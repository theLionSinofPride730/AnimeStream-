## Consumet Integration - Architecture Diagrams

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AnimeStream+ Frontend (React)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Watch Page (/anime/[slug]/watch/[ep])                              │
│  ├─ Uses AniList for metadata (title, cover, etc)                   │
│  ├─ Calls getVideoSources() at page render                          │
│  └─ Passes sources to VideoPlayer component                         │
│                                                                       │
│  VideoPlayer (Vidstack)                                             │
│  ├─ Receives HLS stream URL from server                             │
│  ├─ Renders video with controls                                     │
│  ├─ Shows skip intro/outro buttons                                  │
│  └─ Handles fullscreen and quality selection                        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                   ↓
                        (tRPC over HTTP)
                                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      Next.js Backend (tRPC)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  tRPC Procedures (server/routers/anime.ts)                          │
│  ├─ searchConsumet()       → lib/consumet.ts                        │
│  └─ getEpisodeSources()    → lib/consumet.ts                        │
│                                                                       │
│  Consumet Client (lib/consumet.ts)                                  │
│  ├─ searchConsumetAnime()                                           │
│  ├─ getConsumetEpisodeSources()                                     │
│  └─ getEpisodeSourcesWithFallback()                                 │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                   ↓
                      (HTTPS to public Consumet API)
                                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        Consumet API Providers                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Try in order (fallback):                                           │
