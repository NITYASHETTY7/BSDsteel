import React from "react";
import { X } from "lucide-react";

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function SlidePanel({ isOpen, onClose, title, subtitle, children }: SlidePanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[6px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-[460px] h-full flex flex-col animate-in slide-in-from-right duration-300"
        style={{
          background: "rgb(var(--color-panel))",
          borderLeft: "1px solid rgb(var(--color-border))",
          boxShadow: "-8px 0 48px rgba(0,0,0,0.18), -1px 0 0 rgb(var(--color-border))",
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "linear-gradient(90deg, rgb(var(--color-accent)), rgb(var(--color-accent)/0.3), transparent)" }}
        />

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: "1px solid rgb(var(--color-border))" }}
        >
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-text-primary truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-text-muted text-xs mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 rounded-xl text-text-muted hover:text-text-primary transition-all shrink-0"
            style={{ background: "transparent" }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgb(var(--color-border)/0.5)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
}
