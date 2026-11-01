export async function searchAnime(query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  const animeList = [
    {
      id: 1,
      title: "Naruto",
      description: "Un joven ninja que sueña con convertirse en Hokage.",
      year: 2002,
    },
    {
      id: 2,
      title: "Naruto Shippuden",
      description: "La continuación de la historia de Naruto.",
      year: 2007,
    },
  ];

  return animeList.filter((anime) =>
    anime.title.toLowerCase().includes(normalizedQuery)
  );
}