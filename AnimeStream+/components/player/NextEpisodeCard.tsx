"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Play, X } from "lucide-react";
import { createPortal } from "react-dom";

interface NextEpisodeCardProps {
  nextUrl: string;
  title: string;
  thumbnailUrl?: string;
  countdownSeconds?: number;
  onClose: () => void;
}

export function NextEpisodeCard({
  nextUrl,
  title,
  thumbnailUrl,
  countdownSeconds = 10,
  onClose,
}: NextEpisodeCardProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);
  const [mounted, setMounted] = useState(false);

  // Prefetch immediately
  useEffect(() => {
    router.prefetch(nextUrl);
    setMounted(true);
  }, [nextUrl, router]);

  // Handle Countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      router.push(nextUrl);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, nextUrl, router]);

  // Click handler
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(nextUrl);
  };

  // Prevent click propagation on close
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  if (!mounted) return null;

  // We portal into the fullscreen element if it exists, otherwise document.body
  const targetElement = document.fullscreenElement || document.body;
  if (!targetElement) return null;

  const circumference = 2 * Math.PI * 18; // r=18
  const strokeDashoffset = circumference - (timeLeft / countdownSeconds) * circumference;

  const card = (
    <div
      role="complementary"
      aria-label="Next episode"
      className="fixed bottom-24 right-6 w-[280px] rounded-xl shadow-2xl z-50 animate-slide-up group cursor-pointer"
      style={{
        background: "rgba(22, 22, 42, 0.95)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
      onClick={handleClick}
    >
      <div className="p-3">
        {/* Header + Countdown */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-caption font-semibold" style={{ color: "var(--color-text-muted)" }}>
            UP NEXT
          </span>
          <div className="relative w-8 h-8 flex items-center justify-center">
            {/* SVG Ring */}
            <svg
              className="absolute inset-0 -rotate-90"
              width="32"
              height="32"
              viewBox="0 0 40 40"
            >
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="3"
              />
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke="var(--color-brand-accent)"
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <button
              onClick={handleClose}
              className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center bg-transparent transition-colors hover:bg-white/10"
              aria-label="Cancel autoplay"
            >
              <X size={14} color="white" />
            </button>
          </div>
        </div>

        {/* Thumbnail + Title */}
        <div className="flex gap-3 items-center">
          <div className="relative w-20 h-12 rounded overflow-hidden flex-shrink-0 bg-black">
            {thumbnailUrl ? (
              <Image src={thumbnailUrl} alt={title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--color-surface-elevated)" }}>
                <Play size={16} style={{ color: "var(--color-brand-primary)" }} />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.5)" }}>
              <Play size={20} color="white" fill="white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4
              className="text-body-sm font-semibold line-clamp-2 leading-snug"
              style={{ color: "var(--color-text-primary)" }}
            >
              {title}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(card, targetElement);
}
