"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Play, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

export interface AnimeCardData {
  id: string;
  slug: string;
  titleEn?: string | null;
  titleRomaji: string;
  coverUrl?: string | null;
  bannerUrl?: string | null;
  score?: number | null;
  totalEpisodes?: number | null;
  status?: string | null;
  type?: string | null;
  year?: number | null;
  genres?: string[];
  hasSub?: boolean;
  hasDub?: boolean;
  anilistId?: number | null;
}

interface AnimeCardProps {
  anime: AnimeCardData;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { width: 140, height: 200 },
  md: { width: 180, height: 255 },
  lg: { width: 220, height: 310 },
};

export function AnimeCard({ anime, size = "md", showScore = true, className }: AnimeCardProps) {
  const title = anime.titleEn || anime.titleRomaji;
  const { width, height } = SIZE_MAP[size];

  const scoreColor =
    !anime.score ? "" :
    anime.score >= 75 ? "score-high" :
    anime.score >= 60 ? "score-mid" : "score-low";

  return (
    <Link
      href={`/anime/${anime.slug}`}
      className={cn("group block flex-shrink-0 card-hover", className)}
      style={{ width }}
    >
      {/* Cover Image */}
      <div
        className="relative overflow-hidden rounded-lg mb-2.5"
        style={{ height, background: "var(--color-surface-elevated)" }}
      >
        {anime.coverUrl ? (
          <Image
            src={anime.coverUrl}
            alt={`${title} anime cover art`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes={`${width}px`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            🎌
          </div>
        )}

        {/* Overlay on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
          style={{ background: "rgba(13,13,26,0.7)" }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "var(--color-brand-primary)" }}
          >
            <Play size={20} color="white" fill="white" />
          </div>
        </div>

        {/* Score badge */}
        {showScore && anime.score && (
          <div
            className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded"
            style={{ background: "rgba(13,13,26,0.85)" }}
          >
            <Star size={10} fill="#F59E0B" className="text-yellow-400" />
            <span className={cn("text-caption font-semibold", scoreColor)}>
              {(anime.score / 10).toFixed(1)}
            </span>
          </div>
        )}

        {/* Sub/Dub badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {anime.hasSub !== false && (
            <span className="badge-sub text-caption px-1.5 py-0.5 rounded font-semibold">SUB</span>
          )}
          {anime.hasDub && (
            <span className="badge-dub text-caption px-1.5 py-0.5 rounded font-semibold">DUB</span>
          )}
        </div>

        {/* Episode count bottom bar */}
        {anime.totalEpisodes && (
          <div
            className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
            style={{ background: "linear-gradient(to top, rgba(13,13,26,0.9) 0%, transparent 100%)" }}
          >
            <span className="text-caption" style={{ color: "var(--color-text-muted)" }}>
              {anime.totalEpisodes} eps
            </span>
          </div>
        )}

        {/* Status badge */}
        {anime.status === "ONGOING" && (
          <div className="absolute bottom-0 right-0 m-2">
            <span className="badge-ongoing text-caption px-1.5 py-0.5 rounded-md font-medium">
              Airing
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <h3
          className="text-body-sm font-semibold line-clamp-2 leading-snug mb-1 transition-colors group-hover:text-purple-300"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {anime.year && (
            <span className="text-caption" style={{ color: "var(--color-text-muted)" }}>
              {anime.year}
            </span>
          )}
          {anime.type && anime.type !== "TV" && (
            <span className="text-caption" style={{ color: "var(--color-text-muted)" }}>
              • {anime.type}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function AnimeCardSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { width, height } = SIZE_MAP[size];

  return (
    <div className="flex-shrink-0" style={{ width }}>
      <div className="shimmer rounded-lg mb-2.5" style={{ height }} />
      <div className="shimmer rounded h-4 mb-2" />
      <div className="shimmer rounded h-3 w-3/4" />
    </div>
  );
}
