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

    const languageNames: Record<string, string> = {
      JAPANESE_SUB: "🇯🇵 Japonés subtitulado",
      CHINESE_SUB: "🇨🇳 Chino subtitulado",
      LATINO: "🇲🇽 Latino",
      CASTILIAN: "🇪🇸 Castellano",
      UNKNOWN: "🌐 Idioma no especificado",
    };

    const animeMessages = results.map((anime, index) => {
      const year = anime.year ?? "Año desconocido";
      const description = anime.description
        ? anime.description.slice(0, 250) +
        (anime.description.length > 250 ? "..." : "")
        : "Sin descripción.";

      const channelsByUrl = new Map<string, Set<string>>();

      for (const relation of anime.channels) {
        const channel = relation.telegramChannel;
        const url = channel.publicUrl ?? channel.inviteUrl;

        if (!url) continue;

        if (!channelsByUrl.has(url)) {
          channelsByUrl.set(url, new Set());
        }

        channelsByUrl.get(url)!.add(relation.language);
      }

      const channelLines = Array.from(channelsByUrl.entries())
        .map(([url, languages]) => {
          const labels = Array.from(languages)
            .map((language) =>
              languageNames[language] ?? "🌐 Otro idioma"
            )
            .join(" · ");

          return `${labels}\n🔗 ${url}`;
        });

      const channelsText = channelLines.length > 0
        ? "\n\n" + channelLines.join("\n\n")
        : "\n\n⚠️ No hay canales disponibles.";


      return (
        `${index + 1}. 📺 ${anime.title}\n` +
        `📅 ${year} · ${anime.type}\n\n` +
        `${description}` +
        channelsText
      );
    });

    await ctx.reply(`🔎 Resultados para "${query}":`);

    let message = "";

    for (const animeMessage of animeMessages) {
      const nextMessage = message
        ? `${message}\n\n━━━━━━━━━━━━━━\n\n${animeMessage}`
        : animeMessage;

      if (nextMessage.length > 3500) {
        await ctx.reply(message);
        message = animeMessage;
      } else {
        message = nextMessage;
      }
    }

    if (message) {
      await ctx.reply(message);
    }

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

