import type { Context, MiddlewareFn } from "grammy";
import { upsertTelegramUser } from "../../../services/admin.service";

export const userMiddleware: MiddlewareFn<Context> = async (
  ctx,
  next
) => {
  if (!ctx.from) {
    return next();
  }

  const user = await upsertTelegramUser({
    telegramUserId: ctx.from.id,
    username: ctx.from.username,
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name,
  });

  if (user.isBlocked) {
    await ctx.reply("Tu acceso al bot está bloqueado.");
    return;
  }

  await next();
};