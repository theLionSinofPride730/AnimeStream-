## Consumet Integration - Deployment & Configuration Guide

### Environment Configuration

#### Development (.env.local)

No special configuration needed - Consumet API is public and free.

```bash
# .env.local (optional)
# These are defaults, override if needed:
CONSUMET_API_TIMEOUT=10000  # milliseconds
CONSUMET_DEFAULT_PROVIDER=gogoanime
```

#### Production (.env.production)

```bash
# Use same as development, or configure for your deployment:
CONSUMET_API_TIMEOUT=15000  # Allow more time on slower servers
CONSUMET_PROVIDERS=gogoanime,zoro,aniwatch  # Define fallback order
```

### Configuration Options

Add these to `lib/consumet.ts` to make the integration configurable:

```typescript
// At the top of lib/consumet.ts

const CONSUMET_API_URL = process.env.CONSUMET_API_URL || "https://api.consumet.org";
const API_TIMEOUT = parseInt(process.env.CONSUMET_API_TIMEOUT || "10000", 10);
const DEFAULT_PROVIDER = process.env.CONSUMET_DEFAULT_PROVIDER || "gogoanime";

// Update the client initialization:
const client = axios.create({
  baseURL: CONSUMET_API_URL,
  timeout: API_TIMEOUT,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  },
});

// Use in functions:
export async function searchConsumetAnime(
  query: string,
  provider: string = DEFAULT_PROVIDER
) {
  // ... function body
}
```

### Database Schema (Optional Enhancement)

To cache anime/episode IDs and avoid repeated Consumet searches:

```prisma
// Add to prisma/schema.prisma

model ConsumetAnime {
  id        String   @id
  anilistId Int      @unique
  consumetId String   @unique
  title     String
  image     String?
  totalEpisodes Int?
  cachedAt  DateTime @default(now())

  @@index([anilistId])
  @@index([consumetId])
}

model ConsumetEpisodeCache {
  id        String   @id @default(cuid())
  consumetId String
  episodeNum Int
  sources   String   // JSON stringified
  quality   String?
  cachedAt  DateTime @default(now())
  expiresAt DateTime

  @@unique([consumetId, episodeNum])
  @@index([consumetId])
}
```

Run migration:
```bash
npx prisma migrate dev --name add_consumet_cache
```

### Enhanced tRPC Procedures with Caching

```typescript
// server/routers/anime.ts - Enhanced version with database caching

import { prisma } from "@/lib/prisma";

// Cache implementation helper
async function getCachedAnimeId(anilistId: number): Promise<string | null> {
  const cached = await prisma.consumetAnime.findUnique({
    where: { anilistId },
  });
  return cached?.consumetId || null;
}

async function cacheAnimeId(anilistId: number, consumetId: string, title: string) {
  await prisma.consumetAnime.upsert({
    where: { anilistId },
    create: { anilistId, consumetId, title },
    update: { consumetId, title },
  });
}

// Enhanced search with caching
searchConsumetCached: publicProcedure
  .input(z.object({ 
    query: z.string().min(1),
    anilistId: z.number().optional(),
  }))
  .query(async ({ input }) => {
    // Check if we already have this anime cached
    if (input.anilistId) {
      const cached = await getCachedAnimeId(input.anilistId);
      if (cached) {
        return {
          results: [{ id: cached }],
          fromCache: true,
          success: true,
        };
      }
    }

    // Fall back to search
    const response = await searchConsumetAnime(
      toConsumetSearchQuery(input.query)
    );

    if (response.results?.[0] && input.anilistId) {
      await cacheAnimeId(input.anilistId, response.results[0].id, input.query);
    }

    return {
      results: response.results || [],
      fromCache: false,
      success: true,
    };
  }),

// Episode sources with caching
getEpisodeSourcesCached: publicProcedure
  .input(z.object({
    animeId: z.string(),
    episodeNumber: z.number().int().min(1),
  }))
  .query(async ({ input }) => {
    const cacheKey = `${input.animeId}-${input.episodeNumber}`;
    
    // Check cache (valid for 24 hours)
    const cached = await prisma.consumetEpisodeCache.findUnique({
      where: { 
        consumetId_episodeNum: {
          consumetId: input.animeId,
          episodeNum: input.episodeNumber,
        }
      },
    });

    if (cached && cached.expiresAt > new Date()) {
      return {
        sources: JSON.parse(cached.sources),
        fromCache: true,
        success: true,
      };
    }

    // Fetch from Consumet
    const sources = await getEpisodeSourcesWithFallback(
      `${input.animeId}-episode-${input.episodeNumber}`
    );

    // Cache for 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.consumetEpisodeCache.upsert({
      where: { 
        consumetId_episodeNum: {
          consumetId: input.animeId,
          episodeNum: input.episodeNumber,
        }
      },
      create: {
        consumetId: input.animeId,
        episodeNum: input.episodeNumber,
        sources: JSON.stringify(sources.sources),
        expiresAt,
      },
      update: {
        sources: JSON.stringify(sources.sources),
        expiresAt,
      },
    });

    return {
      sources: sources.sources,
      fromCache: false,
      success: true,
    };
  }),
```

### Deployment Checklist

