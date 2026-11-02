
import { prisma } from "../db/prisma";
import { normalizeTitle } from "../../services/normalize";

export async function searchAnime(query: string) {
  const normalizedQuery = normalizeTitle(query);

  if (!normalizedQuery) {
    return [];
  }

  const animes = await prisma.anime.findMany({
    where: {
      isActive: true,
      OR: [
        {
          normalizedTitle: {
            contains: normalizedQuery,
          },
        },
        {
          aliases: {
            some: {
              normalized: {
                contains: normalizedQuery,
              },
            },
          },
        },
      ],
    },
    include: {
      aliases: true,
    },
    take: 50,
  });

  // Orden de relevancia:
  // 1. Título principal exacto.
  // 2. Alias exacto.
  // 3. Título que comienza con la búsqueda.
  // 4. Alias que comienza con la búsqueda.
  // 5. Coincidencias parciales.

  function getScore(anime: (typeof animes)[number]) {
    const title = anime.normalizedTitle;
    const aliases = anime.aliases.map((alias) => alias.normalized);

    if (title === normalizedQuery) return 1;
    if (aliases.includes(normalizedQuery)) return 2;
    if (title.startsWith(normalizedQuery)) return 3;
    if (aliases.some((alias) => alias.startsWith(normalizedQuery))) {
      return 4;
    }

    return 5;
  }

  return animes
    .sort((a, b) => {
      const scoreDifference = getScore(a) - getScore(b);

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return a.title.localeCompare(b.title);
    })
    .slice(0, 10);
}
