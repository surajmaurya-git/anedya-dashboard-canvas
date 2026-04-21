import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Gauge, LineChart, Hash, Settings, PieChart, ToggleRight, Battery } from 'lucide-react';
import { useBuilderStore } from '../../store/useBuilderStore';
import { WIDGET_SIZE_CONSTRAINTS } from './widgetConfig';

const WIDGET_TYPES = [
  { id: 'GaugeWidget', name: 'Gauge', icon: <Gauge size={18} /> },
  { id: 'HistoricalTrendWidget', name: 'Historical Trend', icon: <LineChart size={18} /> },
  { id: 'ValueDisplayWidget', name: 'Value Display', icon: <Hash size={18} /> },
  { id: 'ValueStoreWidget', name: 'Value Store Control', icon: <Settings size={18} /> },
  { id: 'DonutChartWidget',    name: 'Donut Chart',          icon: <PieChart size={18} /> },
  { id: 'ToggleSwitchWidget', name: 'Toggle Switch',         icon: <ToggleRight size={18} /> },
  { id: 'BatteryWidget',      name: 'Battery Level',         icon: <Battery size={18} /> },
];

export default function ComponentSidebar() {
  const setDraggedWidgetType = useBuilderStore(state => state.setDraggedWidgetType);

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, widgetType: string) => {
    e.dataTransfer.setData('text/plain', widgetType);
    e.dataTransfer.setData('widgetType', widgetType);
    e.dataTransfer.effectAllowed = 'copy';
    setDraggedWidgetType(widgetType);
  };

  const onDragEnd = () => {
    setDraggedWidgetType(null);
  };

  return (
    <div className="w-64 border-r bg-card flex flex-col h-full">
      <div className="p-4 border-b font-medium bg-background">
        Component Library
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        <p className="text-xs text-muted-foreground mb-4">
          Drag components into a section on the canvas.
        </p>
        
        {WIDGET_TYPES.map((widget) => {
          const sizes = WIDGET_SIZE_CONSTRAINTS[widget.id];
          return (
            <div
              key={widget.id}
              draggable={true}
              unselectable="on"
              onDragStart={(e) => onDragStart(e, widget.id)}
              onDragEnd={onDragEnd}
              className="cursor-move"
            >
              <Card className="hover:border-primary hover:shadow-sm transition-all bg-card border-dashed">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="p-2 bg-muted rounded text-muted-foreground">
                    {widget.icon}
                  </div>
                  <span className="text-sm font-medium">{widget.name}</span>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
