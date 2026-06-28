import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { WidgetConfig } from '@/store/useBuilderStore';
import { useValueStoreData } from '@/hooks/useValueStoreData';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, SlidersHorizontal, CalendarPlus, Pencil } from 'lucide-react';

interface SliderWidgetProps {
  config: WidgetConfig;
  nodeId?: string;
  pollIntervalMs?: number;
  isEditMode?: boolean;
}

export function SliderWidget({ config, nodeId, pollIntervalMs, isEditMode }: SliderWidgetProps) {
  const { role } = useAuth();
  const canWrite = role !== 'viewer';

  const key = config.config.deviceKey || '';
  const isMinDynamic = config.config.minLimitSource === 'valuestore';
  const isMaxDynamic = config.config.maxLimitSource === 'valuestore';
  
  const minLimitVs = useValueStoreData(nodeId, isMinDynamic ? config.config.minVsKey : undefined, pollIntervalMs);
  const maxLimitVs = useValueStoreData(nodeId, isMaxDynamic ? config.config.maxVsKey : undefined, pollIntervalMs);

  const min = isMinDynamic 
    ? (typeof minLimitVs.value === 'number' ? minLimitVs.value : config.config.min ?? 0) 
    : config.config.min ?? 0;
    
  const max = isMaxDynamic 
    ? (typeof maxLimitVs.value === 'number' ? maxLimitVs.value : config.config.max ?? 100) 
    : config.config.max ?? 100;
    
  const step = config.config.step ?? 1;
  const unit = config.config.unit || '';
  const color = config.config.color || '#0ea5e9';

  // State
  const vs = useValueStoreData(
    isEditMode || !key ? undefined : nodeId,
    isEditMode || !key ? undefined : key,
    pollIntervalMs
  );

  const [localValue, setLocalValue] = useState<number>(() => {
    return (max - min) / 2 + min; // Middle value for preview
  });

  const [isDragging, setIsDragging] = useState(false);

  // Sync local value when server value changes, unless dragging
  useEffect(() => {
    if (!isDragging && vs.value !== undefined && vs.value !== null) {
      setLocalValue(Number(vs.value));
    }
  }, [vs.value, isDragging]);

  const handleValueChange = (values: number[]) => {
    if (vs.isSetting) return; // Prevent drag if currently setting
    setIsDragging(true);
    setLocalValue(values[0]);
  };

  const handleValueCommit = async (values: number[]) => {
    setIsDragging(false);
    if (!canWrite || isEditMode || !key || !nodeId) return;

    const val = values[0];
    const dataType = config.config.dataType as 'string' | 'float' | undefined;

    // We send float by default for numbers, unless user specifies 'string'
    await vs.setValue(dataType === 'string' ? String(val) : val, dataType || 'float');
  };

  const hasData = isEditMode || vs.value !== undefined;

  // Format timestamps
  const fmtTs = (ts: number | null) => {
    if (!ts || ts === 0) return '--';
    return new Date(ts * 1000).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="w-full h-full flex flex-col hover:border-primary transition-colors overflow-hidden">
      <CardContent className="p-3 flex-1 flex flex-col min-h-0 gap-2">
        {/* Header */}
        <div className="flex items-center justify-between min-w-0 pb-1">
          <div className="flex items-center gap-2 overflow-hidden">
            <SlidersHorizontal size={14} className="text-muted-foreground shrink-0" />
            <span
              className="text-sm font-semibold text-foreground truncate leading-tight"
              title={config.title}
            >
              {config.title || 'Slider'}
            </span>
          </div>

          <div className="flex items-baseline gap-1 shrink-0 ml-2">
            <span
              className="text-lg font-bold tabular-nums"
              style={{ color }}
            >
              {Number(localValue).toFixed(Math.max(0, -Math.floor(Math.log10(step))))}
            </span>
            {unit && <span className="text-xs text-muted-foreground font-medium">{unit}</span>}
          </div>
        </div>

        {/* Slider Body */}
        <div className="flex-1 flex flex-col justify-center px-1">
          <div className="relative flex items-center">
            <Slider
              min={min}
              max={max}
              step={step}
              value={[localValue]}
              onValueChange={handleValueChange}
              onValueCommit={handleValueCommit}
              disabled={(!canWrite && !isEditMode) || vs.isSetting || (!hasData && !isEditMode)}
              className="py-2 cursor-pointer w-full"
              style={{
                // Quick hack to override root variables for shadcn slider if possible, 
                // but standard shadcn slider uses bg-primary. We'll add a CSS variable.
                '--primary': color,
              } as React.CSSProperties}
            />
            {vs.isSetting && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 w-full h-full rounded">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>
      </CardContent>

      {/* Footer / Timestamps */}
      {!isEditMode && (vs.modified) && (
        <div className="px-3 pb-2 flex flex-col gap-0.5 border-t pt-1.5 bg-muted/10 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Pencil className="h-3 w-3 shrink-0 text-amber-500" />
            <span className="truncate">
              Modified:&nbsp;
              <span className="font-medium text-foreground/70">{fmtTs(vs.modified)}</span>
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
