/**
 * Miruro API Provider
 * Supports multiple backends: AnimeKai, HiAnime, AnimePahe
 * API: https://miruro-api.vercel.app/api
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

const BASE_URL = "https://miruro-api.vercel.app/api";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  },
});

// Available backend providers in Miruro
export const MIRURO_BACKENDS = ["animekai", "hianime", "animepahe"] as const;
export type MiruroBackend = typeof MIRURO_BACKENDS[number];

export const miruroProvider: AnimeProvider = {
  id: "miruro",
  name: "Miruro",
  baseUrl: BASE_URL,
  supportsDub: true,

  async search(query: string): Promise<SearchResult[]> {
    try {
      const response = await client.get(`/search/${encodeURIComponent(query)}`);
      
      const results = response.data?.results || response.data || [];
      
      return results.map((anime: any) => ({
        id: anime.id,
        title: anime.title?.english || anime.title?.romaji || anime.title || anime.name,
        image: anime.image || anime.coverImage?.large || anime.poster,
        totalEpisodes: anime.totalEpisodes || anime.episodes,
        type: anime.type || anime.format,
        status: anime.status,
      }));
    } catch (error) {
      console.error("[Miruro] Search failed:", error);
      return [];
    }
  },

  async getAnimeInfo(animeId: string): Promise<AnimeInfo> {
    try {
      const response = await client.get(`/anime/episodes/${animeId}`);
      const data = response.data;
      
      const episodes = data?.episodes || data || [];

      return {
        id: animeId,
        title: data?.title || animeId,
        image: data?.image,
        description: data?.description,
        totalEpisodes: episodes.length,
        episodes: episodes.map((ep: any, index: number) => ({
          id: ep.id || ep.episodeId || `${animeId}-ep-${index + 1}`,
          number: ep.number || index + 1,
          title: ep.title,
          isFiller: ep.isFiller,
        })),
      };
    } catch (error) {
      console.error("[Miruro] Get anime info failed:", error);
      throw new Error("Failed to fetch anime info from Miruro");
    }
  },

  async getServers(episodeId: string): Promise<ProviderServer[]> {
    // Miruro supports multiple backend providers as "servers"
    return MIRURO_BACKENDS.map((backend) => ({
      name: backend.charAt(0).toUpperCase() + backend.slice(1),
      id: backend,
    }));
  },

  async getSources(
    episodeId: string,
    audioType: AudioType = "sub",
    server: string = "animekai"
  ): Promise<EpisodeSourceData> {
    try {
      // Miruro uses provider param to specify backend
      const response = await client.get("/anime/sources", {
        params: {
          id: episodeId,
          provider: server,
          dub: audioType === "dub",
        },
      });

      const data = response.data;
      
      if (!data?.sources || data.sources.length === 0) {
        throw new Error("No sources found");
      }

      return {
        sources: data.sources.map((source: any) => ({
          url: source.url,
          quality: source.quality || "auto",
          isM3U8: source.url?.includes(".m3u8") || source.isM3U8,
          server: server,
        })),
        subtitles: data.subtitles?.map((sub: any) => ({
          lang: sub.lang || sub.language || "Unknown",
          url: sub.url,
          label: sub.lang,
        })) || [],
        intro: data.intro,
        outro: data.outro,
        provider: "miruro",
        server: server,
      };
    } catch (error) {
      console.error("[Miruro] Get sources failed:", error);
      throw new Error("Failed to fetch sources from Miruro");
    }
  },

  async checkStatus(): Promise<boolean> {
    try {
      const response = await client.get("/search/naruto", { timeout: 5000 });
      return Array.isArray(response.data?.results || response.data);
    } catch {
      return false;
    }
  },
};

/**
 * Get sources from a specific Miruro backend
 */
export async function getMiruroSourcesFromBackend(
  episodeId: string,
  backend: MiruroBackend,
  audioType: AudioType = "sub"
): Promise<EpisodeSourceData> {
  return miruroProvider.getSources(episodeId, audioType, backend);
}
