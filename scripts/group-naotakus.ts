
import fs from "node:fs";
import path from "node:path";

type Channel = {
  url: string;
  languages: string[];
};

type Anime = {
  title: string;
  originalTitles: string[];
  languages: string[];
  channels: Channel[];
  sourceSections: string[];
};

type EquivalenceGroup = {
  canonicalTitle: string;
  titles: string[];
};

type Equivalences = {
  groups: EquivalenceGroup[];
  review: Array<string[]>;
};

const BASE = path.join(process.cwd(), "data", "naotakus");
const OUTPUT = path.join(BASE, "output");

const INPUT_FILE = path.join(OUTPUT, "catalog.normalized.json");
const EQUIVALENCES_FILE = path.join(BASE, "title-equivalences.json");

function normalizeTitle(title: string): string {
  return title.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function mergeAnimes(items: Anime[], canonicalTitle: string): Anime {
  const channels = new Map<string, Channel>();

  for (const anime of items) {
    for (const channel of anime.channels) {
      const existing = channels.get(channel.url);

      if (!existing) {
        channels.set(channel.url, {
          url: channel.url,
          languages: [...channel.languages],
        });
      } else {
        existing.languages = unique([
          ...existing.languages,
          ...channel.languages,
        ]);
      }
    }
  }

  const actualTitles = unique(
    items.flatMap(anime => [anime.title, ...anime.originalTitles])
  );

  const selectedTitle = actualTitles.find(
    title => normalizeTitle(title) === normalizeTitle(canonicalTitle)
  ) ?? items[0].title;

  return {
    title: selectedTitle,
    originalTitles: actualTitles.filter(
      title => normalizeTitle(title) !== normalizeTitle(selectedTitle)
    ),
    languages: unique(items.flatMap(anime => anime.languages)),
    channels: [...channels.values()],
    sourceSections: unique(items.flatMap(anime => anime.sourceSections)),
  };
}

function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    throw new Error(`No existe el catálogo: ${INPUT_FILE}`);
  }

  const animes = JSON.parse(
    fs.readFileSync(INPUT_FILE, "utf8")
  ) as Anime[];

  const equivalences = JSON.parse(
    fs.readFileSync(EQUIVALENCES_FILE, "utf8")
  ) as Equivalences;

  const animeByTitle = new Map<string, Anime>();

  for (const anime of animes) {
    animeByTitle.set(normalizeTitle(anime.title), anime);
  }

  const claimedTitles = new Map<string, string>();

  for (const group of equivalences.groups) {
    for (const title of group.titles) {
      const key = normalizeTitle(title);
      const previous = claimedTitles.get(key);

      if (previous) {
        throw new Error(
          `El título "${title}" aparece en dos grupos: "${previous}" y "${group.canonicalTitle}".`
        );
      }

      claimedTitles.set(key, group.canonicalTitle);
    }
  }

  const consumed = new Set<string>();
  const grouped: Anime[] = [];
  const groupDetails = [];
  const missingTitles = [];

  for (const group of equivalences.groups) {
    const found: Anime[] = [];

    for (const title of group.titles) {
      const key = normalizeTitle(title);
      const anime = animeByTitle.get(key);

      if (anime) {
        found.push(anime);
        consumed.add(key);
      } else {
        missingTitles.push({
          group: group.canonicalTitle,
          title,
        });
      }
    }

    if (found.length === 0) continue;

    grouped.push(mergeAnimes(found, group.canonicalTitle));

    groupDetails.push({
      canonicalTitle: group.canonicalTitle,
      foundTitles: found.map(anime => anime.title),
      mergedCount: found.length,
    });
  }

  for (const anime of animes) {
    const key = normalizeTitle(anime.title);

    if (!consumed.has(key)) {
      grouped.push(anime);
    }
  }

  const review = equivalences.review.map(titles => ({
    titles,
    reason: "Compartían un canal, pero no se confirmó que sean el mismo anime. No se fusionaron.",
  }));

  const report = {
    inputCount: animes.length,
    outputCount: grouped.length,
    mergedCount: animes.length - grouped.length,
    equivalenceGroupsConfigured: equivalences.groups.length,
    equivalenceGroupsApplied: groupDetails.length,
    missingTitles,
    review,
    groups: groupDetails,
  };

  fs.writeFileSync(
    path.join(OUTPUT, "catalog.grouped.json"),
    JSON.stringify(grouped, null, 2),
    "utf8"
  );

  fs.writeFileSync(
    path.join(OUTPUT, "catalog.grouped.report.json"),
    JSON.stringify(report, null, 2),
    "utf8"
  );

  console.log("\n========== AGRUPACIÓN COMPLETADA ==========");
  console.log(`Animes originales: ${report.inputCount}`);
  console.log(`Animes agrupados: ${report.outputCount}`);
  console.log(`Fusiones realizadas: ${report.mergedCount}`);
  console.log(`Grupos aplicados: ${report.equivalenceGroupsApplied}`);
  console.log(`Títulos no encontrados: ${missingTitles.length}`);
  console.log(`Casos para revisión: ${review.length}`);
  console.log("\nArchivos generados:");
  console.log(" - catalog.grouped.json");
  console.log(" - catalog.grouped.report.json");
}

main();
