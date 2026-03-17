"use client";

import { useEffect, useCallback, useState } from "react";
import { CheckCircle, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useServerStore, useFilteredServers } from "@/lib/stores/server-store";
import { getAllProvidersInfo } from "@/lib/providers";
import type { AudioType, EpisodeSourceData } from "@/lib/providers/types";

interface ServerSelectorProps {
  episodeId: string;
  onSourcesLoaded: (sources: EpisodeSourceData) => void;
  initialProvider?: string;
  initialAudioType?: AudioType;
}

// Provider-specific colors for visual distinction
const PROVIDER_COLORS: Record<string, string> = {
  zoro: "from-orange-500/20 to-orange-600/10 border-orange-500/30 hover:border-orange-400",
  gogoanime: "from-green-500/20 to-green-600/10 border-green-500/30 hover:border-green-400",
  animepahe: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 hover:border-cyan-400",
};

export function ServerSelector({
  episodeId,
  onSourcesLoaded,
  initialProvider = "zoro",
  initialAudioType = "sub",
}: ServerSelectorProps) {
  const {
    selectedProvider,
    audioType,
    availableServers,
    isLoading,
    error,
    isCheckingServers,
    setSelectedProvider,
    setAudioType,
    setAvailableServers,
    setIsLoading,
    setError,
    setIsCheckingServers,
    setCurrentSources,
    updateServerStatus,
  } = useServerStore();

  const filteredServers = useFilteredServers();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  // Initialize providers list on mount
  useEffect(() => {
    const providers = getAllProvidersInfo();
    setAvailableServers(
      providers.map((p) => ({
        id: p.id,
        name: p.name,
        online: true, // Assume online initially
        supportsDub: p.supportsDub,
      }))
    );
    
    // Set initial values if different from store
    if (initialProvider && selectedProvider !== initialProvider) {
      setSelectedProvider(initialProvider);
    }
    if (initialAudioType && audioType !== initialAudioType) {
      setAudioType(initialAudioType);
    }
  }, []);

  // Check provider status and fetch sources
  const checkProviderAndFetchSources = useCallback(
    async (providerId: string) => {
      setLoadingProvider(providerId);
      setError(null);

      try {
        const response = await fetch(
          `/api/providers/sources?episodeId=${encodeURIComponent(episodeId)}&provider=${providerId}&audioType=${audioType}`
        );

        const data = await response.json();

        if (!data.success) {
          updateServerStatus(providerId, false);
          throw new Error(data.error || "Failed to fetch sources");
        }

        // Mark provider as online and update sources
        updateServerStatus(providerId, true);
        setCurrentSources(data.sources);
        onSourcesLoaded(data.sources);
        setSelectedProvider(providerId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        updateServerStatus(providerId, false);
      } finally {
        setLoadingProvider(null);
      }
    },
    [episodeId, audioType, onSourcesLoaded, setSelectedProvider, setError, setCurrentSources, updateServerStatus]
  );

  // Handle server selection
  const handleServerClick = (providerId: string) => {
    if (loadingProvider) return; // Prevent multiple clicks
    checkProviderAndFetchSources(providerId);
  };

  // Handle audio type change
  const handleAudioTypeChange = (type: AudioType) => {
    setAudioType(type);
    // Re-fetch sources with new audio type if a provider is selected
    if (selectedProvider) {
      checkProviderAndFetchSources(selectedProvider);
    }
  };

  // Refresh all servers
  const handleRefresh = async () => {
    setIsCheckingServers(true);
    setError(null);

    // Reset all servers to checking state
    const providers = getAllProvidersInfo();
    
    // Check each provider in parallel
    const checkPromises = providers.map(async (provider) => {
      try {
        const response = await fetch(`/api/providers/status?provider=${provider.id}`, {
          signal: AbortSignal.timeout(10000),
        });
        const data = await response.json();
        updateServerStatus(provider.id, data.online ?? false);
      } catch {
        updateServerStatus(provider.id, false);
      }
    });

    await Promise.allSettled(checkPromises);
    setIsCheckingServers(false);
  };

  // Auto-fetch sources on initial mount if episodeId is provided
  useEffect(() => {
    if (episodeId && selectedProvider) {
      checkProviderAndFetchSources(selectedProvider);
    }
  }, [episodeId]); // Only run on episodeId change

  return (
    <div className="flex flex-col gap-3">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          Servers
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isCheckingServers}
          className="p-1.5 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          title="Refresh server status"
        >
          <RefreshCw size={14} className={isCheckingServers ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Server Grid */}
      <div className="grid grid-cols-2 gap-2">
        {filteredServers.map((server) => {
          const isSelected = selectedProvider === server.id;
          const isLoadingThis = loadingProvider === server.id;
          const colorClass = PROVIDER_COLORS[server.id] || PROVIDER_COLORS.zoro;

          return (
            <button
              key={server.id}
              onClick={() => handleServerClick(server.id)}
              disabled={isLoadingThis || loadingProvider !== null}
              className={`
                relative flex items-center gap-2 p-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  isSelected
                    ? `bg-gradient-to-br ${colorClass} border text-white`
                    : `bg-surface-base border border-white/5 text-gray-400 hover:bg-white/5 hover:text-white`
                }
                ${isLoadingThis ? "opacity-70" : ""}
                disabled:cursor-not-allowed
              `}
            >
              {/* Status indicator */}
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  server.online ? "bg-green-400" : "bg-gray-500"
                }`}
              />

              {/* Provider name */}
              <span className="truncate">{server.name}</span>

              {/* Loading or selected indicator */}
              {isLoadingThis ? (
                <Loader2 size={14} className="ml-auto animate-spin text-brand-primary" />
              ) : isSelected ? (
                <CheckCircle size={14} className="ml-auto text-brand-primary" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span className="line-clamp-2">{error}</span>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-white/10 my-1" />

      {/* Sub/Dub Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => handleAudioTypeChange("sub")}
          disabled={loadingProvider !== null}
          className={`
            flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all
            ${
              audioType === "sub"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-surface-base text-gray-400 border border-white/10 hover:text-white"
            }
          `}
        >
          SUB
        </button>
        <button
          onClick={() => handleAudioTypeChange("dub")}
          disabled={loadingProvider !== null}
          className={`
            flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all
            ${
              audioType === "dub"
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                : "bg-surface-base text-gray-400 border border-white/10 hover:text-white"
            }
          `}
        >
          DUB
        </button>
      </div>

      {/* Dub warning for providers that don't support it */}
      {audioType === "dub" && availableServers.filter(s => s.supportsDub).length < availableServers.length && (
        <p className="text-xs text-gray-500">
          Some servers only offer subtitled content.
        </p>
      )}
    </div>
  );
}
