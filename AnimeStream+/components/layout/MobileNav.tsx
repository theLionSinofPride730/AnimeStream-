"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Calendar, User } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Search", href: "/search", icon: Search },
  { label: "Schedule", href: "/schedule", icon: Calendar },
  { label: "Profile", href: "/profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: "rgba(13, 13, 26, 0.97)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        paddingBottom: "env(safe-area-inset-bottom)",
        height: "var(--mobile-nav-height)",
      }}
    >
      <div className="flex items-center justify-around h-full px-2">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className="mobile-nav-item min-w-0 flex-1"
              style={{
                color: isActive ? "var(--color-brand-primary)" : "var(--color-text-muted)",
              }}
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  fill={isActive ? "rgba(124,58,237,0.15)" : "none"}
                />
                {isActive && (
                  <span
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: "var(--color-brand-primary)" }}
                  />
                )}
              </div>
              <span className="text-caption">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
