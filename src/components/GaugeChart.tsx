import React from "react";

interface GaugeChartProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  color?: string;
  timestamp?: number;
  showValue?: boolean;
}

const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  min,
  max,
  label,
  unit,
  timestamp,
  showValue = false,
}) => {
  // Clamp value to ensure it stays within range
  const clampedValue = Math.min(max, Math.max(min, value));

  //, ... (existing code)

  // Calculate percentage (0 to 1) for needle position
  const normalizedValue = (clampedValue - min) / (max - min);

  // Angle for needle: -90 (left) to 90 (right)
  const angle = normalizedValue * 180 - 90;

  // Gauge Configuration
  const radius = 70;
  const strokeWidth = 12;
  const cx = 100;
  const cy = 100; // Pivot point

  // Helper for ticks
  const polarToCartesian = (angleInDegrees: number, dist: number) => {
    // Convert Angle (-90..90) to Radians for SVG trig
    // -90deg (Left) -> PI radians
    // 0deg (Up) -> 3PI/2 radians (-PI/2)
    // 90deg (Right) -> 0 radians
    // Formula: (angle - 90) * PI / 180
    const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180);
    return {
      x: cx + dist * Math.cos(angleInRadians),
      y: cy + dist * Math.sin(angleInRadians)
    };
  };

  // Helper for dynamic precision based on step size
  const getPrecision = (num: number) => {
    if (Number.isInteger(num)) return 0;
    const str = num.toString();
    const decimalPart = str.split('.')[1] || '';
    return Math.min(decimalPart.length, 3); // Cap at 3 decimals to avoid floating point issues
  };

  const step = (max - min) / 4;
  const precision = getPrecision(step);

  // Generate ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((percent) => {
    const val = min + (max - min) * percent;
    const tickAngle = percent * 180 - 90;
    
    const start = polarToCartesian(tickAngle, radius + strokeWidth / 2 + 5);
    const end = polarToCartesian(tickAngle, radius + strokeWidth / 2 + 12);
    
    // Text position
    const textPos = polarToCartesian(tickAngle, radius + 32); 

    return { 
      x1: start.x, 
      y1: start.y, 
      x2: end.x, 
      y2: end.y, 
      tx: textPos.x,
      ty: textPos.y,
      value: parseFloat(val.toFixed(precision)), 
      angle: tickAngle 
    };
  });

  // Calculate Color Class for Text based on value (Cold Room logic)
  // Low temp (negative) is usually good/cold -> Blue
  // High temp (positive) is bad/hot -> Red
  const getValueColor = (val: number) => {
    if (val <= 0) return "text-blue-500";
    if (val < 40) return "text-cyan-600";
    if (val < 70) return "text-orange-500";
    return "text-red-600";
  };

  const formatValue = (v: number) => {
    const isPositive = v > 0;
    return `${v.toFixed(1)}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-full">
      <div className="relative w-full max-w-full aspect-[2/1.3] select-none max-h-full flex items-center justify-center">
        <svg viewBox="0 0 200 135" className="w-full h-full overflow-visible max-h-full">
          <defs>
            <linearGradient id="coldToHotGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" /> {/* Blue */}
              <stop offset="40%" stopColor="#06b6d4" /> {/* Cyan */}
              <stop offset="60%" stopColor="#f59e0b" /> {/* Amber */}
              <stop offset="100%" stopColor="#ef4444" /> {/* Red */}
            </linearGradient>
            <filter id="needleShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="1" dy="1" stdDeviation="2" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Background Arc Track */}
          <path
            d="M 30 100 A 70 70 0 0 1 170 100"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="opacity-20"
          />

          {/* Colored Gradient Arc */}
          <path
            d="M 30 100 A 70 70 0 0 1 170 100"
            fill="none"
            stroke="url(#coldToHotGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Ticks & Labels */}
          {ticks.map((tick, i) => (
            <g key={i}>
              <line
                x1={tick.x1} y1={tick.y1}
                x2={tick.x2} y2={tick.y2}
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-muted-foreground/50"
              />
              <text
                x={tick.tx}
                y={tick.ty}
                textAnchor="middle"
                alignmentBaseline="middle"
                className="text-[10px] fill-muted-foreground font-medium"
              >
                {tick.value}
              </text>
            </g>
          ))}

          {/* Needle Layer */}
          <g
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: "100px 100px",
              transition: "transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* Main triangular needle */}
            <path
              d="M 100 110 L 95 100 L 100 40 L 105 100 Z"
              fill="currentColor"
              className="text-foreground"
              filter="url(#needleShadow)"
            />
            {/* Center Pivot */}
            <circle cx="100" cy="100" r="5" className="fill-foreground" />
            <circle cx="100" cy="100" r="2" className="fill-background" />
          </g>
        </svg>
      </div>

      {/* Detail Value Display */}
      {showValue && (
        <div className="-mt-8 text-center flex flex-col items-center z-10 relative">
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-bold tracking-tight ${getValueColor(value)}`}>
              {formatValue(value)}
            </span>
            <span className="text-sm font-bold text-muted-foreground/80 mb-1">{unit}</span>
          </div>

          {timestamp && timestamp > 0 && (
            <span className="text-xs text-muted-foreground/60 mt-1">
              {new Date(timestamp * 1000).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default GaugeChart;
