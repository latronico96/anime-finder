
import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

type Language =
    | "JAPANESE_SUB"
    | "CHINESE_SUB"
    | "LATINO"
    | "CASTILIAN"
    | "MULTIPLE"
    | "UNKNOWN";

type CatalogChannel = {
    url: string;
    languages: Language[];
};

type CatalogAnime = {
    title: string;
    originalTitles: string[];
    languages: Language[];
    channels: CatalogChannel[];
    sourceSections: string[];
};

type Counters = {
    animeCreated: number;
    animeReused: number;
    aliasesCreated: number;
    aliasesReused: number;
    channelsCreated: number;
    channelsReused: number;
    relationsCreated: number;
    relationsReused: number;
};

const INPUT_FILE = path.resolve(
    process.cwd(),
    "data/naotakus/output/catalog.grouped.json"
);

const VALID_LANGUAGES = new Set<Language>([
    "JAPANESE_SUB",
    "CHINESE_SUB",
    "LATINO",
    "CASTILIAN",
    "MULTIPLE",
    "UNKNOWN",
]);

function normalizeTitle(value: string): string {
    return value
        .normalize("NFKC")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase();
}

function normalizeTelegramUrl(rawUrl: string): {
    url: string;
    type: "PUBLIC" | "PRIVATE";
    username: string | null;
} {
    const parsed = new URL(rawUrl);

    const host = parsed.hostname.toLowerCase();

    if (host !== "t.me" && host !== "telegram.me") {
        throw new Error(`URL de Telegram no soportada: ${rawUrl}`);
    }

    const segments = parsed.pathname
        .split("/")
        .filter(Boolean);

    if (segments.length === 0) {
        throw new Error(`URL de Telegram sin canal: ${rawUrl}`);
    }

    const first = segments[0];

    const isPrivate =
        first.startsWith("+") ||
        first.toLowerCase() === "joinchat";

    const normalizedPath = `/${segments.join("/")}`;

    return {
        url: `https://t.me${normalizedPath}`,
        type: isPrivate ? "PRIVATE" : "PUBLIC",
        username: isPrivate ? null : first,
    };
}

function validateCatalog(data: unknown): CatalogAnime[] {
    if (!Array.isArray(data)) {
        throw new Error(
            "El catálogo normalizado debe ser un array JSON."
        );
    }

    for (const [index, anime] of data.entries()) {
        if (
            !anime ||
            typeof anime.title !== "string" ||
            !anime.title.trim() ||
            !Array.isArray(anime.originalTitles) ||
            !Array.isArray(anime.languages) ||
            !Array.isArray(anime.channels)
        ) {
            throw new Error(
                `Entrada inválida en posición ${index}: estructura incompleta.`
            );
        }

        for (const language of anime.languages) {
            if (!VALID_LANGUAGES.has(language)) {
                throw new Error(
                    `Idioma no soportado en "${anime.title}": ${language}`
                );
            }
        }

        for (const channel of anime.channels) {
            if (
                typeof channel.url !== "string" ||
                !Array.isArray(channel.languages)
            ) {
                throw new Error(
                    `Canal inválido en "${anime.title}".`
                );
            }

            for (const language of channel.languages) {
                if (!VALID_LANGUAGES.has(language)) {
                    throw new Error(
                        `Idioma no soportado en "${anime.title}": ${language}`
                    );
                }
            }

            normalizeTelegramUrl(channel.url);
        }
    }

    return data as CatalogAnime[];
}

function createCounters(): Counters {
    return {
        animeCreated: 0,
        animeReused: 0,
        aliasesCreated: 0,
        aliasesReused: 0,
        channelsCreated: 0,
        channelsReused: 0,
        relationsCreated: 0,
        relationsReused: 0,
    };
}

