import { prisma } from "../lib/db/prisma";
import { normalizeText } from "./normalize";

export async function addAnimeAlias(
  animeId: string,
  value: string
) {
  const normalized = normalizeText(value);

  if (!normalized) {
    throw new Error("El alias no puede estar vacío.");
  }

  return prisma.animeAlias.upsert({
    where: {
      animeId_normalized: {
        animeId,
        normalized,
      },
    },
    update: { value: value.trim() },
    create: {
      animeId,
      value: value.trim(),
      normalized,
    },
  });
}

export async function removeAnimeAlias(aliasId: string) {
  return prisma.animeAlias.delete({
    where: { id: aliasId },
  });
}

export async function listAnimeAliases(animeId: string) {
  return prisma.animeAlias.findMany({
    where: { animeId },
    orderBy: { value: "asc" },
  });
}
