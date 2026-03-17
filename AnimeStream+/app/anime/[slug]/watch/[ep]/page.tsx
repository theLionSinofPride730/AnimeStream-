import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle, Play, Info } from "lucide-react";
import { VideoPlayer, type SkipTime } from "@/components/player/VideoPlayer";
import { getAnimeById, createSlug, type AniListAnime } from "@/lib/anilist";
import { searchConsumetAnime, getEpisodeSourcesWithFallback, toConsumetSearchQuery } from "@/lib/consumet";
import type { Metadata } from "next";

export const revalidate = 0; // SSR for watch page

interface Props {
  params: Promise<{ slug: string; ep: string }>;
}

function getIdFromSlug(slug: string): number | null {
  const parts = slug.split("-");
  const last = parts[parts.length - 1];
  const id = parseInt(last, 10);
  return isNaN(id) ? null : id;
}

/**
 * Fetch video sources from Consumet
 * Searches for the anime by title and fetches episode sources
 */
async function getVideoSources(animeTitle: string, epNum: number) {
  try {
    // Step 1: Search for anime on Consumet
    const searchQuery = toConsumetSearchQuery(animeTitle);
    const searchResponse = await searchConsumetAnime(searchQuery);
    
    if (!searchResponse.results || searchResponse.results.length === 0) {
      console.warn(`No Consumet results for ${animeTitle}`);
      return null;
    }

    // Step 2: Use first result (best match)
    const animeId = searchResponse.results[0].id;
    console.log(`Found Consumet anime: ${animeTitle} -> ${animeId}`);

    // Step 3: Fetch episode sources
    const episodeData = await getEpisodeSourcesWithFallback(`${animeId}-episode-${epNum}`);
    
    if (!episodeData.sources || episodeData.sources.length === 0) {
      console.warn(`No sources found for episode ${epNum}`);
      return null;
    }

    // Step 4: Format response for VideoPlayer
    return {
      sources: episodeData.sources.map((source) => ({
        quality: source.quality || "HD",
        url: source.url,
        isM3U8: source.isM3U8,
      })),
      intro: episodeData.intro,
      outro: episodeData.outro,
      subtitles: episodeData.subtitles,
    };
  } catch (error) {
    console.error("Failed to fetch video sources:", error);
    return null;
  }
}

async function mockGetSkipTimes(malId?: number | null, epNum?: number): Promise<SkipTime[]> {
  return [
    { type: "op" as const, startTime: 90, endTime: 180 }, // 1:30 to 3:00
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, ep } = await params;
  const anime = await getAnimeById(getIdFromSlug(slug) || 0);
  if (!anime) return { title: "Not Found" };

  const title = anime.title.english || anime.title.romaji;
  return {
    title: `Watch ${title} Episode ${ep} Free Online`,
    description: `Watch ${title} Episode ${ep} in HD. Free anime streaming on AnimeStream.`,
  };
}

