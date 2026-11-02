import type { CommandContext, Context } from "grammy";

export async function handleStart(
  ctx: CommandContext<Context>
) {
  const firstName = ctx.from?.first_name ?? "usuario";

  await ctx.reply(
    `¡Hola, ${firstName}! 👋

Soy Anime Finder.

Podés utilizar estos comandos:

/buscar - Buscar un anime
/favoritos - Ver tus favoritos
/historial - Ver tus búsquedas

¡Que disfrutes buscando anime!`
  );
}
