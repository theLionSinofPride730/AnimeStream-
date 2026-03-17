# 👨‍💻 AnimeStream+ Developer Guide

Complete guide for developers working on the AnimeStream+ codebase.

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Next.js 16 Application                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐         ┌──────────────────────┐  │
│  │  React Pages    │────────▶│  tRPC API Routes     │  │
│  │  & Components   │         │  (Type-Safe RPC)     │  │
│  └─────────────────┘         └──────────────────────┘  │
│         │                            │                 │
│         │                            ▼                 │
│         │                    ┌──────────────────────┐  │
│         │                    │   Prisma Database    │  │
│         │                    │       Client         │  │
│         │                    └──────────────────────┘  │
│         │                            │                 │
│         │                            ▼                 │
│         │                    ┌──────────────────────┐  │
│         │                    │  PostgreSQL / SQLite │  │
│         │                    │      Database        │  │
│         │                    └──────────────────────┘  │
│         │                                              │
│         ▼                                              │
│  ┌──────────────────────────────────────────────────┐ │
│  │         External APIs                            │ │
│  │  - AniList GraphQL API                          │ │
│  │  - Video Streaming Providers (future)           │ │
│  └──────────────────────────────────────────────────┘ │
│                                                       │
└─────────────────────────────────────────────────────────┘
```

## 📁 Directory Guide

### `/app` - Next.js App Directory

```
app/
├── api/
│   └── trpc/
│       └── [trpc]/
│           └── route.ts           # tRPC API handler
├── anime/
│   └── [slug]/
│       ├── page.tsx               # Anime detail page
│       └── watch/[ep]/
│           └── page.tsx           # Video player page
├── genre/
│   └── [slug]/
│       └── page.tsx               # Genre browse page
├── schedule/
│   └── page.tsx                   # Airing schedule page
├── search/
│   └── page.tsx                   # Search interface
├── layout.tsx                     # Root layout
├── page.tsx                       # Home page
├── globals.css                    # Global styles
└── providers.tsx                  # React context providers
```

### `/components` - React Components

```
components/
├── anime/
│   ├── AnimeCard.tsx              # Individual anime card with hover
│   └── AnimeCarousel.tsx          # Horizontal scrolling carousel
├── home/
│   ├── HeroBanner.tsx             # Auto-rotating featured anime
│   ├── GenreGrid.tsx              # 16 genre selection grid
│   └── SchedulePreview.tsx        # Weekly schedule preview
├── layout/
│   ├── Navbar.tsx                 # Top glassmorphic navigation
│   └── MobileNav.tsx              # Bottom mobile navigation
└── player/
    ├── VideoPlayer.tsx            # HLS video player
    ├── NextEpisodeCard.tsx        # Auto-play next episode
    └── FullscreenScrollPanel.tsx  # Fullscreen UI panel
```

### `/lib` - Utilities & Clients

```
lib/
├── anilist.ts                     # AniList GraphQL integration
│   ├── interface AniListAnime
│   ├── getTrendingAnime()
│   ├── getPopularAnime()
│   ├── getSeasonalAnime()
│   ├── searchAnime()
│   ├── getAiringSchedule()
│   └── + 10 more functions
├── prisma.ts                      # Prisma client singleton
├── trpc.ts                        # tRPC client creation
├── trpc-client.tsx                # tRPC client config
└── cn.ts                          # clsx + tailwind-merge utility
```

### `/server` - Backend Code

```
server/
├── trpc.ts                        # tRPC initialization
│   ├── createTRPCContext()
│   ├── router (t.router)
│   ├── publicProcedure (t.procedure)
│   └── protectedProcedure (auth middleware)
└── routers/
    ├── index.ts                   # Router aggregation
    ├── anime.ts                   # Anime query procedures
    │   ├── getTrending
    │   ├── getPopular
    │   ├── getSeasonal
    │   ├── search
    │   └── getAiringSchedule
    └── watchlist.ts               # Watchlist mutations
        ├── add()
        ├── remove()
        ├── updateStatus()
        └── getWatchlist()
```

### `/prisma` - Database

```
prisma/
├── schema.prisma                  # Prisma schema
│   ├── generator client
│   ├── datasource db
│   ├── model Anime
│   ├── model Episode
│   ├── model User
│   └── + 7 more models
└── dev.db                         # SQLite database (created on first run)
```

## 🔄 Data Flow

### Example: User Searches for Anime

```
1. User Types in Search Box
   └─ React State Updated (debounced)

