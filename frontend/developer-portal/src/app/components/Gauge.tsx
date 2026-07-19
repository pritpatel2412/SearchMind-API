import React from 'react';

interface GaugeProps {
  value: number;
  color?: string;
  showLabels?: boolean;
  min?: string;
  max?: string;
}

export default function Gauge({
  value,
  color = '#ef4d23',
  showLabels = false,
  min,
  max,
}: GaugeProps) {
  const totalTicks = 40;
  const activeCount = Math.round((value / 100) * totalTicks);

  const cx = 100;
  const cy = 100;
  const rOuter = 80;
  const rInner = 70;

  const ticks = Array.from({ length: totalTicks }).map((_, i) => {
    // Angle from PI to 0
    const theta = Math.PI - (i / (totalTicks - 1)) * Math.PI;

    const x1 = cx + rOuter * Math.cos(theta);
    const y1 = cy - rOuter * Math.sin(theta);
    const x2 = cx + rInner * Math.cos(theta);
    const y2 = cy - rInner * Math.sin(theta);

    const isActive = i < activeCount;

    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isActive ? color : '#d4d4d8'}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    );
  });

  return (
    <div className="w-full max-w-[260px] mx-auto flex flex-col">
      <svg viewBox="0 0 200 120" className="w-full h-auto overflow-visible">
        {ticks}
        <text
          x={100}
          y={105}
          textAnchor="middle"
          fontSize="22"
          fontWeight="600"
          fill="#171717" // Neutral-900 like
        >
          {value}%
        </text>
      </svg>
      {showLabels && (
        <div className="flex justify-between text-[11px] text-neutral-500 mt-2 font-medium">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}
