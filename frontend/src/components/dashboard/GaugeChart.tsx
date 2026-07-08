import React from "react";

interface GaugeChartProps {
  value: number;
  max: number;
}

export function GaugeChart({ value, max }: GaugeChartProps) {
  const percentage = Math.min(value / max, 1);

  const cx = 110;
  const cy = 90;
  const radius = 85;
  const strokeWidth = 12;

  // Arc goes from 180° → 0° (left to right, semicircle)
  const startAngleDeg = 180;
  const endAngleDeg = 0;
  const totalAngleDeg = 180;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const polarToXY = (angleDeg: number, r: number) => ({
    x: cx + r * Math.cos(toRad(angleDeg)),
    y: cy - r * Math.sin(toRad(angleDeg)),
  });

  // Track arc (full background)
  const trackStart = polarToXY(startAngleDeg, radius);
  const trackEnd   = polarToXY(endAngleDeg, radius);

  // Filled arc
  const fillAngle = startAngleDeg - percentage * totalAngleDeg;
  const fillEnd   = polarToXY(fillAngle, radius);
  const largeArcFill = percentage * totalAngleDeg > 180 ? 1 : 0;

  // Color based on performance
  const getColor = (pct: number) => {
    if (pct < 0.5)  return "#D02936";
    if (pct < 0.75) return "#F4A623";
    return "#34A878";
  };
  const activeColor = getColor(percentage);

  // Needle angle: 180° = 0%, 0° = 100%
  const needleAngleDeg = startAngleDeg - percentage * totalAngleDeg;
  const needleRad = toRad(needleAngleDeg);
  const needleLength = radius - 4;
  const needleBaseWidth = 5;
  const needleTipX = cx + needleLength * Math.cos(needleRad);
  const needleTipY = cy - needleLength * Math.sin(needleRad);

  // Perpendicular for needle base
  const perpX = Math.sin(needleRad) * needleBaseWidth;
  const perpY = Math.cos(needleRad) * needleBaseWidth;
  const baseLeft  = { x: cx - perpX, y: cy - perpY };
  const baseRight = { x: cx + perpX, y: cy + perpY };

  const formatVal = (v: number) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
    if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000)     return `₹${(v / 1000).toFixed(0)}k`;
    return `₹${v}`;
  };

  return (
    <div className="w-full max-w-[240px] mx-auto">
      <svg viewBox="0 0 220 220" className="w-full h-auto overflow-visible">
        {/* Defs */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#D02936" stopOpacity="0.9" />
            <stop offset="50%"  stopColor="#F4A623" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#34A878" stopOpacity="0.9" />
          </linearGradient>
          <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Track arc */}
        <path
          d={`M ${trackStart.x} ${trackStart.y} A ${radius} ${radius} 0 0 1 ${trackEnd.x} ${trackEnd.y}`}
          fill="none"
          stroke="rgb(var(--color-border))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Colored fill arc */}
        {percentage > 0.01 && (
          <path
            d={`M ${trackStart.x} ${trackStart.y} A ${radius} ${radius} 0 ${largeArcFill} 1 ${fillEnd.x} ${fillEnd.y}`}
            fill="none"
            stroke={activeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ transition: "stroke 0.4s ease", filter: `drop-shadow(0 0 6px ${activeColor}55)` }}
          />
        )}

        {/* Needle */}
        <polygon
          points={`${needleTipX},${needleTipY} ${baseLeft.x},${baseLeft.y} ${baseRight.x},${baseRight.y}`}
          fill={activeColor}
          filter="url(#needleShadow)"
          style={{ transition: "all 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}
        />

        {/* Needle hub */}
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill={activeColor}
          style={{ filter: `drop-shadow(0 0 4px ${activeColor}80)` }}
        />
        <circle cx={cx} cy={cy} r={3} fill="rgb(var(--color-panel))" />

        {/* Min / Max labels — aligned with arc ends */}
        <text
          x={trackStart.x - 2}
          y={cy + 18}
          textAnchor="end"
          fill="rgb(var(--color-text-muted))"
          style={{ fontSize: 9, fontFamily: "inherit" }}
        >
          ₹0
        </text>
        <text
          x={trackEnd.x + 2}
          y={cy + 18}
          textAnchor="start"
          fill="rgb(var(--color-text-muted))"
          style={{ fontSize: 9, fontFamily: "inherit" }}
        >
          {formatVal(max)}
        </text>

        {/* Value — below the arc */}
        <text
          x={cx}
          y={cy + 42}
          textAnchor="middle"
          fill="rgb(var(--color-text-primary))"
          style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-display), sans-serif" }}
        >
          {formatVal(value)}
        </text>

        {/* COLLECTED label */}
        <text
          x={cx}
          y={cy + 58}
          textAnchor="middle"
          fill="rgb(var(--color-text-muted))"
          style={{ fontSize: 9, fontFamily: "inherit", letterSpacing: "0.12em", textTransform: "uppercase" }}
        >
          COLLECTED
        </text>

        {/* Percentage */}
        <text
          x={cx}
          y={cy + 76}
          textAnchor="middle"
          fill={activeColor}
          style={{ fontSize: 13, fontWeight: 700, fontFamily: "inherit", letterSpacing: "0.05em" }}
        >
          {Math.round(percentage * 100)}%
        </text>
      </svg>
    </div>
  );
}
