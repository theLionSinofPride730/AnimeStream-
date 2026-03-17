// AniList GraphQL API Client
// Primary source for anime metadata

const ANILIST_URL = "https://graphql.anilist.co";

export interface AniListAnime {
  id: number;
  idMal: number | null;
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
  };
  description: string | null;
  coverImage: {
    extraLarge: string | null;
    large: string | null;
    color: string | null;
  };
  bannerImage: string | null;
  format: string | null;
  status: string | null;
  episodes: number | null;
  duration: number | null;
  season: string | null;
  seasonYear: number | null;
  averageScore: number | null;
  popularity: number | null;
  genres: string[];
  studios: {
    edges: Array<{
      isMain: boolean;
      node: { id: number; name: string };
    }>;
  };
  nextAiringEpisode: {
    episode: number;
    airingAt: number;
    timeUntilAiring: number;
  } | null;
  airingSchedule: {
    nodes: Array<{
      episode: number;
      airingAt: number;
    }>;
  };
}

export interface AniListPageResult {
  pageInfo: {
    total: number;
    currentPage: number;
    lastPage: number;
    hasNextPage: boolean;
  };
  media: AniListAnime[];
}

const ANIME_FRAGMENT = `
  id
  idMal
  title { romaji english native }
  description(asHtml: false)
  coverImage { extraLarge large color }
  bannerImage
  format
  status
  episodes
  duration
  season
  seasonYear
  averageScore
  popularity
  genres
  studios(isMain: true) {
    edges { isMain node { id name } }
  }
  nextAiringEpisode { episode airingAt timeUntilAiring }
`;

async function anilistFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`AniList API error: ${response.status}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(`AniList GraphQL error: ${json.errors[0].message}`);
  }

  return json.data as T;
}

export async function getTrendingAnime(page = 1, perPage = 20): Promise<AniListPageResult> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;

  const data = await anilistFetch<{ Page: AniListPageResult }>(query, { page, perPage });
  return data.Page;
}

export async function getPopularAnime(page = 1, perPage = 20): Promise<AniListPageResult> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(sort: POPULARITY_DESC, type: ANIME, isAdult: false, status: RELEASING) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;
  const data = await anilistFetch<{ Page: AniListPageResult }>(query, { page, perPage });
  return data.Page;
}

export async function getSeasonalAnime(season: string, year: number, page = 1, perPage = 20): Promise<AniListPageResult> {
  const query = `
    query ($season: MediaSeason, $year: Int, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(season: $season, seasonYear: $year, type: ANIME, isAdult: false, sort: POPULARITY_DESC) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;
  const data = await anilistFetch<{ Page: AniListPageResult }>(query, { season, year, page, perPage });
  return data.Page;
}

export async function getAnimeById(id: number): Promise<AniListAnime | null> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${ANIME_FRAGMENT}
        airingSchedule(notYetAired: false, perPage: 50) {
          nodes { episode airingAt }
        }
        relations {
          edges {
            relationType
            node { id title { romaji } coverImage { large } format }
          }
        }
        recommendations(page: 1, perPage: 8) {
          nodes {
            mediaRecommendation {
              id title { romaji } coverImage { large } averageScore
            }
          }
        }
      }
    }
  `;
  const data = await anilistFetch<{ Media: AniListAnime | null }>(query, { id });
  return data.Media;
}

export async function searchAnime(search: string, page = 1, perPage = 20): Promise<AniListPageResult> {
  const query = `
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(search: $search, type: ANIME, isAdult: false, sort: SEARCH_MATCH) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;
  const data = await anilistFetch<{ Page: AniListPageResult }>(query, { search, page, perPage });
  return data.Page;
}

export async function getAiringSchedule(): Promise<Array<{
  episode: number;
  airingAt: number;
  timeUntilAiring: number;
  media: AniListAnime;
}>> {
  const now = Math.floor(Date.now() / 1000);
  const weekFromNow = now + 7 * 24 * 60 * 60;

  const query = `
    query ($start: Int, $end: Int) {
      Page(page: 1, perPage: 50) {
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
          episode
          airingAt
          timeUntilAiring
          media {
            ${ANIME_FRAGMENT}
          }
        }
      }
    }
  `;

  const data = await anilistFetch<{ Page: { airingSchedules: Array<{ episode: number; airingAt: number; timeUntilAiring: number; media: AniListAnime }> } }>(query, { start: now, end: weekFromNow });
  return data.Page.airingSchedules;
}

export async function getAnimeByGenre(genre: string, page = 1, perPage = 20): Promise<AniListPageResult> {
  const query = `
    query ($genre: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(genre: $genre, type: ANIME, isAdult: false, sort: POPULARITY_DESC) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;
  const data = await anilistFetch<{ Page: AniListPageResult }>(query, { genre, page, perPage });
  return data.Page;
}

// Transform AniList status to our status format
export function normalizeStatus(status: string | null): string {
  switch (status) {
    case "RELEASING": return "ONGOING";
    case "FINISHED": return "COMPLETED";
    case "NOT_YET_RELEASED": return "UPCOMING";
    case "CANCELLED": return "HIATUS";
    case "HIATUS": return "HIATUS";
    default: return "ONGOING";
  }
}

// Create a URL-safe slug from the anime title
export function createSlug(title: string, id: number): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
      .slice(0, 60) +
    `-${id}`
  );
}
