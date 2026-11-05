import fs from "node:fs";
import path from "node:path";

import { AnimeCatalogSchema } from
  "../src/lib/importers/naotakus/schema";

const DIR = path.resolve("data/naotakus");

function normalize(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

function main() {
  const files = fs.readdirSync(DIR)
    .filter(file => file.endsWith(".json"))
    .filter(file => file !== "catalog.json")
    .map(file => path.join(DIR, file));

  const entries = files.flatMap(file => {
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    return AnimeCatalogSchema.parse(raw).entries;
  });

  const titles = new Map<string, typeof entries>();
  const urls = new Map<string, Array<{
    title: string;
    languages: string[];
    sourceSection: string;
  }>>();

  for (const entry of entries) {
    const key = normalize(entry.title);
    const titleGroup = titles.get(key) ?? [];
    titleGroup.push(entry);
    titles.set(key, titleGroup);

    for (const channel of entry.channels) {
      const channelGroup = urls.get(channel.url) ?? [];

      channelGroup.push({
        title: entry.title,
        languages: channel.languages,
        sourceSection: entry.sourceSection,
      });

      urls.set(channel.url, channelGroup);
    }
  }

  console.log("\n========== TÍTULOS REPETIDOS ==========\n");

  for (const group of titles.values()) {
    if (group.length < 2) continue;

    console.log(`\n🎬 ${group[0].title}`);

    for (const entry of group) {
      console.log(`  Sección: ${entry.sourceSection}`);
      console.log(`  Idiomas: ${entry.languages.join(", ")}`);
      for (const channel of entry.channels) {
        console.log(`  Canal: ${channel.url}`);
        console.log(`  Idiomas canal: ${channel.languages.join(", ")}`);
      }
    }
  }

  console.log("\n========== CANALES COMPARTIDOS ==========\n");

  for (const [url, group] of urls) {
    if (group.length < 2) continue;

    console.log(`\n🔗 ${url}`);
    for (const item of group) {
      console.log(
        `  Anime: ${item.title} | Idiomas: ${item.languages.join(", ")} | Sección: ${item.sourceSection}`
      );
    }
  }
}

main();