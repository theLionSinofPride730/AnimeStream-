import { router } from "@/server/trpc";
import { animeRouter } from "@/server/routers/anime";
import { watchlistRouter } from "@/server/routers/watchlist";

export const appRouter = router({
  anime: animeRouter,
  watchlist: watchlistRouter,
});

export type AppRouter = typeof appRouter;
