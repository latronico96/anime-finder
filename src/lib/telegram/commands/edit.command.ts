
import { Composer, InlineKeyboard, type Context } from "grammy";
import {
  getAnimeByTitle,
  updateAnime,
} from "../../../services/anime.service";

type EditField =
  | "title"
  | "titleEs"
  | "titleEn"
  | "titleRomaji"
  | "titleNative"
  | "year"
  | "type"
  | "status"
  | "episodes"
  | "description"
  | "posterUrl";

interface EditSession {
  animeId: string;
  animeTitle: string;
  field?: EditField;
}

// Estado temporal por usuario y chat.
const editSessions = new Map<string, EditSession>();

function getSessionKey(ctx: Context): string | null {
  if (!ctx.from || !ctx.chat) return null;
  return `${ctx.from.id}:${ctx.chat.id}`;
}

function getEditKeyboard() {
  return new InlineKeyboard()
    .text("Título", "edit:title")
    .text("Español", "edit:titleEs")
    .row()
    .text("Inglés", "edit:titleEn")
    .text("Romaji", "edit:titleRomaji")
    .row()
    .text("Japonés", "edit:titleNative")
    .text("Año", "edit:year")
    .row()
    .text("Tipo", "edit:type")
    .text("Estado", "edit:status")
    .row()
    .text("Episodios", "edit:episodes")
    .row()
    .text("Descripción", "edit:description")
    .text("Poster", "edit:posterUrl")
    .row()
    .text("Cancelar", "edit:cancel");
}

function getFieldLabel(field: EditField): string {
  const labels: Record<EditField, string> = {
    title: "Título principal",
    titleEs: "Título en español",
    titleEn: "Título en inglés",
    titleRomaji: "Título romaji",
    titleNative: "Título japonés / nativo",
    year: "Año",
    type: "Tipo",
    status: "Estado",
    episodes: "Cantidad de episodios",
    description: "Descripción",
    posterUrl: "URL del poster",
  };

  return labels[field];
}

function getFieldInstructions(field: EditField): string {
  switch (field) {
    case "title":
    case "titleEs":
    case "titleEn":
    case "titleRomaji":
    case "titleNative":
      return "Escribí el nuevo título.\n\nPara borrar un título alternativo, escribí: ninguno";

    case "year":
      return "Escribí el año (por ejemplo, 2019).\n\nPara borrar el año, escribí: ninguno";

    case "episodes":
      return "Escribí la cantidad de episodios (por ejemplo, 26).\n\nPara borrar el dato, escribí: ninguno";

    case "type":
      return (
        "Elegí uno de estos valores escribiéndolo:\n\n" +
        "TV\nMOVIE\nOVA\nONA\nSPECIAL\nUNKNOWN"
      );

    case "status":
      return (
        "Elegí uno de estos valores escribiéndolo:\n\n" +
        "FINISHED\nRELEASING\nNOT_YET_RELEASED\nCANCELLED\nUNKNOWN"
      );

    case "description":
      return "Escribí la nueva descripción.\n\nPara borrar la descripción, escribí: ninguno";

    case "posterUrl":
      return "Pegá la URL de la imagen del poster.\n\nPara borrar el poster, escribí: ninguno";
  }
}

function parseOptionalText(value: string): string | null {
  return value.trim().toLowerCase() === "ninguno"
    ? null
    : value.trim();
}

function parseOptionalNumber(value: string): number | null {
  if (value.trim().toLowerCase() === "ninguno") return null;

  const parsed = Number(value.trim());

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error("Ingresá un número entero igual o mayor a cero.");
  }

  return parsed;
}

async function showEditMenu(ctx: Context, session: EditSession) {
  await ctx.reply(
    `✏️ EDITAR ANIME\n\n` +
    `📺 ${session.animeTitle}\n` +
    `ID: ${session.animeId}\n\n` +
    "¿Qué dato querés modificar?",
    {
      reply_markup: getEditKeyboard(),
    }
  );
}

export const editCommands = new Composer<Context>();

// Iniciar edición.
editCommands.command("editar", async (ctx) => {
  const title = ctx.match.trim();

  if (!title) {
    await ctx.reply(
      "Indicá el anime que querés editar.\n\n" +
      "Ejemplo:\n/editar Kimetsu no Yaiba"
    );
    return;
  }

  try {
    const anime = await getAnimeByTitle(title);

    if (!anime) {
      await ctx.reply("No encontré ese anime en el catálogo.");
      return;
    }

    const key = getSessionKey(ctx);
    if (!key) return;

    const session: EditSession = {
      animeId: anime.id,
      animeTitle: anime.title,
    };

    editSessions.set(key, session);
    await showEditMenu(ctx, session);
  } catch (error) {
    console.error("Error iniciando edición:", error);
    await ctx.reply("No pude iniciar la edición del anime.");
  }
});

// Cancelar mediante comando.
editCommands.command("cancelareditar", async (ctx) => {
  const key = getSessionKey(ctx);
  if (key) editSessions.delete(key);

  await ctx.reply("Edición cancelada.");
});

