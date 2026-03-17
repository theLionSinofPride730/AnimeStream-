import { notFound } from "next/navigation";
import { getAnimeByGenre, createSlug, normalizeStatus } from "@/lib/anilist";
import { AnimeCard } from "@/components/anime/AnimeCard";
import type { Metadata } from "next";

export const revalidate = 3600; // 1 hr

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const genreName = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return {
    title: `${genreName} Anime`,
    description: `Browse the best ${genreName} anime on AnimeStream.`,
  };
}

export default async function GenrePage({ params }: Props) {
  const { slug } = await params;
  // Convert slug to proper genre string (e.g. slice-of-life -> Slice of Life)
  const genreQuery = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const result = await getAnimeByGenre(genreQuery, 1, 40);

  if (!result || result.media.length === 0) {
    notFound();
  }

  return (
    <div className="page-container py-8 min-h-screen">
      <div className="mb-8">
        <h1 className="text-display-lg font-black text-white mb-2">
          {genreQuery} Anime
        </h1>
        <p className="text-gray-400">Explore the best anime in the {genreQuery} genre.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {result.media.map((anime) => (
          <AnimeCard
            key={anime.id}
            size="lg"
            className="w-full"
            anime={{
              id: String(anime.id),
              slug: createSlug(anime.title.romaji, anime.id),
              titleEn: anime.title.english,
              titleRomaji: anime.title.romaji,
              coverUrl: anime.coverImage.large,
              score: anime.averageScore,
              totalEpisodes: anime.episodes,
              status: normalizeStatus(anime.status),
              type: anime.format,
              year: anime.seasonYear,
              hasSub: true,
              hasDub: false,
            }}
          />
        ))}
      </div>
    </div>
  );
}
