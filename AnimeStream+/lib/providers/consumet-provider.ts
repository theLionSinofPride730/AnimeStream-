/**
 * Consumet API Provider (Refactored as AnimeProvider interface)
 * Supports: Gogoanime, Zoro, AnimePahe via Consumet unified API
 * Uses multiple endpoints for redundancy
 */

import axios from "axios";
import type {
  AnimeProvider,
  SearchResult,
  AnimeInfo,
  EpisodeSourceData,
  AudioType,
  ProviderServer,
} from "./types";

// Multiple Consumet API endpoints for redundancy
const CONSUMET_ENDPOINTS = [
  "https://api.consumet.org",
  "https://consumet-api-two-tau.vercel.app",
  "https://consumet-api.vercel.app",
];

function createClient(baseURL: string) {
  return axios.create({
    baseURL,
    timeout: 12000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });
}

// Available providers through Consumet
export const CONSUMET_PROVIDERS = ["gogoanime", "zoro", "animepahe"] as const;
export type ConsumetProvider = (typeof CONSUMET_PROVIDERS)[number];

function createConsumetProvider(providerName: ConsumetProvider): AnimeProvider {
  const displayNames: Record<ConsumetProvider, string> = {
    gogoanime: "Gogoanime",
    zoro: "Zoro",
    animepahe: "AnimePahe",
  };

  return {
    id: providerName,
    name: displayNames[providerName],
    baseUrl: `https://api.consumet.org/anime/${providerName}`,
    supportsDub: providerName !== "animepahe", // AnimePahe is sub-only

    async search(query: string): Promise<SearchResult[]> {
      for (const baseUrl of CONSUMET_ENDPOINTS) {
        try {
          const client = createClient(baseUrl);
          const response = await client.get(`/anime/${providerName}/search`, {
            params: { query, page: 1 },
          });
          const results = response.data?.results || [];

          if (results.length > 0) {
            return results.map((anime: any) => ({
              id: anime.id,
              title: anime.title,
              image: anime.image,
              releaseDate: anime.releaseDate,
              totalEpisodes:
                anime.totalEpisodes || anime.subOrDub?.includes("sub")
                  ? anime.episodeCount
                  : undefined,
              type: anime.type,
            }));
          }
        } catch (error) {
          console.warn(`[Consumet/${providerName}] Search failed at ${baseUrl}`);
          continue;
        }
      }
      return [];
    },

    async getAnimeInfo(animeId: string): Promise<AnimeInfo> {
      for (const baseUrl of CONSUMET_ENDPOINTS) {
        try {
          const client = createClient(baseUrl);
          const response = await client.get(`/anime/${providerName}/info`, {
            params: { id: animeId },
          });
          const data = response.data;

          if (data) {
            return {
              id: animeId,
              title: data?.title || animeId,
              image: data?.image,
              description: data?.description,
              totalEpisodes: data?.totalEpisodes,
              status: data?.status,
              genres: data?.genres,
              episodes: (data?.episodes || []).map((ep: any, index: number) => ({
                id: ep.id,
                number: ep.number || index + 1,
                title: ep.title,
                isFiller: ep.isFiller,
              })),
            };
          }
        } catch (error) {
          console.warn(`[Consumet/${providerName}] Get anime info failed at ${baseUrl}`);
          continue;
        }
      }
      throw new Error(`Failed to fetch anime info from ${providerName}`);
    },

    async getServers(episodeId: string): Promise<ProviderServer[]> {
      // Consumet has limited server selection, return available options
      if (providerName === "zoro") {
        return [
          { name: "VidCloud", id: "vidcloud" },
          { name: "StreamSB", id: "streamsb" },
          { name: "StreamTape", id: "streamtape" },
        ];
      }
      if (providerName === "gogoanime") {
        return [
          { name: "GogoCDN", id: "gogocdn" },
          { name: "VidStreaming", id: "vidstreaming" },
          { name: "StreamSB", id: "streamsb" },
        ];
      }
      return [{ name: "Default", id: "default" }];
    },

    async getSources(
      episodeId: string,
      audioType: AudioType = "sub",
      server: string = "default"
    ): Promise<EpisodeSourceData> {
      for (const baseUrl of CONSUMET_ENDPOINTS) {
        try {
          const client = createClient(baseUrl);
          const params: Record<string, string> = { episodeId };

          // Add server param for providers that support it
          if (server !== "default") {
            params.server = server;
          }

          // Zoro supports dub selection
          if (providerName === "zoro" && audioType === "dub") {
            params.dub = "true";
          }

          const response = await client.get(`/anime/${providerName}/watch`, { params });

          const data = response.data;

          if (data?.sources?.length > 0) {
            return {
              sources: data.sources.map((source: any) => ({
                url: source.url,
                quality: source.quality || "auto",
                isM3U8: source.url?.includes(".m3u8") || source.isM3U8 || false,
                server: server,
              })),
              subtitles:
                data.subtitles?.map((sub: any) => ({
                  lang: sub.lang,
                  url: sub.url,
                  label: sub.lang,
                })) || [],
              intro: data.intro,
              outro: data.outro,
              provider: providerName,
              server: server,
            };
          }
        } catch (error) {
          console.warn(`[Consumet/${providerName}] Get sources failed at ${baseUrl}`);
          continue;
        }
      }
      throw new Error(`Failed to fetch sources from ${providerName}`);
    },

    async checkStatus(): Promise<boolean> {
      for (const baseUrl of CONSUMET_ENDPOINTS) {
        try {
          const client = createClient(baseUrl);
          const response = await client.get(`/anime/${providerName}/search`, {
            params: { query: "naruto" },
            timeout: 5000,
          });
          if (Array.isArray(response.data?.results)) {
            return true;
          }
        } catch {
          continue;
        }
      }
      return false;
    },
  };
}

// Export individual providers
export const gogoanimeProvider = createConsumetProvider("gogoanime");
export const zoroProvider = createConsumetProvider("zoro");
export const animepaheProvider = createConsumetProvider("animepahe");
