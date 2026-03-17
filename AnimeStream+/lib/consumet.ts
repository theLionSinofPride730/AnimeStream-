/**
 * Consumet API Integration
 * Provides anime search and episode streaming from multiple providers
 * Primary providers: Gogoanime, Zoro, Aniwatch
 */

import axios, { AxiosError } from "axios";

const CONSUMET_BASE_URL = "https://api.consumet.org";
const GOGOANIME_PROVIDER = "gogoanime";
const ZORO_PROVIDER = "zoro";
const ANIWATCH_PROVIDER = "aniwatch";

// Types
export interface ConsumetSearchResult {
  id: string;
  title: string;
  image?: string;
  releaseDate?: string;
  totalEpisodes?: number;
}

export interface ConsumetSearchResponse {
  results: ConsumetSearchResult[];
  hasNextPage?: boolean;
}

export interface StreamingSource {
  url: string;
  quality?: string;
  isM3U8: boolean;
  headers?: Record<string, string>;
}

export interface ConsumetEpisodeData {
  sources: StreamingSource[];
  intro?: {
    start: number;
    end: number;
  };
  outro?: {
    start: number;
    end: number;
  };
  subtitles?: Array<{
    lang: string;
    url: string;
  }>;
}

// Initialize axios with timeout
const client = axios.create({
  baseURL: CONSUMET_BASE_URL,
  timeout: 10000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
});

/**
 * Search for anime on Consumet
 * @param query - Search query (e.g., "One Piece")
 * @param provider - Provider to search on (default: gogoanime)
 * @returns Array of anime results with IDs
 */
export async function searchConsumetAnime(
  query: string,
  provider: string = GOGOANIME_PROVIDER
): Promise<ConsumetSearchResponse> {
  try {
    const response = await client.get(`/anime/${provider}/search`, {
      params: { query, page: 1 },
    });
    return response.data;
  } catch (error) {
    console.error(`Consumet search failed for provider ${provider}:`, error);
    throw new Error(`Failed to search anime: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get anime info from Consumet
 * @param animeId - Anime ID from search results
 * @param provider - Provider (default: gogoanime)
 * @returns Anime info with episode count
 */
export async function getConsumetAnimeInfo(
  animeId: string,
  provider: string = GOGOANIME_PROVIDER
): Promise<any> {
  try {
    const response = await client.get(`/anime/${provider}/info`, {
      params: { id: animeId },
    });
    return response.data;
  } catch (error) {
    console.error(`Consumet info fetch failed for ${animeId}:`, error);
    throw new Error(`Failed to fetch anime info: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get streaming sources for an episode
 * @param episodeId - Episode ID (usually "animeId-ep-episodeNumber")
 * @param provider - Provider (default: gogoanime)
 * @returns Streaming sources with URLs
 */
export async function getConsumetEpisodeSources(
  episodeId: string,
  provider: string = GOGOANIME_PROVIDER
): Promise<ConsumetEpisodeData> {
  try {
    const response = await client.get(`/anime/${provider}/watch`, {
      params: { episodeId },
    });

    // Normalize response structure
    const data = response.data;
    return {
      sources: (data.sources || []).map((source: any) => ({
        url: source.url,
        quality: source.quality || "default",
        isM3U8: source.url?.includes(".m3u8") || false,
      })),
      intro: data.intro,
      outro: data.outro,
      subtitles: data.subtitles || [],
    };
  } catch (error) {
    console.error(`Consumet episode fetch failed for ${episodeId}:`, error);
    throw new Error(
      `Failed to fetch episode sources: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Try multiple providers for episode sources (fallback mechanism)
 * @param episodeId - Episode ID
 * @returns Streaming sources from first successful provider
 */
export async function getEpisodeSourcesWithFallback(
  episodeId: string
): Promise<ConsumetEpisodeData> {
  const providers = [GOGOANIME_PROVIDER, ZORO_PROVIDER, ANIWATCH_PROVIDER];

  for (const provider of providers) {
    try {
      console.log(`Trying provider: ${provider}`);
      const sources = await getConsumetEpisodeSources(episodeId, provider);

      // Check if we got valid sources
      if (sources.sources && sources.sources.length > 0 && sources.sources[0].url) {
        console.log(`Success with provider: ${provider}`);
        return sources;
      }
    } catch (error) {
      console.warn(`Provider ${provider} failed, trying next...`);
      continue;
    }
  }

  throw new Error("Failed to fetch episode sources from all providers");
}

/**
 * Format anime ID for Consumet (e.g., "Death Note" -> "death-note")
 */
export function formatConsumetId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Helper to convert AniList anime title to Consumet search query
 */
export function toConsumetSearchQuery(title: string): string {
  // Remove special characters, keep alphanumeric and spaces
  return title
    .replace(/[^\w\s]/g, "")
    .trim()
    .substring(0, 50); // Limit length for better search results
}