2. Component Calls tRPC
   └─ trpc.anime.search.useQuery({ query: "Jujutsu" })

3. tRPC Client Sends HTTP Request
   └─ POST /api/trpc/anime.search
      input: { query: "Jujutsu", page: 1 }

4. Backend Process
   └─ Server receives request
      └─ anime router anime.search procedure activated
         └─ Calls searchAnime() from lib/anilist.ts
            └─ Makes GraphQL request to AniList API

5. AniList API Response
   └─ Returns GraphQL response with anime data
   └─ Transformed to AnimeCardData format

6. Response Sent to Client
   └─ Returns via tRPC
   └─ React Query caches the result

7. UI Update
   └─ Component receives data
   └─ Maps to AnimeCard components
   └─ Renders on screen
```

## 🏗️ Adding a New Feature

### Step 1: Add Database Model (if needed)

File: `prisma/schema.prisma`
```prisma
model MyNewModel {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
}
```

Then migrate:
```bash
npx prisma migrate dev --name add_my_new_model
```

### Step 2: Create API Route

File: `server/routers/mynew.ts`
```typescript
import { z } from "zod"
import { router, publicProcedure } from "@/server/trpc"

export const myNewRouter = router({
  getAll: publicProcedure
    .query(async ({ ctx }) => {
      return await ctx.prisma.myNewModel.findMany()
    }),
    
  create: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.myNewModel.create({
        data: input
      })
    })
})
```

### Step 3: Add Router to Aggregation

File: `server/routers/index.ts`
```typescript
import { myNewRouter } from "@/server/routers/mynew"

export const appRouter = router({
  anime: animeRouter,
  watchlist: watchlistRouter,
  mynew: myNewRouter, // Add here
})
```

### Step 4: Create Component

File: `components/mynew/MyNewComponent.tsx`
```typescript
"use client"

import { trpc } from "@/lib/trpc"

export function MyNewComponent() {
  const { data } = trpc.mynew.getAll.useQuery()
  
  return (
    <div>
      {data?.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}
```

### Step 5: Use in Page

File: `app/mynew/page.tsx`
```typescript
import { MyNewComponent } from "@/components/mynew/MyNewComponent"

export default function MyNewPage() {
  return <MyNewComponent />
}
```

## 🔧 Common Development Tasks

### Adding a New API Endpoint

```typescript
// In server/routers/anime.ts
export const animeRouter = router({
  // ... existing endpoints
  
  myNewEndpoint: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // Your logic here
      return result
    })
})
```

### Using tRPC in Components

```typescript
"use client"

import { trpc } from "@/lib/trpc"

export function MyComponent() {
  // Query
  const { data, isLoading } = trpc.anime.getTrending.useQuery({
    page: 1
  })
  
  // Mutation
  const { mutate } = trpc.watchlist.add.useMutation({
    onSuccess: () => alert("Added!")
  })
  
  return (
    <button onClick={() => mutate({ animeId: "123" })}>
      Add to Watchlist
    </button>
  )
}
```

### Database Queries with Prisma

```typescript
// Find single
const anime = await prisma.anime.findUnique({
  where: { id: "123" }
})

// Find many
const trending = await prisma.anime.findMany({
  where: { status: "ONGOING" },
  orderBy: { score: "desc" },
  take: 20
})

// Create
const newAnime = await prisma.anime.create({
  data: {
    slug: "my-anime",
    titleRomaji: "My Anime"
  }
})

// Update
const updated = await prisma.anime.update({
  where: { id: "123" },
  data: { score: 8.5 }
})

// Delete
await prisma.anime.delete({
  where: { id: "123" }
})
```

## 📋 Code Standards

### TypeScript
- Use strict mode (`"strict": true`)
- Define all function return types
- Export interfaces for component props
- Avoid `any` types

### Components
- Use `"use client"` for interactive components
- Use `async` for server-side fetching
- Subscribe to tRPC queries, not raw fetches
- Always provide loading/error states

### API Routes
- Validate input with Zod
- Return consistent response shapes
- Handle errors gracefully
- Log important operations

### File Naming
- Components: `PascalCase` (e.g., `AnimeCard.tsx`)
- Files: `kebab-case` unless exporting component
- Pages: `page.tsx` or `layout.tsx`
- Routes: `[brackets]` for dynamic segments

## 🧪 Testing Guide

### Unit Test Example
```typescript
// components/__tests__/AnimeCard.test.tsx
import { render, screen } from "@testing-library/react"
import { AnimeCard } from "../AnimeCard"

