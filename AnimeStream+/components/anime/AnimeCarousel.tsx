"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AnimeCard, AnimeCardSkeleton, AnimeCardData } from "./AnimeCard";

interface AnimeCarouselProps {
  title: string;
  anime: AnimeCardData[];
  viewAllHref?: string;
  isLoading?: boolean;
  cardSize?: "sm" | "md" | "lg";
  accentColor?: string;
}

export function AnimeCarousel({
  title,
  anime,
  viewAllHref,
  isLoading = false,
  cardSize = "md",
  accentColor,
}: AnimeCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = direction === "left" ? -400 : 400;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-0">
        <div className="flex items-center gap-3">
          <div
            className="w-1 h-5 rounded-full flex-shrink-0"
            style={{ background: accentColor || "var(--color-brand-primary)" }}
          />
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Scroll arrows — hidden on mobile */}
          <button
            onClick={() => scroll("left")}
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg transition-all duration-200 hover:scale-110"
            style={{
              background: "var(--color-surface-elevated)",
              border: "1px solid var(--color-border-subtle)",
              color: "var(--color-text-secondary)",
            }}
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg transition-all duration-200 hover:scale-110"
            style={{
              background: "var(--color-surface-elevated)",
              border: "1px solid var(--color-border-subtle)",
              color: "var(--color-text-secondary)",
            }}
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>

          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="flex items-center gap-1 text-sm font-medium transition-all duration-200 hover:gap-2"
              style={{ color: "var(--color-brand-primary)" }}
            >
              View All
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>

      {/* Cards */}
      <div
        ref={scrollRef}
        className="carousel-container scrollbar-hide"
        style={{ gap: "12px" }}
      >
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="carousel-item">
                <AnimeCardSkeleton size={cardSize} />
              </div>
            ))
          : anime.map((a) => (
              <div key={a.id} className="carousel-item">
                <AnimeCard anime={a} size={cardSize} />
              </div>
            ))}
      </div>
    </section>
  );
}
