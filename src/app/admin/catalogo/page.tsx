
"use client";

import { useEffect, useMemo, useState } from "react";

type Channel = {
    url: string;
    languages: string[];
};

type Entry = {
    title: string;
    languages: string[];
    channels: Channel[];
    sourceSection: string;
    status: string;
};

type CatalogSource = {
    name?: string;
    telegramUrl?: string;
};

type Catalog = {
    schemaVersion: number;
    source: CatalogSource | string;
    counts: {
        total: number;
        withoutChannelLink: number;
        withChannels: number;
    };
    entries: Entry[];
};

const languageLabels: Record<string, string> = {
    JAPANESE_SUB: "Japonés subtitulado",
    CHINESE_SUB: "Chino subtitulado",
    LATINO: "Latino",
    CASTILIAN: "Castellano",
    UNKNOWN: "Sin especificar",
};

const PAGE_SIZE = 50;

function getSourceName(source: Catalog["source"]) {
    if (typeof source === "string") return source;
    return source?.name ?? "Anime Naotakus";
}

function getSourceUrl(source: Catalog["source"]) {
    return typeof source === "object" ? source?.telegramUrl : undefined;
}

function getSectionLabel(section: string) {
    const labels: Record<string, string> = {
        user_pasted_AK: "Lista pegada (A-K)",
        user_pasted_K: "Lista pegada (K)",
        export_LZ: "Exportación (L-Z)",
    };

    return labels[section] ?? section;
}

