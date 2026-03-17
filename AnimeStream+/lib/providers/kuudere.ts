/**
 * 9Anime Provider (via Consumet API)
 * Uses Consumet's 9anime endpoint as an alternative source
 * API: https://api.consumet.org/anime/9anime
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

export const kuudereProvider: AnimeProvider = {
  id: "kuudere",
  name: "9Anime",
  baseUrl: BASE_URL,
  supportsDub: true,

  async search(query: string): Promise<SearchResult[]> {
    try {
      // Try 9anime endpoint, fallback to gogoanime if it fails
      let response;
      try {
        response = await client.get("/anime/9anime/search", {
          params: { query, page: 1 },
        });
      } catch {
        // Fallback to gogoanime search
        response = await client.get("/anime/gogoanime/search", {
          params: { query, page: 1 },
        });
      }

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
      console.error("[9Anime] Search failed:", error);
      return [];
    }
  },

  async getAnimeInfo(animeId: string): Promise<AnimeInfo> {
    try {
      let response;
      try {
        response = await client.get("/anime/9anime/info", {
          params: { id: animeId },
        });
      } catch {
        response = await client.get("/anime/gogoanime/info", {
          params: { id: animeId },
        });
      }
      const data = response.data;

      const episodes = data?.episodes || [];

      return {
        id: animeId,
        title: data?.title || animeId,
        image: data?.image,
        description: data?.description,
        totalEpisodes: episodes.length || data?.totalEpisodes,
        status: data?.status,
        genres: data?.genres,
        episodes: episodes.map((ep: any, index: number) => ({
          id: ep.id,
          number: ep.number || index + 1,
          title: ep.title,
          isFiller: ep.isFiller,
        })),
      };
    } catch (error) {
      console.error("[9Anime] Get anime info failed:", error);
      throw new Error("Failed to fetch anime info from 9Anime");
    }
  },

  async getServers(episodeId: string): Promise<ProviderServer[]> {
    return [
      { name: "VidStream", id: "vidstream" },
      { name: "MyCloud", id: "mycloud" },
      { name: "Filemoon", id: "filemoon" },
    ];
  },

  async getSources(
    episodeId: string,
    audioType: AudioType = "sub",
    server: string = "vidstream"
  ): Promise<EpisodeSourceData> {
    try {
      const params: Record<string, string> = { episodeId };
      
      if (server && server !== "vidstream") {
        params.server = server;
      }

      let response;
      try {
        response = await client.get("/anime/9anime/watch", { params });
      } catch {
        // Fallback to gogoanime
        response = await client.get("/anime/gogoanime/watch", { params });
      }
      
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
          lang: sub.lang || "Unknown",
          url: sub.url,
          label: sub.lang,
        })) || [],
        intro: data.intro,
        outro: data.outro,
        provider: "kuudere",
        server: server,
      };
    } catch (error) {
      console.error("[9Anime] Get sources failed:", error);
      throw new Error("Failed to fetch sources from 9Anime");
    }
  },

  async checkStatus(): Promise<boolean> {
    try {
      const response = await client.get("/anime/gogoanime/search", {
        params: { query: "naruto", page: 1 },
        timeout: 5000,
      });
      return Array.isArray(response.data?.results);
    } catch {
      return false;
    }
  },
};
