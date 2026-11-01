
import { prisma } from "../lib/db/prisma";

type ChannelType = "PUBLIC" | "PRIVATE";

type AnimeLanguage =
  | "JAPANESE_SUB"
  | "LATINO"
  | "CASTILIAN"
  | "MULTIPLE"
  | "UNKNOWN";

interface CreateChannelInput {
  title: string;
  username?: string | null;
  description?: string | null;
  photoUrl?: string | null;
  publicUrl?: string | null;
  inviteUrl?: string | null;
  telegramChatId?: string | null;
  type?: ChannelType;
}

export async function createChannel(input: CreateChannelInput) {
  const title = input.title.trim();

  if (!title) {
    throw new Error("El nombre del canal es obligatorio.");
  }

  return prisma.telegramChannel.create({
    data: {
      title,
      username: input.username,
      description: input.description,
      photoUrl: input.photoUrl,
      publicUrl: input.publicUrl,
      inviteUrl: input.inviteUrl,
      telegramChatId: input.telegramChatId
        ? BigInt(input.telegramChatId)
        : null,
      type: input.type ?? "PUBLIC",
    },
  });
}

export async function updateChannel(
  channelId: string,
  input: Partial<CreateChannelInput>
) {
  const data = {
    ...(input.title !== undefined && {
      title: input.title.trim(),
    }),
    ...(input.username !== undefined && {
      username: input.username,
    }),
    ...(input.description !== undefined && {
      description: input.description,
    }),
    ...(input.photoUrl !== undefined && {
      photoUrl: input.photoUrl,
    }),
    ...(input.publicUrl !== undefined && {
      publicUrl: input.publicUrl,
    }),
    ...(input.inviteUrl !== undefined && {
      inviteUrl: input.inviteUrl,
    }),
    ...(input.type !== undefined && {
      type: input.type,
    }),
    ...(input.telegramChatId !== undefined && {
      telegramChatId: input.telegramChatId
        ? BigInt(input.telegramChatId)
        : null,
    }),
  };

  if (input.title !== undefined && !input.title.trim()) {
    throw new Error("El nombre del canal no puede estar vacío.");
  }

  return prisma.telegramChannel.update({
    where: { id: channelId },
    data,
  });
}

export async function getChannelById(channelId: string) {
  return prisma.telegramChannel.findUnique({
    where: { id: channelId },
    include: {
      animes: {
        include: { anime: true },
      },
    },
  });
}

export async function listChannels() {
  return prisma.telegramChannel.findMany({
    where: { isActive: true },
    orderBy: { title: "asc" },
  });
}

export async function assignChannelToAnime(
  animeId: string,
  telegramChannelId: string,
  language: AnimeLanguage = "UNKNOWN"
) {
  return prisma.animeChannel.upsert({
    where: {
      animeId_telegramChannelId_language: {
        animeId,
        telegramChannelId,
        language,
      },
    },
    update: {},
    create: {
      animeId,
      telegramChannelId,
      language,
    },
  });
}

export async function removeChannelFromAnime(
  animeId: string,
  telegramChannelId: string,
  language: AnimeLanguage = "UNKNOWN"
) {
  return prisma.animeChannel.delete({
    where: {
      animeId_telegramChannelId_language: {
        animeId,
        telegramChannelId,
        language,
      },
    },
  });
}

export async function deactivateChannel(channelId: string) {
  return prisma.telegramChannel.update({
    where: { id: channelId },
    data: { isActive: false },
  });
}
