import { NextRequest, NextResponse } from "next/server";
import { getProvider, searchAcrossProviders } from "@/lib/providers";

/**
 * GET /api/providers/search
 * Search for anime across providers
 * 
 * Query params:
 * - q: Search query (required)
 * - provider: Provider ID (optional, searches all if not provided)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const providerId = searchParams.get("provider");

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: "Missing search query" },
      { status: 400 }
    );
  }

  try {
    if (providerId) {
      // Search single provider
      const provider = getProvider(providerId);
      if (!provider) {
        return NextResponse.json(
          { success: false, error: `Unknown provider: ${providerId}` },
          { status: 400 }
        );
      }

      const results = await provider.search(query);
      
      return NextResponse.json({
        success: true,
        provider: providerId,
        results,
      });
    } else {
      // Search all providers
      const allResults = await searchAcrossProviders(query);
      
      return NextResponse.json({
        success: true,
        results: allResults,
      });
    }
  } catch (error) {
    console.error("[API] Provider search error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search providers",
      },
      { status: 500 }
    );
  }
}
