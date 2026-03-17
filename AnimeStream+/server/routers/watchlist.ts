import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "@/server/trpc";

export const watchlistRouter = router({
  // Add anime to watchlist (stub - requires auth)
  add: publicProcedure
    .input(
      z.object({
        animeId: z.string(),
        status: z.enum(["WATCHING", "COMPLETED", "PLAN_TO_WATCH", "DROPPED", "ON_HOLD"]).default("PLAN_TO_WATCH"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // This would require authentication in a real app
      // For now, we return a placeholder that can be updated later
      return {
        success: true,
        message: "Anime added to watchlist",
        animeId: input.animeId,
        status: input.status,
      };
    }),

  // Remove anime from watchlist
  remove: publicProcedure
    .input(z.object({ animeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        message: "Anime removed from watchlist",
        animeId: input.animeId,
      };
    }),

  // Update watchlist status
  updateStatus: publicProcedure
    .input(
      z.object({
        animeId: z.string(),
        status: z.enum(["WATCHING", "COMPLETED", "PLAN_TO_WATCH", "DROPPED", "ON_HOLD"]),
        rating: z.number().min(1).max(10).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        message: "Watchlist updated",
        animeId: input.animeId,
        status: input.status,
        rating: input.rating,
      };
    }),

  // Get user's watchlist (stub)
  getWatchlist: publicProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      // Would fetch from database with real auth
      return {
        watchlist: [],
        total: 0,
      };
    }),
});
