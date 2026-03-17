import { NextRequest, NextResponse } from "next/server";
import { getProvider, getSourcesWithFallback } from "@/lib/providers";
import type { AudioType } from "@/lib/providers/types";

/**
 * GET /api/providers/sources
 * Fetches streaming sources from a specific provider
 * 
 * Query params:
 * - episodeId: The episode identifier (required)
 * - provider: Provider ID (optional, defaults to auto-fallback)
 * - audioType: 'sub' or 'dub' (optional, defaults to 'sub')
 * - server: Server ID within the provider (optional)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const episodeId = searchParams.get("episodeId");
  const providerId = searchParams.get("provider");
  const audioType = (searchParams.get("audioType") || "sub") as AudioType;
  const server = searchParams.get("server") || undefined;

  if (!episodeId) {
    return NextResponse.json(
      { success: false, error: "Missing episodeId parameter" },
      { status: 400 }
    );
  }

  try {
    let sources;

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

      sources = await provider.getSources(episodeId, audioType, server);
    } else {
      // Auto-fallback through all providers
      sources = await getSourcesWithFallback(episodeId, audioType);
    }

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
    });
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
