/**
 * Aniwatch Provider (via Consumet API)
 * Alternative name for HiAnime/Zoro, using Consumet's Aniwatch endpoint
 * API: https://api.consumet.org/anime/zoro
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

const BASE_URL = "https://api.consumet.org";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  },
});

// Available backend servers
export const MIRURO_BACKENDS = ["vidcloud", "streamsb", "streamtape"] as const;
export type MiruroBackend = typeof MIRURO_BACKENDS[number];

export const miruroProvider: AnimeProvider = {
  id: "miruro",
  name: "Aniwatch",
  baseUrl: BASE_URL,
  supportsDub: true,

  async search(query: string): Promise<SearchResult[]> {
    try {
      const response = await client.get("/anime/zoro/search", {
        params: { query, page: 1 },
      });
      
      const results = response.data?.results || [];
      
      return results.map((anime: any) => ({
        id: anime.id,
        title: anime.title,
        image: anime.image,
        totalEpisodes: anime.totalEpisodes,
        type: anime.type,
        status: anime.status,
      }));
    } catch (error) {
      console.error("[Aniwatch] Search failed:", error);
      return [];
    }
  },

  async getAnimeInfo(animeId: string): Promise<AnimeInfo> {
    try {
      const response = await client.get("/anime/zoro/info", {
        params: { id: animeId },
      });
      const data = response.data;
      
      const episodes = data?.episodes || [];

      return {
        id: animeId,
        title: data?.title || animeId,
        image: data?.image,
        description: data?.description,
        totalEpisodes: episodes.length || data?.totalEpisodes,
        episodes: episodes.map((ep: any, index: number) => ({
          id: ep.id,
          number: ep.number || index + 1,
          title: ep.title,
          isFiller: ep.isFiller,
        })),
      };
    } catch (error) {
      console.error("[Aniwatch] Get anime info failed:", error);
      throw new Error("Failed to fetch anime info from Aniwatch");
    }
  },

  async getServers(episodeId: string): Promise<ProviderServer[]> {
    return MIRURO_BACKENDS.map((backend) => ({
      name: backend.charAt(0).toUpperCase() + backend.slice(1),
      id: backend,
    }));
  },

  async getSources(
    episodeId: string,
    audioType: AudioType = "sub",
    server: string = "vidcloud"
  ): Promise<EpisodeSourceData> {
    try {
      const params: Record<string, string> = { episodeId };
      
      if (server && server !== "vidcloud") {
        params.server = server;
      }
      
      if (audioType === "dub") {
        params.episodeId = episodeId.replace("$sub", "$dub");
      }

      const response = await client.get("/anime/zoro/watch", { params });
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
          lang: sub.lang || "Unknown",
          url: sub.url,
          label: sub.lang,
        })) || [],
        intro: data.intro,
        outro: data.outro,
        provider: "miruro",
        server: server,
      };
    } catch (error) {
      console.error("[Aniwatch] Get sources failed:", error);
      throw new Error("Failed to fetch sources from Aniwatch");
    }
  },

  async checkStatus(): Promise<boolean> {
    try {
      const response = await client.get("/anime/zoro/search", {
        params: { query: "naruto", page: 1 },
        timeout: 5000,
      });
      return Array.isArray(response.data?.results);
    } catch {
      return false;
    }
  },
};

export async function getMiruroSourcesFromBackend(
  episodeId: string,
  backend: MiruroBackend,
  audioType: AudioType = "sub"
): Promise<EpisodeSourceData> {
  return miruroProvider.getSources(episodeId, audioType, backend);
}
