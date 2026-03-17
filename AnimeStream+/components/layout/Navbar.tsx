"use client";

import Link from "next/link";
import { Play, ArrowRight, Search, Menu, Sparkles, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Browse", href: "/trending" },
  { label: "Schedule", href: "/schedule" },
  { label: "Dubs", href: "/genre/dub" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-4 px-4 sm:px-8 pointer-events-none transition-all duration-300">
      <div className="max-w-7xl mx-auto w-full">
        {/* Glassmorphic Pill */}
        <div
          className={cn(
            "flex items-center justify-between px-6 py-3 rounded-full pointer-events-auto transition-all duration-300",
            scrolled ? "bg-[rgba(15,15,25,0.85)] shadow-lg" : "bg-[rgba(10,10,20,0.55)]"
          )}
          style={{
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: scrolled ? "0 8px 32px rgba(0, 0, 0, 0.6)" : "0 8px 32px rgba(0, 0, 0, 0.4)",
          }}
        >
          {/* Logo & Anime Flair (Left) */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center">
              <Sparkles size={20} className="text-[#FF3366] group-hover:rotate-12 transition-transform duration-300" style={{ filter: "drop-shadow(0 0 8px rgba(255,51,102,0.6))" }} />
            </div>
            <span
              className="text-2xl font-black tracking-tight"
              style={{
                background: "linear-gradient(to right, #FF3366, #9D4EDD)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0px 2px 4px rgba(255,51,102,0.3))",
              }}
            >
              AnimeStream+
            </span>
          </Link>

          {/* Middle: Text Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 mx-8 flex-1 justify-center">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "px-4 py-2 text-sm font-bold rounded-full transition-all duration-300 hover:bg-white/10 hover:text-white",
                  pathname === link.href ? "text-white bg-white/5" : "text-gray-300"
                )}
                style={{
                  textShadow: pathname === link.href ? "0 0 10px rgba(255,255,255,0.3)" : "none",
                }}
              >
                {link.label}
              </Link>
            ))}
            {/* Dropdown for More */}
            <div className="relative group">
              <button
                className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-gray-300 rounded-full transition-all duration-300 hover:bg-white/10 hover:text-white"
              >
                More <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
              </button>
              {/* Invisible hover bridge */}
              <div className="absolute top-full left-0 w-full h-4" />
              {/* Dropdown Menu */}
              <div
                className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-40 py-2 rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 scale-95 group-hover:scale-100"
                style={{
                  background: "rgba(20, 20, 30, 0.95)",
                  backdropFilter: "blur(24px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                }}
              >
                <Link href="/news" className="block px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors">Anime News</Link>
                <Link href="/store" className="block px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors">Store</Link>
                <Link href="/games" className="block px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors">Games</Link>
              </div>
            </div>
          </nav>

          {/* Right Actions (Search + Buttons) */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto lg:ml-0">
            {/* Search Icon */}
            <button
              className="p-2 w-10 h-10 flex items-center justify-center rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 hover:scale-110"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {/* CTA Buttons (Hidden on very small screens) */}
            <div className="hidden sm:flex items-center gap-2 md:gap-3">
              <Link
                href="/"
                className="group flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-full font-bold text-sm text-white transition-all duration-300 hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #FF3366, #E11D48)",
                  boxShadow: "0 0 20px rgba(255, 51, 102, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                <span className="hidden md:inline" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>Watch Now</span>
                <Play size={16} fill="white" className="group-hover:translate-x-0.5 transition-transform drop-shadow-md" />
              </Link>
              
              <Link
                href="/login"
                className="group flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-full font-bold text-sm text-white transition-all duration-300 hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #9D4EDD, #7C3AED)",
                  boxShadow: "0 0 20px rgba(157, 78, 221, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                <span className="hidden md:inline" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>Log in</span>
                <ArrowRight size={16} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform drop-shadow-md" />
              </Link>
            </div>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 w-10 h-10 flex items-center justify-center rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown Panel */}
        {isMobileMenuOpen && (
          <div
            className="absolute top-20 left-4 right-4 p-4 rounded-2xl pointer-events-auto md:hidden animate-fade-in"
            style={{
              background: "rgba(20, 20, 30, 0.95)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6)",
            }}
          >
            <nav className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 text-sm font-bold text-gray-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-white/10 my-2" />
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-white"
                style={{ background: "linear-gradient(135deg, #9D4EDD, #7C3AED)" }}
              >
                Log in <ArrowRight size={16} strokeWidth={3} />
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