describe("AnimeCard", () => {
  it("renders anime title", () => {
    const anime = {
      id: "1",
      titleRomaji: "Test Anime",
      // ... other props
    }
    
    render(<AnimeCard anime={anime} />)
    expect(screen.getByText("Test Anime")).toBeInTheDocument()
  })
})
```

### API Test Example
```typescript
// server/routers/__tests__/anime.test.ts
import { createTRPCMsw } from "@trpc/next"

describe("anime router", () => {
  it("getTrending returns anime list", async () => {
    const result = await animeRouter.createCaller({
      // mock context
    }).getTrending({ page: 1 })
    
    expect(result.media).toBeDefined()
  })
})
```

## 🎨 Styling Guide

### Using Tailwind CSS
```tsx
<div className="p-4 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-colors">
  Content
</div>
```

### Using Custom CSS Variables
```tsx
<div style={{
  background: "var(--color-surface-elevated)",
  color: "var(--color-text-primary)"
}}>
  Content
</div>
```

## 🐛 Debugging

### Using Browser DevTools
```typescript
// Add to any component
console.log("data:", data)
debugger // Breaks execution
```

### Using React Query DevTools
```typescript
// Already included in providers.tsx
// Open at bottom of page in development
```

### Using Prisma Studio
```bash
npx prisma studio
# Opens at http://localhost:5555
```

## 🚀 Performance Tips

### Lazy Load Components
```typescript
import dynamic from "next/dynamic"

const HeavyComponent = dynamic(
  () => import("./HeavyComponent"),
  { loading: () => <div>Loading...</div> }
)
```

### Use React Query Caching
```typescript
const { data } = trpc.anime.getTrending.useQuery(
  { page: 1 },
  { staleTime: 1000 * 60 * 5 } // 5 minutes
)
```

### Image Optimization
```tsx
import Image from "next/image"

<Image
  src={url}
  alt="description"
  width={200}
  height={300}
  loading="lazy"
/>
```

## 📚 Documentation Standards

### Comment Complex Logic
```typescript
// Calculate trending score based on popularity and recency
const trendingScore = (popularity * 0.7) + (recentViews * 0.3)
```

### Document Public Functions
```typescript
/**
 * Fetches trending anime from AniList API
 * @param page - Page number (1-indexed)
 * @param limit - Items per page (max 50)
 * @returns Promise with anime list and pagination info
 */
export async function getTrendingAnime(page = 1, limit = 20) {
  // ...
}
```

## 🔒 Security Checklist

- [ ] Input validation with Zod
- [ ] No secrets in code
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Error messages don't leak info
- [ ] Database queries use Prisma
- [ ] XSS prevention
- [ ] CSRF tokens if needed

## 📦 Dependencies Guide

### When Adding Dependencies
1. Check if it's really needed
2. Choose community-standard packages
3. Verify active maintenance
4. Check bundle size impact
5. Update lock file: `npm install`

### Updating Dependencies
```bash
# Check outdated
npm outdated

# Update safely
npm update

# Major version update
npm install package@latest

# Security fix
npm audit fix
```

## 🎯 Development Checklist Before Commit

- [ ] Code follows style guide
- [ ] No `console.log` statements
- [ ] All types properly defined
- [ ] Components have proper error handling
- [ ] Tests pass (when added)
- [ ] No breaking changes to API
- [ ] Documentation updated
- [ ] Git commit message is clear

## 🚀 Release Process

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push and create PR
git push origin feature/new-feature

# 4. After review, merge to main
# 5. Automatic deploy triggered on main push
```

## 💡 Pro Tips

1. **Use TypeScript Strict Mode** - Catches more errors
2. **Subscribe to tRPC, not raw fetches** - Better caching
3. **Validate all inputs** - Security and reliability
4. **Lazy load heavy components** - Better performance
5. **Cache expensive queries** - Reduced server load

## 🎓 Learning Resources

- [Next.js Docs](https://nextjs.org/docs)
- [tRPC Docs](https://trpc.io/docs)
- [Prisma Docs](https://prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [React Documentation](https://react.dev)

---

**Happy coding! 💻**
