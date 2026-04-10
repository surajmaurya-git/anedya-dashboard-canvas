import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Clock, CalendarPlus, Pencil, Loader2 } from 'lucide-react';
import { WidgetConfig } from '@/store/useBuilderStore';
import { useValueStoreData } from '@/hooks/useValueStoreData';
import { useWidgetData } from '@/hooks/useWidgetData';
import { useAuth } from '@/contexts/AuthContext';

interface ValueStoreWidgetProps {
  config: WidgetConfig;
  nodeId?: string;
  pollIntervalMs?: number;
  isEditMode?: boolean;
}

/**
 * ValueStore Widget — fetches the current value of a key,
 * displays it in an editable input, and allows setting a new value.
 * Shows Created and Modified timestamps.
 *
 * Supports two data sources:
 *   - "valuestore" (default): read/write via ValueStore API
 *   - "variable": read-only via latest Data API (Set button disabled)
 */
export function ValueStoreWidget({ config, nodeId, pollIntervalMs, isEditMode }: ValueStoreWidgetProps) {
  const { role } = useAuth();
  const vsKey = config.config.deviceKey || '';
  const dataSource = config.config.dataSource || 'valuestore';

  // ── ValueStore source (read + write) ──
  const vs = useValueStoreData(
    isEditMode || dataSource !== 'valuestore' ? undefined : nodeId,
    isEditMode || dataSource !== 'valuestore' ? undefined : vsKey,
    dataSource === 'valuestore' ? pollIntervalMs : 0
  );

  // ── Variable source (read-only) ──
  const vr = useWidgetData(
    isEditMode || dataSource !== 'variable' ? undefined : nodeId,
    isEditMode || dataSource !== 'variable' ? undefined : vsKey,
    dataSource === 'variable' ? pollIntervalMs : 0
  );

  // Pick the active data
  const isLoading = dataSource === 'valuestore' ? vs.isLoading : vr.isLoading;
  const activeValue = dataSource === 'valuestore' ? vs.value : vr.value;
  const canWrite = dataSource === 'valuestore' && role !== 'viewer'; // Only ValueStore supports writing, and viewers cannot write

  const [inputValue, setInputValue] = useState('');
  const unit = config.config.unit || '';

  // Sync input when fetched value changes
  useEffect(() => {
    if (activeValue !== null && activeValue !== undefined) {
      setInputValue(String(activeValue));
    }
  }, [activeValue]);

  const handleSet = async () => {
    if (!vsKey || isEditMode || !canWrite) return;
    await vs.setValue(inputValue);
  };

  const formatTimestamp = (ts: number | null) => {
    if (!ts || ts === 0) return '--';
    return new Date(ts * 1000).toLocaleString();
  };

  // For variable source, Anedya also returns epoch seconds
  const formatVariableTimestamp = (ts: number | null) => {
    if (!ts) return '--';
    return new Date(ts * 1000).toLocaleString();
  };

  return (
    <Card className="w-full h-full flex flex-col hover:border-primary transition-colors cursor-default overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4 border-b flex-none">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Settings className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate" title={config.title}>{config.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col justify-between gap-3">
        {isEditMode ? (
          /* ── Edit / Preview Mode ── */
          <div className="flex flex-col gap-3 flex-1 justify-center">
            <div className="flex gap-2 items-center">
              <Input
                value="sample_value"
                disabled
                className="h-9 text-sm flex-1"
                placeholder="Value..."
              />
              <span className="text-xs text-muted-foreground shrink-0">{unit}</span>
              <Button size="sm" className="h-9 px-4" disabled>
                Set
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarPlus className="h-3 w-3 shrink-0" />
                <span>Created: --</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Pencil className="h-3 w-3 shrink-0" />
                <span>Modified: --</span>
              </div>
            </div>
          </div>
        ) : isLoading && activeValue === null ? (
          /* ── Loading State ── */
          <div className="flex flex-col gap-3 flex-1 justify-center">
            <Skeleton className="h-9 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ) : (
          /* ── Live State ── */
          <div className="flex flex-col gap-3 flex-1 justify-center">
            <div className="flex gap-2 items-center">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="h-9 text-sm flex-1"
                placeholder="Enter value..."
                readOnly={!canWrite}
              />
              {unit && (
                <span className="text-xs text-muted-foreground shrink-0 font-medium">{unit}</span>
              )}
              <Button
                size="sm"
                className="h-9 px-4"
                onClick={handleSet}
                disabled={vs.isSetting || !canWrite}
                title={!canWrite ? (dataSource !== 'valuestore' ? 'Set is only available with ValueStore source' : 'Viewers cannot set values') : ''}
              >
                {vs.isSetting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Set'
                )}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {dataSource === 'valuestore' ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <CalendarPlus className="h-3 w-3 shrink-0 text-green-500" />
                    <span className="truncate">Created: {formatTimestamp(vs.created)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Pencil className="h-3 w-3 shrink-0 text-amber-500" />
                    <span className="truncate">Modified: {formatTimestamp(vs.modified)}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 shrink-0 text-blue-500" />
                  <span className="truncate">Last Updated: {formatVariableTimestamp(vr.timestamp)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
