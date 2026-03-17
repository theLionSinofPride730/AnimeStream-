import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Play, Plus, Star, Clock, Calendar, Tv, CheckCircle, BookOpen, Layers } from "lucide-react";
import { AnimeCarousel } from "@/components/anime/AnimeCarousel";
import {
  searchAnime,
  getAnimeById,
  createSlug,
  normalizeStatus,
  type AniListAnime,
} from "@/lib/anilist";
import type { Metadata } from "next";

export const revalidate = 3600; // ISR: 1 hour

interface Props {
  params: Promise<{ slug: string }>;
}

// Extract anilistId from the slug (last number after final dash)
function getIdFromSlug(slug: string): number | null {
  const parts = slug.split("-");
  const last = parts[parts.length - 1];
  const id = parseInt(last, 10);
  return isNaN(id) ? null : id;
}

async function getAnime(slug: string): Promise<AniListAnime | null> {
  const id = getIdFromSlug(slug);
  if (!id) return null;
  try {
    return await getAnimeById(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const anime = await getAnime(slug);
  if (!anime) return { title: "Not Found" };

  const title = anime.title.english || anime.title.romaji;
  const description = anime.description
    ?.replace(/<[^>]*>/g, "")
    .slice(0, 155) ?? `Watch ${title} free online on AnimeStream.`;

  return {
    title: `${title} — Watch Free Online`,
    description,
    openGraph: {
      title: `${title} | AnimeStream`,
      description,
      images: anime.coverImage.extraLarge ? [{ url: anime.coverImage.extraLarge }] : [],
    },
  };
}

function mapSimilar(media: { id: number; title: { romaji: string; english?: string | null }; coverImage: { large: string | null }; averageScore?: number | null }) {
  const slug = createSlug(media.title.romaji, media.id);
  return {
    id: String(media.id),
    slug,
    titleEn: media.title.english,
    titleRomaji: media.title.romaji,
    coverUrl: media.coverImage.large,
    score: media.averageScore ?? null,
    totalEpisodes: null,
    status: null,
    type: null,
    year: null,
  };
}

export default async function AnimeDetailPage({ params }: Props) {
  const { slug } = await params;
  const anime = await getAnime(slug);
  if (!anime) notFound();

  const title = anime.title.english || anime.title.romaji;
  const mainStudio = anime.studios?.edges?.find((e: { isMain: boolean; node: { id: number; name: string } }) => e.isMain)?.node;
  const status = normalizeStatus(anime.status);
  const synopsis = anime.description?.replace(/<[^>]*>/g, "") ?? "No synopsis available.";

  // Episodes (from airing schedule or create stubs)
  const episodes = anime.airingSchedule?.nodes ?? [];
  const totalEpisodes = anime.episodes ?? episodes.length;

  // Similar from recommendations
  const recommendations = (anime as any).recommendations?.nodes
    ?.map((n: { mediaRecommendation: { id: number; title: { romaji: string; english?: string | null }; coverImage: { large: string | null }; averageScore?: number | null } }) => n.mediaRecommendation)
    .filter(Boolean)
    .map(mapSimilar) ?? [];

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="relative w-full" style={{ height: "320px" }}>
        {/* Banner background */}
        {(anime.bannerImage || anime.coverImage.extraLarge) && (
          <Image
            src={anime.bannerImage || anime.coverImage.extraLarge || ""}
            alt={title}
            fill
            priority
            className="object-cover object-top"
            style={{ filter: "brightness(0.3)" }}
          />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, var(--color-surface-base) 100%)" }} />
      </div>

      <div className="page-container" style={{ marginTop: "-160px", position: "relative" }}>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <div className="flex-shrink-0">
            <div
              className="relative rounded-xl overflow-hidden shadow-2xl"
              style={{ width: 200, height: 280, background: "var(--color-surface-elevated)" }}
            >
              {anime.coverImage.extraLarge && (
                <Image
                  src={anime.coverImage.extraLarge}
                  alt={`${title} anime cover art`}
                  fill
                  className="object-cover"
                  priority
                />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-2 md:pt-24">
            {/* Status + badges */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className={`badge-${status.toLowerCase()} text-caption px-2.5 py-1 rounded-md font-semibold uppercase tracking-wide`}>
                {status}
              </span>
              {anime.format && (
                <span
                  className="text-caption px-2.5 py-1 rounded-md font-semibold"
                  style={{ background: "var(--color-surface-overlay)", color: "var(--color-text-secondary)" }}
                >
                  {anime.format}
                </span>
              )}
              {anime.genres?.slice(0, 3).map((g: string) => (
                <Link key={g} href={`/genre/${g.toLowerCase().replace(/\s+/g, "-")}`}>
                  <span className="tag-chip">{g}</span>
                </Link>
              ))}
            </div>

            <h1
              className="text-display-md md:text-display-lg font-black mb-1"
              style={{ color: "var(--color-text-primary)" }}
            >
              {title}
            </h1>
            {anime.title.romaji !== title && (
              <p className="text-body-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
                {anime.title.romaji}
              </p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-5 flex-wrap mb-5">
              {anime.averageScore && (
                <div className="flex items-center gap-1.5">
                  <Star size={16} fill="#F59E0B" className="text-yellow-400" />
                  <span className="font-bold text-lg" style={{ color: "var(--color-text-primary)" }}>
                    {(anime.averageScore / 10).toFixed(1)}
                  </span>
                  <span className="text-body-sm" style={{ color: "var(--color-text-muted)" }}>/10</span>
                </div>
              )}
              {totalEpisodes > 0 && (
                <div className="flex items-center gap-1.5" style={{ color: "var(--color-text-secondary)" }}>
                  <Tv size={14} />
                  <span className="text-body-sm">{totalEpisodes} episodes</span>
                </div>
              )}
              {anime.duration && (
                <div className="flex items-center gap-1.5" style={{ color: "var(--color-text-secondary)" }}>
                  <Clock size={14} />
                  <span className="text-body-sm">{anime.duration} min/ep</span>
                </div>
              )}
              {anime.seasonYear && (
                <div className="flex items-center gap-1.5" style={{ color: "var(--color-text-secondary)" }}>
                  <Calendar size={14} />
                  <span className="text-body-sm">
                    {anime.season} {anime.seasonYear}
                  </span>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-3 flex-wrap mb-6">
              <Link
                href={`/anime/${slug}/watch/1`}
                className="btn-gradient flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm"
              >
                <Play size={16} fill="white" />
                Watch Now
              </Link>
              <button
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                style={{
                  background: "var(--color-surface-overlay)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                <Plus size={16} />
                Add to List
              </button>
            </div>

            {/* Studio */}
            {mainStudio && (
              <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Studio: </span>
                {mainStudio.name}
              </p>
            )}
          </div>
        </div>

        {/* Synopsis */}
        <div className="mt-10">
          <h2 className="section-title mb-4">Synopsis</h2>
          <p className="text-body-md leading-relaxed" style={{ color: "var(--color-text-secondary)", maxWidth: "800px" }}>
            {synopsis}
          </p>
        </div>

        {/* Episodes */}
        {totalEpisodes > 0 && (
          <div className="mt-10">
            <h2 className="section-title mb-4">Episodes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: Math.min(totalEpisodes, 24) }, (_, i) => i + 1).map((epNum) => {
                const scheduled = episodes.find((e: { episode: number; airingAt: number }) => e.episode === epNum);
                const hasAired = scheduled ? scheduled.airingAt * 1000 < Date.now() : epNum <= totalEpisodes;

                return (
                  <Link
                    key={epNum}
                    href={`/anime/${slug}/watch/${epNum}`}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02]"
                    style={{
                      background: "var(--color-surface-elevated)",
                      border: "1px solid var(--color-border-subtle)",
                      opacity: hasAired ? 1 : 0.5,
                      pointerEvents: hasAired ? "auto" : "none",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{
                        background: "rgba(124,58,237,0.15)",
                        color: "var(--color-brand-primary)",
                      }}
                    >
                      {epNum}
                    </div>
                    <div>
                      <p className="text-body-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                        Episode {epNum}
                      </p>
                      {scheduled && !hasAired && (
                        <p className="text-caption" style={{ color: "var(--color-text-muted)" }}>
                          {new Date(scheduled.airingAt * 1000).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="ml-auto">
                      {hasAired ? (
                        <Play size={16} style={{ color: "var(--color-brand-primary)" }} />
                      ) : (
                        <Clock size={16} style={{ color: "var(--color-text-muted)" }} />
                      )}
                    </div>
                  </Link>
                );
              })}
              {totalEpisodes > 24 && (
                <div
                  className="flex items-center justify-center p-3 rounded-xl text-body-sm font-medium"
                  style={{ background: "var(--color-surface-elevated)", color: "var(--color-text-muted)" }}
                >
                  +{totalEpisodes - 24} more episodes
                </div>
              )}
            </div>
          </div>
        )}

        {/* Similar Anime */}
        {recommendations.length > 0 && (
          <div className="mt-10">
            <AnimeCarousel
              title="Similar Anime"
              anime={recommendations}
            />
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
