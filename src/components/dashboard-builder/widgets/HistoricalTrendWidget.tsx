import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Play, ArrowDownToLine } from 'lucide-react';
import { DatePickerWithRange } from '@/components/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { WidgetConfig } from '../../../store/useBuilderStore';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export function HistoricalTrendWidget({
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
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 1),
    to: new Date(),
  });
  const [isLive, setIsLive] = useState<boolean>(true);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deviceKey = config.config.deviceKey;
  const strokeColor = config.config.strokeColor || "hsl(var(--primary))";
  const unit = config.config.unit;
  
  const customRange = useMemo(() => {
    if (isLive || !date?.from) return null;
    const fromTime = new Date(date.from);
    const toTime = date.to ? new Date(date.to) : new Date(fromTime);
    return {
      from: Math.floor(fromTime.getTime() / 1000),
      to: Math.floor(toTime.getTime() / 1000),
    };
  }, [date, isLive]);

  const fetchData = useCallback(async () => {
    if (isEditMode || !nodeId || !deviceKey) return;

    setIsLoading(true);
    try {
      const apiKey = import.meta.env.VITE_ANEDYA_API_KEY;
      const now = Math.floor(Date.now() / 1000);
      const from = customRange ? customRange.from : now - 86400;
      const to = customRange ? customRange.to : now;

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
          limit: 0,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch historical data");
      }

      const pjson = await res.json();
      if (pjson?.data?.[nodeId]) {
        const series = pjson.data[nodeId].map((p: any) => ({
          time: new Date(p.timestamp * 1000).toLocaleString(undefined, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }),
          [deviceKey]: +(Number(p.value).toFixed(1)),
          timestamp: p.timestamp,
        }));
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
  }, [nodeId, deviceKey, customRange, isEditMode]);

  useEffect(() => {
    fetchData();

    if (!customRange && pollIntervalMs > 0) {
      const interval = setInterval(fetchData, pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchData, pollIntervalMs, customRange]);

  const handleLiveClick = () => {
    setIsLive(true);
    setDate({
      from: subDays(new Date(), 1),
      to: new Date(),
    });
  };

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    if (newDate?.from && newDate?.to) {
      setIsLive(false);
    }
  };

  const handleExport = () => {
    if (!data.length) return;
    const headers = ["Date-Time (ISO)", `${config.title} (${config.config.unit || ""})`];
    const csvRows = [headers.join(",")];

    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    sortedData.forEach(entry => {
      const isoTime = `"${entry.time.replace(/"/g, '""')}"`;
      csvRows.push(`${isoTime},${entry[deviceKey] ?? ""}`);
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", `${deviceKey}_historical_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Card className="w-full h-full flex flex-col hover:border-primary transition-colors cursor-default overflow-hidden">
      <CardHeader className="pb-3 pt-3 px-4 border-b flex-none bg-white z-10 relative">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-[50px] shrink-0">
            <Activity className="h-4 w-4 text-primary shrink-0" />
            <CardTitle className="text-sm font-medium truncate" title={config.title}>
              {config.title}
            </CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={isLive ? "default" : "outline"}
              size="sm"
              onClick={handleLiveClick}
              className="gap-2 h-9"
            >
              <Play className="h-3 w-3" />
              Live
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2 h-9"
              title="Export Data as CSV"
            >
              <ArrowDownToLine className="h-3 w-3" />
              Export
            </Button>
            <DatePickerWithRange date={date} setDate={handleDateChange} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 relative min-h-[150px]">
        {isEditMode ? (
           <div className="absolute inset-4 flex items-center justify-center bg-gray-50 text-gray-400 text-sm rounded outline-dashed outline-2 outline-gray-200">
             Historical Trend Preview
           </div>
        ) : isLoading && data.length === 0 ? (
          <div className="absolute inset-0 p-4">
            <Skeleton className="w-full h-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            No data available
          </div>
        ) : (
          <div className="absolute inset-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={`gradient-${deviceKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis
                  className="text-xs"
                  domain={['auto', 'auto']}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number) =>
                    unit ? [`${value} ${unit}`, config.title] : [value, config.title]
                  }
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold", marginBottom: "4px" }}
                />
                <Area
                  type="monotone"
                  dataKey={deviceKey || ""}
                  stroke={strokeColor}
                  strokeWidth={3}
                  fill={`url(#gradient-${deviceKey})`}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
