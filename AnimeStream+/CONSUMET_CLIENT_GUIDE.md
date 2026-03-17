## Consumet Client-Side Search Implementation Guide

This guide shows how to implement search and streaming features on the client side using the new tRPC endpoints.

### Basic Setup (Already Done)

The tRPC backend now has these procedures:
```typescript
// Search anime on Consumet
client.anime.searchConsumet.query({ query: "One Piece" })

// Get episode sources
client.anime.getEpisodeSources.query({ 
  animeId: "one-piece",
  episodeNumber: 1 
})
```

### Example: Anime Search Component

Here's a React component using the new tRPC endpoint (client-side):

```typescript
// components/search/ConsumetSearch.tsx
"use client";

import { useState } from "react";
import { api } from "@/lib/trpc-client"; // Your tRPC client
import Link from "next/link";

interface SearchResult {
  id: string;
  title: string;
  image?: string;
  totalEpisodes?: number;
}

export function ConsumetSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use tRPC mutation for search
  const searchMutation = api.anime.searchConsumet.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setResults(data.results);
      } else {
        setError(data.error || "Search failed");
      }
      setLoading(false);
    },
    onError: (error) => {
      setError(error.message);
      setLoading(false);
    },
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    await searchMutation.mutate({ query: query.trim() });
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Search anime (e.g., One Piece, Naruto)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg bg-surface-base border border-white/10 text-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 rounded-lg bg-brand-primary text-white font-medium disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30 text-red-300 mb-4">
          {error}
        </div>
      )}

      {/* Results Grid */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map((anime) => (
            <Link
              key={anime.id}
              href={`/search?consumetId=${anime.id}&title=${encodeURIComponent(anime.title)}`}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[9/12] rounded-lg overflow-hidden bg-surface-base border border-white/5 group-hover:border-brand-primary/50 transition-colors">
                {anime.image && (
                  <img
                    src={anime.image}
                    alt={anime.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3">
                  <p className="text-white font-semibold text-sm line-clamp-2">
                    {anime.title}
                  </p>
                  <p className="text-gray-300 text-xs mt-1">
                    {anime.totalEpisodes} Episodes
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && query && (
        <div className="text-center py-8 text-gray-400">
          No results found for "{query}"
        </div>
      )}
    </div>
  );
}
```

### Example: Episode Selection Component

```typescript
// components/player/EpisodeSelector.tsx
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/trpc-client";
import { Loader2 } from "lucide-react";

interface EpisodeSelectorProps {
  consumetId: string;
  totalEpisodes?: number;
  onSelectEpisode: (episodeNumber: number, sources: any) => void;
}

export function EpisodeSelector({
  consumetId,
  totalEpisodes = 12,
  onSelectEpisode,
}: EpisodeSelectorProps) {
  const [selectedEp, setSelectedEp] = useState(1);
  const [loading, setLoading] = useState(false);

  // Use tRPC query to fetch sources
  const sourceQuery = api.anime.getEpisodeSources.useQuery(
    {
      animeId: consumetId,
      episodeNumber: selectedEp,
    },
    {
      enabled: false, // Manual trigger
    }
  );

  const loadEpisode = async (epNumber: number) => {
    setSelectedEp(epNumber);
    setLoading(true);

    const result = await sourceQuery.refetch();
    if (result.data?.success && result.data.sources.length > 0) {
      onSelectEpisode(epNumber, result.data.sources);
    } else {
      alert("Failed to load episode sources");
    }
    setLoading(false);
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold text-white mb-3">Episodes</h3>
      
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-2 border border-white/5 rounded-lg">
        {Array.from({ length: totalEpisodes }, (_, i) => i + 1).map((ep) => (
          <button
            key={ep}
            onClick={() => loadEpisode(ep)}
            disabled={loading && selectedEp !== ep}
            className={`w-full aspect-square flex items-center justify-center rounded font-medium text-sm transition-colors ${
              selectedEp === ep
                ? "bg-brand-primary text-white"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
          >
            {loading && selectedEp === ep ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              ep
            )}
          </button>
        ))}
      </div>

      {/* Show current episode info */}
      {selectedEp && (
        <p className="text-sm text-gray-400 mt-2">
          Episode {selectedEp} - {sourceQuery.data?.sources.length || 0} source(s)
        </p>
      )}
    </div>
  );
}
```

### Example: Quality Selector Component

```typescript
// components/player/QualitySelector.tsx
"use client";

