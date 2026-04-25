import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, ArrowDown, ArrowUp } from 'lucide-react';
import { WidgetConfig } from '../../../store/useBuilderStore';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

export function SparklineWidget({
  config,
  nodeId,
  pollIntervalMs = 60000,
  isEditMode,
}: {
  config: WidgetConfig;
  nodeId?: string;
  pollIntervalMs?: number;
  isEditMode?: boolean;
}) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deviceKey = config.config.deviceKey;
  const strokeColor = config.config.strokeColor || "#22c55e"; // default to a green
  const unit = config.config.unit;

  const fetchData = useCallback(async () => {
    if (isEditMode || !nodeId || !deviceKey) return;

    setIsLoading(true);
    try {
      const apiKey = import.meta.env.VITE_ANEDYA_API_KEY;
      const now = Math.floor(Date.now() / 1000);
      const from = 1704070800; // Last 24 hours
      const to = now;

      const res = await fetch("https://api.anedya.io/v1/data/getData", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nodes: [nodeId],
          variable: deviceKey,
          from: from,
          to: to,
          order: "desc",
          limit: 1000,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch sparkline data");
      }

      const pjson = await res.json();
      if (pjson?.data?.[nodeId]) {
        const series = pjson.data[nodeId].map((p: any) => ({
          time: p.timestamp,
          [deviceKey]: +(Number(p.value).toFixed(1)),
        })).reverse();
        setData(series);
      } else {
        setData([]);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [nodeId, deviceKey, isEditMode]);

  useEffect(() => {
    fetchData();

    if (pollIntervalMs > 0) {
      const interval = setInterval(fetchData, pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchData, pollIntervalMs]);

  const stats = useMemo(() => {
    if (!data || data.length === 0 || !deviceKey) return null;

    // Data is ordered asc, so first is [0], last is [length-1]
    const firstVal = data[0][deviceKey];
    const lastVal = data[data.length - 1][deviceKey];

    let diff = null;
    let diffPercent = null;
    let isPositive = false;

    if (firstVal !== undefined && lastVal !== undefined) {
      diff = lastVal - firstVal;
      isPositive = diff >= 0;
      if (firstVal !== 0) {
        diffPercent = Math.abs((diff / firstVal) * 100).toFixed(1);
      } else {
        diffPercent = diff === 0 ? "0.0" : "100.0"; // fallback if firstVal was 0
      }
    }

    return {
      last: lastVal,
      diff: diff !== null ? Math.abs(diff).toFixed(1) : null,
      diffPercent,
      isPositive,
    };
  }, [data, deviceKey]);

  return (
    <Card className="w-full h-full flex flex-col bg-card overflow-hidden border shadow-sm hover:border-primary transition-colors cursor-default">
      <CardHeader className="pb-2 pt-3 px-4 border-b flex-none z-10 relative">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Activity className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate" title={config.title}>{config.title}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col relative h-full">
        {isEditMode ? (
          <div className="flex flex-col h-full w-full p-4 relative overflow-hidden group">
            {/* Mock Content */}
            <div className="flex-1 flex flex-col items-center justify-center mt-7 relative z-10">
              <div className="flex items-baseline gap-1 opacity-90">
                <span className="text-5xl font-extrabold tracking-tight" style={{ color: strokeColor }}>
                  42
                </span>
                <span className="text-lg font-bold text-muted-foreground/80">
                  {unit || 'unit'}
                </span>
              </div>
              <div className="flex items-center text-xs font-bold px-2 py-0.5 mt-2 text-green-500 opacity-90">
                <ArrowUp className="w-3 h-3 mr-1" strokeWidth={3} />
                <span>12.5%</span>
              </div>
            </div>

            {/* Bottom Offset for Graph space */}
            <div className="h-10" />

            {/* Mock Sparkline background */}
            <div className="absolute bottom-0 left-0 right-0 h-[50%] pointer-events-none opacity-20 z-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { v: 30 }, { v: 45 }, { v: 35 }, { v: 60 }, { v: 40 }, { v: 55 }, { v: 50 }
                ]}>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={strokeColor}
                    fill={strokeColor}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Overlay Label
            <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px] z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-background border border-border px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Sparkline Preview</span>
              </div>
            </div> */}
          </div>
        ) : isLoading && data.length === 0 ? (
          <div className="absolute inset-0 p-4 shrink-0 h-full">
            <Skeleton className="w-full h-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm shrink-0 h-full">
            No data available
          </div>
        ) : (
          <div className="flex flex-col h-full w-full p-4 relative z-10">
            {/* Middle Section: Value */}
            <div className="flex-1 flex flex-col items-center justify-center mt-7">
              <div className="flex items-baseline gap-1">
                <span
                  className="text-5xl font-extrabold tracking-tight drop-shadow-sm transition-all"
                  style={{ color: strokeColor }}
                >
                  {stats?.last ?? "-"}
                </span>
                {unit && (
                  <span className="text-lg font-bold text-muted-foreground/80">
                    {unit}
                  </span>
                )}
              </div>

              {/* Trend Section */}
              {stats?.diffPercent !== null && (
                <div
                  className={`flex items-center text-xs font-bold px-2 py-0.5 mt-2 ${stats?.isPositive ? "text-green-500" : "text-red-500"
                    }`}
                >
                  {stats?.isPositive ? (
                    <ArrowUp className="w-3 h-3 mr-1" strokeWidth={3} />
                  ) : (
                    <ArrowDown className="w-3 h-3 mr-1" strokeWidth={3} />
                  )}
                  <span>
                    {stats?.isPositive ? "" : "-"}
                    {stats?.diffPercent}%
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Offset for Graph space */}
            <div className="h-10" />
          </div>
        )}

        {/* Sparkline background - Confined to bottom 50% */}
        {!isEditMode && data.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[50%] pointer-events-none opacity-50 z-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`sparkline-${deviceKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey={deviceKey || ""}
                  stroke={strokeColor}
                  fill={`url(#sparkline-${deviceKey})`}
                  strokeWidth={2.5}
                  isAnimationActive={false}
                  baseLine="0"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

