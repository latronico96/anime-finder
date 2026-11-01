import { webhookCallback } from "grammy";
import { bot } from "../../../../lib/telegram/bot";

export const runtime = "nodejs";

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
.env
├── .env.local
├── .env.production
├── .env.example