## Consumet API Integration Guide

This guide explains how the anime streaming integration works with the Consumet API.

### Architecture Overview

```
Frontend (Next.js) 
    ↓
tRPC Backend Routes
    ↓
Consumet API (Gogoanime/Zoro/Aniwatch providers)
    ↓
HLS Streams to Video Player (Vidstack)
```

### Files Modified

1. **`lib/consumet.ts`** - New Consumet API client library
   - `searchConsumetAnime()` - Search anime by title
   - `getConsumetEpisodeSources()` - Fetch streaming URLs
   - `getEpisodeSourcesWithFallback()` - Try multiple providers for fallback

2. **`server/routers/anime.ts`** - Extended tRPC procedures
   - `searchConsumet` - Search endpoint (tRPC)
   - `getEpisodeSources` - Get episode streaming sources (tRPC)

3. **`app/anime/[slug]/watch/[ep]/page.tsx`** - Updated watch page
   - Replaced mock API with real Consumet fetches
   - Integrated intro/outro skip times from Consumet

### How It Works

#### Flow for Playing an Episode

1. User lands on `watch` page with anime title and episode number
2. Page calls `getVideoSources()` which:
   - Searches Consumet for the anime by title
   - Gets the anime ID (e.g., "one-piece")
   - Fetches episode sources with fallback to multiple providers
   - Returns streaming URLs for video player

3. VideoPlayer (Vidstack) receives sources and plays the episode
4. If Consumet fails, fallback placeholder URL is used

#### Search Flow (for future implementation)

```typescript
// Client-side search
const results = await client.anime.searchConsumet.query({ query: "One Piece" });
// Returns: [
//   { id: "one-piece", title: "One Piece", image: "...", totalEpisodes: 1000 }
// ]

// Then fetch episode
const sources = await client.anime.getEpisodeSources.query({
  animeId: "one-piece",
  episodeNumber: 1
});
// Returns: { 
//   sources: [{ url: "https://...", quality: "1080p", isM3U8: true }],
//   intro: { start: 0, end: 90 },
//   outro: { start: 1300, end: 1360 }
// }
```

### Testing Steps

#### Test 1: Watch "One Piece" Episode 1
1. Navigate to the anime details page for "One Piece"
2. Click "Watch Episode 1"
3. Should load real streaming URL from Consumet
4. Video should play in Vidstack player
5. Check browser DevTools Console for logs:
   ```
   Found Consumet anime: One Piece -> one-piece
   Success with provider: gogoanime
   ```

#### Test 2: Test Multiple Episodes
1. Start Episode 1, play for a few seconds
2. Click "Next EP" button or select Episode 2 from panel
3. Should fetch Episode 2 sources from Consumet
4. Video should switch seamlessly

#### Test 3: Check Fallback Providers
1. Enable DevTools to inspect Network tab
2. Watch console logs to see which provider succeeded
3. Providers try in order: Gogoanime → Zoro → Aniwatch
4. If primary fails, secondary should kick in

#### Test 4: Desktop vs Mobile
1. Test on desktop (fullscreen player works)
2. Test on mobile (responsive player, episode list sidebar)
3. Verify episode navigation works on both

### Expected Behavior

**Success Case:**
- Video loads and plays immediately
- Console shows: `Found Consumet anime: [title] -> [id]`
- Episode numbers and duration display correctly
- Next episode navigation works

**Fallback Case (if primary provider fails):**
- App tries next provider automatically
- Takes longer (5-10 seconds)
- Still plays video from fallback provider
- Console shows which provider succeeded

**Error Case:**
- If ALL providers fail, placeholder URL shown
- Placeholder won't play but shows in UI
- Check console for error details
- Likely causes: API rate limits, network issues, anime not on platform

### Troubleshooting

#### "No Consumet results found"
- **Cause**: Anime title mismatch or anime not on Consumet provider
- **Fix**: 
  - Try exact Japanese title
  - Check if anime is on Gogoanime/Zoro websites
  - Enable console logs to see search query

#### "No sources found for this episode"
- **Cause**: Episode not available on any provider
- **Fix**:
  - Check if episode has aired
  - Try different episode number
  - Some providers may not have all episodes

#### CORS Errors in Browser Console
- **Cause**: Browser blocked direct Consumet API calls (shouldn't happen with server-side fetch)
- **Fix**: Ensure fetches happen from Next.js server, not client

#### Slow Load Times (>10 seconds)
- **Cause**: Fallback providers are being tried sequentially
- **Fix**: 
  - Check API status: https://api.consumet.org/
  - Increase timeout in `lib/consumet.ts:`
    ```typescript
    const client = axios.create({
      timeout: 15000, // Increase to 15s
    });
    ```

### API Changes & Monitoring

**Monitor These Consumet Endpoints:**
```bash
# Ping to check API status
curl https://api.consumet.org/

# Search endpoint
curl "https://api.consumet.org/anime/gogoanime/search?query=One%20Piece"

# Episode endpoint
curl "https://api.consumet.org/anime/gogoanime/watch?episodeId=one-piece-episode-1"
```

### Performance Optimization (Future)

1. **Cache anime/episode metadata** in Prisma:
   ```typescript
   // Store Consumet IDs in database after first search
   const cachedAnime = await prisma.animeConsumetCache.findUnique({
     where: { anilistId: animeId }
   });
   ```

2. **Parallel source fetching** for faster load:
   ```typescript
   // Try multiple providers in parallel instead of sequentially
   const [gogoanime, zoro, aniwatch] = await Promise.allSettled([
     getConsumetEpisodeSources(episodeId, "gogoanime"),
     getConsumetEpisodeSources(episodeId, "zoro"),
     getConsumetEpisodeSources(episodeId, "aniwatch"),
   ]);
   ```

3. **Client-side caching** with React Query:
   - Already have React Query setup in `lib/trpc-client.tsx`
   - tRPC queries auto-cache, no additional config needed

### Security Notes

✅ All API calls proxied through Next.js backend (no direct browser calls)
✅ User-Agent header set to avoid API blocking
✅ Timeouts configured to prevent hanging
✅ Error messages don't expose internal details

### Next Steps

1. ✅ Basic Consumet integration complete
2. 📋 Optional: Add anime search UI component
3. 📋 Optional: Cache anime/episode IDs in Prisma
4. 📋 Optional: Add quality selection dropdown
5. 📋 Optional: Add subtitle support UI

---

For issues or updates, check:
- Consumet API Status: https://api.consumet.org/
- GitHub: https://github.com/consumet/consumet.ts
