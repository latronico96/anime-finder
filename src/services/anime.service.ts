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
  const data = { ...input };

  if (input.title !== undefined) {
    const title = input.title.trim();

    if (!title) {
      throw new Error("El título no puede estar vacío.");
    }

    data.title = title;
  }

  return prisma.anime.update({
    where: { id: animeId },
    data: {
      ...data,
      ...(data.title
        ? { normalizedTitle: normalizeTitle(data.title) }
        : {}),
    },
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
