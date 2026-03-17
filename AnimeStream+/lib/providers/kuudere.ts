/**
 * Kuudere API Provider
 * Lightweight API for kuudere.to streaming sources
 * API: https://kuudere-api.vercel.app/api
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

const BASE_URL = "https://kuudere-api.vercel.app/api";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  },
});

export const kuudereProvider: AnimeProvider = {
  id: "kuudere",
  name: "Kuudere",
  baseUrl: BASE_URL,
  supportsDub: false, // Kuudere primarily serves sub content

  async search(query: string): Promise<SearchResult[]> {
    try {
      const response = await client.get("/search", {
        params: { q: query },
      });

      const results = response.data?.results || response.data || [];

      return results.map((anime: any) => ({
        id: anime.id || anime.slug,
        title: anime.title || anime.name,
        image: anime.image || anime.poster || anime.cover,
        totalEpisodes: anime.totalEpisodes || anime.episodes,
        type: anime.type,
        status: anime.status,
      }));
    } catch (error) {
      console.error("[Kuudere] Search failed:", error);
      return [];
    }
  },

  async getAnimeInfo(animeId: string): Promise<AnimeInfo> {
    try {
      const response = await client.get(`/info/${animeId}`);
      const data = response.data;

      const episodes = data?.episodes || [];

      return {
        id: animeId,
        title: data?.title || data?.name || animeId,
        image: data?.image || data?.poster,
        description: data?.description || data?.synopsis,
        totalEpisodes: episodes.length || data?.totalEpisodes,
        status: data?.status,
        genres: data?.genres,
        episodes: episodes.map((ep: any, index: number) => ({
          id: ep.id || ep.episodeId || `${animeId}-episode-${index + 1}`,
          number: ep.number || ep.episode || index + 1,
          title: ep.title,
          isFiller: ep.isFiller,
        })),
      };
    } catch (error) {
      console.error("[Kuudere] Get anime info failed:", error);
      throw new Error("Failed to fetch anime info from Kuudere");
    }
  },

  async getServers(episodeId: string): Promise<ProviderServer[]> {
    // Kuudere typically has a single default server
    return [
      { name: "Default", id: "default" },
      { name: "Backup", id: "backup" },
    ];
  },

  async getSources(
    episodeId: string,
    audioType: AudioType = "sub",
    server: string = "default"
  ): Promise<EpisodeSourceData> {
    try {
      const response = await client.get(`/watch/${episodeId}`);
      const data = response.data;

      if (!data?.sources && !data?.url) {
        throw new Error("No sources found");
      }

      // Handle both array of sources and single source formats
      const sources = data.sources || [{ url: data.url, quality: "auto" }];

      return {
        sources: sources.map((source: any) => ({
          url: source.url,
          quality: source.quality || "auto",
          isM3U8: source.url?.includes(".m3u8") || source.isM3U8 || false,
          server: server,
        })),
        subtitles: data.subtitles?.map((sub: any) => ({
          lang: sub.lang || sub.language || "Unknown",
          url: sub.url,
          label: sub.lang,
        })) || [],
        intro: data.intro,
        outro: data.outro,
        provider: "kuudere",
        server: server,
      };
    } catch (error) {
      console.error("[Kuudere] Get sources failed:", error);
      throw new Error("Failed to fetch sources from Kuudere");
    }
  },

  async checkStatus(): Promise<boolean> {
    try {
      const response = await client.get("/search", {
        params: { q: "naruto" },
        timeout: 5000,
      });
      return Array.isArray(response.data?.results || response.data);
    } catch {
      return false;
    }
  },
};
