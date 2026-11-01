import "dotenv/config";

const botToken = process.env.BOT_TOKEN?.trim();

if (!botToken) {
  throw new Error(
    "BOT_TOKEN no está configurado. Revisá el archivo .env en la raíz del proyecto."
  );
}

export const env = {
  BOT_TOKEN: botToken,
  DATABASE_URL: process.env.DATABASE_URL,
  TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET,
};