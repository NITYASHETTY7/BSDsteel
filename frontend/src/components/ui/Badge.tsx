import React from "react";

interface BadgeProps {
  status: "success" | "warning" | "error" | "neutral";
  label?: string;
}

const colorMap = {
  success: "bg-[#3D7A6B]",
  warning: "bg-[#D98E2C]",
  error: "bg-[#C0392B]",
  neutral: "bg-border",
};

export function Badge({ status, label }: BadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colorMap[status]}`} />
      {label && (
        <span className={`text-xs font-bold uppercase tracking-wider ${status === 'error' ? 'text-[#C0392B]' : 'text-text-muted'}`}>
          {label}
        </span>
      )}
    </div>
  );
}
