/**
 * Shared types for anime streaming providers
 * All providers implement these interfaces for consistent behavior
 */

export interface StreamingSource {
  url: string;
  quality: string;
  isM3U8: boolean;
  server?: string;
  headers?: Record<string, string>;
}

export interface Subtitle {
  lang: string;
  url: string;
  label?: string;
}

export interface EpisodeSourceData {
  sources: StreamingSource[];
  subtitles?: Subtitle[];
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  provider: string;
  server?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  image?: string;
  releaseDate?: string;
  totalEpisodes?: number;
  type?: string;
  status?: string;
}

export interface Episode {
  id: string;
  number: number;
  title?: string;
  isFiller?: boolean;
}

export interface AnimeInfo {
  id: string;
  title: string;
  image?: string;
  description?: string;
  episodes: Episode[];
  totalEpisodes?: number;
  status?: string;
  genres?: string[];
}

export type AudioType = 'sub' | 'dub';

export interface ProviderServer {
  name: string;
  id: string;
}

export interface AnimeProvider {
  id: string;
  name: string;
  baseUrl: string;
  supportsDub: boolean;
  
  /**
   * Search for anime by title
   */
  search(query: string): Promise<SearchResult[]>;
  
  /**
   * Get anime info including episodes list
   */
  getAnimeInfo(animeId: string): Promise<AnimeInfo>;
  
  /**
   * Get streaming sources for an episode
   */
  getSources(episodeId: string, audioType?: AudioType, server?: string): Promise<EpisodeSourceData>;
  
  /**
   * Get available servers for an episode
   */
  getServers?(episodeId: string): Promise<ProviderServer[]>;
  
  /**
   * Check if provider is currently online
   */
  checkStatus(): Promise<boolean>;
}

export interface ProviderStatus {
  id: string;
  name: string;
  online: boolean;
  hasSourcesForEpisode?: boolean;
  supportsDub: boolean;
  servers?: ProviderServer[];
}

// Provider registry type
export type ProviderRegistry = Record<string, AnimeProvider>;
