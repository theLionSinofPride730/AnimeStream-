import { Suspense } from "react";
import { HeroBanner } from "@/components/home/HeroBanner";
import { AnimeCarousel } from "@/components/anime/AnimeCarousel";
import { GenreGrid } from "@/components/home/GenreGrid";
import { SchedulePreview } from "@/components/home/SchedulePreview";
import {
  getTrendingAnime,
  getPopularAnime,
  getSeasonalAnime,
  getAiringSchedule,
  createSlug,
  normalizeStatus,
  type AniListAnime,
} from "@/lib/anilist";

export const revalidate = 300; // ISR: 5 minute cache

function mapAniListToCard(anime: AniListAnime) {
  const slug = createSlug(anime.title.romaji, anime.id);
  return {
    id: String(anime.id),
    slug,
    titleEn: anime.title.english,
    titleRomaji: anime.title.romaji,
    coverUrl: anime.coverImage.extraLarge || anime.coverImage.large,
    bannerUrl: anime.bannerImage,
    score: anime.averageScore,
    totalEpisodes: anime.episodes,
    status: normalizeStatus(anime.status),
    type: anime.format,
    year: anime.seasonYear,
    genres: anime.genres?.slice(0, 3),
    hasSub: true,
    hasDub: false,
    anilistId: anime.id,
  };
}

export default async function HomePage() {
  // Fetch all data in parallel
  const [trending, popular, seasonal, schedule] = await Promise.allSettled([
    getTrendingAnime(1, 20),
    getPopularAnime(1, 20),
    getSeasonalAnime("WINTER", 2025, 1, 20),
    getAiringSchedule(),
  ]);

  const trendingAnime = trending.status === "fulfilled" ? trending.value.media.map(mapAniListToCard) : [];
  const popularAnime = popular.status === "fulfilled" ? popular.value.media.map(mapAniListToCard) : [];
  const seasonalAnime = seasonal.status === "fulfilled" ? seasonal.value.media.map(mapAniListToCard) : [];
  const scheduleData = schedule.status === "fulfilled"
    ? schedule.value.slice(0, 30).map((item) => ({
        animeTitle: item.media.title.english || item.media.title.romaji,
        animeSlug: createSlug(item.media.title.romaji, item.media.id),
        coverUrl: item.media.coverImage.large || undefined,
        episode: item.episode,
        airingAt: item.airingAt,
        dayOfWeek: new Date(item.airingAt * 1000).toLocaleDateString("en-US", { weekday: "long" }),
      }))
    : [];

  // Featured for hero: top 5 trending with banner images
  const featuredAnime = trendingAnime.slice(0, 5);

  return (
    <div className="relative">
      {/* Hero Banner */}
      <HeroBanner featured={featuredAnime} />

      {/* Content sections */}
      <div className="page-container space-y-12 py-10">
        {/* Trending */}
        {trendingAnime.length > 0 && (
          <AnimeCarousel
            title="🔥 Trending Now"
            anime={trendingAnime}
            viewAllHref="/trending"
          />
        )}

        {/* Schedule Preview */}
        {scheduleData.length > 0 && (
          <SchedulePreview schedule={scheduleData} />
        )}

        {/* Seasonal */}
        {seasonalAnime.length > 0 && (
          <AnimeCarousel
            title="❄️ Winter 2025"
            anime={seasonalAnime}
            viewAllHref="/season/winter-2025"
            accentColor="#3B82F6"
          />
        )}

        {/* Browse by Genre */}
        <GenreGrid />

        {/* Popular — Most Watched */}
        {popularAnime.length > 0 && (
          <AnimeCarousel
            title="👑 Most Popular"
            anime={popularAnime}
            viewAllHref="/popular"
            accentColor="#FF6B35"
          />
        )}

        {/* Extra spacing for mobile nav */}
        <div className="h-4" />
      </div>
    </div>
  );
}
