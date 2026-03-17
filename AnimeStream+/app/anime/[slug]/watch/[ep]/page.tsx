import { notFound } from "next/navigation";
import { getAnimeById, createSlug } from "@/lib/anilist";
import { searchConsumetAnime, getEpisodeSourcesWithFallback, toConsumetSearchQuery } from "@/lib/consumet";
import { WatchPageClient } from "@/components/watch/WatchPageClient";
import type { Metadata } from "next";
import type { SkipTime, VideoSource } from "@/components/player/VideoPlayer";

export const revalidate = 0; // SSR for watch page

interface Props {
  params: Promise<{ slug: string; ep: string }>;
}

function getIdFromSlug(slug: string): number | null {
  const parts = slug.split("-");
  const last = parts[parts.length - 1];
  const id = parseInt(last, 10);
  return isNaN(id) ? null : id;
}

/**
 * Fetch video sources from Consumet for initial load
 * This provides SSR sources, client-side ServerSelector can override
 */
async function getVideoSources(animeTitle: string, epNum: number) {
  try {
    // Step 1: Search for anime on Consumet
    const searchQuery = toConsumetSearchQuery(animeTitle);
    const searchResponse = await searchConsumetAnime(searchQuery);

    if (!searchResponse.results || searchResponse.results.length === 0) {
      console.warn(`No Consumet results for ${animeTitle}`);
      return null;
    }

    // Step 2: Use first result (best match)
    const animeId = searchResponse.results[0].id;
    console.log(`Found Consumet anime: ${animeTitle} -> ${animeId}`);

    // Step 3: Fetch episode sources
    const episodeData = await getEpisodeSourcesWithFallback(`${animeId}-episode-${epNum}`);

    if (!episodeData.sources || episodeData.sources.length === 0) {
      console.warn(`No sources found for episode ${epNum}`);
      return null;
    }

    // Step 4: Format response for VideoPlayer
    return {
      sources: episodeData.sources.map((source) => ({
        quality: source.quality || "HD",
        url: source.url,
        isM3U8: source.isM3U8,
      })),
      intro: episodeData.intro,
      outro: episodeData.outro,
      subtitles: episodeData.subtitles,
      animeId: animeId, // Return the anime ID for client-side use
    };
  } catch (error) {
    console.error("Failed to fetch video sources:", error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, ep } = await params;
  const anime = await getAnimeById(getIdFromSlug(slug) || 0);
  if (!anime) return { title: "Not Found" };

  const title = anime.title.english || anime.title.romaji;
  return {
    title: `Watch ${title} Episode ${ep} Free Online`,
    description: `Watch ${title} Episode ${ep} in HD. Free anime streaming on AnimeStream.`,
  };
}

export default async function WatchPage({ params }: Props) {
  const { slug, ep } = await params;
  const animeId = getIdFromSlug(slug);
  const epNum = parseInt(ep, 10);

  if (!animeId || isNaN(epNum)) notFound();

  const anime = await getAnimeById(animeId);
  if (!anime) notFound();

  const title = anime.title.english || anime.title.romaji;
  const episodes = anime.airingSchedule?.nodes ?? [];
  const totalEpisodes = anime.episodes ?? episodes.length;

  // Validate episode range
  if (epNum < 1 || (totalEpisodes > 0 && epNum > totalEpisodes)) {
    notFound();
  }

  // Fetch initial sources from Consumet for SSR
  let initialSources: VideoSource[] = [];
  let initialSkipTimes: SkipTime[] = [];
  let consumetAnimeId: string | null = null;

  const sourceData = await getVideoSources(title, epNum);
  
  if (sourceData) {
    initialSources = sourceData.sources;
    consumetAnimeId = sourceData.animeId;
    
    // Build skip times from intro/outro
    if (sourceData.intro) {
      initialSkipTimes.push({
        type: "op",
        startTime: sourceData.intro.start,
        endTime: sourceData.intro.end,
      });
    }
    if (sourceData.outro) {
      initialSkipTimes.push({
        type: "ed",
        startTime: sourceData.outro.start,
        endTime: sourceData.outro.end,
      });
    }
  }

  // Fallback to placeholder if no sources found
  if (initialSources.length === 0) {
    console.warn("No sources found, using placeholder");
    initialSources = [
      { quality: "1080p", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", isM3U8: true },
    ];
  }

  // Build episode ID for provider API - format: "anime-title-episode-X"
  // The client-side ServerSelector will use this to fetch from different providers
  const episodeId = consumetAnimeId 
    ? `${consumetAnimeId}-episode-${epNum}` 
    : `${toConsumetSearchQuery(title).toLowerCase().replace(/\s+/g, '-')}-episode-${epNum}`;

  return (
    <WatchPageClient
      animeTitle={title}
      animeSlug={slug}
      episodeNumber={epNum}
      totalEpisodes={totalEpisodes}
      initialSources={initialSources}
      posterUrl={anime.coverImage.large || undefined}
      bannerUrl={anime.bannerImage || anime.coverImage.extraLarge || undefined}
      skipTimes={initialSkipTimes}
      episodeId={episodeId}
      anime={{
        coverImage: anime.coverImage.large || undefined,
        status: anime.status,
        averageScore: anime.averageScore,
        format: anime.format,
        seasonYear: anime.seasonYear,
        description: anime.description,
        genres: anime.genres,
      }}
    />
  );
}
