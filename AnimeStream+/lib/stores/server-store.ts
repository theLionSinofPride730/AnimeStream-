/**
 * Server Selection Store
 * Manages user's server/provider preferences for anime streaming
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AudioType, ProviderStatus, EpisodeSourceData } from "../providers/types";

interface ServerInfo {
  id: string;
  name: string;
  online: boolean;
  supportsDub: boolean;
}

interface ServerStoreState {
  // Selected provider/server
  selectedProvider: string;
  
  // Audio type preference (sub/dub)
  audioType: AudioType;
  
  // Available servers with their status
  availableServers: ServerInfo[];
  
  // Current sources loaded
  currentSources: EpisodeSourceData | null;
  
  // Loading state
  isLoading: boolean;
  
  // Error state
  error: string | null;
  
  // Whether servers are being fetched
  isCheckingServers: boolean;
}

interface ServerStoreActions {
  // Set the selected provider
  setSelectedProvider: (id: string) => void;
  
  // Set audio type (sub/dub)
  setAudioType: (type: AudioType) => void;
  
  // Set available servers from status check
  setAvailableServers: (servers: ServerInfo[]) => void;
  
  // Update a single server's status
  updateServerStatus: (id: string, online: boolean) => void;
  
  // Set current sources
  setCurrentSources: (sources: EpisodeSourceData | null) => void;
  
  // Set loading state
  setIsLoading: (loading: boolean) => void;
  
  // Set error
  setError: (error: string | null) => void;
  
  // Set checking servers state
  setIsCheckingServers: (checking: boolean) => void;
  
  // Reset to defaults
  reset: () => void;
}

type ServerStore = ServerStoreState & ServerStoreActions;

const DEFAULT_STATE: ServerStoreState = {
  selectedProvider: "hianime",
  audioType: "sub",
  availableServers: [],
  currentSources: null,
  isLoading: false,
  error: null,
  isCheckingServers: false,
};

export const useServerStore = create<ServerStore>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setSelectedProvider: (id) => {
        set({ selectedProvider: id, error: null });
      },

      setAudioType: (type) => {
        set({ audioType: type, error: null });
      },

      setAvailableServers: (servers) => {
        set({ availableServers: servers });
      },

      updateServerStatus: (id, online) => {
        set((state) => ({
          availableServers: state.availableServers.map((server) =>
            server.id === id ? { ...server, online } : server
          ),
        }));
      },

      setCurrentSources: (sources) => {
        set({ currentSources: sources, error: null });
      },

      setIsLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error, isLoading: false });
      },

      setIsCheckingServers: (checking) => {
        set({ isCheckingServers: checking });
      },

      reset: () => {
        set(DEFAULT_STATE);
      },
    }),
    {
      name: "animestream-server-preferences",
      // Only persist user preferences, not runtime state
      partialize: (state) => ({
        selectedProvider: state.selectedProvider,
        audioType: state.audioType,
      }),
    }
  )
);

// Selector hooks for better performance
export const useSelectedProvider = () => useServerStore((state) => state.selectedProvider);
export const useAudioType = () => useServerStore((state) => state.audioType);
export const useAvailableServers = () => useServerStore((state) => state.availableServers);
export const useCurrentSources = () => useServerStore((state) => state.currentSources);
export const useServerLoading = () => useServerStore((state) => state.isLoading);
export const useServerError = () => useServerStore((state) => state.error);

// Helper to get servers that support the current audio type
export const useFilteredServers = () => {
  const servers = useServerStore((state) => state.availableServers);
  const audioType = useServerStore((state) => state.audioType);
  
  if (audioType === "sub") {
    return servers;
  }
  
  // For dub, only show servers that support it
  return servers.filter((server) => server.supportsDub);
};
