/**
 * Provider Registry
 * Central export for all anime streaming providers
 * 
 * Note: Using Consumet API providers (Gogoanime, Zoro, AnimePahe) which are
 * the most reliable free anime streaming APIs available.
 */

export * from "./types";

// Import Consumet providers (most reliable)
import { 
  gogoanimeProvider, 
  zoroProvider, 
  animepaheProvider,
  CONSUMET_PROVIDERS,
  type ConsumetProvider 
} from "./consumet-provider";

import type { 
  AnimeProvider, 
  ProviderRegistry, 
  EpisodeSourceData, 
  AudioType,
  ProviderStatus 
} from "./types";

// Provider registry - only using working Consumet providers
// Note: HiAnime/Miruro/Kuudere external APIs require payment or are unavailable
export const providers: ProviderRegistry = {
  zoro: zoroProvider,        // Best for subs + dubs, high quality
  gogoanime: gogoanimeProvider, // Reliable, wide library
  animepahe: animepaheProvider, // Sub-only, good quality
};

// Export individual providers
export { 
  gogoanimeProvider,
  zoroProvider,
  animepaheProvider,
  CONSUMET_PROVIDERS,
};

export type { ConsumetProvider };

// Default provider order (used for auto-fallback)
// Zoro first as it has best sub/dub support
export const PROVIDER_PRIORITY = [
  "zoro",
  "gogoanime",
  "animepahe",
] as const;

/**
 * Get a provider by ID
 */
export function getProvider(providerId: string): AnimeProvider | undefined {
  return providers[providerId];
}

/**
 * Get all available provider IDs
 */
export function getProviderIds(): string[] {
  return Object.keys(providers);
}

/**
 * Get provider display info for UI
 */
export function getProviderInfo(providerId: string) {
  const provider = providers[providerId];
  if (!provider) return null;
  
  return {
    id: provider.id,
    name: provider.name,
    supportsDub: provider.supportsDub,
  };
}

/**
 * Get all providers info for UI display
 */
export function getAllProvidersInfo() {
  return Object.values(providers).map(p => ({
    id: p.id,
    name: p.name,
    supportsDub: p.supportsDub,
  }));
}

/**
 * Check status of all providers
 */
export async function checkAllProvidersStatus(): Promise<ProviderStatus[]> {
  const statusChecks = Object.values(providers).map(async (provider) => {
    const online = await provider.checkStatus();
    return {
      id: provider.id,
      name: provider.name,
      online,
      supportsDub: provider.supportsDub,
    };
  });

  return Promise.all(statusChecks);
}

/**
 * Get sources with automatic fallback through providers
 */
export async function getSourcesWithFallback(
  episodeId: string,
  audioType: AudioType = "sub"
): Promise<EpisodeSourceData> {
  for (const providerId of PROVIDER_PRIORITY) {
    const provider = providers[providerId];
    if (!provider) continue;
    
    // Skip providers that don't support dub if requesting dub
    if (audioType === "dub" && !provider.supportsDub) {
      continue;
    }

    try {
      console.log(`[Providers] Trying ${provider.name}...`);
      const sources = await provider.getSources(episodeId, audioType);
      
      if (sources.sources && sources.sources.length > 0 && sources.sources[0].url) {
        console.log(`[Providers] Success with ${provider.name}`);
        return sources;
      }
    } catch (error) {
      console.warn(`[Providers] ${provider.name} failed, trying next...`);
      continue;
    }
  }

  throw new Error("Failed to fetch sources from all providers");
}

/**
 * Search across multiple providers and merge results
 */
export async function searchAcrossProviders(
  query: string,
  maxPerProvider: number = 5
): Promise<Array<{ provider: string; results: any[] }>> {
  const searchPromises = Object.entries(providers).map(async ([id, provider]) => {
    try {
      const results = await provider.search(query);
      return {
        provider: id,
        results: results.slice(0, maxPerProvider),
      };
    } catch {
      return { provider: id, results: [] };
    }
  });

  return Promise.all(searchPromises);
}
