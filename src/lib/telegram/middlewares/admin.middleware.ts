import type { Context, MiddlewareFn } from "grammy";
import { isAdmin } from "../../../services/admin.service";

export const adminMiddleware: MiddlewareFn<Context> = async (
  ctx,
  next
) => {
  if (!ctx.from) {
    return;
  }

  const authorized = await isAdmin(ctx.from.id);

  if (!authorized) {
    await ctx.reply(
      "No tenés permisos para utilizar este comando."
    );
    return;
  }

  await next();
};