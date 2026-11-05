
import fs from "node:fs";
import path from "node:path";

import {
  AnimeCatalogSchema,
  type AnimeCatalog,
} from "../src/lib/importers/naotakus/schema";

import {
  processCatalog,
} from "../src/lib/importers/naotakus/processor";


const INPUT_DIR = path.resolve("data/naotakus");
const OUTPUT_DIR = path.resolve("data/naotakus/output");

const INPUT_FILE = process.argv[2];

function getInputFiles(): string[] {
  if (INPUT_FILE) {
    const filePath = path.resolve(INPUT_FILE);

    if (!fs.existsSync(filePath)) {
      throw new Error(`No existe el archivo: ${filePath}`);
    }

    return [filePath];
  }

  if (!fs.existsSync(INPUT_DIR)) {
    throw new Error(`No existe el directorio: ${INPUT_DIR}`);
  }

  return fs
    .readdirSync(INPUT_DIR)
    .filter(file => file.toLowerCase().endsWith(".json"))
    .filter(file => file !== "catalog.json")
    .map(file => path.join(INPUT_DIR, file))
    .sort((a, b) => a.localeCompare(b));
}

function main() {
  const files = getInputFiles();

  if (!fs.existsSync(INPUT_DIR)) {
    throw new Error(`No existe la carpeta: ${INPUT_DIR}`);
  }

  if (files.length === 0) {
    throw new Error("No se encontraron archivos JSON.");
  }

  const catalogs: AnimeCatalog[] = [];
  let hasErrors = false;

  for (const file of files) {
    const filePath = path.join(INPUT_DIR, file);

    try {
      const raw = JSON.parse(
        fs.readFileSync(file, "utf8")
      ); const result = AnimeCatalogSchema.safeParse(raw);

      if (!result.success) {
        hasErrors = true;

        console.error(`\n❌ ${file}: JSON inválido`);

        for (const issue of result.error.issues) {
          console.error(
            `  - ${issue.path.join(".")}: ${issue.message}`
          );
        }

        continue;
      }

      catalogs.push(result.data);
      console.log(`✅ ${file}: ${result.data.entries.length} entradas`);
    } catch (error) {
      hasErrors = true;
      console.error(`\n❌ Error leyendo ${file}:`, error);
    }
  }

  if (hasErrors) {
    throw new Error(
      "Hay archivos inválidos. Corregilos antes de continuar."
    );
  }

  const { animes, report } = processCatalog(catalogs);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "catalog.normalized.json"),
    JSON.stringify(animes, null, 2),
    "utf8"
  );

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "catalog.report.json"),
    JSON.stringify(report, null, 2),
    "utf8"
  );

  console.log("\n📊 RESULTADO DEL PROCESAMIENTO");
  console.log("-----------------------------");
  console.log(`Archivos: ${catalogs.length}`);
  console.log(`Entradas originales: ${report.sourceEntries}`);
  console.log(`Animes agrupados: ${report.processedEntries}`);
  console.log(`Entradas agrupadas: ${report.mergedEntries}`);
  console.log(`Canales originales: ${report.totalChannels}`);
  console.log(`Canales únicos: ${report.uniqueChannels}`);
  console.log(`URLs repetidas: ${report.duplicateUrls.length}`);
  console.log(`Entradas sin canales: ${report.entriesWithoutChannels}`);

  console.log("\nArchivos generados:");
  console.log("- data/naotakus/output/catalog.normalized.json");
  console.log("- data/naotakus/output/catalog.report.json");
}

main();
