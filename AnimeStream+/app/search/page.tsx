"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search as SearchIcon, Filter, X } from "lucide-react";
import { searchAnime, type AniListAnime, normalizeStatus, createSlug } from "@/lib/anilist";
import { AnimeCard, type AnimeCardData } from "@/components/anime/AnimeCard";

function mapAniListToCard(anime: AniListAnime): AnimeCardData {
  return {
    id: String(anime.id),
    slug: createSlug(anime.title.romaji, anime.id),
    titleEn: anime.title.english,
    titleRomaji: anime.title.romaji,
    coverUrl: anime.coverImage.large,
    score: anime.averageScore,
    totalEpisodes: anime.episodes,
    status: normalizeStatus(anime.status),
    type: anime.format,
    year: anime.seasonYear,
    genres: anime.genres?.slice(0, 3),
    hasSub: true,
    hasDub: false,
  };
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<AnimeCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchAnime(query, 1, 40);
        setResults(data.media.map(mapAniListToCard));
        router.replace(`/search?q=${encodeURIComponent(query)}`);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 400); // debounce

    return () => clearTimeout(timer);
  }, [query, router]);

  return (
    <div className="page-container py-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Search Bar */}
        <div className="relative mb-8 flex gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for anime... (e.g. Jujutsu Kaisen, Frieren)"
              className="w-full bg-surface-elevated border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-lg"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 rounded-xl border flex items-center gap-2 font-medium transition-colors ${
              showFilters ? "bg-brand-primary/20 border-brand-primary text-brand-primary" : "bg-surface-elevated border-white/10 text-gray-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Filter size={18} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* Temporary stub for filters panel */}
        {showFilters && (
          <div className="bg-surface-elevated border border-white/10 rounded-xl p-6 mb-8 animate-slide-up">
            <h3 className="text-lg font-semibold text-white mb-4">Advanced Filters</h3>
            <p className="text-sm text-gray-400">Filter panel implemented in Phase 3.</p>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 rounded-full border-4 border-white/10 border-t-brand-primary animate-spin" />
            <p className="text-gray-400 animate-pulse">Searching...</p>
          </div>
        ) : query.trim() && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="text-6xl mb-4 opacity-50">🔍</div>
            <h2 className="text-xl font-bold text-white mb-2">No results found</h2>
            <p className="text-gray-400">Try adjusting your search query or filters.</p>
          </div>
        ) : results.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              Found <span className="text-brand-primary">{results.length}</span> results for &quot;{query}&quot;
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {results.map((anime) => (
                <div key={anime.id} className="w-full">
                  <AnimeCard anime={anime} size="lg" className="w-full" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="text-6xl mb-4 opacity-50">✨</div>
            <h2 className="text-xl font-bold text-white mb-2">What are you looking for?</h2>
            <p className="text-gray-400">Search by title, character, or studio.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-white/10 border-t-brand-primary animate-spin" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
