import { prisma } from "../lib/db/prisma";

interface CreateSeasonInput {
  animeId: string;
  number: number;
  title?: string | null;
  description?: string | null;
}

interface CreateEpisodeInput {
  seasonId: string;
  number: number;
  title?: string | null;
  description?: string | null;
  duration?: number | null;
}

export async function createSeason(input: CreateSeasonInput) {
  if (input.number < 1) {
    throw new Error("El número de temporada debe ser mayor que cero.");
  }

  return prisma.season.upsert({
    where: {
      animeId_number: {
        animeId: input.animeId,
        number: input.number,
      },
    },
    update: {
      title: input.title,
      description: input.description,
    },
    create: input,
  });
}

export async function updateSeason(
  seasonId: string,
  input: Partial<Pick<CreateSeasonInput, "title" | "description">>
) {
  return prisma.season.update({
    where: { id: seasonId },
    data: input,
  });
}

export async function listSeasons(animeId: string) {
  return prisma.season.findMany({
    where: { animeId },
    include: {
      episodes: {
        orderBy: { number: "asc" },
      },
    },
    orderBy: { number: "asc" },
  });
}

export async function createEpisode(input: CreateEpisodeInput) {
  if (input.number < 1) {
    throw new Error("El número de episodio debe ser mayor que cero.");
  }

  return prisma.episode.upsert({
    where: {
      seasonId_number: {
        seasonId: input.seasonId,
        number: input.number,
      },
    },
    update: {
      title: input.title,
      description: input.description,
      duration: input.duration,
    },
    create: input,
  });
}

export async function updateEpisode(
  episodeId: string,
  input: Partial<
    Pick<CreateEpisodeInput, "title" | "description" | "duration">
  >
) {
  return prisma.episode.update({
    where: { id: episodeId },
    data: input,
  });
}

export async function listEpisodes(seasonId: string) {
  return prisma.episode.findMany({
    where: { seasonId },
    orderBy: { number: "asc" },
  });
}
