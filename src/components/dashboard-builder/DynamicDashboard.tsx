import React, { useRef, useState, useEffect } from 'react';
import ReactGridLayout from 'react-grid-layout';
import WidgetRenderer from './widgets/WidgetRenderer';
import { type WidgetConfig, type Layout, type Section } from '../../store/useBuilderStore';
import { WIDGET_SIZE_CONSTRAINTS } from './widgetConfig';
import { Activity } from 'lucide-react';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

function useMeasure() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    if (!ref.current) return;
    setWidth(ref.current.offsetWidth);

    const observer = new ResizeObserver((entries) => {
      if (entries.length > 0) {
        window.requestAnimationFrame(() => {
          setWidth(entries[0].contentRect.width);
        });
      }
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

// ─── Single Section View (read-only) ─────────
function SectionView({
  section,
  sectionLayout,
  widgets,
  nodeId,
  pollIntervalMs,
}: {
  section: Section;
  sectionLayout: Layout[];
  widgets: Record<string, WidgetConfig>;
  nodeId: string;
  pollIntervalMs: number;
}) {
  const { ref, width } = useMeasure();

  const normalizedLayout = sectionLayout.map((item) => {
    const widgetConfig = widgets[item.i];
    const constraints = widgetConfig ? WIDGET_SIZE_CONSTRAINTS[widgetConfig.type] : null;
    if (!constraints) return item;

    return {
      ...item,
      w: Math.max(constraints.minW, Math.min(item.w || constraints.defaultW, constraints.maxW)),
      h: Math.max(constraints.minH, Math.min(item.h || constraints.defaultH, constraints.maxH)),
      minW: constraints.minW,
      minH: constraints.minH,
      maxW: constraints.maxW,
      maxH: constraints.maxH,
    };
  });

  const showHeader = !section.hideHeader;

  return (
    <div className={showHeader ? "bg-card rounded-lg border border-border shadow-sm mb-8" : "mb-8"}>
      {/* Section Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 rounded-t-lg">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Activity className="w-5 h-5 text-primary shrink-0" />
            <h3 className="text-[20px] font-semibold text-foreground truncate">{section.title}</h3>
          </div>
        </div>
      )}

      {/* Section Grid */}
      <div ref={ref} className={showHeader ? "w-full p-2" : "w-full"}>
        {/* @ts-ignore - ReactGridLayout type mismatch with cols prop */}
        <ReactGridLayout
          className="layout"
          width={width}
          layout={normalizedLayout}
          cols={12}
          rowHeight={40}
          isDraggable={false}
          isResizable={false}
          compactType="vertical"
        >
          {normalizedLayout.map((item) => {
            const widgetConfig = widgets[item.i];
            if (!widgetConfig) {
              return (
                <div key={item.i} className="bg-card border border-red-200 rounded p-4 text-sm text-red-400">
                  Widget {item.i} not found
                </div>
              );
            }

            return (
              <div key={item.i} className="flex flex-col h-full w-full">
                <WidgetRenderer
                  config={widgetConfig}
                  nodeId={nodeId}
                  pollIntervalMs={pollIntervalMs}
                  isEditMode={false}
                />
              </div>
            );
          })}
        </ReactGridLayout>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────
interface DynamicDashboardProps {
  schema: any;
  nodeId: string;
  pollIntervalMs?: number;
}

export function DynamicDashboard({ schema, nodeId, pollIntervalMs = 0 }: DynamicDashboardProps) {
  if (!schema || !schema.layout || !schema.widgets || !Array.isArray(schema.layout)) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/30 border border-border rounded-lg text-muted-foreground">
        No valid dashboard configuration found.
      </div>
    );
  }

  const { layout, widgets } = schema;

  // Support both v1 (no sections) and v2 (with sections)
  const sections: Section[] = schema.sections && schema.sections.length > 0
    ? [...schema.sections].sort((a: Section, b: Section) => a.order - b.order)
    : [{ id: 'section-default', title: 'Dashboard', order: 0 }];

  return (
    <div className="w-full space-y-2">
      {sections.map((section: Section, index: number) => {
        // For v1 schemas (no sectionId on layout items), safely assign them to the very first section available
        const isFirstSection = index === 0;
        const sectionLayout = layout.filter((l: Layout) =>
          l.sectionId === section.id || (!l.sectionId && isFirstSection)
        );

        if (sectionLayout.length === 0) return null;

        return (
          <SectionView
            key={section.id}
            section={section}
            sectionLayout={sectionLayout}
            widgets={widgets}
            nodeId={nodeId}
            pollIntervalMs={pollIntervalMs}
          />
        );
      })}
    </div>
  );
}
