import { loadEnvConfig } from "@next/env";
import fs from "node:fs";

loadEnvConfig(process.cwd());

function normalize(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

async function main() {
  const { prisma } = await import("../src/lib/db/prisma");

  try {
    const catalog = JSON.parse(
      fs.readFileSync(
        "data/naotakus/output/catalog.normalized.json",
        "utf8"
      )
    );

    const existing = await prisma.anime.findMany({
      select: {
        id: true,
        title: true,
        normalizedTitle: true,
        anilistId: true,
        channels: {
          select: {
            language: true,
            telegramChannel: {
              select: {
                title: true,
                username: true,
                publicUrl: true,
                inviteUrl: true,
              },
            },
          },
        },
      },
    });

    const existingMap = new Map(
      existing.map((anime) => [
        normalize(anime.normalizedTitle),
        anime,
      ])
    );

    console.log("\nANIMES DEL CATÁLOGO QUE YA EXISTEN EN NEON:");

    for (const entry of catalog) {
      const match = existingMap.get(normalize(entry.title));

      if (match) {
        console.log({
          catalogTitle: entry.title,
          databaseTitle: match.title,
          anilistId: match.anilistId,
          channelsAlreadyLinked: match.channels.length,
          databaseId: match.id,
        });
      }
    }

    console.log("\nRESUMEN DE LA BASE:");

    console.log({
      totalAnimes: existing.length,
      totalChannels: await prisma.telegramChannel.count(),
      totalAnimeChannelRelations: await prisma.animeChannel.count(),
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
