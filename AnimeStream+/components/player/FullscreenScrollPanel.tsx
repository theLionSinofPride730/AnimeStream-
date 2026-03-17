"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface FullscreenScrollPanelProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function FullscreenScrollPanel({ isOpen, title, onClose, children }: FullscreenScrollPanelProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const targetElement = document.fullscreenElement || document.body;
  if (!targetElement) return null;

  const panel = (
    <div
      className={`fixed top-0 bottom-0 right-0 w-[320px] z-[60] shadow-2xl transition-transform duration-300 ease-out flex flex-col fullscreen-panel-content ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{
        background: "rgba(13, 13, 26, 0.95)", // --color-surface-base
        backdropFilter: "blur(16px)",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <h3 className="text-body-md font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
        >
          <X size={18} color="white" />
        </button>
      </div>

      {/* Content wrapper with independent scrolling */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar"
        onWheel={(e) => e.stopPropagation()} // Prevent closing panel when scrolling inside
      >
        {children}
      </div>
    </div>
  );

  return createPortal(panel, targetElement);
}