async function main() {
    loadEnvConfig(process.cwd());

    const commit = process.argv.includes("--commit");

    if (process.argv.includes("--help")) {
        console.log(`
Importador ListaNaOtakus

Simular:
  npm run catalog:import

Aplicar cambios:
  npm run catalog:import -- --commit
`);
        return;
    }

    if (!fs.existsSync(INPUT_FILE)) {
        throw new Error(`No existe el archivo: ${INPUT_FILE}`);
    }

    const raw = fs.readFileSync(INPUT_FILE, "utf8");
    const catalog = validateCatalog(JSON.parse(raw));

    console.log("\n====================================");
    console.log(" IMPORTADOR LISTA NAOTAKUS");
    console.log("====================================");
    console.log(`Archivo: ${INPUT_FILE}`);
    console.log(`Animes procesados: ${catalog.length}`);
    console.log(
        `Modo: ${commit ? "COMMIT (modifica Neon)" : "DRY-RUN (solo simulación)"}`
    );

    // Cargar Prisma después de cargar las variables de entorno.
    const { prisma } = await import("../src/lib/db/prisma");

    try {
        const [
            existingAnimes,
            existingAliases,
            existingChannels,
            existingRelations,
        ] = await Promise.all([
            prisma.anime.findMany({
                select: {
                    id: true,
                    title: true,
                    normalizedTitle: true,
                },
            }),

            prisma.animeAlias.findMany({
                select: {
                    animeId: true,
                    normalized: true,
                },
            }),

            prisma.telegramChannel.findMany({
                select: {
                    id: true,
                    username: true,
                    publicUrl: true,
                    inviteUrl: true,
                },
            }),

            prisma.animeChannel.findMany({
                select: {
                    animeId: true,
                    telegramChannelId: true,
                    language: true,
                },
            }),
        ]);

        const animeMap = new Map<
            string,
            { id: string }
        >();

        for (const anime of existingAnimes) {
            const key = normalizeTitle(anime.normalizedTitle);

            if (!animeMap.has(key)) {
                animeMap.set(key, { id: anime.id });
            }
        }

        const aliasSet = new Set(
            existingAliases.map(
                alias => `${alias.animeId}|${alias.normalized}`
            )
        );

        const channelMap = new Map<
            string,
            { id: string }
        >();

        for (const channel of existingChannels) {
            if (channel.username) {
                channelMap.set(
                    `PUBLIC:${channel.username.toLowerCase()}`,
                    { id: channel.id }
                );
            }

            if (channel.publicUrl) {
                try {
                    const normalized = normalizeTelegramUrl(channel.publicUrl);

                    const key =
                        normalized.type === "PUBLIC"
                            ? `PUBLIC:${normalized.username!.toLowerCase()}`
                            : normalized.url;

                    channelMap.set(key, { id: channel.id });
                } catch {
                    // Ignorar URLs antiguas que no podamos normalizar.
                }
            }

            if (channel.inviteUrl) {
                try {
                    const normalized = normalizeTelegramUrl(
                        channel.inviteUrl
                    );

                    channelMap.set(normalized.url, { id: channel.id });
                } catch {
                    // Ignorar URLs antiguas que no podamos normalizar.
                }
            }
        }

        const relationSet = new Set(
            existingRelations.map(
                relation =>
                    `${relation.animeId}|${relation.telegramChannelId}|${relation.language}`
            )
        );

        const counters = createCounters();

        async function processCatalog(
            tx?: any,
            entriesToProcess = catalog
        ) {
            for (const entry of entriesToProcess) {
                const animeKey = normalizeTitle(entry.title);

                let anime = animeMap.get(animeKey);

                if (anime) {
                    counters.animeReused++;
                } else {
                    counters.animeCreated++;

                    const created = tx
                        ? await tx.anime.create({
                            data: {
                                title: entry.title,
                                normalizedTitle: animeKey,
                                type: "UNKNOWN",
                                status: "UNKNOWN",
                                isActive: true,
                            },
                            select: { id: true },
                        })
                        : { id: `DRY_ANIME:${animeKey}` };

                    if (!created) {
                        throw new Error(`No se pudo obtener el anime: ${entry.title}`);
                    }

                    anime = created;
                    animeMap.set(animeKey, created);
                }

                if (!anime) {
                    throw new Error(`Anime indefinido: ${entry.title}`);
                }

                const aliases = [
                    ...new Set(entry.originalTitles),
                ];

                for (const alias of aliases) {
                    const normalized = normalizeTitle(alias);

                    if (!normalized || normalized === animeKey) {
                        continue;
                    }

                    const aliasKey = `${anime.id}|${normalized}`;

                    if (aliasSet.has(aliasKey)) {
                        counters.aliasesReused++;
                        continue;
                    }

                    counters.aliasesCreated++;

                    if (tx) {
                        await tx.animeAlias.create({
                            data: {
                                animeId: anime.id,
                                value: alias,
                                normalized,
                                source: "TITLE",
                            },
                        });
                    }

                    aliasSet.add(aliasKey);
                }

                for (const sourceChannel of entry.channels) {
                    const parsed = normalizeTelegramUrl(
                        sourceChannel.url
                    );

                    const channelKey =
                        parsed.type === "PUBLIC"
                            ? `PUBLIC:${parsed.username!.toLowerCase()}`
                            : parsed.url;

                    let channel = channelMap.get(channelKey);

                    if (!channel) {
                        counters.channelsCreated++;

                        const created = tx
                            ? await tx.telegramChannel.create({
                                data: {
                                    title:
                                        parsed.type === "PUBLIC"
                                            ? `@${parsed.username}`
                                            : "Canal privado importado",
                                    type: parsed.type,
                                    username: parsed.username,
                                    publicUrl:
                                        parsed.type === "PUBLIC"
                                            ? parsed.url
                                            : null,
                                    inviteUrl:
                                        parsed.type === "PRIVATE"
                                            ? parsed.url
                                            : null,
                                    isActive: true,
                                },
                                select: { id: true },
                            })
                            : { id: `DRY_CHANNEL:${channelKey}` };

                        if (!created) {
                            throw new Error(`No se pudo obtener el canal: ${sourceChannel.url}`);
                        }

                        channel = created;
                        channelMap.set(channelKey, created);
                    } else {
                        counters.channelsReused++;
                    }
                    
                    if (!channel) {
                        throw new Error(`Canal indefinido: ${sourceChannel.url}`);
                    }

                    const languages =
                        sourceChannel.languages.length > 0
                            ? sourceChannel.languages
                            : entry.languages.length > 0
                                ? entry.languages
                                : ["UNKNOWN" as Language];

                    for (const language of new Set(languages)) {
                        const relationKey =
                            `${anime.id}|${channel.id}|${language}`;

                        if (relationSet.has(relationKey)) {
                            counters.relationsReused++;
                            continue;
                        }

                        counters.relationsCreated++;

                        if (tx) {
                            await tx.animeChannel.create({
                                data: {
                                    animeId: anime.id,
                                    telegramChannelId: channel.id,
                                    language,
                                },
                            });
                        }

                        relationSet.add(relationKey);
                    }
                }
            }
        }

        if (commit) {
            const BATCH_SIZE = 25;
            const totalBatches = Math.ceil(catalog.length / BATCH_SIZE);

            console.log("\nIniciando importación por lotes...");
            console.log(`Total de animes: ${catalog.length}`);
            console.log(`Tamaño de lote: ${BATCH_SIZE}`);
            console.log(`Lotes: ${totalBatches}\n`);

            for (let i = 0; i < catalog.length; i += BATCH_SIZE) {
                const batch = catalog.slice(i, i + BATCH_SIZE);
                const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

                console.log(
                    `Procesando lote ${batchNumber}/${totalBatches} (${batch.length} animes)...`
                );

                await prisma.$transaction(
                    async tx => {
                        await processCatalog(tx, batch);
                    },
                    {
                        maxWait: 15_000,
                        timeout: 60_000,
                    }
                );

                console.log(`Lote ${batchNumber}/${totalBatches} confirmado.`);
            }

            console.log("\nTodos los lotes fueron procesados.");
        } else {
            await processCatalog();
        }

        console.log("\n========== RESULTADO ==========");

        console.table([
            {
                entidad: "Animes",
                nuevos: counters.animeCreated,
                existentes: counters.animeReused,
            },
            {
                entidad: "Aliases",
                nuevos: counters.aliasesCreated,
                existentes: counters.aliasesReused,
            },
            {
                entidad: "Canales",
                nuevos: counters.channelsCreated,
                existentes: counters.channelsReused,
            },
            {
                entidad: "Relaciones anime-canal",
                nuevos: counters.relationsCreated,
                existentes: counters.relationsReused,
            },
        ]);

        console.log("\n====================================");

        if (commit) {
            console.log("IMPORTACIÓN COMPLETADA.");
        } else {
            console.log("SIMULACIÓN COMPLETADA. Neon no fue modificado.");
            console.log(
                "Para importar realmente, ejecutá: npm run catalog:import -- --commit"
            );
        }
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(error => {
    console.error("\nERROR EN LA IMPORTACIÓN:");
    console.error(error);
    process.exitCode = 1;
});