// Selección del campo mediante botones.
editCommands.on("callback_query:data", async (ctx, next) => {
  const data = ctx.callbackQuery.data;

  if (!data.startsWith("edit:")) return next();

  const key = getSessionKey(ctx);
  if (!key) {
    await ctx.answerCallbackQuery();
    return;
  }

  const session = editSessions.get(key);

  if (!session) {
    await ctx.answerCallbackQuery({
      text: "La sesión de edición venció. Volvé a ejecutar /editar.",
      show_alert: true,
    });
    return;
  }

  const action = data.slice("edit:".length);

  if (action === "cancel") {
    editSessions.delete(key);
    await ctx.answerCallbackQuery({ text: "Edición cancelada." });
    await ctx.editMessageText("Edición cancelada.");
    return;
  }

  const validFields: EditField[] = [
    "title",
    "titleEs",
    "titleEn",
    "titleRomaji",
    "titleNative",
    "year",
    "type",
    "status",
    "episodes",
    "description",
    "posterUrl",
  ];

  if (!validFields.includes(action as EditField)) {
    await ctx.answerCallbackQuery({ text: "Opción inválida." });
    return;
  }

  const field = action as EditField;
  session.field = field;
  editSessions.set(key, session);

  await ctx.answerCallbackQuery();

  await ctx.reply(
    `✏️ ${getFieldLabel(field)}\n\n${getFieldInstructions(field)}\n\n` +
    "También podés cancelar con /cancelareditar."
  );
});

// Recibir el nuevo valor y guardarlo.
editCommands.on("message:text", async (ctx, next) => {
  const key = getSessionKey(ctx);
  if (!key) return next();

  const session = editSessions.get(key);

  // No interceptar mensajes que no formen parte de una edición.
  if (!session?.field) return next();

  const value = ctx.message.text.trim();

  // Permitir que otros comandos sigan funcionando.
  if (value.startsWith("/")) return next();

  if (!value) {
    await ctx.reply("El valor no puede estar vacío.");
    return;
  }

  const field = session.field;

  try {
    // Validar y actualizar según el campo elegido.
    switch (field) {
      case "title": {
        const newTitle = value;

        if (newTitle.length < 2) {
          throw new Error("El título debe tener al menos 2 caracteres.");
        }

        const existing = await getAnimeByTitle(newTitle);

        if (existing && existing.id !== session.animeId) {
          throw new Error("Ya existe otro anime registrado con ese título.");
        }

        await updateAnime(session.animeId, { title: newTitle });
        session.animeTitle = newTitle;
        break;
      }

      case "titleEs":
        await updateAnime(session.animeId, {
          titleEs: parseOptionalText(value),
        });
        break;

      case "titleEn":
        await updateAnime(session.animeId, {
          titleEn: parseOptionalText(value),
        });
        break;

      case "titleRomaji":
        await updateAnime(session.animeId, {
          titleRomaji: parseOptionalText(value),
        });
        break;

      case "titleNative":
        await updateAnime(session.animeId, {
          titleNative: parseOptionalText(value),
        });
        break;

      case "year":
        await updateAnime(session.animeId, {
          year: parseOptionalNumber(value),
        });
        break;

      case "episodes":
        await updateAnime(session.animeId, {
          episodes: parseOptionalNumber(value),
        });
        break;

      case "type": {
        const allowed = [
          "TV",
          "MOVIE",
          "OVA",
          "ONA",
          "SPECIAL",
          "UNKNOWN",
        ] as const;

        const normalized = value.toUpperCase();

        if (!allowed.includes(normalized as (typeof allowed)[number])) {
          throw new Error("Tipo inválido. Elegí uno de los valores indicados.");
        }

        await updateAnime(session.animeId, {
          type: normalized as (typeof allowed)[number],
        });
        break;
      }

      case "status": {
        const allowed = [
          "FINISHED",
          "RELEASING",
          "NOT_YET_RELEASED",
          "CANCELLED",
          "UNKNOWN",
        ] as const;

        const normalized = value.toUpperCase();

        if (!allowed.includes(normalized as (typeof allowed)[number])) {
          throw new Error("Estado inválido. Elegí uno de los valores indicados.");
        }

        await updateAnime(session.animeId, {
          status: normalized as (typeof allowed)[number],
        });
        break;
      }

      case "description":
        await updateAnime(session.animeId, {
          description: parseOptionalText(value),
        });
        break;

      case "posterUrl": {
        const url = parseOptionalText(value);

        if (url !== null) {
          let parsedUrl: URL;

          try {
            parsedUrl = new URL(url);
          } catch {
            throw new Error("La URL del poster no es válida.");
          }

          if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            throw new Error("El poster debe tener una URL HTTP o HTTPS.");
          }
        }

        await updateAnime(session.animeId, {
          posterUrl: url,
        });
        break;
      }
    }

    session.field = undefined;
    editSessions.set(key, session);

    await ctx.reply(
      `✅ ${getFieldLabel(field)} actualizado correctamente.\n\n` +
      `📺 ${session.animeTitle}`,
      {
        reply_markup: getEditKeyboard(),
      }
    );
  } catch (error) {
    console.error("Error actualizando anime:", error);

    const message =
      error instanceof Error
        ? error.message
        : "No pude actualizar el anime.";

    await ctx.reply(
      `⚠️ ${message}\n\nPodés intentar nuevamente o cancelar con /cancelareditar.`
    );
  }
});
