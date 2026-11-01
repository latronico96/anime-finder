import { prisma } from "../lib/db/prisma";

type UserRole = "USER" | "ADMIN";

interface TelegramUserInput {
  telegramUserId: number | bigint;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export async function upsertTelegramUser(input: TelegramUserInput) {
  const telegramUserId = BigInt(input.telegramUserId);

  return prisma.botUser.upsert({
    where: { telegramUserId },
    update: {
      username: input.username ?? null,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      lastSeenAt: new Date(),
    },
    create: {
      telegramUserId,
      username: input.username ?? null,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      lastSeenAt: new Date(),
    },
  });
}

export async function isAdmin(telegramUserId: number | bigint) {
  const user = await prisma.botUser.findUnique({
    where: {
      telegramUserId: BigInt(telegramUserId),
    },
    select: {
      role: true,
      isBlocked: true,
    },
  });

  return user?.role === "ADMIN" && !user.isBlocked;
}

export async function setUserRole(
  telegramUserId: number | bigint,
  role: UserRole
) {
  return prisma.botUser.update({
    where: {
      telegramUserId: BigInt(telegramUserId),
    },
    data: { role },
  });
}

export async function blockUser(telegramUserId: number | bigint) {
  return prisma.botUser.update({
    where: {
      telegramUserId: BigInt(telegramUserId),
    },
    data: { isBlocked: true },
  });
}

export async function unblockUser(telegramUserId: number | bigint) {
  return prisma.botUser.update({
    where: {
      telegramUserId: BigInt(telegramUserId),
    },
    data: { isBlocked: false },
  });
}

export async function listUsers(limit = 50) {
  return prisma.botUser.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}