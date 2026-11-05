import { webhookCallback } from "grammy";
import { bot } from "../../../../lib/telegram/bot";

const handleUpdate = webhookCallback(bot, "std/http");

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (
    !secret ||
    request.headers.get("x-telegram-bot-api-secret-token") !== secret
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  return handleUpdate(request);
}
