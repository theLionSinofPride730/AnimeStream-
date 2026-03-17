"use client";

import { useRef, useEffect, useState } from "react";
import {
  MediaPlayer,
  MediaProvider,
  Poster,
  Track,
  useMediaStore,
  type MediaPlayerInstance
} from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import { NextEpisodeCard } from "./NextEpisodeCard";
import { FullscreenScrollPanel } from "./FullscreenScrollPanel";

export interface VideoSource {
  quality: string;
  url: string;
  isM3U8: boolean;
}

export interface SkipTime {
  type: "op" | "ed";
  startTime: number;
  endTime: number;
}

interface VideoPlayerProps {
  title: string;
  sources: VideoSource[];
  posterUrl?: string;
  thumbnailsUrl?: string;
  skipTimes?: SkipTime[];
  nextEpisodeUrl?: string;
  nextEpisodeTitle?: string;
  nextEpisodeThumbnail?: string;
  startTime?: number; // For resume playback
  onProgress?: (currentTime: number, duration: number) => void;
  episodeListNode?: React.ReactNode;
  infoPanelNode?: React.ReactNode;
}

export function VideoPlayer({
  title,
  sources,
  posterUrl,
  thumbnailsUrl,
  skipTimes = [],
  nextEpisodeUrl,
  nextEpisodeTitle,
  nextEpisodeThumbnail,
  startTime = 0,
  onProgress,
  episodeListNode,
  infoPanelNode
}: VideoPlayerProps) {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const [showNextCard, setShowNextCard] = useState(false);
  const [panelOpen, setPanelOpen] = useState<"episodes" | "info" | null>(null);

  // Default to 1080p if available, else first source
  const defaultSource = sources.find((s) => s.quality === "1080p") || sources[0];

  useEffect(() => {
    if (playerRef.current && startTime > 0) {
      playerRef.current.currentTime = startTime;
    }
  }, [startTime]);

  const onTimeUpdate = (time: number) => {
    const duration = playerRef.current?.state.duration || 0;
    if (duration > 0 && onProgress) {
      onProgress(time, duration);
    }

    // Next Episode Card Trigger (show last 90 seconds)
    if (nextEpisodeUrl && duration > 0) {
      if (duration - time <= 90 && duration - time > 0) {
        if (!showNextCard) setShowNextCard(true);
      } else {
        if (showNextCard) setShowNextCard(false);
      }
    }
  };

  // Fullscreen Scroll Navigation Logic
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Only process wheel events if we are in fullscreen
      if (!document.fullscreenElement) return;

      // Don't trigger if the user is scrolling INSIDE an open panel
      if ((e.target as HTMLElement).closest(".fullscreen-panel-content")) return;

      e.preventDefault();

      if (e.deltaY < 0) {
        // Scroll UP -> show episodes
        setPanelOpen("episodes");
      } else if (e.deltaY > 0) {
        // Scroll DOWN -> show info
        setPanelOpen("info");
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && panelOpen) {
        setPanelOpen(null);
        e.stopPropagation(); // prevent exiting fullscreen on first escape
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [panelOpen]);

  // Provide skip markers for the timeline
  const tracks = [
    ...skipTimes.map((skip) => ({
      kind: "chapters" as const,
      src: URL.createObjectURL(
        new Blob(
          [`WEBVTT\n\n1\n${formatVttTime(skip.startTime)} --> ${formatVttTime(skip.endTime)}\n${skip.type === "op" ? "Skip Intro" : "Skip Outro"}`],
          { type: 'text/vtt' }
        )
      ),
      label: "Skip",
      language: "en"
    }))
  ];

  return (
    <div className="player-container relative shadow-2xl overflow-hidden group">
      <MediaPlayer
        ref={playerRef}
        title={title}
        src={defaultSource?.url}
        viewType="video"
        streamType="on-demand"
        logLevel="warn"
        crossOrigin
        playsInline
        onTimeUpdate={(e) => onTimeUpdate(e.currentTime)}
      >
        <MediaProvider>
          {posterUrl && <Poster className="vds-poster" src={posterUrl} alt={title} />}
          {tracks.map((track, i) => (
            <Track key={String(i)} {...track} />
          ))}
        </MediaProvider>

        <DefaultVideoLayout
          thumbnails={thumbnailsUrl}
          icons={defaultLayoutIcons}
        />

        {/* Skip Buttons Overlay */}
        <SkipButtons playerRef={playerRef} skipTimes={skipTimes} />

      </MediaPlayer>

      {/* Fullscreen Next Episode Card Portal */}
      {showNextCard && nextEpisodeUrl && (
        <NextEpisodeCard
          nextUrl={nextEpisodeUrl}
          title={nextEpisodeTitle || "Next Episode"}
          thumbnailUrl={nextEpisodeThumbnail}
          onClose={() => setShowNextCard(false)}
        />
      )}

      {/* Fullscreen Scroll Navigation Panels */}
      <FullscreenScrollPanel
        isOpen={panelOpen === "episodes"}
        title="Episodes"
        onClose={() => setPanelOpen(null)}
      >
        {episodeListNode}
      </FullscreenScrollPanel>

      <FullscreenScrollPanel
        isOpen={panelOpen === "info"}
        title="About Series"
        onClose={() => setPanelOpen(null)}
      >
        {infoPanelNode}
      </FullscreenScrollPanel>
    </div>
  );
}

// ----------------------------------------------------------------------
// Helper Components
// ----------------------------------------------------------------------

function SkipButtons({ playerRef, skipTimes }: { playerRef: React.RefObject<MediaPlayerInstance | null>, skipTimes: SkipTime[] }) {
  const { currentTime } = useMediaStore(playerRef);

  return (
    <div className="absolute bottom-24 right-4 flex flex-col gap-2 z-50">
      {skipTimes.map((skip, idx) => {
        // Show button if we are within the skip interval, or 10s before it (anticipation)
        const isVisible = currentTime >= Math.max(0, skip.startTime - 10) && currentTime < skip.endTime;

        if (!isVisible) return null;

        return (
          <button
            key={idx}
            onClick={() => {
              if (playerRef.current) playerRef.current.currentTime = skip.endTime;
            }}
            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-lg animate-fade-in hover:scale-105"
            style={{
              background: "rgba(13,13,26,0.85)",
              color: "var(--color-text-primary)",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(8px)"
            }}
          >
            Skip {skip.type === "op" ? "Intro" : "Outro"}
          </button>
        );
      })}
    </div>
  );
}

function formatVttTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}
