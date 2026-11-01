import { loadEnvConfig } from "@next/env";

// Cargar variables antes de importar el cliente de Prisma.
loadEnvConfig(
  process.cwd(),
  process.env.NODE_ENV !== "production"
);

const genres = [
  { name: "Acción", slug: "accion" },
  { name: "Aventura", slug: "aventura" },
  { name: "Comedia", slug: "comedia" },
  { name: "Drama", slug: "drama" },
  { name: "Fantasía", slug: "fantasia" },
  { name: "Romance", slug: "romance" },
  { name: "Ciencia ficción", slug: "ciencia-ficcion" },
  { name: "Suspenso", slug: "suspenso" },
  { name: "Terror", slug: "terror" },
  { name: "Misterio", slug: "misterio" },
  { name: "Deportes", slug: "deportes" },
  { name: "Slice of Life", slug: "slice-of-life" },
  { name: "Psicológico", slug: "psicologico" },
  { name: "Sobrenatural", slug: "sobrenatural" },
  { name: "Mecha", slug: "mecha" },
  { name: "Histórico", slug: "historico" },
];

async function main() {
  // Importación dinámica para asegurar que las variables ya estén cargadas.
  const { prisma } = await import("../src/lib/db/prisma");

  try {
    console.log("Iniciando seed...\n");

    // 1. Géneros
    for (const genre of genres) {
      await prisma.genre.upsert({
        where: {
          slug: genre.slug,
        },
        update: {
          name: genre.name,
        },
        create: genre,
      });
    }

    console.log(`Géneros procesados: ${genres.length}`);

    // 2. Administradores
    const adminIds = (process.env.TELEGRAM_ADMIN_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    for (const id of adminIds) {
      if (!/^\d+$/.test(id)) {
        throw new Error(`ID de administrador inválido: ${id}`);
      }

      await prisma.botUser.upsert({
        where: {
          telegramUserId: BigInt(id),
        },
        update: {
          role: "ADMIN",
        },
        create: {
          telegramUserId: BigInt(id),
          role: "ADMIN",
        },
      });
    }

    console.log(`Administradores procesados: ${adminIds.length}`);

    console.log("\nSeed completado correctamente.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Error ejecutando seed:", error);
  process.exit(1);
});