import React from 'react';
import { Card } from '@/components/ui/card';
import { WidgetConfig } from '../../../store/useBuilderStore';
import GaugeWidget from './GaugeWidget';
import { HistoricalTrendWidget } from './HistoricalTrendWidget';
import { ValueDisplayWidget } from './ValueDisplayWidget';
import { ValueStoreWidget } from './ValueStoreWidget';
import { DonutChartWidget } from './DonutChartWidget';
import { ToggleSwitchWidget } from './ToggleSwitchWidget';
import { BatteryWidget } from './BatteryWidget';
import { useWidgetData } from '@/hooks/useWidgetData';

interface WidgetRendererProps {
  config: WidgetConfig;
  nodeId?: string;
  pollIntervalMs?: number;
  isEditMode?: boolean;
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
  const { config, nodeId, pollIntervalMs, isEditMode } = props;

  if (!config) {
    return <div className="p-4 opacity-50 bg-muted rounded text-muted-foreground">Invalid Widget</div>;
  }

  switch (config.type) {
    case 'GaugeWidget':
      return (
        <GaugeWidgetRuntime
          config={config}
          nodeId={nodeId}
          pollIntervalMs={pollIntervalMs}
          isEditMode={isEditMode}
        />
      );
    case 'HistoricalTrendWidget':
      return (
        <HistoricalTrendWidget
          config={config}
          nodeId={nodeId}
          pollIntervalMs={pollIntervalMs}
          isEditMode={isEditMode}
        />
      );
    case 'ValueDisplayWidget':
      return (
        <ValueDisplayWidget
          config={config}
          nodeId={nodeId}
          pollIntervalMs={pollIntervalMs}
          isEditMode={isEditMode}
        />
      );
    case 'ValueStoreWidget':
      return (
        <ValueStoreWidget
          config={config}
          nodeId={nodeId}
          pollIntervalMs={pollIntervalMs}
          isEditMode={isEditMode}
        />
      );
    case 'DonutChartWidget':
      return (
        <DonutChartWidget
          config={config}
          nodeId={nodeId}
          pollIntervalMs={pollIntervalMs}
          isEditMode={isEditMode}
        />
      );
    case 'ToggleSwitchWidget':
      return (
        <ToggleSwitchWidget
          config={config}
          nodeId={nodeId}
          pollIntervalMs={pollIntervalMs}
          isEditMode={isEditMode}
        />
      );
    case 'BatteryWidget':
      return (
        <BatteryWidget
          config={config}
          nodeId={nodeId}
          pollIntervalMs={pollIntervalMs}
          isEditMode={isEditMode}
        />
      );
    default:
      return (
        <Card className="w-full h-full flex items-center justify-center bg-muted/30 text-muted-foreground">
          Unknown Widget: {config.type}
        </Card>
      );
  }
}
