import { z } from "zod";
import { router, publicProcedure } from "@/server/trpc";
import { getTrendingAnime, getPopularAnime, getSeasonalAnime, getAiringSchedule, searchAnime, createSlug } from "@/lib/anilist";
import { searchConsumetAnime, getEpisodeSourcesWithFallback, toConsumetSearchQuery } from "@/lib/consumet";

export const animeRouter = router({
  // Get trending anime
  getTrending: publicProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const data = await getTrendingAnime(input.page, input.limit);
      return {
        media: data.media.map((anime) => ({
          id: String(anime.id),
          slug: createSlug(anime.title.romaji, anime.id),
          titleEn: anime.title.english,
          titleRomaji: anime.title.romaji,
          titleJp: anime.title.native,
          coverUrl: anime.coverImage.extraLarge || anime.coverImage.large,
          bannerUrl: anime.bannerImage,
          score: anime.averageScore,
          totalEpisodes: anime.episodes,
          status: anime.status,
          type: anime.format,
          year: anime.seasonYear,
          genres: anime.genres?.slice(0, 3),
          anilistId: anime.id,
        })),
        pageInfo: data.pageInfo,
      };
    }),

  // Get popular anime
  getPopular: publicProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const data = await getPopularAnime(input.page, input.limit);
      return {
        media: data.media.map((anime) => ({
          id: String(anime.id),
          slug: createSlug(anime.title.romaji, anime.id),
          titleEn: anime.title.english,
          titleRomaji: anime.title.romaji,
          titleJp: anime.title.native,
          coverUrl: anime.coverImage.extraLarge || anime.coverImage.large,
          bannerUrl: anime.bannerImage,
          score: anime.averageScore,
          totalEpisodes: anime.episodes,
          status: anime.status,
          type: anime.format,
          year: anime.seasonYear,
          genres: anime.genres?.slice(0, 3),
          anilistId: anime.id,
        })),
        pageInfo: data.pageInfo,
      };
    }),

  // Get seasonal anime
  getSeasonal: publicProcedure
    .input(
      z.object({
        season: z.enum(["WINTER", "SPRING", "SUMMER", "FALL"]),
        year: z.number(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const data = await getSeasonalAnime(input.season, input.year, input.page, input.limit);
      return {
        media: data.media.map((anime) => ({
          id: String(anime.id),
          slug: createSlug(anime.title.romaji, anime.id),
          titleEn: anime.title.english,
          titleRomaji: anime.title.romaji,
          titleJp: anime.title.native,
          coverUrl: anime.coverImage.extraLarge || anime.coverImage.large,
          bannerUrl: anime.bannerImage,
          score: anime.averageScore,
          totalEpisodes: anime.episodes,
          status: anime.status,
          type: anime.format,
          year: anime.seasonYear,
          genres: anime.genres?.slice(0, 3),
          anilistId: anime.id,
        })),
        pageInfo: data.pageInfo,
      };
    }),

  // Search for anime by name
  search: publicProcedure
    .input(z.object({ query: z.string().min(1), page: z.number().default(1), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const data = await searchAnime(input.query, input.page, input.limit);
      return {
        media: data.media.map((anime) => ({
          id: String(anime.id),
          slug: createSlug(anime.title.romaji, anime.id),
          titleEn: anime.title.english,
          titleRomaji: anime.title.romaji,
          titleJp: anime.title.native,
          coverUrl: anime.coverImage.extraLarge || anime.coverImage.large,
          bannerUrl: anime.bannerImage,
          score: anime.averageScore,
          totalEpisodes: anime.episodes,
          status: anime.status,
          type: anime.format,
          year: anime.seasonYear,
          genres: anime.genres?.slice(0, 3),
          anilistId: anime.id,
        })),
        pageInfo: data.pageInfo,
      };
    }),

  // Get airing schedule
  getAiringSchedule: publicProcedure.query(async () => {
    const schedule = await getAiringSchedule();
    return schedule.slice(0, 30).map((item) => ({
      animeTitle: item.media.title.english || item.media.title.romaji,
      animeSlug: createSlug(item.media.title.romaji, item.media.id),
      coverUrl: item.media.coverImage.large || undefined,
      episode: item.episode,
      airingAt: item.airingAt,
      dayOfWeek: new Date(item.airingAt * 1000).toLocaleDateString("en-US", { weekday: "long" }),
    }));
  }),

  /**
   * Search for anime on Consumet (for streaming)
   * Returns anime IDs needed to fetch episodes
   */
  searchConsumet: publicProcedure
    .input(z.object({ query: z.string().min(1).max(100) }))
    .query(async ({ input }) => {
      try {
        const searchQuery = toConsumetSearchQuery(input.query);
        const response = await searchConsumetAnime(searchQuery);
        
        return {
          results: (response.results || []).map((anime: any) => ({
            id: anime.id,
            title: anime.title,
            image: anime.image,
            totalEpisodes: anime.totalEpisodes || 0,
          })),
          success: true,
        };
      } catch (error) {
        console.error("Consumet search error:", error);
        return {
          results: [],
          success: false,
          error: error instanceof Error ? error.message : "Failed to search anime",
        };
      }
    }),

  /**
   * Get episode sources from Consumet
   * Returns streaming URLs for a specific episode
   * @param animeId - Consumet anime ID (from search)
   * @param episodeNumber - Episode number (1, 2, 3, etc)
   */
  getEpisodeSources: publicProcedure
    .input(
      z.object({
        animeId: z.string().min(1),
        episodeNumber: z.number().int().min(1),
      })
    )
    .query(async ({ input }) => {
      try {
        // Format episode ID for Consumet: "anime-id-episode-X"
        const episodeId = `${input.animeId}-episode-${input.episodeNumber}`;
        
        const sources = await getEpisodeSourcesWithFallback(episodeId);

        if (!sources.sources || sources.sources.length === 0) {
          return {
            success: false,
            error: "No sources found for this episode",
            sources: [],
          };
        }

        return {
          success: true,
          sources: sources.sources.map((source) => ({
            url: source.url,
            quality: source.quality || "Unknown",
            isM3U8: source.isM3U8,
          })),
          intro: sources.intro,
          outro: sources.outro,
          subtitles: sources.subtitles,
        };
      } catch (error) {
        console.error("Episode source fetch error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to fetch episode sources",
          sources: [],
        };
      }
    }),
});
