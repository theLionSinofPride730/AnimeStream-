"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Play, Info } from "lucide-react";
import { VideoPlayer, type SkipTime, type VideoSource } from "@/components/player/VideoPlayer";
import { ServerSelector } from "@/components/player/ServerSelector";
import type { EpisodeSourceData } from "@/lib/providers/types";

interface WatchPageClientProps {
  animeTitle: string;
  animeSlug: string;
  episodeNumber: number;
  totalEpisodes: number;
  initialSources: VideoSource[];
  posterUrl?: string;
  bannerUrl?: string;
  skipTimes: SkipTime[];
  episodeId: string;
  anime: {
    coverImage?: string;
    status?: string;
    averageScore?: number;
    format?: string;
    seasonYear?: number;
    description?: string;
    genres?: string[];
  };
}

export function WatchPageClient({
  animeTitle,
  animeSlug,
  episodeNumber,
  totalEpisodes,
  initialSources,
  posterUrl,
  bannerUrl,
  skipTimes: initialSkipTimes,
  episodeId,
  anime,
}: WatchPageClientProps) {
  // Video sources state - can be updated when server changes
  const [sources, setSources] = useState<VideoSource[]>(initialSources);
  const [skipTimes, setSkipTimes] = useState<SkipTime[]>(initialSkipTimes);
  const [sourceKey, setSourceKey] = useState(0); // Force re-mount player on source change

  const hasNext = totalEpisodes > 0 ? episodeNumber < totalEpisodes : true;
  const nextEpNum = episodeNumber + 1;
  const nextUrl = `/anime/${animeSlug}/watch/${nextEpNum}`;
  const nextEpisodeTitle = `${animeTitle} - Episode ${nextEpNum}`;

  // Handle sources loaded from ServerSelector
  const handleSourcesLoaded = useCallback((data: EpisodeSourceData) => {
    if (!data.sources || data.sources.length === 0) return;

    // Convert to VideoSource format
    const newSources: VideoSource[] = data.sources.map((source) => ({
      quality: source.quality || "auto",
      url: source.url,
      isM3U8: source.isM3U8,
    }));

    setSources(newSources);

    // Update skip times if provided
    const newSkipTimes: SkipTime[] = [];
    if (data.intro) {
      newSkipTimes.push({
        type: "op",
        startTime: data.intro.start,
        endTime: data.intro.end,
      });
    }
    if (data.outro) {
      newSkipTimes.push({
        type: "ed",
        startTime: data.outro.start,
        endTime: data.outro.end,
      });
    }
    if (newSkipTimes.length > 0) {
      setSkipTimes(newSkipTimes);
    }

    // Force player to reload with new source
    setSourceKey((k) => k + 1);
  }, []);

  // Build episode list for player panel
  const episodeListNode = (
    <div className="flex flex-col gap-2">
      {Array.from({ length: Math.min(totalEpisodes || 12, 100) }, (_, i) => i + 1).map((n) => {
        const isCurrent = n === episodeNumber;
        return (
          <Link
            key={n}
            href={`/anime/${animeSlug}/watch/${n}`}
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

  // Build info panel for player
  const infoPanelNode = (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        {anime.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={anime.coverImage} alt={animeTitle} className="w-24 rounded-lg shadow-lg" />
        )}
        <div className="flex flex-col gap-1">
          <span className="text-brand-accent text-xs font-bold uppercase">{anime.status}</span>
          <span className="text-gray-400 text-xs">
            {anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "N/A"}
          </span>
          <span className="text-gray-400 text-xs">
            {anime.format} {anime.seasonYear && `• ${anime.seasonYear}`}
          </span>
        </div>
      </div>
      {anime.description && (
        <p className="text-sm text-gray-300 leading-relaxed">
          {anime.description.replace(/<[^>]*>/g, "")}
        </p>
      )}
      {anime.genres && (
        <div className="flex flex-wrap gap-2 mt-2">
          {anime.genres.map((g) => (
            <span
              key={g}
              className="px-2 py-1 rounded bg-white/5 text-xs text-gray-300 border border-white/10"
            >
              {g}
            </span>
          ))}
        </div>
      )}
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
                key={sourceKey}
                title={`Episode ${episodeNumber} - ${animeTitle}`}
                sources={sources}
                posterUrl={bannerUrl || posterUrl}
                skipTimes={skipTimes}
                nextEpisodeUrl={hasNext ? nextUrl : undefined}
                nextEpisodeTitle={nextEpisodeTitle}
                nextEpisodeThumbnail={anime.coverImage}
                episodeListNode={episodeListNode}
                infoPanelNode={infoPanelNode}
              />
            </div>

            {/* Video Controls / Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 md:px-0 mt-2">
              <div className="flex items-center gap-3">
                <Link
                  href={`/anime/${animeSlug}`}
                  className="text-xl md:text-2xl font-bold text-white hover:text-brand-primary transition-colors line-clamp-1"
                >
                  {animeTitle}
                </Link>
                <span className="text-gray-400 text-sm hidden md:inline">— Episode {episodeNumber}</span>
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
                {Array.from({ length: Math.min(totalEpisodes || 24, 100) }, (_, i) => i + 1).map(
                  (n) => (
                    <Link
                      key={n}
                      href={`/anime/${animeSlug}/watch/${n}`}
                      className={`aspect-square flex flex-col items-center justify-center rounded-lg border transition-colors ${
                        n === episodeNumber
                          ? "bg-brand-primary/20 border-brand-primary text-brand-primary"
                          : "bg-surface-elevated border-white/5 text-gray-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="text-xs font-medium">EP</span>
                      <span className="font-bold">{n}</span>
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Server Selection & Episodes (Desktop) */}
          <div className="w-[340px] xl:w-[380px] hidden lg:flex flex-col gap-6 flex-shrink-0">
            {/* Server Selector */}
            <div className="bg-surface-elevated rounded-xl border border-white/5 p-4">
              <ServerSelector
                episodeId={episodeId}
                onSourcesLoaded={handleSourcesLoaded}
                initialProvider="zoro"
                initialAudioType="sub"
              />
            </div>

            {/* Desktop Episode List */}
            <div className="bg-surface-elevated rounded-xl border border-white/5 flex flex-col flex-1 max-h-[600px] overflow-hidden">
              <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  List of Episodes
                </h3>
                <span className="text-xs text-gray-500">
                  {episodeNumber} / {totalEpisodes || "?"}
                </span>
              </div>

              <div
                className="flex-1 overflow-y-auto custom-scrollbar p-2"
                id="desktop-episode-list"
              >
                {episodeListNode}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
