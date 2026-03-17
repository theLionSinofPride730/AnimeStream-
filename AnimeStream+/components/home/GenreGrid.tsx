"use client";

import Link from "next/link";
import {
  Swords,
  Compass,
  Smile,
  VenetianMask,
  Wand2,
  Ghost,
  Tornado,
  Bot,
  Search,
  Heart,
  Rocket,
  Coffee,
  Trophy,
  Flame,
  Eye,
  Brain,
} from "lucide-react";

const GENRES = [
  { name: "Action", slug: "action", Icon: Swords, color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)" },
  { name: "Adventure", slug: "adventure", Icon: Compass, color: "#10B981", bg: "rgba(16, 185, 129, 0.1)" },
  { name: "Comedy", slug: "comedy", Icon: Smile, color: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)" },
  { name: "Drama", slug: "drama", Icon: VenetianMask, color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.1)" },
  { name: "Fantasy", slug: "fantasy", Icon: Wand2, color: "#6366F1", bg: "rgba(99, 102, 241, 0.1)" },
  { name: "Horror", slug: "horror", Icon: Ghost, color: "#64748B", bg: "rgba(100, 116, 139, 0.1)" },
  { name: "Isekai", slug: "isekai", Icon: Tornado, color: "#06B6D4", bg: "rgba(6, 182, 212, 0.1)" },
  { name: "Mecha", slug: "mecha", Icon: Bot, color: "#94A3B8", bg: "rgba(148, 163, 184, 0.1)" },
  { name: "Mystery", slug: "mystery", Icon: Search, color: "#3B82F6", bg: "rgba(59, 130, 246, 0.1)" },
  { name: "Romance", slug: "romance", Icon: Heart, color: "#EC4899", bg: "rgba(236, 72, 153, 0.1)" },
  { name: "Sci-Fi", slug: "sci-fi", Icon: Rocket, color: "#0EA5E9", bg: "rgba(14, 165, 233, 0.1)" },
  { name: "Slice of Life", slug: "slice-of-life", Icon: Coffee, color: "#F97316", bg: "rgba(249, 115, 22, 0.1)" },
  { name: "Sports", slug: "sports", Icon: Trophy, color: "#D97706", bg: "rgba(217, 119, 6, 0.1)" },
  { name: "Supernatural", slug: "supernatural", Icon: Flame, color: "#A855F7", bg: "rgba(168, 85, 247, 0.1)" },
  { name: "Thriller", slug: "thriller", Icon: Eye, color: "#E11D48", bg: "rgba(225, 29, 72, 0.1)" },
  { name: "Psychological", slug: "psychological", Icon: Brain, color: "#D1D5DB", bg: "rgba(209, 213, 219, 0.1)" },
];

export function GenreGrid() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-6 rounded-full" style={{ background: "linear-gradient(to bottom, #9D4EDD, #FF3366)" }} />
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Browse by Genre
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {GENRES.map((genre) => (
          <Link
            key={genre.slug}
            href={`/genre/${genre.slug}`}
            className="group relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all duration-300 hover:scale-105 overflow-hidden"
            style={{
              background: "rgba(20, 20, 30, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          >
            {/* Hover Background Glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: `linear-gradient(to bottom right, ${genre.bg}, transparent)`,
              }}
            />
            
            {/* Icon Container */}
            <div
              className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-1"
              style={{
                background: "var(--color-surface-base)",
                border: `1px solid ${genre.color}40`,
                boxShadow: `0 4px 15px ${genre.color}20`,
              }}
            >
              <genre.Icon size={24} color={genre.color} className="group-hover:animate-pulse" />
            </div>
            
            <span
              className="relative z-10 text-sm font-semibold transition-colors duration-300"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {genre.name}
            </span>
            
            {/* Bottom Accent Line */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: genre.color }}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
