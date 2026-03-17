import Link from "next/link";
import { getAiringSchedule, createSlug, type AniListAnime } from "@/lib/anilist";
import { AnimeCard } from "@/components/anime/AnimeCard";
import type { Metadata } from "next";

export const revalidate = 1800; // 30 minutes

export const metadata: Metadata = {
  title: "Airing Schedule",
  description: "Check out the weekly airing schedule for the latest anime episodes.",
};

interface ScheduleItem {
  episode: number;
  airingAt: number;
  media: AniListAnime;
}

export default async function SchedulePage() {
  const schedule = await getAiringSchedule();
  
  // Group by day of week
  const grouped: Record<string, ScheduleItem[]> = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  };

  const now = Date.now() / 1000;

  schedule.forEach((item) => {
    const date = new Date(item.airingAt * 1000);
    const day = date.toLocaleDateString("en-US", { weekday: "long" });
    if (grouped[day]) {
      grouped[day].push(item);
    }
  });

  // Sort today first
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const days = Object.keys(grouped);
  const todayIndex = days.indexOf(today);
  const sortedDays = [...days.slice(todayIndex), ...days.slice(0, todayIndex)];

  return (
    <div className="page-container py-8 min-h-screen">
      <div className="mb-8">
        <h1 className="text-display-lg font-black text-white mb-2">Airing Schedule</h1>
        <p className="text-gray-400">Find out when your favorite anime releases a new episode.</p>
      </div>

      <div className="flex flex-col gap-12">
        {sortedDays.map((day) => {
          const items = grouped[day];
          if (items.length === 0) return null;

          const isToday = day === today;

          return (
            <section key={day}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-1.5 h-6 rounded-full ${isToday ? "bg-brand-primary shine" : "bg-gray-700"}`} />
                <h2 className={`text-2xl font-bold ${isToday ? "text-white" : "text-gray-300"}`}>
                  {day}
                  {isToday && <span className="ml-3 text-xs font-semibold px-2.5 py-1 rounded-md bg-brand-primary/20 text-brand-primary">TODAY</span>}
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {items.map((item) => {
                  const slug = createSlug(item.media.title.romaji, item.media.id);
                  const isAired = item.airingAt < now;
                  
                  return (
                    <div key={`${item.media.id}-${item.episode}`} className="relative group">
                      <AnimeCard
                        size="lg"
                        className="w-full"
                        anime={{
                          id: String(item.media.id),
                          slug,
                          titleEn: item.media.title.english,
                          titleRomaji: item.media.title.romaji,
                          coverUrl: item.media.coverImage.large,
                          score: item.media.averageScore,
                          status: item.media.status,
                          year: item.media.seasonYear,
                        }}
                      />
                      <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded bg-surface-elevated/90 backdrop-blur-sm border border-white/10 shadow-lg text-xs font-bold font-mono">
                        <span className={isAired ? "text-green-400" : "text-brand-accent"}>
                          EP {item.episode}
                        </span>
                        <span className="text-gray-400 ml-2">
                          {new Date(item.airingAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
