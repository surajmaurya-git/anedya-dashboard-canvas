import React, { useState, useEffect } from 'react';
import { useBuilderStore } from '../../store/useBuilderStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Palette, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import type { ValueMapping } from './widgets/ValueDisplayWidget';
import type { DonutSeries } from './widgets/DonutChartWidget';
import type { DataTableVariableColumn } from './widgets/DataTableWidget';
import { useDevices } from '@/hooks/useDevices';

export default function PropertiesPanel() {
  const {
    selectedWidgetId,
    widgets,
    updateWidgetTitle,
    updateWidgetConfig,
    templateType,
    selectedSectionId,
    sections,
    updateSectionTitle,
    updateSectionHideHeader
  } = useBuilderStore();
  const { data: devices = [] } = useDevices();

  const widget = selectedWidgetId ? widgets[selectedWidgetId] : null;
  const section = selectedSectionId ? sections.find(s => s.id === selectedSectionId) : null;

  const [draftTitle, setDraftTitle] = useState('');
  const [draftConfig, setDraftConfig] = useState<any>({});
  const [sectionTitleDraft, setSectionTitleDraft] = useState('');

  useEffect(() => {
    if (widget) {
      setDraftTitle(widget.title);
      setDraftConfig(widget.config);
    }
  }, [selectedWidgetId]); // Reset draft when selection changes

  useEffect(() => {
    if (section) {
      setSectionTitleDraft(section.title);
    }
  }, [selectedSectionId, section?.title]);

  const handleSectionTitleChange = (newTitle: string) => {
    setSectionTitleDraft(newTitle);
    updateSectionTitle(selectedSectionId!, newTitle);
  };

  if (!selectedWidgetId && selectedSectionId && section) {
    return (
      <div className="w-72 border-l bg-card flex flex-col h-full">
        <div className="p-4 border-b font-medium bg-background">
          Section Properties
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          <div className="space-y-2">
            <Label>Section Title</Label>
            <Input
              value={sectionTitleDraft}
              onChange={(e) => handleSectionTitleChange(e.target.value)}
              placeholder="Section Title"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Hide Header & Border</Label>
              <p className="text-xs text-muted-foreground">
                Hide the section border and title. Widgets remain visible.
              </p>
            </div>
            <Switch
              checked={section.hideHeader || false}
              onCheckedChange={(checked) => updateSectionHideHeader(section.id, checked)}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!selectedWidgetId || !widget) {
    return (
      <div className="w-72 border-l bg-card p-4 text-center text-sm text-muted-foreground h-full flex items-center justify-center">
        Select a component or section to edit its properties
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

        {templateType === 'home' && widget.type !== 'DataTableWidget' && (
          <div className="space-y-2">
            <Label>Target Device</Label>
            <Select
              value={draftConfig.nodeId || "none"}
              onValueChange={(val) => handleConfigChange({ nodeId: val === "none" ? undefined : val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select device" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Specific Device</SelectItem>
                {devices.map((d) => (
                  <SelectItem key={d.node_id} value={d.node_id}>
                    {d.title || d.node_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Select which device this widget fetches data from.
            </p>
          </div>
        )}

        {/* Global Variable / Key for legacy/simple widgets */}
        {/* Global Variable / Key for legacy/simple widgets */}
        {!['ToggleSwitchWidget', 'SliderWidget', 'DonutChartWidget', 'CameraViewerWidget', 'DataTableWidget'].includes(widget.type) && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data Source</Label>
              <Select
                value={draftConfig.dataSource || (['HistoricalTrendWidget', 'SparklineWidget', 'GaugeWidget', 'MapWidget', 'AgrrChartWidget', 'AggregateGoalWidget'].includes(widget.type) ? 'variable' : 'valuestore')}
                onValueChange={(val) => handleConfigChange({ dataSource: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  {!['HistoricalTrendWidget', 'SparklineWidget', 'GaugeWidget', 'MapWidget', 'AgrrChartWidget', 'AggregateGoalWidget'].includes(widget.type) && (
                    <SelectItem value="valuestore">Valuestore</SelectItem>
                  )}
                  {!['ToggleSwitchWidget', 'SliderWidget'].includes(widget.type) && (
                    <SelectItem value="variable">Variable</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                {(draftConfig.dataSource === 'variable' || (['HistoricalTrendWidget', 'SparklineWidget', 'GaugeWidget', 'MapWidget', 'AgrrChartWidget', 'AggregateGoalWidget'].includes(widget.type) && !draftConfig.dataSource))
                  ? 'Variable Identifier' : 'Key'}
              </Label>
              <Input
                placeholder="e.g. temperature"
                value={draftConfig.deviceKey || ''}
                onChange={(e) => handleConfigChange({ deviceKey: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Dynamic fields based on type */}
        {widget.type === 'CameraViewerWidget' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground italic">
                Connects to the camera on the device using WebRTC.
                Requires a device that supports the Anedya Video Streaming protocol.
              </p>
            </div>
            <div className="space-y-2">
              <Label>TURN Port</Label>
              <Input
                type="number"
                placeholder="3478"
                value={draftConfig.turnPort || ''}
                onChange={(e) => handleConfigChange({ turnPort: e.target.value ? Number(e.target.value) : undefined })}
              />
              <p className="text-[10px] text-muted-foreground">Default: 3478</p>
            </div>

            <div className="space-y-3 pt-2 border-t text-sm">
              <Label>Display Options</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showSnapshotBtn"
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                  checked={draftConfig.showSnapshotBtn !== false}
                  onChange={(e) => handleConfigChange({ showSnapshotBtn: e.target.checked })}
                />
                <Label htmlFor="showSnapshotBtn" className="font-normal cursor-pointer text-sm">Show Snapshot Button</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showFullscreenBtn"
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                  checked={draftConfig.showFullscreenBtn !== false}
                  onChange={(e) => handleConfigChange({ showFullscreenBtn: e.target.checked })}
                />
                <Label htmlFor="showFullscreenBtn" className="font-normal cursor-pointer text-sm">Show Fullscreen Button</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showNetworkStatsBtn"
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                  checked={draftConfig.showNetworkStatsBtn !== false}
                  onChange={(e) => handleConfigChange({ showNetworkStatsBtn: e.target.checked })}
                />
                <Label htmlFor="showNetworkStatsBtn" className="font-normal cursor-pointer text-sm">Show Network Stats Button</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoStart"
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                  checked={draftConfig.autoStart === true}
                  onChange={(e) => handleConfigChange({ autoStart: e.target.checked })}
                />
                <Label htmlFor="autoStart" className="font-normal cursor-pointer text-sm">Auto Start Stream on Open</Label>
              </div>
            </div>
          </div>
        )}

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

        {widget.type === 'SparklineWidget' && (
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
              <Label>Sparkline Base Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="color"
                  value={draftConfig.strokeColor || '#22c55e'}
                  onChange={(e) => handleConfigChange({ strokeColor: e.target.value })}
                  className="w-12 h-8 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  placeholder="#22c55e"
                  value={draftConfig.strokeColor || '#22c55e'}
                  onChange={(e) => handleConfigChange({ strokeColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        )}

        {widget.type === 'HistoricalTrendWidget' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Chart Type</Label>
                <Select
                  value={draftConfig.chartType || 'area'}
                  onValueChange={(val) => handleConfigChange({ chartType: val })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="area">Area</SelectItem>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label title="Max time gap (mins) before dotted line gap">Max Gap (mins)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 30"
                  className="h-8"
                  value={draftConfig.maxGapMins !== undefined ? draftConfig.maxGapMins : 30}
                  onChange={(e) => handleConfigChange({ maxGapMins: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label title="Maximum number of points to fetch">Data Limit</Label>
              <Input
                type="number"
                placeholder="10000"
                className="h-8"
                min={1}
                max={10000}
                value={draftConfig.limit || ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  handleConfigChange({ limit: val !== undefined ? Math.min(val, 10000) : undefined });
                }}
              />
              <p className="text-[10px] text-muted-foreground italic">
                Max: 10,000 points.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Unit symbol</Label>
                <Input
                  className="h-8"
                  placeholder="e.g. °C, %"
                  value={draftConfig.unit || ''}
                  onChange={(e) => handleConfigChange({ unit: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Line Color</Label>
                <Input
                  type="color"
                  className="h-8 w-full p-0.5"
                  value={draftConfig.strokeColor || '#0ea5e9'}
                  onChange={(e) => handleConfigChange({ strokeColor: e.target.value })}
                />
              </div>
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showTable"
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                  checked={draftConfig.showTable === true}
                  onChange={(e) => handleConfigChange({ showTable: e.target.checked })}
                />
                <Label htmlFor="showTable" className="font-normal cursor-pointer text-sm">Show Data Table</Label>
              </div>
            </div>
          </div>
        )}

        {widget.type === 'AgrrChartWidget' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Chart Type</Label>
                <Select
                  value={draftConfig.chartType || 'bar'}
                  onValueChange={(val) => handleConfigChange({ chartType: val })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Bar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="area">Area</SelectItem>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Compute</Label>
                <Input
                  className="h-8"
                  placeholder="deltasum"
                  value={draftConfig.compute || 'deltasum'}
                  onChange={(e) => handleConfigChange({ compute: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Measure</Label>
                <Select
                  value={draftConfig.measure || 'day'}
                  onValueChange={(val) => handleConfigChange({ measure: val })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minute">Minute</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Interval</Label>
                <Input
                  type="number"
                  className="h-8"
                  placeholder="1"
                  min={1}
                  value={draftConfig.interval !== undefined ? draftConfig.interval : 1}
                  onChange={(e) => handleConfigChange({ interval: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Unit symbol</Label>
                <Input
                  className="h-8"
                  placeholder="e.g. °C, %"
                  value={draftConfig.unit || ''}
                  onChange={(e) => handleConfigChange({ unit: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  type="color"
                  className="h-8 w-full p-0.5"
                  value={draftConfig.strokeColor || '#0ea5e9'}
                  onChange={(e) => handleConfigChange({ strokeColor: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-3 pt-2 border-t text-sm">
              <Label>Display & Advanced</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="aggr_forEachNode"
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                  checked={draftConfig.forEachNode === true}
                  onChange={(e) => handleConfigChange({ forEachNode: e.target.checked })}
                />
                <Label htmlFor="aggr_forEachNode" className="font-normal cursor-pointer text-sm">For Each Node</Label>
              </div>
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showTable"
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                  checked={draftConfig.showTable === true}
                  onChange={(e) => handleConfigChange({ showTable: e.target.checked })}
                />
                <Label htmlFor="showTable" className="font-normal cursor-pointer text-sm">Show Data Table</Label>
              </div>
            </div>
          </div>
        )}

        {widget.type === 'AggregateGoalWidget' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Compute</Label>
                <Input
                  className="h-8"
                  placeholder="deltasum"
                  value={draftConfig.compute || 'deltasum'}
                  onChange={(e) => handleConfigChange({ compute: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Goal Value</Label>
                <Input
                  type="number"
                  className="h-8"
                  placeholder="300"
                  value={draftConfig.goalValue !== undefined ? draftConfig.goalValue : 300}
                  onChange={(e) => handleConfigChange({ goalValue: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Unit symbol</Label>
                <Input
                  className="h-8"
                  placeholder="e.g. L"
                  value={draftConfig.unit || ''}
                  onChange={(e) => handleConfigChange({ unit: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t text-sm">
              <Label>Display & Advanced</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ag_showFooter"
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                  checked={draftConfig.showFooter !== false}
                  onChange={(e) => handleConfigChange({ showFooter: e.target.checked })}
                />
                <Label htmlFor="ag_showFooter" className="font-normal cursor-pointer text-sm">Show Footer Message</Label>
              </div>
            </div>
          </div>
        )}

        {widget.type === 'MapWidget' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label title="Maximum number of points to fetch">Data Limit</Label>
              <Input
                type="number"
                placeholder="1000"
                className="h-8"
                min={1}
                max={10000}
                value={draftConfig.limit || ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  handleConfigChange({ limit: val !== undefined ? Math.min(val, 10000) : undefined });
                }}
              />
              <p className="text-[10px] text-muted-foreground italic">
                Max: 10,000 points.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Path Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="color"
                  value={draftConfig.pathColor || '#2563eb'}
                  onChange={(e) => handleConfigChange({ pathColor: e.target.value })}
                  className="w-12 h-8 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  placeholder="#2563eb"
                  value={draftConfig.pathColor || '#2563eb'}
                  onChange={(e) => handleConfigChange({ pathColor: e.target.value })}
                  className="flex-1 h-8"
                />
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-t mt-2">
              <div className="space-y-0.5">
                <Label className="text-xs">Show History Table</Label>
                <p className="text-[10px] text-muted-foreground">
                  Display location history table next to map.
                </p>
              </div>
              <Switch
                checked={draftConfig.showTable || false}
                onCheckedChange={(checked) => handleConfigChange({ showTable: checked })}
              />
            </div>
          </div>
        )}

        {widget.type === 'ValueDisplayWidget' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground italic">
                {(draftConfig.dataSource || 'valuestore') === 'valuestore'
                  ? 'Fetches value from Anedya ValueStore'
                  : 'Fetches latest data from Anedya Variable'}
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
              <p className="text-xs text-muted-foreground italic">
                {(draftConfig.dataSource || 'valuestore') === 'valuestore'
                  ? 'Read & write to Anedya ValueStore'
                  : 'Read-only from Anedya Variables (Set disabled)'}
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

        {/* ── SliderWidget ────────────────────────────────────────── */}
        {widget.type === 'SliderWidget' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ValueStore Key</Label>
              <Input
                placeholder="e.g. thermostat_setpoint"
                value={draftConfig.deviceKey || ''}
                onChange={(e) => handleConfigChange({ deviceKey: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                The key in Anedya ValueStore to write the value to.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Expected Data Type</Label>
              <Select
                value={draftConfig.dataType || 'float'}
                onValueChange={(val) => handleConfigChange({ dataType: val })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Float (Number)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="float">Float (Number)</SelectItem>
                  <SelectItem value="string">String</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Min</Label>
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
                <Label className="text-xs">Max</Label>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Step Size</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  placeholder="1"
                  value={draftConfig.step ?? '1'}
                  onChange={(e) => handleConfigChange({
                    step: e.target.value === '' ? undefined : Number(e.target.value)
                  })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unit</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="e.g. °C"
                  value={draftConfig.unit || ''}
                  onChange={(e) => handleConfigChange({ unit: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2 border-t pt-3">
              <Label className="flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" />
                Track Colour
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  className="h-8 w-12 p-0.5 cursor-pointer"
                  value={draftConfig.color || '#0ea5e9'}
                  onChange={(e) => handleConfigChange({ color: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── TankWidget ────────────────────────────────────────── */}
        {widget.type === 'TankWidget' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data Source</Label>
              <Select
                value={draftConfig.dataSource || 'variable'}
                onValueChange={(val) => handleConfigChange({ dataSource: val, deviceKey: '' })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Variable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="variable">Variable</SelectItem>
                  <SelectItem value="valuestore">ValueStore</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{draftConfig.dataSource === 'valuestore' ? 'Valuestore Key' : 'Variable Identifier'}</Label>
              <Input
                placeholder="e.g. water_level"
                value={draftConfig.deviceKey || ''}
                onChange={(e) => handleConfigChange({ deviceKey: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tank Shape</Label>
              <Select
                value={draftConfig.shape || 'cylinder'}
                onValueChange={(val) => handleConfigChange({ shape: val })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Cylinder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cylinder">Silo / Cylinder</SelectItem>
                  <SelectItem value="rectangle">Bar / Rectangle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Min Value</Label>
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
                <Label className="text-xs">Max Value</Label>
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

            <div className="space-y-2 border-t pt-3">
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Unit String</Label>
                  <Input
                    className="h-8 text-xs"
                    placeholder="e.g. L, %, m"
                    value={draftConfig.unit || ''}
                    onChange={(e) => handleConfigChange({ unit: e.target.value })}
                  />
                </div>
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs mb-1">Liquid Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      className="h-8 w-12 p-0.5 cursor-pointer"
                      value={draftConfig.color || '#3b82f6'}
                      onChange={(e) => handleConfigChange({ color: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────── DataTableWidget ───────────────────────── */}
        {widget.type === 'DataTableWidget' && (() => {
          const vars: DataTableVariableColumn[] = draftConfig.variables ?? [];

          const addVariable = () => {
            const newVar: DataTableVariableColumn = {
              id: `var-${Date.now()}`,
              label: `Column ${vars.length + 1}`,
              variableKey: '',
              unit: '',
              decimals: 2,
              thresholdEnabled: false,
            };
            handleConfigChange({ variables: [...vars, newVar] });
          };

          const removeVariable = (id: string) => {
            handleConfigChange({ variables: vars.filter((v) => v.id !== id) });
          };

          const updateVariable = (id: string, patch: Partial<DataTableVariableColumn>) => {
            handleConfigChange({
              variables: vars.map((v) => v.id === id ? { ...v, ...patch } : v),
            });
          };

          return (
            <div className="space-y-4">
              {/* Page Size */}
              <div className="space-y-2">
                <Label>Rows per Page (Device Mode)</Label>
                <Select
                  value={String(draftConfig.pageSize ?? 20)}
                  onValueChange={(v) => handleConfigChange({ pageSize: Number(v) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n} rows</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Device Selection (Home mode only) */}
              {templateType === 'home' && (
                <div className="space-y-2 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <Label>Devices to Display</Label>
                    <span className="text-[10px] text-muted-foreground">
                      {(draftConfig.selectedNodeIds?.length ?? 0) === 0
                        ? 'All devices'
                        : `${draftConfig.selectedNodeIds.length} selected`}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Check devices to include. Leave all unchecked to show all.
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto border rounded-md p-2 bg-muted/5">
                    {devices.map((d) => {
                      const selected: string[] = draftConfig.selectedNodeIds ?? [];
                      const checked = selected.includes(d.node_id);
                      const toggle = () => {
                        const next = checked
                          ? selected.filter((id) => id !== d.node_id)
                          : [...selected, d.node_id];
                        handleConfigChange({ selectedNodeIds: next });
                      };
                      return (
                        <label
                          key={d.id}
                          className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-muted/30 transition-colors"
                        >
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5 rounded border-input text-primary cursor-pointer"
                            checked={checked}
                            onChange={toggle}
                          />
                          <span className="text-xs truncate">{d.title || d.node_id}</span>
                        </label>
                      );
                    })}
                    {devices.length === 0 && (
                      <p className="text-[10px] text-muted-foreground italic text-center py-2">No devices found</p>
                    )}
                  </div>
                  {(draftConfig.selectedNodeIds?.length ?? 0) > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs w-full text-muted-foreground"
                      onClick={() => handleConfigChange({ selectedNodeIds: [] })}
                    >
                      Clear selection (show all)
                    </Button>
                  )}
                </div>
              )}

              {/* Variable Columns */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <Label>Variable Columns</Label>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addVariable}>
                    <Plus className="h-3 w-3" /> Add Column
                  </Button>
                </div>

                {vars.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-3">
                    No columns yet. Add a variable column above.
                  </p>
                )}

                <div className="space-y-3">
                  {vars.map((col, idx) => (
                    <div key={col.id} className="border rounded-md p-3 space-y-2 bg-muted/10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Col {idx + 1}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-destructive/60 hover:text-destructive"
                          onClick={() => removeVariable(col.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Label</Label>
                          <Input
                            className="h-7 text-xs"
                            value={col.label}
                            placeholder="e.g. Temperature"
                            onChange={(e) => updateVariable(col.id, { label: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Variable Key</Label>
                          <Input
                            className="h-7 text-xs"
                            value={col.variableKey}
                            placeholder="e.g. temperature"
                            onChange={(e) => updateVariable(col.id, { variableKey: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Unit</Label>
                          <Input
                            className="h-7 text-xs"
                            value={col.unit ?? ''}
                            placeholder="e.g. °C"
                            onChange={(e) => updateVariable(col.id, { unit: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Decimals</Label>
                          <Input
                            type="number"
                            className="h-7 text-xs"
                            value={col.decimals ?? 2}
                            min={0}
                            max={6}
                            onChange={(e) => updateVariable(col.id, { decimals: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      {/* Threshold */}
                      <div className="flex items-center justify-between pt-1">
                        <Label className="text-xs font-normal">Enable Threshold Colors</Label>
                        <Switch
                          checked={col.thresholdEnabled === true}
                          onCheckedChange={(v) => updateVariable(col.id, { thresholdEnabled: v })}
                        />
                      </div>

                      {col.thresholdEnabled && (
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-blue-500">≤ Min (blue)</Label>
                            <Input
                              type="number"
                              className="h-7 text-xs"
                              value={col.thresholdMin ?? ''}
                              placeholder="—"
                              onChange={(e) => updateVariable(col.id, { thresholdMin: e.target.value ? Number(e.target.value) : undefined })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-amber-500">≥ Warn (amber)</Label>
                            <Input
                              type="number"
                              className="h-7 text-xs"
                              value={col.thresholdWarning ?? ''}
                              placeholder="—"
                              onChange={(e) => updateVariable(col.id, { thresholdWarning: e.target.value ? Number(e.target.value) : undefined })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-red-500">≥ Danger (red)</Label>
                            <Input
                              type="number"
                              className="h-7 text-xs"
                              value={col.thresholdDanger ?? ''}
                              placeholder="—"
                              onChange={(e) => updateVariable(col.id, { thresholdDanger: e.target.value ? Number(e.target.value) : undefined })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
