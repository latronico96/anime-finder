import { Bot } from "grammy";
import { env } from "../env";
import { searchAnime } from "../services/search.service";
import { userMiddleware } from "./middlewares/user.middleware";
import { handleStart } from "./commands/start.command";
import { adminCommands } from "./commands/admin.command";

export const bot = new Bot(env.BOT_TOKEN);
bot.use(userMiddleware);
bot.command("start", handleStart);

bot.use(adminCommands);

bot.command("buscar", async (ctx) => {
  const query = ctx.match.trim();

  if (!query) {
    await ctx.reply(
      "🔎 ¿Qué anime estás buscando?\n\n" +
      "Ejemplo: /buscar Naruto"
    );
    return;
  }

  try {
    const results = await searchAnime(query);

    if (results.length === 0) {
      await ctx.reply(
        `No encontré animes para "${query}".\n\n` +
        "Probá con otro título o nombre alternativo."
      );
      return;
    }

    const message = results
      .map((anime, index) => {
        const year = anime.year ?? "Año desconocido";
        const description = anime.description ?? "Sin descripción.";

        return (
          `${index + 1}. 📺 ${anime.title}\n` +
          `📅 ${year} · ${anime.type}\n` +
          `${description}`
        );
      })
      .join("\n\n");

    await ctx.reply(
      `🔎 Resultados para "${query}":\n\n${message}`
    );
  } catch (error) {
    console.error("Error buscando anime:", error);

    await ctx.reply(
      "Ocurrió un error al buscar. Intentá nuevamente."
    );
  }
});

bot.catch((err) => {
  console.error("Error procesando actualización de Telegram:", err);

  console.error("Update:", err.ctx.update);
});

