import React from 'react';
import { Card } from '@/components/ui/card';
import { WidgetConfig } from '../../../store/useBuilderStore';
import GaugeWidget from './GaugeWidget';
import { HistoricalTrendWidget } from './HistoricalTrendWidget';
import { AgrrChartWidget } from './AgrrChartWidget';
import { AggregateGoalWidget } from './AggregateGoalWidget';
import { ValueDisplayWidget } from './ValueDisplayWidget';
import { ValueStoreWidget } from './ValueStoreWidget';
import { DonutChartWidget } from './DonutChartWidget';
import { ToggleSwitchWidget } from './ToggleSwitchWidget';
import { BatteryWidget } from './BatteryWidget';
import { SliderWidget } from './SliderWidget';
import { TankWidget } from './TankWidget';
import { SparklineWidget } from './SparklineWidget';
import { MapWidget } from './MapWidget';
import CameraViewerWidget from './CameraViewerWidget';
import { useWidgetData } from '@/hooks/useWidgetData';
import { AlertTriangle, HelpCircle, FileQuestion } from 'lucide-react';

interface WidgetRendererProps {
  config: WidgetConfig;
  nodeId?: string;
  pollIntervalMs?: number;
  isEditMode?: boolean;
  w?: number;
  h?: number;
}

function GaugeWidgetRuntime({
  config,
  nodeId,
  pollIntervalMs,
  isEditMode,
}: {
  config: WidgetConfig;
  nodeId?: string;
  pollIntervalMs?: number;
  isEditMode?: boolean;
}) {
  const { value, timestamp } = useWidgetData(
    isEditMode ? undefined : nodeId,
    isEditMode ? undefined : config.config.deviceKey,
    pollIntervalMs
  );

  return (
    <GaugeWidget
      config={config.config}
      title={config.title}
      value={isEditMode ? undefined : value}
      timestamp={timestamp ?? undefined}
    />
  );
}

export default function WidgetRenderer(props: WidgetRendererProps) {
  const { config, nodeId, pollIntervalMs, isEditMode, w, h } = props;

  if (!config) {
    return (
      <Card className="w-full h-full flex flex-col items-center justify-center bg-destructive/5 border-destructive/20 text-destructive p-4 min-h-[100px]">
        <AlertTriangle className="h-8 w-8 mb-2 opacity-40" />
        <span className="text-xs font-bold uppercase tracking-tighter opacity-80">Invalid Configuration</span>
      </Card>
    );
  }

  const resolvedNodeId = config.config?.nodeId || nodeId;

  switch (config.type) {
    case 'GaugeWidget':
      return (
        <GaugeWidgetRuntime
          config={config}
          nodeId={resolvedNodeId}
          pollIntervalMs={pollIntervalMs}
          isEditMode={isEditMode}
        />
      );
    case 'HistoricalTrendWidget':
      return (
        <HistoricalTrendWidget
          config={config}
          nodeId={resolvedNodeId}
          pollIntervalMs={pollIntervalMs}
          isEditMode={isEditMode}
          w={w}
          h={h}
        />
      );
    case 'AgrrChartWidget':
      return (
        <AgrrChartWidget
          config={config}
          nodeId={resolvedNodeId}
          pollIntervalMs={pollIntervalMs}
          isEditMode={isEditMode}
          w={w}
          h={h}
        />
      );
    case 'AggregateGoalWidget':
      return (
        <AggregateGoalWidget
          config={config}
          nodeId={resolvedNodeId}
          pollIntervalMs={pollIntervalMs}
          isEditMode={isEditMode}
          w={w}
          h={h}
        />
      );
    case 'ValueDisplayWidget':
      return (
        <ValueDisplayWidget
          config={config}
          nodeId={resolvedNodeId}
          pollIntervalMs={pollIntervalMs}
          isEditMode={isEditMode}
        />
      );
    case 'ValueStoreWidget':
      return (
        <ValueStoreWidget
          config={config}
          nodeId={resolvedNodeId}
          pollIntervalMs={pollIntervalMs}
          isEditMode={isEditMode}
        />
      );
    case 'DonutChartWidget':
      return (
        <DonutChartWidget
          config={config}
          nodeId={resolvedNodeId}
          pollIntervalMs={pollIntervalMs}
          isEditMode={isEditMode}
        />
      );
    case 'ToggleSwitchWidget':
      return (
        <ToggleSwitchWidget
          config={config}
          nodeId={resolvedNodeId}
          pollIntervalMs={pollIntervalMs}
          isEditMode={isEditMode}
        />
      );
    case 'BatteryWidget':
      return (
        <BatteryWidget
          config={config}
          nodeId={resolvedNodeId}
          pollIntervalMs={pollIntervalMs}
          isEditMode={isEditMode}
        />
      );
    case 'SliderWidget':
      return (
        <SliderWidget
          config={config}
          nodeId={resolvedNodeId}
          pollIntervalMs={pollIntervalMs}
          isEditMode={isEditMode}
        />
      );
    case 'TankWidget':
      return (
        <TankWidget
          config={config}
          nodeId={resolvedNodeId}
          pollIntervalMs={pollIntervalMs}
          isEditMode={isEditMode}
        />
      );
    case 'SparklineWidget':
      return (
        <SparklineWidget
          config={config}
          nodeId={resolvedNodeId}
          pollIntervalMs={pollIntervalMs}
          isEditMode={isEditMode}
        />
      );
    case 'MapWidget':
      return (
        <MapWidget
          config={config}
          nodeId={resolvedNodeId}
          pollIntervalMs={pollIntervalMs}
          isEditMode={isEditMode}
        />
      );
    case 'CameraViewerWidget':
      return (
        <CameraViewerWidget
          config={config}
          nodeId={resolvedNodeId}
          isEditMode={isEditMode}
        />
      );
    default:
      return (
        <Card className="w-full h-full flex flex-col items-center justify-center bg-muted/20 border-dashed border-2 border-muted-foreground/10 text-muted-foreground p-4 min-h-[100px]">
          <FileQuestion className="h-10 w-10 mb-3 opacity-20" />
          <div className="text-center group">
            <p className="text-xs font-bold text-muted-foreground/60 mb-2 uppercase tracking-widest text-balance">
              Unsupported Widget
            </p>
            <div className="inline-flex items-center gap-1.5 bg-background/50 px-3 py-1 rounded-full border border-border shadow-sm mb-3">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-foreground/70">
                {String(config.type)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[180px] mx-auto italic opacity-70">
              Kindly sync your cloned repository on GitHub.
            </p>
          </div>
        </Card>
      );
  }
}
