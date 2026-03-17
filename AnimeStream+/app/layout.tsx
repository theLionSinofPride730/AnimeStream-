import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "AnimeStream — Watch Anime Free Online",
    template: "%s | AnimeStream",
  },
  description:
    "AnimeStream is the next-generation anime streaming platform. Watch thousands of anime episodes free in HD. Sub and dub available.",
  keywords: ["anime", "watch anime", "anime streaming", "free anime", "anime online", "sub", "dub"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://animestream.to",
    siteName: "AnimeStream",
    title: "AnimeStream — Watch Anime Free Online",
    description: "The next-generation anime streaming platform. Watch free in HD.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AnimeStream",
    description: "The next-generation anime streaming platform.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-surface-base)' }}>
            <Navbar />
            <main className="flex-1 mt-16 pb-20 md:pb-8">
              {children}
            </main>
            <MobileNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
