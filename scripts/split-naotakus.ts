
import fs from "node:fs";
import path from "node:path";

import { AnimeCatalogSchema } from
  "../src/lib/importers/naotakus/schema";

const INPUT = path.resolve("data/naotakus/catalog.json");
const OUTPUT = path.resolve("data/naotakus");

function getLetter(title: string): string {
  const first = title.trim().charAt(0).toLocaleUpperCase();

  if (/^[A-Z]$/.test(first)) return first;
  if (/^[0-9]$/.test(first)) return "0-9";

  return "OTHER";
}

function main() {
  if (!fs.existsSync(INPUT)) {
    throw new Error(`No existe el archivo: ${INPUT}`);
  }

  const raw = JSON.parse(fs.readFileSync(INPUT, "utf8"));
  const parsed = AnimeCatalogSchema.safeParse(raw);

  if (!parsed.success) {
    console.error("JSON inválido:");

    for (const issue of parsed.error.issues) {
      console.error(
        `- ${issue.path.join(".")}: ${issue.message}`
      );
    }

    process.exit(1);
  }

  const catalog = parsed.data;

  const groups = new Map<string, typeof catalog.entries>();

  for (const entry of catalog.entries) {
    const letter = getLetter(entry.title);
    const entries = groups.get(letter) ?? [];

    entries.push(entry);
    groups.set(letter, entries);
  }

  for (const [letter, entries] of groups) {
    const output = {
      ...catalog,
      notes: [
        ...catalog.notes,
        `Archivo generado desde catalog.json. Sección: ${letter}`,
      ],
      counts: {
        total: entries.length,
        withChannels: entries.filter(
          entry => entry.channels.length > 0
        ).length,
        withoutChannelLink: entries.filter(
          entry => entry.channels.length === 0
        ).length,
      },
      entries,
    };

    const fileName = `${letter}.json`;

    fs.writeFileSync(
      path.join(OUTPUT, fileName),
      JSON.stringify(output, null, 2),
      "utf8"
    );

    console.log(`✅ ${fileName}: ${entries.length} entradas`);
  }

  console.log(`\nTotal procesado: ${catalog.entries.length}`);
  console.log(`Archivos generados: ${groups.size}`);
}

main();
