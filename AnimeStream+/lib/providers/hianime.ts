/**
 * HiAnime Provider (via Consumet Zoro API)
 * HiAnime is the same as Zoro/Aniwatch, using Consumet's Zoro endpoint
 * This provides the best quality and sub/dub support
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

export const hianimeProvider: AnimeProvider = {
  id: "hianime",
  name: "HiAnime",
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
        totalEpisodes: anime.totalEpisodes || anime.episodeCount,
        type: anime.type,
      }));
    } catch (error) {
      console.error("[HiAnime] Search failed:", error);
      return [];
    }
  },

  async getAnimeInfo(animeId: string): Promise<AnimeInfo> {
    try {
      const response = await client.get("/anime/zoro/info", {
        params: { id: animeId },
      });
      const data = response.data;

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
    } catch (error) {
      console.error("[HiAnime] Get anime info failed:", error);
      throw new Error("Failed to fetch anime info from HiAnime");
    }
  },

  async getServers(episodeId: string): Promise<ProviderServer[]> {
    // Zoro/HiAnime supports these servers
    return [
      { name: "VidCloud", id: "vidcloud" },
      { name: "StreamSB", id: "streamsb" },
      { name: "StreamTape", id: "streamtape" },
      { name: "VidStreaming", id: "vidstreaming" },
    ];
  },

  async getSources(
    episodeId: string,
    audioType: AudioType = "sub",
    server: string = "vidcloud"
  ): Promise<EpisodeSourceData> {
    try {
      const params: Record<string, string> = { episodeId };
      
      // Add server if not default
      if (server && server !== "vidcloud") {
        params.server = server;
      }
      
      // Zoro supports dub selection
      if (audioType === "dub") {
        // For Zoro, we need to modify the episodeId to get dub
        // Usually the dub episode has a different ID suffix
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
          isM3U8: source.url?.includes(".m3u8") || source.isM3U8 || false,
          server: server,
        })),
        subtitles: data.subtitles?.map((sub: any) => ({
          lang: sub.lang,
          url: sub.url,
          label: sub.lang,
        })) || [],
        intro: data.intro,
        outro: data.outro,
        provider: "hianime",
        server: server,
      };
    } catch (error) {
      console.error("[HiAnime] Get sources failed:", error);
      throw new Error("Failed to fetch sources from HiAnime");
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
