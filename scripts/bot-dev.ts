import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);

async function main() {
  const { bot } = await import("../src/lib/telegram/bot");

  const me = await bot.api.getMe();

  console.log(`Bot conectado: @${me.username}`);

  await bot.start({
    onStart: () => {
      console.log("Bot iniciado en modo polling");
    },
  });
}

main().catch(console.error);