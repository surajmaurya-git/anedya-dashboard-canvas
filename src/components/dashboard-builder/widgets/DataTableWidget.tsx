import React from 'react';
import { WidgetConfig } from '@/store/useBuilderStore';
import { useDevices } from '@/hooks/useDevices';
import { useMultiNodeLatestData } from '@/hooks/useMultiNodeLatestData';
import { useDeviceHistoricalData } from '@/hooks/useDeviceHistoricalData';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, AlertTriangle, Table2, RefreshCw, Clock, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DataTableVariableColumn {
  id: string;
  label: string;
  variableKey: string;
  unit?: string;
  decimals?: number;
  thresholdEnabled?: boolean;
  thresholdWarning?: number;
  thresholdDanger?: number;
  thresholdMin?: number;
}

export interface DataTableWidgetConfig {
  title?: string;
  variables?: DataTableVariableColumn[];
  pageSize?: number;
  selectedNodeIds?: string[];
  refreshIntervalMs?: number;
}

interface DataTableWidgetProps {
  config: WidgetConfig;
  nodeId?: string;
  pollIntervalMs?: number;
  isEditMode?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCellValue(value: number | string | null | undefined, col: DataTableVariableColumn): string {
  if (value === null || value === undefined) return '—';
  const num = Number(value);
  if (!isNaN(num) && col.decimals !== undefined) return num.toFixed(col.decimals);
  return String(value);
}

function getCellColor(value: number | string | null | undefined, col: DataTableVariableColumn): string {
  if (!col.thresholdEnabled || value === null || value === undefined) return '';
  const num = Number(value);
  if (isNaN(num)) return '';
  if (col.thresholdDanger !== undefined && num >= col.thresholdDanger) return 'text-red-400 font-medium';
  if (col.thresholdWarning !== undefined && num >= col.thresholdWarning) return 'text-amber-400 font-medium';
  if (col.thresholdMin !== undefined && num <= col.thresholdMin) return 'text-sky-400 font-medium';
  return 'text-emerald-400';
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

// ─── Shared Table Header ──────────────────────────────────────────────────────

function TableHeader({ firstColLabel, variables }: {
  firstColLabel: string;
  variables: DataTableVariableColumn[];
}) {
  return (
    <thead className="sticky top-0 z-10">
      <tr className="bg-muted/25 backdrop-blur-sm border-b border-border/60">
        <th className="text-left px-3 py-2 whitespace-nowrap">
          <span className="text-xs font-semibold text-muted-foreground">{firstColLabel}</span>
        </th>
        {variables.map((col) => (
          <th key={col.id} className="text-right px-3 py-2 whitespace-nowrap">
            <span className="text-xs font-semibold text-muted-foreground">
              {col.label}
              {col.unit && <span className="ml-1 text-[10px] font-normal opacity-60">({col.unit})</span>}
            </span>
          </th>
        ))}
      </tr>
    </thead>
  );
}

// ─── Home Mode ───────────────────────────────────────────────────────────────

interface HomeTableProps { cfg: DataTableWidgetConfig; pollIntervalMs?: number; }

function HomeDataTable({ cfg, pollIntervalMs }: HomeTableProps) {
  const { data: allDevices = [], isLoading: devicesLoading } = useDevices();
  const variables = cfg.variables ?? [];

  const devices = (cfg.selectedNodeIds && cfg.selectedNodeIds.length > 0)
    ? allDevices.filter(d => cfg.selectedNodeIds!.includes(d.node_id))
    : allDevices;

  const nodeIds = devices.map(d => d.node_id);
  const col0 = useMultiNodeLatestData(nodeIds, variables[0]?.variableKey, pollIntervalMs);
  const col1 = useMultiNodeLatestData(nodeIds, variables[1]?.variableKey, pollIntervalMs);
  const col2 = useMultiNodeLatestData(nodeIds, variables[2]?.variableKey, pollIntervalMs);
  const col3 = useMultiNodeLatestData(nodeIds, variables[3]?.variableKey, pollIntervalMs);
  const col4 = useMultiNodeLatestData(nodeIds, variables[4]?.variableKey, pollIntervalMs);
  const col5 = useMultiNodeLatestData(nodeIds, variables[5]?.variableKey, pollIntervalMs);
  const colDataArr = [col0, col1, col2, col3, col4, col5];

  const isRefreshing = colDataArr.slice(0, variables.length).some(c => c.isLoading);

  if (devicesLoading) {
    return (
      <div className="p-4 space-y-2">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-md" />)}
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-10">
        <Layers className="h-8 w-8 opacity-20" />
        <span className="text-xs">No devices found</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto relative">
      {isRefreshing && (
        <div className="absolute top-3 right-3 z-20">
          <RefreshCw className="h-3 w-3 text-primary/60 animate-spin" />
        </div>
      )}
      <table className="w-full border-collapse">
        <TableHeader firstColLabel="Device" variables={variables} />
        <tbody className="divide-y divide-border/30">
          {devices.map((device, rowIdx) => (
            <tr
              key={device.id}
              className={cn(
                'transition-colors group hover:bg-primary/5',
                rowIdx % 2 === 0 ? '' : 'bg-muted/5'
              )}
            >
              <td className="px-4 py-2.5 whitespace-nowrap max-w-[200px]">
                <span className="text-xs font-medium text-foreground truncate block" title={device.title}>
                  {device.title || device.node_id}
                </span>
              </td>
              {variables.map((col, colIdx) => {
                const nodeValue = colDataArr[colIdx]?.data?.[device.node_id];
                const val = nodeValue?.value;
                const formatted = formatCellValue(val, col);
                const colorClass = getCellColor(val, col);
                const isEmpty = val === null || val === undefined;
                return (
                  <td
                    key={col.id}
                    className={cn(
                      'px-4 py-2.5 text-right tabular-nums whitespace-nowrap text-xs',
                      isEmpty ? 'text-muted-foreground/30' : colorClass || 'text-foreground'
                    )}
                  >
                    {formatted}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Device Mode ─────────────────────────────────────────────────────────────

interface DeviceTableProps { cfg: DataTableWidgetConfig; nodeId: string; pollIntervalMs?: number; }

function DeviceDataTable({ cfg, nodeId, pollIntervalMs }: DeviceTableProps) {
  const variables = cfg.variables ?? [];
  const pageSize = cfg.pageSize ?? 20;

  const { rows, isLoading, error, page, totalPages, hasNext, hasPrev, goNext, goPrev } =
    useDeviceHistoricalData({ nodeId, variables, pageSize, pollIntervalMs });

  if (variables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-10">
        <Table2 className="h-8 w-8 opacity-20" />
        <span className="text-xs italic">No variables configured</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-auto relative">
        {isLoading && (
          <div className="absolute top-3 right-3 z-20">
            <RefreshCw className="h-3 w-3 text-primary/60 animate-spin" />
          </div>
        )}
        <table className="w-full border-collapse">
          <TableHeader firstColLabel="Timestamp" variables={variables} />
          <tbody className="divide-y divide-border/30">
            {isLoading && rows.length === 0
              ? [...Array(Math.min(pageSize, 5))].map((_, i) => (
                <tr key={i} className={cn(i % 2 !== 0 ? 'bg-muted/5' : '')}>
                  <td className="px-4 py-2.5"><Skeleton className="h-3.5 w-32 rounded" /></td>
                  {variables.map((col) => (
                    <td key={col.id} className="px-4 py-2.5 text-right">
                      <Skeleton className="h-3.5 w-16 ml-auto rounded" />
                    </td>
                  ))}
                </tr>
              ))
              : rows.map((row, rowIdx) => (
                <tr
                  key={row.timestamp}
                  className={cn(
                    'transition-colors hover:bg-primary/5',
                    rowIdx % 2 === 0 ? '' : 'bg-muted/5'
                  )}
                >
                  <td className="px-4 py-2.5 text-xs text-muted-foreground/60 whitespace-nowrap font-mono">
                    {formatTimestamp(row.timestamp)}
                  </td>
                  {variables.map((col) => {
                    const val = row.values[col.variableKey];
                    const formatted = formatCellValue(val, col);
                    const colorClass = getCellColor(val, col);
                    const isEmpty = val === null || val === undefined;
                    return (
                      <td
                        key={col.id}
                        className={cn(
                          'px-4 py-2.5 text-right tabular-nums text-xs whitespace-nowrap',
                          isEmpty ? 'text-muted-foreground/30' : colorClass || 'text-foreground'
                        )}
                      >
                        {formatted}
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>

        {!isLoading && rows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
            <Table2 className="h-8 w-8 opacity-20" />
            <span className="text-xs">No data available</span>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/50 flex-none bg-muted/10">
        <span className="text-[11px] text-muted-foreground/60 tabular-nums">
          Page <span className="text-foreground/70 font-medium">{page + 1}</span> / {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded" disabled={!hasPrev || isLoading} onClick={goPrev}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded" disabled={!hasNext || isLoading} onClick={goNext}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export function DataTableWidget({ config, nodeId, pollIntervalMs, isEditMode }: DataTableWidgetProps) {
  const cfg: DataTableWidgetConfig = config.config ?? {};
  const variables = cfg.variables ?? [];
  const mode: 'home' | 'device' = nodeId ? 'device' : 'home';
  const effectivePollMs = isEditMode ? 0 : (pollIntervalMs ?? cfg.refreshIntervalMs ?? 0);

  const headerContent = (
    <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2.5 flex-none bg-muted/20">
      <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 flex-none">
        <Table2 className="h-3.5 w-3.5 text-primary/70" />
      </div>
      <span className="text-sm font-semibold truncate text-foreground/90">
        {config.title || 'Data Table'}
      </span>

    </div>
  );

  if (isEditMode) {
    return (
      <div className="w-full h-full flex flex-col bg-card text-card-foreground rounded-lg border border-border/60 overflow-hidden">
        {headerContent}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse">
            <TableHeader firstColLabel={mode === 'device' ? 'Timestamp' : 'Device'} variables={variables} />
            <tbody className="divide-y divide-border/30">
              {[...Array(3)].map((_, i) => (
                <tr key={i} className={cn(i % 2 !== 0 ? 'bg-muted/5' : '')}>
                  <td className="px-4 py-2.5"><Skeleton className="h-3.5 w-28 rounded" /></td>
                  {(variables.length > 0 ? variables : [1, 2, 3]).map((_, j) => (
                    <td key={j} className="px-4 py-2.5 text-right">
                      <Skeleton className="h-3.5 w-14 ml-auto rounded" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {variables.length === 0 && (
            <div className="flex items-center justify-center py-6">
              <span className="text-[11px] text-muted-foreground/40 italic">Add variable columns in Properties →</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-card text-card-foreground rounded-lg border border-border/60 overflow-hidden">
      {headerContent}
      <div className="flex-1 overflow-hidden">
        {mode === 'home'
          ? <HomeDataTable cfg={cfg} pollIntervalMs={effectivePollMs} />
          : <DeviceDataTable cfg={cfg} nodeId={nodeId!} pollIntervalMs={effectivePollMs} />
        }
      </div>
    </div>
  );
}
