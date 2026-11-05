import fs from "node:fs";
import path from "node:path";

type Entry = {
  title: string;
  channels: {
    url: string;
    languages: string[];
  }[];
};

const input = path.resolve(
  "data/naotakus/output/catalog.normalized.json"
);

const output = path.resolve(
  "data/naotakus/output/shared-channels.report.json"
);

function normalizeUrl(raw: string) {
  const url = new URL(raw);
  const segments = url.pathname.split("/").filter(Boolean);

  if (!segments.length) {
    throw new Error(`URL inválida: ${raw}`);
  }

  const first = segments[0];

  // Los nombres de canales públicos no distinguen mayúsculas.
  if (!first.startsWith("+") && first.toLowerCase() !== "joinchat") {
    segments[0] = first.toLowerCase();
  }

  return `https://t.me/${segments.join("/")}`;
}

function main() {
  const catalog: Entry[] = JSON.parse(
    fs.readFileSync(input, "utf8")
  );

  const channelMap = new Map<
    string,
    {
      url: string;
      titles: Map<string, Set<string>>;
    }
  >();

  for (const anime of catalog) {
    for (const channel of anime.channels) {
      const key = normalizeUrl(channel.url);

      if (!channelMap.has(key)) {
        channelMap.set(key, {
          url: key,
          titles: new Map(),
        });
      }

      const record = channelMap.get(key)!;

      if (!record.titles.has(anime.title)) {
        record.titles.set(anime.title, new Set());
      }

      for (const language of channel.languages) {
        record.titles.get(anime.title)!.add(language);
      }
    }
  }

  const shared = [...channelMap.values()]
    .filter(channel => channel.titles.size > 1)
    .map(channel => ({
      url: channel.url,
      animeCount: channel.titles.size,
      animes: [...channel.titles.entries()].map(
        ([title, languages]) => ({
          title,
          languages: [...languages],
        })
      ),
    }))
    .sort((a, b) => b.animeCount - a.animeCount);

  fs.writeFileSync(
    output,
    JSON.stringify(shared, null, 2),
    "utf8"
  );

  console.log("\nREPORTE DE CANALES COMPARTIDOS");
  console.log("--------------------------------");
  console.log(`Animes analizados: ${catalog.length}`);
  console.log(`Canales compartidos: ${shared.length}`);

  for (const channel of shared) {
    console.log(`\n${channel.animeCount} ANIMES`);
    console.log(channel.url);

    for (const anime of channel.animes) {
      console.log(
        `  - ${anime.title} [${anime.languages.join(", ")}]`
      );
    }
  }

  console.log(`\nReporte guardado en: ${output}`);
}

main();