import { loadEnvConfig } from "@next/env";
import { defineConfig, env } from "prisma/config";

// Carga las variables de entorno antes de configurar Prisma.
loadEnvConfig(
  process.cwd(),
  process.env.NODE_ENV !== "production"
);

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },

  datasource: {
    url: env("DATABASE_URL"),
  },
});
