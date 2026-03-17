/**
 * HiAnime API Provider
 * Primary provider with high quality sources and sub/dub support
 * API: https://hianime-api-five.vercel.app/api/v2/hianime
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

const BASE_URL = "https://hianime-api-five.vercel.app/api/v2/hianime";

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
      const response = await client.get("/search", {
        params: { q: query, page: 1 },
      });
      
      const data = response.data;
      if (!data.success || !data.data?.animes) {
        return [];
      }

      return data.data.animes.map((anime: any) => ({
        id: anime.id,
        title: anime.name || anime.title,
        image: anime.poster || anime.image,
        totalEpisodes: anime.episodes?.sub || anime.episodes?.dub,
        type: anime.type,
      }));
    } catch (error) {
      console.error("[HiAnime] Search failed:", error);
      return [];
    }
  },

  async getAnimeInfo(animeId: string): Promise<AnimeInfo> {
    try {
      // Get anime info
      const infoResponse = await client.get(`/anime/${animeId}`);
      const info = infoResponse.data?.data?.anime;

      // Get episodes
      const episodesResponse = await client.get(`/anime/${animeId}/episodes`);
      const episodesData = episodesResponse.data?.data?.episodes || [];

      return {
        id: animeId,
        title: info?.name || info?.title || animeId,
        image: info?.poster || info?.image,
        description: info?.description,
        totalEpisodes: episodesData.length,
        status: info?.status,
        genres: info?.genres,
        episodes: episodesData.map((ep: any) => ({
          id: ep.episodeId || `${animeId}?ep=${ep.number}`,
          number: ep.number,
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
    try {
      const response = await client.get(`/episode/servers`, {
        params: { animeEpisodeId: episodeId },
      });
      
      const data = response.data?.data;
      const servers: ProviderServer[] = [];
      
      // Add sub servers
      if (data?.sub) {
        data.sub.forEach((server: any) => {
          servers.push({
            name: `${server.serverName} (Sub)`,
            id: `sub-${server.serverName.toLowerCase()}`,
          });
        });
      }
      
      // Add dub servers
      if (data?.dub) {
        data.dub.forEach((server: any) => {
          servers.push({
            name: `${server.serverName} (Dub)`,
            id: `dub-${server.serverName.toLowerCase()}`,
          });
        });
      }

      return servers;
    } catch (error) {
      console.error("[HiAnime] Get servers failed:", error);
      return [];
    }
  },

  async getSources(
    episodeId: string,
    audioType: AudioType = "sub",
    server: string = "hd-1"
  ): Promise<EpisodeSourceData> {
    try {
      const response = await client.get("/episode/sources", {
        params: {
          animeEpisodeId: episodeId,
          server: server,
          category: audioType,
        },
      });

      const data = response.data?.data;
      if (!data?.sources || data.sources.length === 0) {
        throw new Error("No sources found");
      }

      return {
        sources: data.sources.map((source: any) => ({
          url: source.url,
          quality: source.quality || "auto",
          isM3U8: source.url?.includes(".m3u8") || source.type === "hls",
          server: server,
        })),
        subtitles: data.tracks?.filter((t: any) => t.kind === "captions").map((track: any) => ({
          lang: track.label || "Unknown",
          url: track.file,
          label: track.label,
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
      const response = await client.get("/search", {
        params: { q: "naruto", page: 1 },
        timeout: 5000,
      });
      return response.data?.success === true;
    } catch {
      return false;
    }
  },
};