export default function CatalogPage() {
    const [catalog, setCatalog] = useState<Catalog | null>(null);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [language, setLanguage] = useState("ALL");
    const [linkStatus, setLinkStatus] = useState("ALL");
    const [section, setSection] = useState("ALL");
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetch("/data/anime-catalogo-naotakus.json")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("No se pudo cargar el archivo JSON");
                }
                return response.json();
            })
            .then((data: Catalog) => setCatalog(data))
            .catch((err: Error) => setError(err.message));
    }, []);

    const sections = useMemo(
        () => [
            ...new Set(
                catalog?.entries.map((entry) => entry.sourceSection) ?? []
            ),
        ],
        [catalog]
    );

    const filtered = useMemo(() => {
        if (!catalog) return [];

        const normalizedQuery = query.trim().toLocaleLowerCase("es");

        return catalog.entries.filter((entry) => {
            const matchesQuery =
                !normalizedQuery ||
                entry.title.toLocaleLowerCase("es").includes(normalizedQuery);

            const matchesLanguage =
                language === "ALL" ||
                entry.languages.includes(language) ||
                entry.channels.some((channel) =>
                    channel.languages.includes(language)
                );

            const hasChannels = entry.channels.length > 0;

            const matchesLink =
                linkStatus === "ALL" ||
                (linkStatus === "WITH_LINK" && hasChannels) ||
                (linkStatus === "WITHOUT_LINK" && !hasChannels);

            const matchesSection =
                section === "ALL" || entry.sourceSection === section;

            return (
                matchesQuery &&
                matchesLanguage &&
                matchesLink &&
                matchesSection
            );
        });
    }, [catalog, query, language, linkStatus, section]);

    useEffect(() => {
        setPage(1);
    }, [query, language, linkStatus, section]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

    const visibleEntries = filtered.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );

    const calculatedCounts = useMemo(() => {
        if (!catalog) return null;

        const entries = catalog.entries;

        return {
            total: entries.length,
            withChannels: entries.filter(
                (entry) => entry.channels.length > 0
            ).length,
            withoutChannelLink: entries.filter(
                (entry) => entry.channels.length === 0
            ).length,
            channelCount: entries.reduce(
                (total, entry) => total + entry.channels.length,
                0
            ),
            uniqueTitles: new Set(
                entries.map((entry) => entry.title.toLowerCase().trim())
            ).size,
        };
    }, [catalog]);

    if (error) {
        return (
            <main className="mx-auto max-w-6xl p-8 text-red-400">
                Error: {error}
            </main>
        );
    }

    if (!catalog || !calculatedCounts) {
        return (
            <main className="mx-auto max-w-6xl p-8 text-zinc-500">
                Cargando catálogo...
            </main>
        );
    }

    const sourceName = getSourceName(catalog.source);
    const sourceUrl = getSourceUrl(catalog.source);
    return (
        <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-8">
            <div className="mx-auto max-w-7xl space-y-6">

                <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-emerald-400">
                            ANIME FINDER · ADMINISTRACIÓN
                        </p>

                        <h1 className="mt-1 text-3xl font-bold tracking-tight">
                            Catálogo importado
                        </h1>

                        <p className="mt-1 text-sm text-zinc-400">
                            Fuente: {sourceName}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                            Versión del formato: {catalog.schemaVersion}
                        </p>
                    </div>

                    {sourceUrl && (
                        <a
                            className="text-sm text-emerald-400 hover:text-emerald-300"
                            href={sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Abrir canal fuente ↗
                        </a>
                    )}
                </header>

                <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Stat
                        label="Animes registrados"
                        value={calculatedCounts.total}
                    />

                    <Stat
                        label="Con canales"
                        value={calculatedCounts.withChannels}
                    />

                    <Stat
                        label="Pendientes de enlace"
                        value={calculatedCounts.withoutChannelLink}
                    />
                </section>

                <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">

                        <label className="md:col-span-2">
                            <span className="mb-1 block text-xs font-medium text-zinc-400">
                                Buscar por título
                            </span>

                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Ej. Naruto, Kimetsu..."
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                            />
                        </label>

                        <label>
                            <span className="mb-1 block text-xs font-medium text-zinc-400">
                                Idioma / versión
                            </span>

                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                            >
                                <option value="ALL">Todos</option>

                                {Object.entries(languageLabels).map(
                                    ([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    )
                                )}
                            </select>
                        </label>

                        <label>
                            <span className="mb-1 block text-xs font-medium text-zinc-400">
                                Canales
                            </span>

                            <select
                                value={linkStatus}
                                onChange={(e) => setLinkStatus(e.target.value)}
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                            >
                                <option value="ALL">Todos</option>
                                <option value="WITH_LINK">Con canales</option>
                                <option value="WITHOUT_LINK">Sin canales</option>
                            </select>
                        </label>

                        <label>
                            <span className="mb-1 block text-xs font-medium text-zinc-400">
                                Origen de la lista
                            </span>

                            <select
                                value={section}
                                onChange={(e) => setSection(e.target.value)}
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                            >
                                <option value="ALL">Todos</option>

                                {sections.map((value) => (
                                    <option key={value} value={value}>
                                        {getSectionLabel(value)}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="flex items-end text-sm text-zinc-400 md:col-span-3">
                            {filtered.length.toLocaleString("es-AR")} resultados encontrados
                        </div>

                        <div className="flex items-end justify-end">
                            <a
                                href="/data/anime-catalogo-naotakus-v2.json"
                                download
                                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:border-emerald-500 hover:text-emerald-300"
                            >
                                Descargar JSON ↓
                            </a>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-zinc-800/70 text-xs uppercase tracking-wide text-zinc-400">
                                <tr>
                                    <th className="px-4 py-3">#</th>
                                    <th className="px-4 py-3">Título</th>
                                    <th className="px-4 py-3">Versiones</th>
                                    <th className="px-4 py-3">Origen</th>
                                    <th className="px-4 py-3">Canales</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-zinc-800">
                                {visibleEntries.map((entry, index) => (
                                    <tr
                                        key={`${entry.title}-${(page - 1) * PAGE_SIZE + index}`}
                                        className="hover:bg-zinc-800/40"
                                    >
                                        <td className="px-4 py-3 text-zinc-500">
                                            {(page - 1) * PAGE_SIZE + index + 1}
                                        </td>

                                        <td className="px-4 py-3 font-medium text-zinc-100">
                                            {entry.title}
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {entry.languages.map((item) => (
                                                    <span
                                                        key={item}
                                                        className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
                                                    >
                                                        {languageLabels[item] ?? item}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 text-xs text-zinc-400">
                                            {getSectionLabel(entry.sourceSection)}
                                        </td>

                                        <td className="px-4 py-3">
                                            {entry.channels.length > 0 ? (
                                                <div className="flex flex-col gap-2">
                                                    {entry.channels.map((channel, channelIndex) => (
                                                        <div key={`${channel.url}-${channelIndex}`}>
                                                            <a
                                                                className="text-emerald-400 hover:underline"
                                                                href={channel.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                Canal {channelIndex + 1} ↗
                                                            </a>

                                                            <div className="mt-1 flex flex-wrap gap-1">
                                                                {channel.languages.map((lang) => (
                                                                    <span
                                                                        key={lang}
                                                                        className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400"
                                                                    >
                                                                        {languageLabels[lang] ?? lang}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
                                                    Pendiente
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                {visibleEntries.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-12 text-center text-zinc-500"
                                        >
                                            No hay resultados con esos filtros.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <footer className="flex items-center justify-between border-t border-zinc-800 px-4 py-3 text-sm text-zinc-400">
                        <span>
                            Página {page} de {totalPages}
                        </span>

                        <div className="flex gap-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="rounded-lg border border-zinc-700 px-3 py-1.5 disabled:opacity-30"
                            >
                                Anterior
                            </button>

                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="rounded-lg border border-zinc-700 px-3 py-1.5 disabled:opacity-30"
                            >
                                Siguiente
                            </button>
                        </div>
                    </footer>
                </section>
            </div>
        </main>
    );
}

function Stat({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">{label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">
                {value.toLocaleString("es-AR")}
            </p>
        </div>
    );
}
