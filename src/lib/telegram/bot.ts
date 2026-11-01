import { Bot } from "grammy";
import { env } from "../env";
import { searchAnime } from "../services/search.service";

export const bot = new Bot(env.BOT_TOKEN);

bot.command("start", async (ctx) => {
  await ctx.reply(
    "¡Bienvenido a Anime Finder! 🍥\n\nUsá /buscar seguido del nombre de un anime."
  );
});

bot.command("buscar", async (ctx) => {
  const query = ctx.match.trim();

  if (!query) {
    await ctx.reply("Ejemplo: /buscar Naruto");
    return;
  }

  const results = await searchAnime(query);

  if (results.length === 0) {
    await ctx.reply(`No encontré animes para "${query}".`);
    return;
  }

  const message = results
    .map((anime, index) => {
      return `${index + 1}. ${anime.title} (${anime.year})\n${anime.description}`;
    })
    .join("\n\n");

  await ctx.reply(`🔎 Resultados para "${query}":\n\n${message}`);
});
