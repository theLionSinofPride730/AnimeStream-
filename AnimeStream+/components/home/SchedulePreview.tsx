"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, ExternalLink, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

interface ScheduleItem {
  animeTitle: string;
  animeSlug: string;
  coverUrl?: string;
  episode: number;
  airingAt: number;
  dayOfWeek: string;
}

interface SchedulePreviewProps {
  schedule: ScheduleItem[];
}

export function SchedulePreview({ schedule }: SchedulePreviewProps) {
  const [now, setNow] = useState(Date.now());
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    // Update 'now' every minute instead of second for performance
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Group by day 
  const grouped: Record<string, ScheduleItem[]> = {};
  for (const item of schedule) {
    const day = new Date(item.airingAt * 1000).toLocaleDateString("en-US", { weekday: "long" });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(item);
  }

  // Determine today and next two days
  const todayDate = new Date();
  const todayName = todayDate.toLocaleDateString("en-US", { weekday: "long" });
  
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowName = tomorrowDate.toLocaleDateString("en-US", { weekday: "long" });

  const day3Date = new Date(todayDate);
  day3Date.setDate(day3Date.getDate() + 2);
  const day3Name = day3Date.toLocaleDateString("en-US", { weekday: "long" });

  const upcomingDays = [todayName, tomorrowName, day3Name].filter(d => grouped[d] && grouped[d].length > 0);

  useEffect(() => {
    if (upcomingDays.length > 0 && !activeTab) {
      setActiveTab(upcomingDays[0]);
    }
  }, [upcomingDays, activeTab]);

  if (!upcomingDays.length) return null;

  const activeItems = grouped[activeTab] || [];

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 rounded-full" style={{ background: "linear-gradient(to bottom, #10B981, #059669)" }} />
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Airing This Week
          </h2>
        </div>
        
        {/* Day Tabs */}
        <div className="flex bg-surface-elevated p-1 rounded-xl border border-white/5">
          {upcomingDays.map((day) => (
            <button
              key={day}
              onClick={() => setActiveTab(day)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300",
                activeTab === day
                  ? "bg-[#10B981] text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              {day === todayName ? "Today" : day === tomorrowName ? "Tomorrow" : day}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of nice horizontal cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {activeItems.slice(0, 8).map((item, i) => {
          const airingDate = new Date(item.airingAt * 1000);
          const isAiring = airingDate.getTime() < now;
          const timeLeft = airingDate.getTime() - now;
          const hours = Math.floor(timeLeft / 3600000);
          const mins = Math.floor((timeLeft % 3600000) / 60000);

          return (
            <Link
              key={i}
              href={`/anime/${item.animeSlug}/watch/${item.episode}`}
              className="group relative flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 hover:scale-[1.03]"
              style={{
                background: "linear-gradient(145deg, rgba(30,30,45,0.6), rgba(20,20,30,0.8))",
                border: "1px solid rgba(255,255,255,0.05)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
              }}
            >
              {/* Play button overlay on hover */}
              <div className="absolute right-4 z-20 w-10 h-10 rounded-full bg-[#10B981] flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                <Play size={18} fill="white" color="white" className="ml-0.5" />
              </div>

              {/* Poster */}
              <div className="relative w-16 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-surface-base shadow-md">
                {item.coverUrl ? (
                  <Image
                    src={item.coverUrl}
                    alt={item.animeTitle}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="64px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Play size={20} className="text-gray-600" />
                  </div>
                )}
                {/* Image dark overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                {/* Live / Time badge */}
                <div className="mb-1.5 flex items-center">
                  {isAiring ? (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-400/10 border border-green-400/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Aired
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-brand-primary">
                      <Clock size={11} />
                      {timeLeft < 3600000 ? `${mins}m left` : `${hours}h ${mins}m`}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug mb-1 group-hover:text-[#10B981] transition-colors">
                  {item.animeTitle}
                </h3>
                
                <p className="text-xs text-gray-400 font-medium">
                  Episode {item.episode}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          href="/schedule"
          className="text-sm font-bold flex items-center gap-1.5 hover:gap-2.5 transition-all text-gray-400 hover:text-white"
        >
          View Full Schedule
          <ExternalLink size={14} />
        </Link>
      </div>
    </section>
  );
}
