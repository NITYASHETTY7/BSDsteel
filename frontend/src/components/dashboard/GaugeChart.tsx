import React from "react";

interface GaugeChartProps {
  value: number;
  max: number;
}

export function GaugeChart({ value, max }: GaugeChartProps) {
  const percentage = Math.min(value / max, 1);
  const totalSegments = 24;
  const activeSegments = Math.round(percentage * totalSegments);

  const radius = 90;
  const cx = 110;
  const cy = 110;
  const strokeWidth = 14;
  const gapAngle = 4;

  const startAngle = 180;
  const totalAngle = 180;
  const segmentAngle = (totalAngle - gapAngle * (totalSegments - 1)) / totalSegments;

  const polarToCartesian = (centerX: number, centerY: number, r: number, angleDeg: number) => {
    const rad = ((angleDeg - 180) * Math.PI) / 180.0;
    return { x: centerX + r * Math.cos(rad), y: centerY + r * Math.sin(rad) };
  };

  const getOverallColor = (pct: number) => {
    if (pct < 0.5) return "#D02936"; // Red (Poor)
    if (pct < 0.75) return "#F4A623"; // Amber (Moderate)
    return "#3D7A6B"; // Green (Goal)
  };

  const activeColor = getOverallColor(percentage);

  const getSegmentColor = (index: number, active: number, total: number) => {
    if (index >= active) return "rgb(var(--color-border))"; // Inactive segments are gray
    return activeColor; // Active segments take the performance color
  };

  const segments = Array.from({ length: totalSegments }).map((_, i) => {
    const curStart = startAngle - i * (segmentAngle + gapAngle);
    const curEnd = curStart - segmentAngle;
    const start = polarToCartesian(cx, cy, radius, curStart);
    const end = polarToCartesian(cx, cy, radius, curEnd);
    return (
      <path
        key={i}
        d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`}
        fill="none"
        stroke={getSegmentColor(i, activeSegments, totalSegments)}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className="transition-all duration-500 ease-in-out"
      />
    );
  });

  const formatVal = (v: number) => {
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000)   return `₹${(v / 1000).toFixed(0)}k`;
    return `₹${v}`;
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-[240px] mx-auto">
      <svg viewBox="0 0 220 130" className="w-full h-auto">
        {segments}
        {/* Center value text inside SVG — no absolute positioning needed */}
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          fill="rgb(var(--color-text-primary))"
          style={{ fontSize: 22, fontWeight: 700, fontFamily: 'inherit' }}
        >
          {formatVal(value)}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fill="rgb(var(--color-text-muted))"
          style={{ fontSize: 9, fontFamily: 'inherit', letterSpacing: '0.1em', textTransform: 'uppercase' }}
        >
          Collected
        </text>
      </svg>
    </div>
  );
}
