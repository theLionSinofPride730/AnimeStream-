"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Plus, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimeCardData } from "@/components/anime/AnimeCard";

interface HeroBannerProps {
  featured: AnimeCardData[];
}

export function HeroBanner({ featured }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goTo = (index: number) => {
    if (isAnimating || index === current) return;
    setIsAnimating(true);
    setCurrent(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prev = () => goTo((current - 1 + featured.length) % featured.length);
  const next = () => goTo((current + 1) % featured.length);

  // Auto-rotate every 8s
  useEffect(() => {
    const timer = setInterval(next, 8000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  if (!featured.length) return <HeroBannerSkeleton />;

  const item = featured[current];
  const title = item.titleEn || item.titleRomaji;
  
  // Use banner if available, otherwise fallback to cover
  const bgImg = item.bannerUrl || item.coverUrl;

  return (
    <div className="relative w-full overflow-hidden bg-black" style={{ minHeight: "80vh", maxHeight: "800px" }}>
      {/* Background Image Container */}
      <div
        className="absolute inset-0 transition-all duration-1000 ease-in-out"
        style={{
          opacity: isAnimating ? 0 : 1,
          transform: isAnimating ? "scale(1.05)" : "scale(1)",
        }}
      >
        {bgImg && (
          // Using unoptimized to prevent Next.js from throwing errors on external domains
          <Image
            src={bgImg}
            alt={title}
            fill
            priority
            unoptimized
            className="object-cover object-top"
          />
        )}
      </div>

      {/* Gradients to blend with the rest of the site and make text readable */}
      {/* Top gradient for navbar */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-transparent h-48" />
      
      {/* Bottom gradient matching site background */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0A0A14] via-[#0A0A14]/80 to-transparent" />

      {/* Side gradient (for desktop text readability) */}
      <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-[#0A0A14]/90 via-[#0A0A14]/60 to-transparent hidden md:block" />
      <div className="absolute inset-0 bg-black/40 md:bg-transparent" />

      {/* Content */}
      <div
        className="absolute inset-0 flex flex-col justify-end page-container pb-12 md:pb-24 pt-32 w-full max-w-7xl mx-auto transition-all duration-700 ease-out"
        style={{
          opacity: isAnimating ? 0 : 1,
          transform: isAnimating ? "translateY(20px)" : "translateY(0)",
        }}
      >
        <div className="max-w-3xl flex flex-col gap-4">
          
          {/* Metadata & Badges */}
          <div className="flex items-center gap-3 flex-wrap">
            {item.status === "ONGOING" && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-green-400 bg-green-400/10 border border-green-400/20 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Airing Now
              </span>
            )}
            {item.score && (
              <span className="flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 backdrop-blur-md">
                <Star size={14} fill="currentColor" />
                {(item.score / 10).toFixed(1)} <span className="text-yellow-400/60 font-medium">/ 10</span>
              </span>
            )}
            {item.year && (
              <span className="text-sm font-semibold text-gray-300 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                {item.year}
              </span>
            )}
            {item.type && (
              <span className="text-sm font-semibold text-gray-300 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                {item.type}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight drop-shadow-2xl">
            {title}
          </h1>

          {/* Subtitle / Romaji */}
          {item.titleRomaji && item.titleEn && (
            <p className="text-lg md:text-xl text-gray-300 font-medium drop-shadow-md">
              {item.titleRomaji}
            </p>
          )}

          {/* Genres */}
          <div className="flex items-center gap-2 mt-2">
            {item.genres?.slice(0, 4).map((g) => (
              <span key={g} className="text-sm text-gray-400 font-medium">
                {g} <span className="ml-2 text-gray-600 last:hidden">•</span>
              </span>
            ))}
          </div>

          {/* Call To Actions */}
          <div className="flex items-center gap-4 mt-6">
            <Link
              href={`/anime/${item.slug}`}
              className="group relative flex items-center justify-center gap-3 px-8 py-4 rounded-full font-bold text-white transition-all hover:scale-105"
            >
              {/* Pink glow effect matching NeoTV+ */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF3366] to-[#9D4EDD] opacity-100 blur-lg transition-opacity group-hover:opacity-110 group-hover:blur-xl" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF3366] to-[#9D4EDD]" />
              <div className="relative flex items-center gap-2">
                <Play size={20} fill="white" className="filter drop-shadow-md" />
                <span className="text-base tracking-wide drop-shadow-md">START WATCHING</span>
              </div>
            </Link>

            <button
              className="group flex items-center justify-center gap-2 px-6 py-4 rounded-full font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl transition-all hover:scale-105"
            >
              <Plus size={20} className="transition-transform group-hover:rotate-90" />
              <span className="text-base tracking-wide hidden xs:block">ADD LIST</span>
            </button>
          </div>

        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute right-6 bottom-12 md:bottom-24 flex items-center gap-3">
        <button
          onClick={prev}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-black/40 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all hover:scale-110"
          aria-label="Previous"
        >
          <ChevronLeft size={24} color="white" />
        </button>
        <button
          onClick={next}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-black/40 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all hover:scale-110"
          aria-label="Next"
        >
          <ChevronRight size={24} color="white" />
        </button>
      </div>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {featured.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === current ? "32px" : "8px",
              height: "8px",
              background: i === current ? "#FF3366" : "rgba(255,255,255,0.3)",
              boxShadow: i === current ? "0 0 10px rgba(255,51,102,0.5)" : "none",
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function HeroBannerSkeleton() {
  return (
    <div className="w-full bg-[#0A0A14] flex flex-col justify-end pb-24 px-8" style={{ minHeight: "80vh" }}>
      <div className="max-w-3xl flex flex-col gap-4">
        <div className="w-32 h-6 rounded-full bg-white/5 animate-pulse" />
        <div className="w-3/4 h-16 rounded-xl bg-white/5 animate-pulse" />
        <div className="w-1/2 h-6 rounded-md bg-white/5 animate-pulse mt-4" />
        <div className="flex gap-4 mt-6">
          <div className="w-48 h-14 rounded-full bg-white/5 animate-pulse" />
          <div className="w-32 h-14 rounded-full bg-white/5 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
