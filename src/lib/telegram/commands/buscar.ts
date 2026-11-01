import { searchAnime } from "../../services/search.service";

export async function handleBuscar(ctx: any) {
  const query = ctx.match.trim();

  if (!query) {
    await ctx.reply("Escribí un título. Ejemplo: /buscar Naruto");
    return;
  }

  const results = await searchAnime(query);

  if (results.length === 0) {
    await ctx.reply("No encontré ese anime 😕");
    return;
  }

  // Acá construimos la respuesta con los resultados.
}