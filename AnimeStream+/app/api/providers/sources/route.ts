import { NextRequest, NextResponse } from "next/server";
import { getProvider, getSourcesWithFallback } from "@/lib/providers";
import type { AudioType } from "@/lib/providers/types";

/**
 * GET /api/providers/sources
 * Fetches streaming sources from a specific provider
 * 
 * Query params:
 * - episodeId: Episode identifier in format "anime-title-episode-X" (required)
 * - provider: Provider ID (optional, defaults to auto-fallback)
 * - audioType: 'sub' or 'dub' (optional, defaults to 'sub')
 * - server: Server ID within the provider (optional)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const episodeIdParam = searchParams.get("episodeId");
  const providerId = searchParams.get("provider");
  const audioType = (searchParams.get("audioType") || "sub") as AudioType;
  const server = searchParams.get("server") || undefined;

  if (!episodeIdParam) {
    return NextResponse.json(
      { success: false, error: "Missing episodeId parameter" },
      { status: 400 }
    );
  }

  try {
    // Parse the episodeId to extract anime title and episode number
    // Format: "anime-title-episode-X" or "anime-slug-episode-X"
    const episodeMatch = episodeIdParam.match(/^(.+)-episode-(\d+)$/i);
    
    if (!episodeMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid episodeId format. Expected: anime-title-episode-X" },
        { status: 400 }
      );
    }

    const animeSlug = episodeMatch[1];
    const episodeNumber = parseInt(episodeMatch[2], 10);
    
    // Convert slug to search query (replace dashes with spaces)
    const searchQuery = animeSlug
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    console.log(`[API] Searching for "${searchQuery}" episode ${episodeNumber}`);

    if (providerId) {
      // Fetch from specific provider
      const provider = getProvider(providerId);
      if (!provider) {
        return NextResponse.json(
          { success: false, error: `Unknown provider: ${providerId}` },
          { status: 400 }
        );
      }

      // Check if provider supports dub when requesting dub
      if (audioType === "dub" && !provider.supportsDub) {
        return NextResponse.json(
          { success: false, error: `Provider ${providerId} does not support dubbed content` },
          { status: 400 }
        );
      }

      // Step 1: Search for the anime on this provider
      const searchResults = await provider.search(searchQuery);
      
      if (!searchResults || searchResults.length === 0) {
        console.log(`[API] No search results for "${searchQuery}" on ${providerId}`);
        return NextResponse.json(
          { success: false, error: `No results found for "${searchQuery}" on ${provider.name}` },
          { status: 404 }
        );
      }

      // Use first result (best match)
      const animeId = searchResults[0].id;
      console.log(`[API] Found anime: ${searchResults[0].title} (${animeId})`);

      // Step 2: Get anime info to find the correct episode ID
      let providerEpisodeId: string;
      
      try {
        const animeInfo = await provider.getAnimeInfo(animeId);
        
        if (animeInfo.episodes && animeInfo.episodes.length > 0) {
          // Find the episode by number
          const episode = animeInfo.episodes.find(ep => ep.number === episodeNumber);
          
          if (episode) {
            providerEpisodeId = episode.id;
            console.log(`[API] Found episode ${episodeNumber}: ${providerEpisodeId}`);
          } else if (episodeNumber <= animeInfo.episodes.length) {
            // Fall back to episode at index
            providerEpisodeId = animeInfo.episodes[episodeNumber - 1].id;
            console.log(`[API] Using episode at index ${episodeNumber - 1}: ${providerEpisodeId}`);
          } else {
            return NextResponse.json(
              { success: false, error: `Episode ${episodeNumber} not found. Only ${animeInfo.episodes.length} episodes available.` },
              { status: 404 }
            );
          }
        } else {
          // Fallback: construct episode ID using common patterns
          providerEpisodeId = `${animeId}-episode-${episodeNumber}`;
          console.log(`[API] Constructed episode ID: ${providerEpisodeId}`);
        }
      } catch (infoError) {
        // If we can't get anime info, try common episode ID patterns
        providerEpisodeId = `${animeId}-episode-${episodeNumber}`;
        console.log(`[API] Using fallback episode ID: ${providerEpisodeId}`);
      }

      // Step 3: Fetch sources using the provider's episode ID
      const sources = await provider.getSources(providerEpisodeId, audioType, server);

      // Validate sources
      if (!sources.sources || sources.sources.length === 0) {
        return NextResponse.json(
          { success: false, error: "No sources found for this episode" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        sources: sources,
        debug: {
          searchQuery,
          animeId,
          providerEpisodeId,
          episodeNumber,
        }
      });
    } else {
      // Auto-fallback through all providers
      const sources = await getSourcesWithFallbackSearch(searchQuery, episodeNumber, audioType);
      
      if (!sources.sources || sources.sources.length === 0) {
        return NextResponse.json(
          { success: false, error: "No sources found for this episode from any provider" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        sources: sources,
      });
    }
  } catch (error) {
    console.error("[API] Provider sources error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch sources",
      },
      { status: 500 }
    );
  }
}

/**
 * Try multiple providers with search-based episode lookup
 */
async function getSourcesWithFallbackSearch(
  searchQuery: string,
  episodeNumber: number,
  audioType: AudioType
) {
  const { PROVIDER_PRIORITY, providers } = await import("@/lib/providers");
  
  for (const providerId of PROVIDER_PRIORITY) {
    const provider = providers[providerId];
    if (!provider) continue;
    
    if (audioType === "dub" && !provider.supportsDub) {
      continue;
    }

    try {
      console.log(`[Fallback] Trying ${provider.name}...`);
      
      // Search for anime
      const searchResults = await provider.search(searchQuery);
      if (!searchResults || searchResults.length === 0) {
        console.log(`[Fallback] No results on ${provider.name}`);
        continue;
      }

      const animeId = searchResults[0].id;
      
      // Get episode info
      let providerEpisodeId: string;
      try {
        const animeInfo = await provider.getAnimeInfo(animeId);
        if (animeInfo.episodes && animeInfo.episodes.length >= episodeNumber) {
          const episode = animeInfo.episodes.find(ep => ep.number === episodeNumber) 
            || animeInfo.episodes[episodeNumber - 1];
          providerEpisodeId = episode.id;
        } else {
          providerEpisodeId = `${animeId}-episode-${episodeNumber}`;
        }
      } catch {
        providerEpisodeId = `${animeId}-episode-${episodeNumber}`;
      }

      // Fetch sources
      const sources = await provider.getSources(providerEpisodeId, audioType);
      
      if (sources.sources && sources.sources.length > 0 && sources.sources[0].url) {
        console.log(`[Fallback] Success with ${provider.name}`);
        return sources;
      }
    } catch (error) {
      console.warn(`[Fallback] ${provider.name} failed:`, error);
      continue;
    }
  }

  throw new Error("Failed to fetch sources from all providers");
}