import { VideoSource } from "@/components/player/VideoPlayer";

interface QualitySelectorProps {
  sources: VideoSource[];
  onSelect: (source: VideoSource) => void;
  currentSource?: VideoSource;
}

export function QualitySelector({
  sources,
  onSelect,
  currentSource,
}: QualitySelectorProps) {
  if (sources.length <= 1) {
    return (
      <div className="text-xs text-gray-400">
        Quality: {sources[0]?.quality || "Default"}
      </div>
    );
  }

  return (
    <select
      onChange={(e) => {
        const source = sources[parseInt(e.target.value)];
        onSelect(source);
      }}
      value={sources.indexOf(currentSource || sources[0])}
      className="text-xs px-2 py-1 rounded bg-surface-elevated border border-white/10 text-gray-300"
    >
      {sources.map((source, idx) => (
        <option key={idx} value={idx}>
          {source.quality}
        </option>
      ))}
    </select>
  );
}
```

### Example: Full-Page Search Result Component

This could be added to `app/consumet-search/page.tsx`:

```typescript
// app/consumet-search/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "@/lib/trpc-client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EpisodeSelector } from "@/components/player/EpisodeSelector";
import { VideoPlayer } from "@/components/player/VideoPlayer";

export default function ConsumetSearchPage() {
  const searchParams = useSearchParams();
  const consumetId = searchParams.get("consumetId");
  const title = searchParams.get("title");

  const [selectedSources, setSelectedSources] = useState<any[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState(1);

  if (!consumetId || !title) {
    return (
      <div className="min-h-screen bg-black p-4 flex items-center justify-center">
        <p className="text-gray-400">Invalid search parameters</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          {decodeURIComponent(title)}
        </h1>

        {selectedSources.length > 0 && (
          <div className="mb-8">
            <VideoPlayer
              title={`${decodeURIComponent(title)} - Episode ${selectedEpisode}`}
              sources={selectedSources}
            />
          </div>
        )}

        <EpisodeSelector
          consumetId={consumetId}
          totalEpisodes={100} // Default, could fetch actual count
          onSelectEpisode={(ep, sources) => {
            setSelectedEpisode(ep);
            setSelectedSources(sources);
          }}
        />
      </div>
    </div>
  );
}
```

### Using React Query Hooks

Since tRPC uses React Query under the hood, you get automatic:
- ✅ Caching (episodes don't re-fetch)
- ✅ Loading states
- ✅ Error handling
- ✅ Mutations
- ✅ Infinite queries

Example with useQuery:
```typescript
const { data, isLoading, error } = api.anime.getEpisodeSources.useQuery({
  animeId: "one-piece",
  episodeNumber: 1,
});

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;

return <VideoPlayer sources={data?.sources || []} />;
```

### Error Handling Best Practices

```typescript
try {
  const result = await api.anime.searchConsumet.query({ query });
  
  if (!result.success) {
    // tRPC error response
    console.error("API returned error:", result.error);
    showErrorNotification(result.error);
  } else {
    // Success
    setResults(result.results);
  }
} catch (error) {
  // Network or other runtime errors
  console.error("Network error:", error);
  showErrorNotification("Failed to search. Please try again.");
}
```

---

**Next Steps:**
1. Create a search page using `ConsumetSearch` component
2. Add quality selector to video player
3. Implement results caching in Prisma
4. Add keyboard shortcuts for episode selection
