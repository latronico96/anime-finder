import { prisma } from "../lib/db/prisma";
import { normalizeText } from "./normalize";

export async function addAnimeAlias(
  animeId: string,
  value: string
) {
  const normalized = normalizeText(value);
  const cleanValue = value.trim();

  if (!cleanValue) {
    throw new Error("El alias no puede estar vacío.");
  }

  return prisma.animeAlias.upsert({
    where: {
      animeId_normalized: {
        animeId,
        normalized,
      },
    },
    create: {
      animeId,
      value: cleanValue,
      normalized,
      source: "MANUAL",
    },
    update: {
      value: cleanValue,
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