export default async function WatchPage({ params }: Props) {
  const { slug, ep } = await params;
  const animeId = getIdFromSlug(slug);
  const epNum = parseInt(ep, 10);

  if (!animeId || isNaN(epNum)) notFound();

  const anime = await getAnimeById(animeId);
  if (!anime) notFound();

  const title = anime.title.english || anime.title.romaji;
  const episodes = anime.airingSchedule?.nodes ?? [];
  const totalEpisodes = anime.episodes ?? episodes.length;

  // Validate episode range
  if (epNum < 1 || (totalEpisodes > 0 && epNum > totalEpisodes)) {
    notFound();
  }

  // Fetch real sources from Consumet, fallback to placeholder if fails
  let sources = await getVideoSources(title, epNum);
  if (!sources) {
    console.warn("Consumet fetch failed, using placeholder");
    sources = {
      sources: [
        { quality: "1080p", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", isM3U8: true },
      ],
      intro: undefined,
      outro: undefined,
      subtitles: [],
    };
  }

  const skipTimes = await mockGetSkipTimes(anime.idMal, epNum);

  const hasNext = totalEpisodes > 0 ? epNum < totalEpisodes : true;
  const nextEpNum = epNum + 1;
  const nextUrl = `/anime/${slug}/watch/${nextEpNum}`;

  // Build the Next Episode Card props
  const nextEpisodeTitle = `${title} - Episode ${nextEpNum}`;
  const nextEpisodeThumbnail = anime.coverImage.large || undefined;

  // Merge Consumet intro/outro with skip times
  const allSkipTimes: SkipTime[] = [...skipTimes];
  if (sources.intro) {
    allSkipTimes.push({
      type: "op" as const,
      startTime: sources.intro.start,
      endTime: sources.intro.end,
    });
  }
  if (sources.outro) {
    allSkipTimes.push({
      type: "ed" as const,
      startTime: sources.outro.start,
      endTime: sources.outro.end,
    });
  }

  // Build the Episode List Panel node
  const episodeListNode = (
    <div className="flex flex-col gap-2">
      {Array.from({ length: Math.min(totalEpisodes || 12, 100) }, (_, i) => i + 1).map((n) => {
        const isCurrent = n === epNum;
        return (
          <Link
            key={n}
            href={`/anime/${slug}/watch/${n}`}
            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
              isCurrent ? "bg-purple-900/40 border border-purple-500/30" : "hover:bg-white/5"
            }`}
          >
            <div
              className={`w-12 h-8 rounded flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                isCurrent ? "bg-brand-primary text-white" : "bg-white/10 text-white/50"
              }`}
            >
              EP {n}
            </div>
            <span className="text-sm text-gray-200 line-clamp-1">Episode {n}</span>
            {isCurrent && <Play size={12} className="ml-auto text-brand-primary mr-2" />}
          </Link>
        );
      })}
    </div>
  );

  // Build the Info Panel node
  const infoPanelNode = (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        {anime.coverImage.large && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={anime.coverImage.large} alt={title} className="w-24 rounded-lg shadow-lg" />
        )}
        <div className="flex flex-col gap-1">
          <span className="text-brand-accent text-xs font-bold uppercase">{anime.status}</span>
          <span className="text-gray-400 text-xs">★ {anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "N/A"}</span>
          <span className="text-gray-400 text-xs">{anime.format} • {anime.seasonYear}</span>
        </div>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed">
        {anime.description?.replace(/<[^>]*>/g, "") ?? "No synopsis available."}
      </p>
      <div className="flex flex-wrap gap-2 mt-2">
        {anime.genres.map(g => (
          <span key={g} className="px-2 py-1 rounded bg-white/5 text-xs text-gray-300 border border-white/10">
            {g}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black pt-4 md:pt-6">
      <div className="max-w-[1600px] mx-auto px-0 md:px-4 lg:px-8">
        
        {/* Main Layout Grid */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Column: Player + Info */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {/* Player Container */}
            <div className="w-full bg-surface-base md:rounded-xl overflow-hidden shadow-2xl border border-white/5">
              <VideoPlayer
                title={`Episode ${ep} - ${title}`}
                sources={sources.sources}
                posterUrl={anime.bannerImage || anime.coverImage.extraLarge || undefined}
                skipTimes={allSkipTimes}
                nextEpisodeUrl={hasNext ? nextUrl : undefined}
                nextEpisodeTitle={nextEpisodeTitle}
                nextEpisodeThumbnail={nextEpisodeThumbnail}
                episodeListNode={episodeListNode}
                infoPanelNode={infoPanelNode}
              />
            </div>

            {/* Video Controls / Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 md:px-0 mt-2">
              <div className="flex items-center gap-3">
                <Link
                  href={`/anime/${slug}`}
                  className="text-xl md:text-2xl font-bold text-white hover:text-brand-primary transition-colors line-clamp-1"
                >
                  {title}
                </Link>
                <span className="text-gray-400 text-sm hidden md:inline">— Episode {ep}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-elevated hover:bg-surface-overlay border border-white/10 transition-colors text-sm font-medium text-gray-200">
                  <Info size={16} />
                  <span>Report</span>
                </button>
                {hasNext && (
                  <Link
                    href={nextUrl}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg btn-gradient text-white text-sm font-medium"
                  >
                    <span>Next EP</span>
                    <Play size={14} fill="currentColor" />
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile-only episodes (replaced by right panel on desktop) */}
            <div className="block lg:hidden px-4 mb-8">
              <h3 className="text-lg font-bold text-white mb-4">Episodes</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {Array.from({ length: Math.min(totalEpisodes || 24, 100) }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={`/anime/${slug}/watch/${n}`}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg border transition-colors ${
                      n === epNum
                        ? "bg-brand-primary/20 border-brand-primary text-brand-primary"
                        : "bg-surface-elevated border-white/5 text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="text-xs font-medium">EP</span>
                    <span className="font-bold">{n}</span>
                  </Link>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Server Selection & Episodes (Desktop) */}
          <div className="w-[340px] xl:w-[380px] hidden lg:flex flex-col gap-6 flex-shrink-0">
            {/* Server Selector */}
            <div className="bg-surface-elevated rounded-xl border border-white/5 p-4 flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                Servers
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center gap-2 p-2.5 rounded-lg bg-brand-primary/20 border border-brand-primary/50 text-brand-primary text-sm font-medium transition-colors">
                  <CheckCircle size={14} />
                  VidStream
                </button>
                <button className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-base border border-white/5 text-gray-400 hover:bg-white/5 hover:text-white text-sm font-medium transition-colors">
                  MegaCloud
                </button>
                <button className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-base border border-white/5 text-gray-400 hover:bg-white/5 hover:text-white text-sm font-medium transition-colors">
                  StreamSB
                </button>
              </div>

              <div className="h-px bg-white/10 my-1" />

              <div className="flex gap-2">
                <button className="flex-1 py-1.5 rounded bg-brand-primary text-white text-xs font-bold uppercase tracking-wider">SUB</button>
                <button className="flex-1 py-1.5 rounded bg-surface-base text-gray-400 border border-white/10 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors">DUB</button>
              </div>
            </div>

            {/* Desktop Episode List */}
            <div className="bg-surface-elevated rounded-xl border border-white/5 flex flex-col flex-1 max-h-[600px] overflow-hidden">
              <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  List of Episodes
                </h3>
                <span className="text-xs text-gray-500">{epNum} / {totalEpisodes || "?"}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2" id="desktop-episode-list">
                {episodeListNode}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
