import { create } from 'zustand';

export interface Layout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
  resizeHandles?: Array<'s' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne'>;
  isBounded?: boolean;
  sectionId: string; // Which section this widget belongs to
}

export interface WidgetConfig {
  type: string;
  title: string;
  config: Record<string, any>;
}

export interface Section {
  id: string;
  title: string;
  order: number;
  hideHeader?: boolean;
}

export interface BuilderState {
  sections: Section[];
  layout: Layout[];
  widgets: Record<string, WidgetConfig>;
  selectedWidgetId: string | null;
  selectedSectionId: string | null;
  draggedWidgetType: string | null;
  copiedWidget: { layout: Layout; config: WidgetConfig } | null;
  templateType: 'device' | 'home';

  // Section actions
  addSection: (title?: string) => string;
  updateSectionTitle: (sectionId: string, title: string) => void;
  updateSectionHideHeader: (sectionId: string, hideHeader: boolean) => void;
  removeSection: (sectionId: string) => void;
  reorderSections: (sectionId: string, direction: 'up' | 'down') => void;

  // Widget actions
  addWidget: (layoutItem: Omit<Layout, 'sectionId'>, widgetType: string, sectionId: string) => void;
  setDraggedWidgetType: (type: string | null) => void;
  updateWidgetConfig: (id: string, config: any) => void;
  updateWidgetTitle: (id: string, title: string) => void;
  removeWidget: (id: string) => void;
  updateLayout: (newLayout: Layout[], sectionId: string) => void;
  copyWidget: (id: string) => void;
  pasteWidget: (sectionId: string) => void;
  duplicateWidget: (id: string, sectionId: string) => void;

  // Selection
  setSelectedWidget: (id: string | null) => void;
  setSelectedSection: (id: string | null) => void;

  // Template
  setTemplate: (sections: Section[], layout: Layout[], widgets: Record<string, WidgetConfig>) => void;
  setTemplateType: (type: 'device' | 'home') => void;
  reset: () => void;
}

const DEFAULT_SECTION_ID = 'section-default';
const DEFAULT_SECTIONS: Section[] = [
  { id: DEFAULT_SECTION_ID, title: 'Default Section', order: 0 }
];

