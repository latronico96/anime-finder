import { Composer, type Context } from "grammy";
import { listGenres } from "../../../services/genre.service";
import { adminMiddleware } from "../middlewares/admin.middleware";
import {
  createAnime,
  getAnimeByTitle,
  getAnimeById,
  listAnimes,
} from "../../../services/anime.service";
import { editCommands } from "./edit.command";

export const adminCommands = new Composer<Context>();

// Todos los comandos de este Composer requieren ADMIN.
adminCommands.use(adminMiddleware);
adminCommands.use(editCommands);

// Menú administrativo
adminCommands.command("admin", async (ctx) => {
  await ctx.reply(
    `⚙️ PANEL DE ADMINISTRACIÓN

📚 Catálogo
/alta - Registrar anime
/ver - Consultar anime
/listar - Listar catálogo
/editar - Editar anime
/alias - Administrar alias
/generos - Listar géneros

📺 Canales
/canal - Administrar canales

🎬 Contenido
/temporada - Crear temporada
/episodio - Crear episodio

📥 Importaciones
/importar - Importar desde Telegram

Estos comandos están disponibles solamente para administradores.`
  );
});

// Consultar géneros
adminCommands.command("generos", async (ctx) => {
  const genres = await listGenres();

  if (genres.length === 0) {
    await ctx.reply("Todavía no hay géneros registrados.");
    return;
  }

  const message = genres
    .map((genre, index) => `${index + 1}. ${genre.name}`)
    .join("\n");

  await ctx.reply(`📚 GÉNEROS DISPONIBLES\n\n${message}`);
});

// Registrar un anime
adminCommands.command("alta", async (ctx) => {
  const title = ctx.match.trim();

  if (!title) {
    await ctx.reply(
      "Tenés que indicar el título del anime.\n\n" +
      "Ejemplo:\n" +
      "/alta Kimetsu no Yaiba"
    );
    return;
  }

  if (title.length < 2) {
    await ctx.reply("El título es demasiado corto.");
    return;
  }

  try {
    const existing = await getAnimeByTitle(title);

    if (existing) {
      await ctx.reply(
        `Este anime ya está registrado.\n\n` +
        `📺 ${existing.title}\n` +
        `ID: ${existing.id}`
      );
      return;
    }

    const anime = await createAnime({
      title,
      type: "UNKNOWN",
      status: "UNKNOWN",
    });

    await ctx.reply(
      `✅ Anime registrado correctamente.\n\n` +
      `📺 ${anime.title}\n` +
      `Tipo: ${anime.type}\n` +
      `ID: ${anime.id}`
    );
  } catch (error) {
    console.error("Error registrando anime:", error);

    await ctx.reply(
      "No pude registrar el anime. Revisá los datos e intentá nuevamente."
    );
  }
});

adminCommands.command("ver", async (ctx) => {
  const title = ctx.match.trim();

  if (!title) {
    await ctx.reply(
      "Indicá el nombre del anime.\n\nEjemplo:\n/ver Kimetsu no Yaiba"
    );
    return;
  }

  try {
    const anime = await getAnimeByTitle(title);

    if (!anime) {
      await ctx.reply("No encontré ese anime.");
      return;
    }

    const details = await getAnimeById(anime.id);

    if (!details) {
      await ctx.reply("No pude recuperar los detalles del anime.");
      return;
    }

    const aliases = details.aliases
      .map((alias) => `• ${alias.value}`)
      .join("\n") || "Sin alias";

    const genres = details.genres
      .map((item) => item.genre.name)
      .join(", ") || "Sin géneros";

    const channels = details.channels
      .map((item) => `• ${item.telegramChannel.title} (${item.language})`)
      .join("\n") || "Sin canales";

    const seasons = details.seasons
      .map((season) => `• Temporada ${season.number}: ${season.episodes.length} episodios`)
      .join("\n") || "Sin temporadas";

    await ctx.reply(
      `📺 ${details.title}

ID: ${details.id}
Año: ${details.year ?? "No definido"}
Tipo: ${details.type}
Estado: ${details.status}
Episodios: ${details.episodes ?? "No definido"}

📝 Alias:
${aliases}

🎭 Géneros:
${genres}

📡 Canales:
${channels}

🎬 Temporadas:
${seasons}`
    );
  } catch (error) {
    console.error("Error consultando anime:", error);
    await ctx.reply("Ocurrió un error al consultar el anime.");
  }
});

adminCommands.command("listar", async (ctx) => {
  try {
    const animes = await listAnimes(20);

    if (animes.length === 0) {
      await ctx.reply("Todavía no hay animes registrados.");
      return;
    }

    const message = animes
      .map((anime, index) =>
        `${index + 1}. ${anime.title} (${anime.type})`
      )
      .join("\n");

    await ctx.reply(
      `📚 CATÁLOGO DE ANIME\n\n${message}\n\nMostrando ${animes.length} resultados.`
    );
  } catch (error) {
    console.error("Error listando animes:", error);
    await ctx.reply("No pude consultar el catálogo.");
  }
});