│  1️⃣  Gogoanime   (https://api.consumet.org/anime/gogoanime/...)     │
│  2️⃣  Zoro       (https://api.consumet.org/anime/zoro/...)          │
│  3️⃣  Aniwatch   (https://api.consumet.org/anime/aniwatch/...)      │
│                                                                       │
│  Each provider returns:                                             │
│  - Anime ID (e.g., "one-piece")                                     │
│  - Episode streaming URLs (HLS .m3u8 format)                        │
│  - Skip intro/outro timestamps                                      │
│  - Available quality options                                        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                   ↓
                    (HLS streams hosted by CDNs)
                                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         Video CDNs & Hosts                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Streaming sources provided by Gogoanime/Zoro/Aniwatch:            │
│  - Mux, Cdn, Betterstream, Vidstream, etc.                         │
│  - HLS playlists (.m3u8) with multiple quality variants            │
│  - Adaptive bitrate streaming (auto quality selection)             │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Data Flow for Playing an Episode

```
User clicks "Watch Episode 1"
        │
        ↓
┌─────────────────────────────────────┐
│ Watch Page Renders                  │
│ - UUID: one-piece-XXXXX             │
│ - Episode: 1                        │
│ - Title: "One Piece"                │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│ getVideoSources() called            │
│  Step 1: Prepare search query       │
│  Input: "One Piece"                 │
│  Output: "one piece" (normalized)   │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│ searchConsumetAnime()               │
│  (Try Gogoanime provider)           │
│                                     │
│  GET /anime/gogoanime/search        │
│    ?query=one+piece                 │
│                                     │
│  RESPONSE:                          │
│  {                                  │
│    results: [                       │
│      {                              │
│        id: "one-piece",             │
│        title: "One Piece",          │
│        image: "...",                │
│        totalEpisodes: 1044          │
│      }                              │
│    ]                                │
│  }                                  │
└────────────┬────────────────────────┘
             │ Found! Use ID: "one-piece"
             ↓
┌─────────────────────────────────────┐
│ getEpisodeSourcesWithFallback()     │
│  Step 2: Format episode ID          │
│  Input: animeId="one-piece",        │
│         episodeNum=1                │
│  Output: "one-piece-episode-1"      │
└────────────┬────────────────────────┘
             │
             ↓
     ┌───────────────────┐
     │ Try Provider #1   │
     │ (Gogoanime)       │
     └───────┬───────────┘
             │
             ↓
┌─────────────────────────────────────┐
│ getConsumetEpisodeSources()         │
│  (Request episode from Gogoanime)   │
│                                     │
│ GET /anime/gogoanime/watch          │
│  ?episodeId=one-piece-episode-1     │
│                                     │
│ RESPONSE:                           │
│ {                                   │
│   sources: [                        │
│     {                               │
│       url: "https://cdn1.../m3u8",  │
│       quality: "1080p"              │
│     },                              │
│     {                               │
│       url: "https://cdn2.../m3u8",  │
│       quality: "720p"               │
│     }                               │
│   ],                                │
│   intro: { start: 0, end: 90 },     │
│   outro: { start: 1300, end: 1420 },│
│   subtitles: [...]                  │
│ }                                   │
└────────────┬────────────────────────┘
             │ ✅ Success! Return sources
             ↓
┌─────────────────────────────────────┐
│ Format Response                     │
│                                     │
│ Return to Watch Page:               │
│ {                                   │
│   sources: [                        │
│     { quality: "1080p",             │
│       url: "https://...",           │
│       isM3U8: true },               │
│     { quality: "720p",              │
│       url: "https://...",           │
│       isM3U8: true }                │
│   ],                                │
│   intro: { start: 0, end: 90 },     │
│   outro: { start: 1300, end: 1420 } │
│ }                                   │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│ VideoPlayer Component               │
│  - Receives sources array           │
│  - Defaults to 1080p (if available) │
│  - Sets up skip buttons (intro/outro)│
│  - Player loads HLS stream          │
└────────────┬────────────────────────┘
             │
             ↓
     ┌──────────────────┐
     │  ▶️ VIDEO PLAYS  │
     │  (HLS streaming) │
     └──────────────────┘
```

---

### Fallback Flow (If Primary Provider Fails)

```
┌─ Try Gogoanime ─┐
│    TIMEOUT      │
│    or ERROR     │
└────────┬────────┘
         │ ❌ Failed
         ↓
        ┌───────────────────┐
        │ Log: "Gogoanime   │
        │ failed, trying    │
        │ Zoro..."          │
        └────────┬──────────┘
                 │
                 ↓
  ┌─ Try Zoro (Provider #2) ─┐
  │                           │
  │ GET /anime/zoro/watch ... │
  │                           │
  ├─ SUCCESS ✅               │
  │   Return sources          │
  │   (Skip to VideoPlayer)   │
  │                           │
  │ FAILURE ❌                │
  │   Try next provider       │
  └────────┬──────────────────┘
           │
           ↓
    ┌─ Try Aniwatch (Provider #3) ─┐
    │                               │
    │ GET /anime/aniwatch/watch ... │
    │                               │
    ├─ SUCCESS ✅                   │
    │   Return sources              │
    │   (Skip to VideoPlayer)       │
    │                               │
    │ FAILURE ❌                    │
    │   All providers failed        │
    └────────┬──────────────────────┘
             │
             ↓
    ┌─────────────────────────┐
    │ Return Error + Use      │
    │ Fallback Placeholder    │
    │                         │
    │ Show message:           │
    │ "Episode not available  │
    │  on selected providers" │
    │                         │
    │ Play test stream instead│
    └─────────────────────────┘
```

---

### Error Handling Paths

```
┌──────────────────────────────────────────────────────────────┐
│                    Get Video Sources                          │
└──────┬───────────────────────────────────────────────────────┘
       │
       ├─ Search fails              ──→ "No anime found"
       │                               Try different search query
       │
       ├─ Episode doesn't exist     ──→ "Episode not available"
       │                               Check episode number
       │
       ├─ All providers timeout     ──→ "Slow API, retrying..."
       │                               Increase timeout
       │
       ├─ Network error             ──→ "Check connection"
       │                               Retry or offline mode
       │
       ├─ API rate limited          ──→ "API busy, retry later"
       │                               Wait and try again
       │
       └─ Success! ✅               ──→ Play video


┌──────────────────────────────────────────────────────────────┐
│                    Video Playback Errors                      │
└──────┬───────────────────────────────────────────────────────┘
       │
       ├─ HLS invalid/corrupted     ──→ Player shows error
       │                               Try different quality
       │
       ├─ Stream restricted/blocked ──→ Geo-blocking detected
       │                               Try VPN if needed
       │
       ├─ Subtitle encoding error   ──→ Disable subtitles
       │                               Try auto-translate
       │
       └─ Player bug                ──→ Refresh page
                                        Try different browser
```

---

### Request/Response Examples

#### Example 1: Search Request & Response

```javascript
// REQUEST
GET https://api.consumet.org/anime/gogoanime/search?query=one+piece

Headers:
  User-Agent: Mozilla/5.0...
  Timeout: 10000ms

// RESPONSE (200 OK)
{
  "results": [
    {
      "id": "one-piece",
      "title": "One Piece",
      "image": "https://image-cdn.com/one-piece.jpg",
      "releaseDate": "1999",
      "totalEpisodes": 1044
    },
    {
      "id": "one-piece-episode-of-luffy",
      "title": "One Piece: Episode of Luffy",
      "image": "...",
      "releaseDate": "2010",
      "totalEpisodes": 1
    },
    ...
  ],
  "hasNextPage": true
}

// STATUS: Found! Use: results[0].id = "one-piece"
```

#### Example 2: Episode Source Request & Response

```javascript
// REQUEST
GET https://api.consumet.org/anime/gogoanime/watch?episodeId=one-piece-episode-1

Headers:
  User-Agent: Mozilla/5.0...
  Timeout: 10000ms

// RESPONSE (200 OK)
{
  "sources": [
    {
      "url": "https://cdn-v1.mux.delivery/one-piece-ep1.m3u8",
      "quality": "1080p",
      "isM3U8": true
    },
    {
      "url": "https://cdn-v2.mux.delivery/one-piece-ep1.m3u8",
      "quality": "720p",
      "isM3U8": true
    },
    {
      "url": "https://cdn-v3.mux.delivery/one-piece-ep1.m3u8",
      "quality": "480p",
      "isM3U8": true
    }
  ],
  "intro": {
    "start": 0,
    "end": 94
  },
  "outro": {
    "start": 1316,
    "end": 1380
  },
  "subtitles": [
    {
      "lang": "English",
      "url": "https://cdn-v1.mux.delivery/one-piece-ep1-en.vtt"
    },
    {
      "lang": "Spanish",
      "url": "https://cdn-v1.mux.delivery/one-piece-ep1-es.vtt"
    }
  ]
}

// STATUS: Got 3 sources! Player will use HLS protocol
// Uses first 1080p stream by default
// Shows skip buttons at 0:00-1:34 (intro) and 21:56-23:00 (outro)
```

---

### Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   Watch Page (Server Component)                  │
│                                                                  │
│  1. Gets AniList anime data                                     │
│  2. Calls getVideoSources(title, episode)                       │
│  3. Returns sources or fallback                                 │
└─────────────────────┬───────────────────────────────────────────┘
                     │
                     │ Props: sources, skipTimes, episode data
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                   VideoPlayer (Client Component)                 │
│                                                                  │
│  @vidstack/react MediaPlayer                                    │
│  ├─ Handles video playback                                      │
│  ├─ Manages quality selection                                   │
│  ├─ Renders skip buttons for intro/outro                        │
│  └─ Shows next episode card at end                              │
│                                                                  │
│  Sub-components:                                                │
│  ├─ NextEpisodeCard (shows at 90 sec before end)               │
│  ├─ FullscreenScrollPanel (episode & info in fullscreen)       │
│  └─ Quality Selector (dropdown for 1080p/720p/480p)            │
└─────────────────────────────────────────────────────────────────┘
```

---

### Performance Timeline

```
Load Watch Page
    │
    ├─ 0ms    ─ Ask for AniList data (parallel)
    │         ─ Ask for video sources
    │
    ├─ 100ms  ─ AniList returns (cover, title, etc)
    │
    ├─ 500ms  ─ Start Consumet search
    │
    ├─ 1.5s   ─ Found anime ID on Consumet
    │
    ├─ 2-3s   ─ Fetch episode sources from Gogoanime
    │
    ├─ 3.5s   ─ Got sources + skip times
    │
    ├─ 4s     ─ VideoPlayer renders with sources
    │
    ├─ 4.5s   ─ HLS playlist loads
    │
    └─ 5.5s   ─ ▶️ VIDEO STARTS PLAYING
    
    (If Gogoanime fails, add 3-5s more for fallback retry)
```

---

### Cache Layer (Optional, for Production)

```
┌─────────────────────────════════────────────────────────┐
│              Anime Search with Cache                      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Query: "One Piece"                                      │
│         │                                                │
│         ├─ Check Prisma cache (ConsumetAnime table)    │
│         │   │                                            │
│         │   ├─ ✅ CACHE HIT  ──→ Return ID immediately │
│         │   │   (< 10ms)                                │
│         │   │                                            │
│         │   └─ ❌ CACHE MISS ──→ Search Consumet API   │
│         │       (1.5s)                                   │
│         │                                                │
│         └─ Store result in cache (24h TTL)             │
│            (next request will hit cache)                │
│                                                           │
│  Next request for "One Piece": < 10ms (cached)          │
│  Without cache: 1.5s each time                          │
│  Savings: 99.3% faster on cache hits!                   │
└──────────────────────────────────────────────────────────┘
```

---

This visual representation helps understand how data flows through your entire system!
