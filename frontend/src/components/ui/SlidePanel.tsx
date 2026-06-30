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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className="relative w-full max-w-[440px] h-full bg-panel border-l border-border shadow-[0_0_60px_rgba(0,0,0,0.6)] flex flex-col animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0 bg-background/30">
          <div>
            <h2 className="text-base font-display font-bold uppercase tracking-widest text-text-primary">
              {title}
            </h2>
            {subtitle && (
              <p className="text-text-muted text-xs mt-0.5">{subtitle}</p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
}
