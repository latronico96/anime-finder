
import type {
  AnimeCatalog,
  AnimeEntry,
  AnimeChannel,
} from "./schema";

export interface ProcessedAnime {
  title: string;
  originalTitles: string[];
  languages: string[];
  channels: AnimeChannel[];
  sourceSections: string[];
}

export interface CatalogReport {
  sourceEntries: number;
  processedEntries: number;
  mergedEntries: number;
  totalChannels: number;
  uniqueChannels: number;
  duplicateChannelOccurrences: number;
  entriesWithoutChannels: number;
  repeatedTitles: Array<{
    title: string;
    occurrences: number;
  }>;
  duplicateUrls: Array<{
    url: string;
    occurrences: number;
  }>;
}

function normalizeTitle(title: string): string {
  return title
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function processCatalog(catalogs: AnimeCatalog[]) {
  const allEntries: AnimeEntry[] = catalogs.flatMap(
    catalog => catalog.entries
  );

  const groups = new Map<string, AnimeEntry[]>();

  for (const entry of allEntries) {
    const key = normalizeTitle(entry.title);
    const current = groups.get(key) ?? [];
    current.push(entry);
    groups.set(key, current);
  }

  const animes: ProcessedAnime[] = [];

  for (const entries of groups.values()) {
    const first = entries[0];

    // Deduplicamos canales por URL dentro del mismo anime.
    const channelMap = new Map<string, AnimeChannel>();

    for (const entry of entries) {
      for (const channel of entry.channels) {
        const existing = channelMap.get(channel.url);

        if (!existing) {
          channelMap.set(channel.url, {
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

    const channels = [...channelMap.values()];

    animes.push({
      title: first.title,
      originalTitles: unique(entries.map(entry => entry.title)),
      languages: unique(entries.flatMap(entry => entry.languages)),
      channels,
      sourceSections: unique(entries.map(entry => entry.sourceSection)),
    });
  }

  const urlOccurrences = new Map<string, number>();

  for (const entry of allEntries) {
    for (const channel of entry.channels) {
      urlOccurrences.set(
        channel.url,
        (urlOccurrences.get(channel.url) ?? 0) + 1
      );
    }
  }

  const duplicateUrls = [...urlOccurrences.entries()]
    .filter(([, count]) => count > 1)
    .map(([url, occurrences]) => ({ url, occurrences }));

  const repeatedTitles = [...groups.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([, entries]) => ({
      title: entries[0].title,
      occurrences: entries.length,
    }));

  const totalChannels = allEntries.reduce(
    (sum, entry) => sum + entry.channels.length,
    0
  );

  const uniqueChannels = new Set(
    allEntries.flatMap(entry => entry.channels.map(channel => channel.url))
  ).size;

  const report: CatalogReport = {
    sourceEntries: allEntries.length,
    processedEntries: animes.length,
    mergedEntries: allEntries.length - animes.length,
    totalChannels,
    uniqueChannels,
    duplicateChannelOccurrences: totalChannels - uniqueChannels,
    entriesWithoutChannels: allEntries.filter(
      entry => entry.channels.length === 0
    ).length,
    repeatedTitles,
    duplicateUrls,
  };

  return { animes, report };
}
