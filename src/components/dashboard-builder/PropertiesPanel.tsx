import React, { useState, useEffect } from 'react';
import { useBuilderStore } from '../../store/useBuilderStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Palette, ChevronDown, ChevronUp } from 'lucide-react';
import type { ValueMapping } from './widgets/ValueDisplayWidget';
import type { DonutSeries } from './widgets/DonutChartWidget';

export default function PropertiesPanel() {
  const { selectedWidgetId, widgets, updateWidgetTitle, updateWidgetConfig } = useBuilderStore();

  const widget = selectedWidgetId ? widgets[selectedWidgetId] : null;

  const [draftTitle, setDraftTitle] = useState('');
  const [draftConfig, setDraftConfig] = useState<any>({});

  useEffect(() => {
    if (widget) {
      setDraftTitle(widget.title);
      setDraftConfig(widget.config);
    }
  }, [selectedWidgetId]); // Reset draft when selection changes

  if (!selectedWidgetId || !widget) {
    return (
      <div className="w-72 border-l bg-card p-4 text-center text-sm text-muted-foreground h-full flex items-center justify-center">
        Select a component to edit its properties
      </div>
    );
  }

  const handleConfigChange = (updates: any) => {
    const newConfig = { ...draftConfig, ...updates };
    setDraftConfig(newConfig);
    updateWidgetConfig(selectedWidgetId, newConfig);
  };

  const handleTitleChange = (newTitle: string) => {
    setDraftTitle(newTitle);
    updateWidgetTitle(selectedWidgetId, newTitle);
  };

  return (
    <div className="w-72 border-l bg-card flex flex-col h-full">
      <div className="p-4 border-b font-medium bg-background">
        Properties
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        <div className="space-y-2">
          <Label>Widget Type</Label>
          <div className="text-sm px-3 py-2 bg-muted rounded text-muted-foreground font-mono">
            {widget.type}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={draftTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Variable / Key</Label>
          <Input
            placeholder="e.g. temperature"
            value={draftConfig.deviceKey || ''}
            onChange={(e) => handleConfigChange({ deviceKey: e.target.value })}
          />
          {/* <p className="text-xs text-muted-foreground">The identifier in the Anedya API response</p> */}
        </div>

        {/* Dynamic fields based on type */}
        {widget.type === 'GaugeWidget' && (
          <>
            <div className="space-y-2">
              <Label>Unit symbol</Label>
              <Input
                placeholder="e.g. °C, %"
                value={draftConfig.unit || ''}
                onChange={(e) => handleConfigChange({ unit: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Minimum Value</Label>
              <Input
                type="number"
                placeholder="e.g. -50"
                value={draftConfig.min !== undefined ? draftConfig.min : ''}
                onChange={(e) => handleConfigChange({ min: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum Value</Label>
              <Input
                type="number"
                placeholder="e.g. 50"
                value={draftConfig.max !== undefined ? draftConfig.max : ''}
                onChange={(e) => handleConfigChange({ max: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </>
        )}

        {widget.type === 'HistoricalTrendWidget' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Unit symbol</Label>
              <Input
                placeholder="e.g. °C, %"
                value={draftConfig.unit || ''}
                onChange={(e) => handleConfigChange({ unit: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Stroke Color</Label>
              <Input
                type="color"
                className="h-8 px-2"
                value={draftConfig.strokeColor || '#0ea5e9'}
                onChange={(e) => handleConfigChange({ strokeColor: e.target.value })}
              />
            </div>
            <div className="space-y-3 pt-2 border-t text-sm">
              <Label>Display Options</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showLatest"
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                  checked={draftConfig.showLatest !== false}
                  onChange={(e) => handleConfigChange({ showLatest: e.target.checked })}
                />
                <Label htmlFor="showLatest" className="font-normal cursor-pointer text-sm">Show Latest Value</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showMin"
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                  checked={draftConfig.showMin !== false}
                  onChange={(e) => handleConfigChange({ showMin: e.target.checked })}
                />
                <Label htmlFor="showMin" className="font-normal cursor-pointer text-sm">Show Min Value</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showAvg"
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                  checked={draftConfig.showAvg !== false}
                  onChange={(e) => handleConfigChange({ showAvg: e.target.checked })}
                />
                <Label htmlFor="showAvg" className="font-normal cursor-pointer text-sm">Show Average Value</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showMax"
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                  checked={draftConfig.showMax !== false}
                  onChange={(e) => handleConfigChange({ showMax: e.target.checked })}
                />
                <Label htmlFor="showMax" className="font-normal cursor-pointer text-sm">Show Max Value</Label>
              </div>
            </div>
          </div>
        )}

        {widget.type === 'ValueDisplayWidget' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data Source</Label>
              <Select
                value={draftConfig.dataSource || 'valuestore'}
                onValueChange={(val) => handleConfigChange({ dataSource: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="valuestore">Valuestore</SelectItem>
                  <SelectItem value="variable">Variable</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {(draftConfig.dataSource || 'valuestore') === 'valuestore'
                  ? 'Fetches value from Anedya ValueStore API'
                  : 'Fetches latest data point from Anedya Data API'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Unit symbol</Label>
              <Input
                placeholder="e.g. °C, %"
                value={draftConfig.unit || ''}
                onChange={(e) => handleConfigChange({ unit: e.target.value })}
              />
            </div>

            {/* ── Value Mappings ── */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5" />
                  Value Mappings
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const current: ValueMapping[] = draftConfig.valueMappings || [];
                    handleConfigChange({
                      valueMappings: [
                        ...current,
                        { id: `m-${Date.now()}`, operator: '==', compareValue: '', displayText: '', color: '' },
                      ],
                    });
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Rule
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Show custom text when the value matches a condition. Rules are checked top-to-bottom; first match wins.
              </p>

              {(draftConfig.valueMappings as ValueMapping[] || []).map((mapping: ValueMapping, idx: number) => (
                <div key={mapping.id} className="border rounded-lg p-3 space-y-2 bg-muted/30 relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      const updated = (draftConfig.valueMappings as ValueMapping[]).filter(
                        (_: ValueMapping, i: number) => i !== idx
                      );
                      handleConfigChange({ valueMappings: updated });
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  <div className="flex gap-2 items-center pr-6">
                    <span className="text-xs text-muted-foreground shrink-0">If value</span>
                    <Select
                      value={mapping.operator}
                      onValueChange={(val) => {
                        const updated = [...(draftConfig.valueMappings as ValueMapping[])];
                        updated[idx] = { ...updated[idx], operator: val as ValueMapping['operator'] };
                        handleConfigChange({ valueMappings: updated });
                      }}
                    >
                      <SelectTrigger className="h-8 w-[80px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="==">==</SelectItem>
                        <SelectItem value="!=">!=</SelectItem>
                        <SelectItem value=">">&gt;</SelectItem>
                        <SelectItem value="<">&lt;</SelectItem>
                        <SelectItem value=">=">&gt;=</SelectItem>
                        <SelectItem value="<=">&lt;=</SelectItem>
                        <SelectItem value="contains">contains</SelectItem>
                        <SelectItem value="startsWith">starts with</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="h-8 text-xs flex-1"
                      placeholder="Compare value"
                      value={mapping.compareValue}
                      onChange={(e) => {
                        const updated = [...(draftConfig.valueMappings as ValueMapping[])];
                        updated[idx] = { ...updated[idx], compareValue: e.target.value };
                        handleConfigChange({ valueMappings: updated });
                      }}
                    />
                  </div>

                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-muted-foreground shrink-0">Show</span>
                    <Input
                      className="h-8 text-xs flex-1"
                      placeholder="Display text"
                      value={mapping.displayText}
                      onChange={(e) => {
                        const updated = [...(draftConfig.valueMappings as ValueMapping[])];
                        updated[idx] = { ...updated[idx], displayText: e.target.value };
                        handleConfigChange({ valueMappings: updated });
                      }}
                    />
                    <Input
                      type="color"
                      className="h-8 w-10 p-0.5 cursor-pointer"
                      title="Text color (optional)"
                      value={mapping.color || '#22c55e'}
                      onChange={(e) => {
                        const updated = [...(draftConfig.valueMappings as ValueMapping[])];
                        updated[idx] = { ...updated[idx], color: e.target.value };
                        handleConfigChange({ valueMappings: updated });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {widget.type === 'ValueStoreWidget' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data Source</Label>
              <Select
                value={draftConfig.dataSource || 'valuestore'}
                onValueChange={(val) => handleConfigChange({ dataSource: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="valuestore">Valuestore</SelectItem>
                  <SelectItem value="variable">Variable</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {(draftConfig.dataSource || 'valuestore') === 'valuestore'
                  ? 'Read & write via Anedya ValueStore API'
                  : 'Read-only from Anedya Data API (Set disabled)'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Unit symbol</Label>
              <Input
                placeholder="e.g. °C, seconds"
                value={draftConfig.unit || ''}
                onChange={(e) => handleConfigChange({ unit: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Optional unit label shown next to the input</p>
            </div>
          </div>
        )}

        {widget.type === 'DonutChartWidget' && (() => {
          const series: DonutSeries[] = draftConfig.series || [];
          const DEFAULT_COLORS = ['#38bdf8', '#22c55e', '#f59e0b', '#a78bfa'];

          const updateSeries = (updated: DonutSeries[]) =>
            handleConfigChange({ series: updated });

          const addSeries = () => {
            if (series.length >= 4) return;
            const next: DonutSeries = {
              id: `ds-${Date.now()}`,
              label: `Series ${series.length + 1}`,
              deviceKey: '',
              dataSource: 'valuestore',
              min: 0,
              max: 100,
              unit: '',
              color: DEFAULT_COLORS[series.length] || '#94a3b8',
            };
            updateSeries([...series, next]);
          };

          const removeSeries = (id: string) =>
            updateSeries(series.filter((s) => s.id !== id));

          const patchSeries = (id: string, patch: Partial<DonutSeries>) =>
            updateSeries(series.map((s) => (s.id === id ? { ...s, ...patch } : s)));

          return (
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5" />
                  Data Series
                  <span className="text-muted-foreground font-normal">({series.length}/4)</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={series.length >= 4}
                  onClick={addSeries}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Each series is an independent concentric ring. Max 4 series.
              </p>

              {series.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                  Click "Add" to add your first data series.
                </div>
              )}

              {/* Series cards */}
              {series.map((s, idx) => (
                <div
                  key={s.id}
                  className="border rounded-lg p-3 space-y-2.5 bg-muted/30 relative"
                  style={{ borderLeft: `3px solid ${s.color}` }}
                >
                  {/* Series header row */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: s.color }}
                    >
                      Ring {idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-destructive"
                      onClick={() => removeSeries(s.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Label */}
                  <div className="space-y-1">
                    <Label className="text-xs">Display Label</Label>
                    <Input
                      className="h-7 text-xs"
                      placeholder="e.g. Temperature"
                      value={s.label}
                      onChange={(e) => patchSeries(s.id, { label: e.target.value })}
                    />
                  </div>

                  {/* Data Source */}
                  <div className="space-y-1">
                    <Label className="text-xs">Data Source</Label>
                    <Select
                      value={s.dataSource}
                      onValueChange={(val) =>
                        patchSeries(s.id, { dataSource: val as 'variable' | 'valuestore' })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="valuestore">Valuestore</SelectItem>
                        <SelectItem value="variable">Variable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Device Key */}
                  <div className="space-y-1">
                    <Label className="text-xs">Variable / Key</Label>
                    <Input
                      className="h-7 text-xs"
                      placeholder="e.g. temperature"
                      value={s.deviceKey}
                      onChange={(e) => patchSeries(s.id, { deviceKey: e.target.value })}
                    />
                  </div>

                  {/* Min / Max */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Min</Label>
                      <Input
                        type="number"
                        className="h-7 text-xs"
                        placeholder="0"
                        value={s.min}
                        onChange={(e) =>
                          patchSeries(s.id, { min: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Max</Label>
                      <Input
                        type="number"
                        className="h-7 text-xs"
                        placeholder="100"
                        value={s.max}
                        onChange={(e) =>
                          patchSeries(s.id, { max: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>

                  {/* Unit + Color */}
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Unit</Label>
                      <Input
                        className="h-7 text-xs"
                        placeholder="%, °C …"
                        value={s.unit}
                        onChange={(e) => patchSeries(s.id, { unit: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Colour</Label>
                      <Input
                        type="color"
                        className="h-7 w-10 p-0.5 cursor-pointer"
                        value={s.color}
                        onChange={(e) => patchSeries(s.id, { color: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ── ToggleSwitchWidget ───────────────────────────────────── */}
        {widget.type === 'ToggleSwitchWidget' && (
          <div className="space-y-4">

            {/* ValueStore key */}
            <div className="space-y-2">
              <Label>ValueStore Key</Label>
              <Input
                placeholder="e.g. generator_state"
                value={draftConfig.deviceKey || ''}
                onChange={(e) => handleConfigChange({ deviceKey: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                The key in Anedya ValueStore that holds this toggle's state.
              </p>
            </div>

            {/* Data Type */}
            <div className="space-y-2">
              <Label>Expected Data Type</Label>
              <Select
                value={draftConfig.dataType || 'auto'}
                onValueChange={(val) => handleConfigChange({ dataType: val === 'auto' ? undefined : val })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Auto-detect" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect (Default)</SelectItem>
                  <SelectItem value="boolean">Boolean (true / false)</SelectItem>
                  <SelectItem value="float">Number</SelectItem>
                  <SelectItem value="string">String</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ON / OFF raw values */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Value when ON</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="1"
                  value={draftConfig.onValue ?? '1'}
                  onChange={(e) => handleConfigChange({ onValue: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Value when OFF</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="0"
                  value={draftConfig.offValue ?? '0'}
                  onChange={(e) => handleConfigChange({ offValue: e.target.value })}
                />
              </div>
            </div>

            {/* Status labels */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">Status Labels</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">ON label</Label>
                  <Input
                    className="h-8 text-xs"
                    placeholder="Active"
                    value={draftConfig.onLabel || ''}
                    onChange={(e) => handleConfigChange({ onLabel: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">OFF label</Label>
                  <Input
                    className="h-8 text-xs"
                    placeholder="Inactive"
                    value={draftConfig.offLabel || ''}
                    onChange={(e) => handleConfigChange({ offLabel: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* ON colour */}
            <div className="space-y-2 border-t pt-3">
              <Label className="flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" />
                ON Colour
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  className="h-8 w-12 p-0.5 cursor-pointer"
                  value={draftConfig.onColor || '#22c55e'}
                  onChange={(e) => handleConfigChange({ onColor: e.target.value })}
                />
                <span className="text-xs text-muted-foreground">
                  Used for the pill, status label, and glow effect when ON.
                </span>
              </div>
            </div>

          </div>
        )}

        {/* ── BatteryWidget ────────────────────────────────────────── */}
        {widget.type === 'BatteryWidget' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data Source</Label>
              <Select
                value={draftConfig.dataSource || 'valuestore'}
                onValueChange={(val) => handleConfigChange({ dataSource: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="valuestore">Valuestore</SelectItem>
                  <SelectItem value="variable">Variable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Min (0%)</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  placeholder="0"
                  value={draftConfig.min ?? '0'}
                  onChange={(e) => handleConfigChange({ 
                    min: e.target.value === '' ? undefined : Number(e.target.value) 
                  })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max (100%)</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  placeholder="100"
                  value={draftConfig.max ?? '100'}
                  onChange={(e) => handleConfigChange({ 
                    max: e.target.value === '' ? undefined : Number(e.target.value) 
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Unit symbol</Label>
              <Input
                className="h-8 text-xs"
                placeholder="e.g. %, V"
                value={draftConfig.unit || ''}
                onChange={(e) => handleConfigChange({ unit: e.target.value })}
              />
            </div>

            {/* ── Value Mappings (For Color) ── */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5" />
                  Color Mappings
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const current: ValueMapping[] = draftConfig.valueMappings || [];
                    handleConfigChange({
                      valueMappings: [
                        ...current,
                        { id: `m-${Date.now()}`, operator: '<', compareValue: '20', displayText: '', color: '#ef4444' },
                      ],
                    });
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Rule
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Set battery colors based on conditions (e.g. If &lt; 20, color = Red). Default is Green. First match wins.
              </p>

              {(draftConfig.valueMappings as ValueMapping[] || []).map((mapping: ValueMapping, idx: number) => (
                <div key={mapping.id} className="border rounded-lg p-3 space-y-2 bg-muted/30 relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      const updated = (draftConfig.valueMappings as ValueMapping[]).filter(
                        (_: ValueMapping, i: number) => i !== idx
                      );
                      handleConfigChange({ valueMappings: updated });
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  <div className="flex gap-2 items-center pr-6">
                    <span className="text-xs text-muted-foreground shrink-0">If value</span>
                    <Select
                      value={mapping.operator}
                      onValueChange={(val) => {
                        const updated = [...(draftConfig.valueMappings as ValueMapping[])];
                        updated[idx] = { ...updated[idx], operator: val as ValueMapping['operator'] };
                        handleConfigChange({ valueMappings: updated });
                      }}
                    >
                      <SelectTrigger className="h-8 w-[80px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="==">==</SelectItem>
                        <SelectItem value="!=">!=</SelectItem>
                        <SelectItem value=">">&gt;</SelectItem>
                        <SelectItem value="<">&lt;</SelectItem>
                        <SelectItem value=">=">&gt;=</SelectItem>
                        <SelectItem value="<=">&lt;=</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="h-8 text-xs flex-1"
                      placeholder="Value"
                      value={mapping.compareValue}
                      onChange={(e) => {
                        const updated = [...(draftConfig.valueMappings as ValueMapping[])];
                        updated[idx] = { ...updated[idx], compareValue: e.target.value };
                        handleConfigChange({ valueMappings: updated });
                      }}
                    />
                  </div>

                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-muted-foreground shrink-0">Color</span>
                    <Input
                      type="color"
                      className="h-8 w-full p-0.5 cursor-pointer rounded-sm"
                      value={mapping.color || '#22c55e'}
                      onChange={(e) => {
                        const updated = [...(draftConfig.valueMappings as ValueMapping[])];
                        updated[idx] = { ...updated[idx], color: e.target.value };
                        handleConfigChange({ valueMappings: updated });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