- [ ] Run `npm run build` locally and verify no errors
- [ ] Test streaming on production-like environment
- [ ] Configure timeouts based on your server latency
- [ ] Set up error logging (Sentry/LogRocket recommended)
- [ ] Monitor Consumet API status regularly
- [ ] Plan for API outages (have fallback URLs ready)

### Hosting Platform Specifics

#### Vercel (Next.js Recommended)
- ✅ Works out of the box
- ✅ Serverless functions have 60s timeout (enough for Consumet)
- ⚠️ Axios/HTTP requests work fine in serverless

Configuration for `vercel.json`:
```json
{
  "functions": {
    "app/api/trpc/[trpc]/route.ts": {
      "maxDuration": 60
    }
  }
}
```

#### Netlify
- ✅ Works with Next.js
- ⚠️ Functions limited to 30s (may timeout on slow API)
- Solution: Increase fallback timeout in `lib/consumet.ts`

#### Self-Hosted (Docker)
```dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV CONSUMET_API_TIMEOUT=20000

CMD ["npm", "start"]
```

### Monitoring & Logging

Add structured logging:

```typescript
// lib/logger.ts
export function log(level: "info" | "warn" | "error", msg: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message: msg,
    ...(data && { data }),
  };

  console.log(JSON.stringify(logEntry));

  // Optional: Send to external service (Sentry, LogRocket, etc.)
  // if (level === "error") {
  //   captureException(msg, { extra: data });
  // }
}
```

Use in `lib/consumet.ts`:
```typescript
import { log } from "./logger";

export async function searchConsumetAnime(query: string, provider: string) {
  try {
    log("info", `Searching Consumet: ${query}`, { provider });
    const response = await client.get(`/anime/${provider}/search`, {
      params: { query, page: 1 },
    });
    log("info", `Consumet search success`, { query, resultCount: response.data.results?.length });
    return response.data;
  } catch (error) {
    log("error", `Consumet search failed: ${query}`, { provider, error: String(error) });
    throw error;
  }
}
```

### Performance Monitoring

Track performance with `console.time`:

```typescript
export async function getEpisodeSourcesWithFallback(episodeId: string) {
  const startTime = Date.now();
  
  try {
    const sources = await getConsumetEpisodeSources(episodeId);
    const duration = Date.now() - startTime;
    console.log(`[PERF] Episode fetch: ${episodeId} took ${duration}ms`);
    return sources;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.warn(`[PERF] Episode fetch failed after ${duration}ms`);
    throw error;
  }
}
```

### Rate Limiting

If you experience rate limits from Consumet:

```typescript
// lib/rateLimit.ts
import { RateLimiter } from "limiter";

const limiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: "second",
});

export async function withRateLimit<T>(
  fn: () => Promise<T>
): Promise<T> {
  await limiter.removeTokens(1);
  return fn();
}
```

Use in searches:
```typescript
export async function searchConsumetAnime(query: string) {
  return withRateLimit(() => 
    client.get(`/anime/gogoanime/search`, { params: { query } })
  );
}
```

### fallback URLs & Mirrors

In case primary Consumet API goes down:

```typescript
const CONSUMET_MIRRORS = [
  "https://api.consumet.org",
  "https://consumet-api.herokuapp.com",  // If available
  "https://consumet-proxy.vercel.app",   // If available
];

export async function searchConsumetAnime(query: string, provider: string) {
  for (const baseUrl of CONSUMET_MIRRORS) {
    try {
      const response = await axios.get(`${baseUrl}/anime/${provider}/search`, {
        params: { query, page: 1 },
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      console.warn(`Mirror ${baseUrl} failed, trying next...`);
      continue;
    }
  }
  throw new Error("All Consumet mirrors unavailable");
}
```

### Security Best Practices

1. **Rate Limiting**: Implement to prevent abuse
   ```typescript
   // Limit per IP
   const ipLimiter = new Map<string, number>();
   ```

2. **Input Validation**: Already done with Zod
   ```typescript
   .input(z.object({
     query: z.string().min(1).max(100),  // Max length
     episodeNumber: z.number().int().min(1).max(2000),
   }))
   ```

3. **API key rotation** (if Consumet adds auth):
   ```bash
   CONSUMET_API_KEY=xxx
   CONSUMET_API_SECRET=yyy
   ```

4. **CORS headers** (if needed):
   ```typescript
   // In Next.js route handler
   headers: {
     "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGINS || "*",
   }
   ```

---

### Troubleshooting Deployment

**Issue**: "Error: Failed to search anime"
- Check Consumet API status
- Verify network connectivity from server
- Check firewall/proxy blocking

**Issue**: "Timeout errors"
- Increase `CONSUMET_API_TIMEOUT` environment variable
- Check if your server has slow internet
- Use fallback mirrors

**Issue**: "Memory leaks"
- Check if caching is getting too large
- Implement cache expiration (already in optional DB schema)
- Monitor `node` process memory usage

---

For production readiness:
1. ✅ Error handling
2. ✅ Timeouts configured
3. ✅ Fallback providers
4. ✅ Logging ready
5. ⚠️ Optional: Database caching
6. ⚠️ Optional: Rate limiting
7. ⚠️ Optional: Monitoring/errors
