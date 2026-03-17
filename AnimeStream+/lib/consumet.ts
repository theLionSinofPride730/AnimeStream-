/**
 * Consumet API Integration
 * Provides anime search and episode streaming from multiple providers
 * Primary providers: Gogoanime, Zoro, Aniwatch
 * 
 * Uses multiple API endpoints for redundancy
 */

import axios, { AxiosError } from "axios";

// Multiple Consumet API endpoints for redundancy
const CONSUMET_ENDPOINTS = [
  "https://api.consumet.org",
  "https://consumet-api-two-tau.vercel.app", // Community mirror
  "https://consumet-api.vercel.app", // Alternative mirror
];

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

/**
 * Create axios client with timeout
 */
function createClient(baseURL: string) {
  return axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
}

/**
 * Search for anime on Consumet - tries multiple endpoints
 * @param query - Search query (e.g., "One Piece")
 * @param provider - Provider to search on (default: gogoanime)
 * @returns Array of anime results with IDs
 */
export async function searchConsumetAnime(
  query: string,
  provider: string = GOGOANIME_PROVIDER
): Promise<ConsumetSearchResponse> {
  // Try multiple endpoints
  for (const baseUrl of CONSUMET_ENDPOINTS) {
    try {
      console.log(`[v0] Trying Consumet search at ${baseUrl} for "${query}"`);
      const client = createClient(baseUrl);
      const response = await client.get(`/anime/${provider}/search`, {
        params: { query, page: 1 },
      });
      
      if (response.data?.results?.length > 0) {
        console.log(`[v0] Found ${response.data.results.length} results at ${baseUrl}`);
        return response.data;
      }
    } catch (error) {
      console.warn(`[v0] Consumet endpoint ${baseUrl} failed:`, error instanceof Error ? error.message : "Unknown error");
      continue;
    }
  }

  // If all endpoints fail, try alternative providers
  const alternativeProviders = [ZORO_PROVIDER, ANIWATCH_PROVIDER].filter(p => p !== provider);
  
  for (const altProvider of alternativeProviders) {
    for (const baseUrl of CONSUMET_ENDPOINTS) {
      try {
        console.log(`[v0] Trying alternative provider ${altProvider} at ${baseUrl}`);
        const client = createClient(baseUrl);
        const response = await client.get(`/anime/${altProvider}/search`, {
          params: { query, page: 1 },
        });
        
        if (response.data?.results?.length > 0) {
          console.log(`[v0] Found ${response.data.results.length} results with ${altProvider}`);
          return response.data;
        }
      } catch (error) {
        continue;
      }
    }
  }

  console.error(`[v0] All Consumet endpoints failed for query: ${query}`);
  return { results: [] };
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
  for (const baseUrl of CONSUMET_ENDPOINTS) {
    try {
      const client = createClient(baseUrl);
      const response = await client.get(`/anime/${provider}/info`, {
        params: { id: animeId },
      });
      return response.data;
    } catch (error) {
      console.warn(`[v0] Consumet info endpoint ${baseUrl} failed`);
      continue;
    }
  }

  throw new Error(`Failed to fetch anime info from all endpoints`);
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
  for (const baseUrl of CONSUMET_ENDPOINTS) {
    try {
      console.log(`[v0] Fetching sources for ${episodeId} from ${baseUrl}/${provider}`);
      const client = createClient(baseUrl);
      const response = await client.get(`/anime/${provider}/watch`, {
        params: { episodeId },
      });

      const data = response.data;
      
      if (data?.sources?.length > 0) {
        console.log(`[v0] Got ${data.sources.length} sources from ${baseUrl}`);
        return {
          sources: data.sources.map((source: any) => ({
            url: source.url,
            quality: source.quality || "default",
            isM3U8: source.url?.includes(".m3u8") || false,
          })),
          intro: data.intro,
          outro: data.outro,
          subtitles: data.subtitles || [],
        };
      }
    } catch (error) {
      console.warn(`[v0] Consumet watch endpoint ${baseUrl} failed:`, error instanceof Error ? error.message : "Unknown");
      continue;
    }
  }

  throw new Error(`Failed to fetch episode sources from all endpoints`);
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
      console.log(`[v0] Trying provider: ${provider} for ${episodeId}`);
      const sources = await getConsumetEpisodeSources(episodeId, provider);

      // Check if we got valid sources
      if (sources.sources && sources.sources.length > 0 && sources.sources[0].url) {
        console.log(`[v0] Success with provider: ${provider}`);
        return sources;
      }
    } catch (error) {
      console.warn(`[v0] Provider ${provider} failed, trying next...`);
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
