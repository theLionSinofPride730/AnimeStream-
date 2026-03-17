import { NextRequest, NextResponse } from "next/server";
import { getProvider, checkAllProvidersStatus, getAllProvidersInfo } from "@/lib/providers";

/**
 * GET /api/providers/status
 * Check status of one or all providers
 * 
 * Query params:
 * - provider: Provider ID (optional, checks all if not provided)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const providerId = searchParams.get("provider");

  try {
    if (providerId) {
      // Check single provider
      const provider = getProvider(providerId);
      if (!provider) {
        return NextResponse.json(
          { success: false, error: `Unknown provider: ${providerId}` },
          { status: 400 }
        );
      }

      const online = await provider.checkStatus();
      
      return NextResponse.json({
        success: true,
        provider: {
          id: provider.id,
          name: provider.name,
          online,
          supportsDub: provider.supportsDub,
        },
      });
    } else {
      // Check all providers
      const statuses = await checkAllProvidersStatus();
      
      return NextResponse.json({
        success: true,
        providers: statuses,
      });
    }
  } catch (error) {
    console.error("[API] Provider status error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to check provider status",
      },
      { status: 500 }
    );
  }
}
