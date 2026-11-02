import { prisma } from "../lib/db/prisma";
import { normalizeTitle } from "./normalize";


type AnimeType =
  | "TV"
  | "MOVIE"
  | "OVA"
  | "ONA"
  | "SPECIAL"
  | "UNKNOWN";

type AnimeStatus =
  | "FINISHED"
  | "RELEASING"
  | "NOT_YET_RELEASED"
  | "CANCELLED"
  | "UNKNOWN";

interface CreateAnimeInput {
  title: string;
  titleEs?: string | null;
  titleEn?: string | null;
  titleRomaji?: string | null;
  titleNative?: string | null;
  description?: string | null;
  posterUrl?: string | null;
  bannerUrl?: string | null;
  year?: number | null;
  episodes?: number | null;
  type?: AnimeType;
  status?: AnimeStatus;
  anilistId?: number | null;
}

export async function createAnime(input: CreateAnimeInput) {
  const title = input.title.trim();

  if (!title) {
    throw new Error("El título del anime es obligatorio.");
  }

  return prisma.anime.create({
    data: {
      ...input,
      title,
      normalizedTitle: normalizeTitle(title),
    },
  });
}

export async function updateAnime(
  animeId: string,
  input: Partial<CreateAnimeInput>
) {
  return prisma.$transaction(async (tx) => {
    const anime = await tx.anime.update({
      where: { id: animeId },
      data: {
        ...input,
        ...(input.title !== undefined && {
          normalizedTitle: normalizeTitle(input.title),
        }),
      },
    });

    // Títulos que deben estar disponibles como alias.
    const titles = [
      anime.title,
      anime.titleEs,
      anime.titleEn,
      anime.titleRomaji,
      anime.titleNative,
    ];

    // Normalizar y eliminar duplicados.
    const aliases = Array.from(
      new Map(
        titles
          .filter((value): value is string =>
            typeof value === "string" && value.trim().length > 0
          )
          .map((value) => {
            const normalized = normalizeTitle(value);
            return [normalized, { value: value.trim(), normalized }];
          })
      ).values()
    );

    const normalizedValues = aliases.map((alias) => alias.normalized);

    // Eliminar solamente los alias automáticos que dejaron de corresponder.
    await tx.animeAlias.deleteMany({
      where: {
        animeId,
        source: "TITLE",
        normalized: {
          notIn: normalizedValues,
        },
      },
    });

    // Crear los alias automáticos faltantes.
    for (const alias of aliases) {
      const existing = await tx.animeAlias.findUnique({
        where: {
          animeId_normalized: {
            animeId,
            normalized: alias.normalized,
          },
        },
      });

      // No sobrescribir ni convertir alias manuales.
      if (!existing) {
        await tx.animeAlias.create({
          data: {
            animeId,
            value: alias.value,
            normalized: alias.normalized,
            source: "TITLE",
          },
        });
      }
    }

    return anime;
  });
}

export async function getAnimeById(animeId: string) {
  return prisma.anime.findUnique({
    where: { id: animeId },
    include: {
      aliases: true,
      genres: {
        include: { genre: true },
      },
      channels: {
        include: { telegramChannel: true },
      },
      seasons: {
        include: {
          episodes: {
            orderBy: { number: "asc" },
          },
        },
        orderBy: { number: "asc" },
      },
    },
  });
}

export async function getAnimeByTitle(title: string) {
  const normalizedTitle = normalizeTitle(title);

  return prisma.anime.findFirst({
    where: {
      normalizedTitle,
      isActive: true,
    },
  });
}

export async function listAnimes(limit = 20) {
  return prisma.anime.findMany({
    where: { isActive: true },
    orderBy: { title: "asc" },
    take: limit,
  });
}

export async function deactivateAnime(animeId: string) {
  return prisma.anime.update({
    where: { id: animeId },
    data: { isActive: false },
  });
}
