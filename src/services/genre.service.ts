import { prisma } from "../lib/db/prisma";
import { normalizeText } from "./normalize";

export async function listGenres() {
  return prisma.genre.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createGenre(name: string) {
  const cleanName = name.trim();

  if (!cleanName) {
    throw new Error("El nombre del género es obligatorio.");
  }

  const slug = normalizeText(cleanName).replace(/\s+/g, "-");

  return prisma.genre.upsert({
    where: { slug },
    update: { name: cleanName },
    create: {
      name: cleanName,
      slug,
    },
  });
}

export async function assignGenre(
  animeId: string,
  genreId: string
) {
  return prisma.animeGenre.upsert({
    where: {
      animeId_genreId: {
        animeId,
        genreId,
      },
    },
    update: {},
    create: {
      animeId,
      genreId,
    },
  });
}

export async function removeGenre(
  animeId: string,
  genreId: string
) {
  return prisma.animeGenre.delete({
    where: {
      animeId_genreId: {
        animeId,
        genreId,
      },
    },
  });
}