export const useBuilderStore = create<BuilderState>((set, get) => ({
  sections: [...DEFAULT_SECTIONS],
  layout: [],
  widgets: {},
  selectedWidgetId: null,
  selectedSectionId: null,
  draggedWidgetType: null,
  copiedWidget: null,
  templateType: 'device',

  addSection: (title?: string) => {
    const id = `section-${Date.now()}`;
    const maxOrder = Math.max(...get().sections.map(s => s.order), -1);
    set((state) => ({
      sections: [...state.sections, { id, title: title || 'New Section', order: maxOrder + 1 }],
    }));
    return id;
  },

  updateSectionTitle: (sectionId, title) => set((state) => ({
    sections: state.sections.map(s => s.id === sectionId ? { ...s, title } : s),
  })),

  updateSectionHideHeader: (sectionId, hideHeader) => set((state) => ({
    sections: state.sections.map(s => s.id === sectionId ? { ...s, hideHeader } : s),
  })),

  removeSection: (sectionId) => set((state) => {
    // Can't remove the last section
    if (state.sections.length <= 1) return state;

    // Remove all widgets in this section
    const widgetIdsToRemove = state.layout
      .filter(l => l.sectionId === sectionId)
      .map(l => l.i);

    const newWidgets = { ...state.widgets };
    widgetIdsToRemove.forEach(id => delete newWidgets[id]);

    return {
      sections: state.sections.filter(s => s.id !== sectionId),
      layout: state.layout.filter(l => l.sectionId !== sectionId),
      widgets: newWidgets,
      selectedWidgetId: widgetIdsToRemove.includes(state.selectedWidgetId || '') ? null : state.selectedWidgetId,
      selectedSectionId: state.selectedSectionId === sectionId ? null : state.selectedSectionId,
    };
  }),

  reorderSections: (sectionId, direction) => set((state) => {
    const sorted = [...state.sections].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(s => s.id === sectionId);
    if (idx < 0) return state;
    if (direction === 'up' && idx === 0) return state;
    if (direction === 'down' && idx === sorted.length - 1) return state;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const tempOrder = sorted[idx].order;
    sorted[idx] = { ...sorted[idx], order: sorted[swapIdx].order };
    sorted[swapIdx] = { ...sorted[swapIdx], order: tempOrder };

    return { sections: sorted };
  }),

  addWidget: (layoutItem, widgetType, sectionId) => set((state) => ({
    layout: [...state.layout, { ...layoutItem, sectionId } as Layout],
    widgets: {
      ...state.widgets,
      [layoutItem.i]: {
        type: widgetType,
        title: `New ${widgetType}`,
        config: {}
      }
    },
    selectedWidgetId: layoutItem.i,
  })),

  setDraggedWidgetType: (type) => set({ draggedWidgetType: type }),

  updateWidgetConfig: (id, newConfig) => set((state) => ({
    widgets: {
      ...state.widgets,
      [id]: {
        ...state.widgets[id],
        config: { ...state.widgets[id].config, ...newConfig }
      }
    }
  })),

  updateWidgetTitle: (id, title) => set((state) => ({
    widgets: {
      ...state.widgets,
      [id]: {
        ...state.widgets[id],
        title
      }
    }
  })),

  removeWidget: (id) => set((state) => {
    const newWidgets = { ...state.widgets };
    delete newWidgets[id];

    return {
      layout: state.layout.filter((l) => l.i !== id),
      widgets: newWidgets,
      selectedWidgetId: state.selectedWidgetId === id ? null : state.selectedWidgetId
    };
  }),

  copyWidget: (id) => set((state) => {
    const layoutItem = state.layout.find(l => l.i === id);
    const config = state.widgets[id];
    if (!layoutItem || !config) return state;

    return {
      copiedWidget: { layout: layoutItem, config }
    };
  }),

  pasteWidget: (sectionId) => set((state) => {
    const { copiedWidget } = state;
    if (!copiedWidget) return state;

    const uniqueId = `widget-${Date.now()}`;
    const { layout: sourceLayout, config: sourceConfig } = copiedWidget;

    // Offset pasted widget slightly to avoid complete overlap
    const newLayoutItem: Layout = {
      ...sourceLayout,
      i: uniqueId,
      sectionId,
      x: sourceLayout.x + 1,
      y: sourceLayout.y + 1,
    };

    return {
      layout: [...state.layout, newLayoutItem],
      widgets: {
        ...state.widgets,
        [uniqueId]: { ...sourceConfig, title: `${sourceConfig.title} (Copy)` }
      },
      selectedWidgetId: uniqueId,
    };
  }),

  duplicateWidget: (id, sectionId) => set((state) => {
    const layoutItem = state.layout.find(l => l.i === id);
    const config = state.widgets[id];
    if (!layoutItem || !config) return state;

    const uniqueId = `widget-${Date.now()}`;
    const newLayoutItem: Layout = {
      ...layoutItem,
      i: uniqueId,
      sectionId,
      x: layoutItem.x + 1,
      y: layoutItem.y + 1,
    };

    return {
      layout: [...state.layout, newLayoutItem],
      widgets: {
        ...state.widgets,
        [uniqueId]: { ...config, title: `${config.title} (Copy)` }
      },
      selectedWidgetId: uniqueId,
    };
  }),

  updateLayout: (newLayout, sectionId) => set((state) => {
    // Instead of replacing the section layout entirely with newLayout,
    // we only update the coordinates of items that exist in newLayout.
    // This prevents a known react-grid-layout race condition where onDrop triggers
    // onLayoutChange before the new widget has been rendered into the grid children,
    // causing the new widget to be instantly deleted.

    const nextLayout = state.layout.map(existingItem => {
      // Only process items for this section
      if (existingItem.sectionId !== sectionId) return existingItem;

      const newPos = newLayout.find((l: any) => l.i === existingItem.i);
      if (newPos) {
        return {
          ...existingItem,
          ...newPos,
          sectionId // ensure sectionId safety
        };
      }

      return existingItem; // Retain items not reported by react-grid-layout yet
    });

    return { layout: nextLayout };
  }),

  setSelectedWidget: (id) => set((state) => ({
    selectedWidgetId: id,
    selectedSectionId: id ? null : state.selectedSectionId
  })),
  setSelectedSection: (id) => set((state) => ({
    selectedSectionId: id,
    selectedWidgetId: id ? null : state.selectedWidgetId
  })),

  setTemplate: (sections, layout, widgets) => {
    const activeSections = sections.length > 0 ? sections : [...DEFAULT_SECTIONS];
    const defaultSectionId = activeSections[0].id;

    // Purge old container items and validate remaining widgets
    const validLayout = layout.filter(l => {
      const w = widgets[l.i];
      if (!w) return false;
      if (w.type === 'ContainerWidget') return false; // deprecated
      return true;
    }).map(l => {
      // If widget from older template has no sectionId, put it in the first section
      if (!l.sectionId) return { ...l, sectionId: defaultSectionId };
      return l;
    });

    const validWidgets: Record<string, WidgetConfig> = {};
    validLayout.forEach(l => {
      validWidgets[l.i] = widgets[l.i];
    });

    set({
      sections: activeSections,
      layout: validLayout,
      widgets: validWidgets,
      selectedWidgetId: null,
      selectedSectionId: null,
    });
  },

  setTemplateType: (type) => set({ templateType: type }),

  reset: () => set({
    sections: [...DEFAULT_SECTIONS],
    layout: [],
    widgets: {},
    selectedWidgetId: null,
    selectedSectionId: null,
    templateType: 'device',
  })
}));
