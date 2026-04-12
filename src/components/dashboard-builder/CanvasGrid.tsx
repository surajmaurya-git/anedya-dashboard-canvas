import React, { useRef, useState, useEffect } from 'react';
import ReactGridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useBuilderStore, type Layout, type Section } from '../../store/useBuilderStore';
import WidgetRenderer from './widgets/WidgetRenderer';
import { X, Plus, ChevronUp, ChevronDown, Activity, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeviceBannerPreview } from './DeviceBannerPreview';
import { getWidgetConstraints } from './widgetConfig';

// ─── Measure hook ───────────────────────────
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

// ─── Single Section Component ───────────────
function SectionGrid({ section, isOnly }: { section: Section; isOnly: boolean }) {
  const {
    layout,
    widgets,
    addWidget,
    updateLayout,
    selectedWidgetId,
    setSelectedWidget,
    setSelectedSection,
    removeWidget,
    removeSection,
    reorderSections,
    updateSectionTitle,
    draggedWidgetType,
    setDraggedWidgetType,
  } = useBuilderStore();

  const { ref, width } = useMeasure();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(section.title);

  // Get only widgets belonging to this section
  const sectionLayout = layout.filter((l) => l.sectionId === section.id);

  const handleDrop = (_layoutArr: any[], layoutItem: any, _event: any) => {
    console.log('Drop event triggered:', { _layoutArr, layoutItem, _event });
    
    // Fallback to dataTransfer if state isn't available
    const widgetType = draggedWidgetType || _event.dataTransfer?.getData('widgetType') || _event.dataTransfer?.getData('text/plain');
    console.log('Detected widgetType:', widgetType);
    
    if (!widgetType) return;
    setDraggedWidgetType(null); // Clear dragging state

    const uniqueId = `widget-${Date.now()}`;
    const constraints = getWidgetConstraints(widgetType);

    addWidget({
      ...layoutItem,
      i: uniqueId,
      w: constraints.defaultW,
      h: constraints.defaultH,
      minW: constraints.minW,
      minH: constraints.minH,
      maxW: constraints.maxW,
      maxH: constraints.maxH,
    }, widgetType, section.id);
  };

  const handleTitleSave = () => {
    updateSectionTitle(section.id, titleDraft);
    setIsEditingTitle(false);
  };

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8"
      onClick={(e) => {
        e.stopPropagation();
        setSelectedSection(section.id);
      }}
    >
      {/* ── Section Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Activity className="w-5 h-5 text-[#0066cc] shrink-0" />
          {isEditingTitle ? (
            <input
              autoFocus
              className="text-[20px] font-semibold text-[#002b49] bg-transparent border-b-2 border-primary outline-none flex-1 min-w-0"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => { if (e.key === 'Enter') handleTitleSave(); }}
            />
          ) : (
            <h3
              className="text-[20px] font-semibold text-[#002b49] truncate cursor-pointer hover:text-primary transition-colors"
              onDoubleClick={() => {
                setTitleDraft(section.title);
                setIsEditingTitle(true);
              }}
              title="Double-click to rename"
            >
              {section.title}
            </h3>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => reorderSections(section.id, 'up')} title="Move up">
            <ChevronUp size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => reorderSections(section.id, 'down')} title="Move down">
            <ChevronDown size={14} />
          </Button>
          {!isOnly && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
              title="Delete section"
            >
              <X size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* ── Section Grid Body ── */}
      <div
        ref={ref}
        className="min-h-[120px] p-2 relative"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const widgetType = draggedWidgetType || e.dataTransfer.getData('widgetType') || e.dataTransfer.getData('text/plain');
          if (!widgetType) return;
          setDraggedWidgetType(null);

          const rect = e.currentTarget.getBoundingClientRect();
          const xPos = e.clientX - rect.left;
          const yPos = e.clientY - rect.top;

          const colWidth = width / 12;
          const x = Math.min(11, Math.max(0, Math.floor(xPos / colWidth)));
          const y = Math.max(0, Math.floor(yPos / 40));

          const constraints = getWidgetConstraints(widgetType);
          const uniqueId = `widget-${Date.now()}`;

          addWidget({
            i: uniqueId,
            x,
            y,
            w: constraints.defaultW,
            h: constraints.defaultH,
            minW: constraints.minW,
            minH: constraints.minH,
            maxW: constraints.maxW,
            maxH: constraints.maxH,
          }, widgetType, section.id);
        }}
      >
        {/* @ts-ignore - cols prop type mismatch in react-grid-layout types */}
        <ReactGridLayout
          className="layout"
          width={width}
          layout={sectionLayout}
          cols={12}
          rowHeight={40}
          onLayoutChange={(currentLayout: any) => {
            updateLayout(currentLayout, section.id);
          }}
          isDroppable={false} // Internal droplet disabled since we're handling identically manually
          compactType="vertical"
          style={{ minHeight: '100px', width: '100%' }}
        >
          {sectionLayout.map((item) => {
            const isSelected = selectedWidgetId === item.i;

            return (
              <div
                key={item.i}
                className={`relative group transition-all rounded ${
                  isSelected ? 'ring-2 ring-primary ring-offset-2 z-10' : 'hover:ring-1 hover:ring-gray-300'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWidget(item.i);
                }}
              >
                {/* Delete button */}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-3 -right-3 h-6 w-6 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeWidget(item.i);
                  }}
                >
                  <X size={12} />
                </Button>

                <div className="w-full h-full p-1 pointer-events-none">
                  <WidgetRenderer
                    config={widgets[item.i]}
                    isEditMode={true}
                  />
                </div>
              </div>
            );
          })}
        </ReactGridLayout>

        {sectionLayout.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-300 text-sm">
            Drag widgets here
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Canvas ─────────────────────────────
export default function CanvasGrid({ onSave }: { onSave?: () => void }) {
  const { sections, addSection, setSelectedWidget, setSelectedSection, selectedWidgetId, selectedSectionId, copyWidget, pasteWidget, removeWidget, duplicateWidget } = useBuilderStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Use Ctrl/Cmd for shortcuts
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key === 'c') {
        if (selectedWidgetId) {
          e.preventDefault();
          copyWidget(selectedWidgetId);
        }
      } else if (isMod && e.key === 'v') {
        const sectionId = selectedSectionId || sections[0]?.id;
        if (sectionId) {
          e.preventDefault();
          pasteWidget(sectionId);
        }
      } else if (isMod && e.key === 'd') {
        const sectionId = selectedSectionId || sections[0]?.id;
        if (selectedWidgetId && sectionId) {
          e.preventDefault();
          duplicateWidget(selectedWidgetId, sectionId);
        }
      } else if (isMod && e.key === 's') {
        e.preventDefault();
        onSave?.();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Avoid deleting when input is focused
        if ((document.activeElement as HTMLElement)?.tagName === 'INPUT') return;

        if (selectedWidgetId) {
          e.preventDefault();
          removeWidget(selectedWidgetId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWidgetId, selectedSectionId, sections, copyWidget, pasteWidget, removeWidget, duplicateWidget, onSave]);

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div
      className="flex-1 bg-gray-100 overflow-y-auto h-full p-4"
      onClick={() => { setSelectedWidget(null); }}
    >
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <DeviceBannerPreview />

        {sortedSections.map((section) => (
          <SectionGrid
            key={section.id}
            section={section}
            isOnly={sortedSections.length === 1}
          />
        ))}

        {/* Add Section button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            addSection();
          }}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Plus size={16} />
          Add Section
        </button>
      </div>
    </div>
  );
}
