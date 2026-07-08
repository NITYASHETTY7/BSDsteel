"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  name?: string;
}

export function Select({ value, onChange, options, placeholder = "Select...", className = "", name }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-10'} ${className}`} ref={dropdownRef}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-transparent border-b border-white/10 py-2 px-1 focus:outline-none focus:border-accent transition-colors text-xs text-text-primary uppercase tracking-[0.15em] font-medium group"
      >
        <span className="truncate pr-4">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-accent transition-transform duration-300 ${isOpen ? "rotate-180" : "group-hover:translate-y-0.5"}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-background/95 backdrop-blur-xl border border-white/10 shadow-2xl py-2 animate-in fade-in slide-in-from-top-1 origin-top">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-[10px] text-left uppercase tracking-[0.2em] transition-all duration-200 hover:bg-white/5 hover:text-accent ${
                  isSelected ? "text-accent font-bold bg-white/5 border-l-2 border-accent" : "text-text-muted border-l-2 border-transparent"
                }`}
              >
                {option.label}
                {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
