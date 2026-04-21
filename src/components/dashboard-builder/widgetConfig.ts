/**
 * Single source of truth for widget size constraints.
 * Used by ComponentSidebar, CanvasGrid, and DynamicDashboard.
 */
export interface WidgetSizeConfig {
  minW: number;
  minH: number;
  maxW: number;
  maxH: number;
  defaultW: number;
  defaultH: number;
}

export const WIDGET_SIZE_CONSTRAINTS: Record<string, WidgetSizeConfig> = {
  GaugeWidget: { minW: 1, minH: 1, maxW: 12, maxH: 12, defaultW: 2.5, defaultH: 1.5 },
  HistoricalTrendWidget: { minW: 6, minH: 2, maxW: 24, maxH: 24, defaultW: 6, defaultH: 2 },
  ValueDisplayWidget: { minW: 1, minH: 1, maxW: 12, maxH: 24, defaultW: 3, defaultH: 1.5 },
  ValueStoreWidget: { minW: 3, minH: 1, maxW: 12, maxH: 12, defaultW: 4, defaultH: 1 },
  DonutChartWidget: { minW: 2, minH: 2, maxW: 8, maxH: 8, defaultW: 3, defaultH: 3 },
  ToggleSwitchWidget: { minW: 2, minH: 1, maxW: 8, maxH: 4, defaultW: 3, defaultH: 1 },
  BatteryWidget: { minW: 1, minH: 1, maxW: 6, maxH: 8, defaultW: 1.5, defaultH: 1.5 },
};

/** Returns constraints for a widget type, with safe fallback */
export function getWidgetConstraints(widgetType: string): WidgetSizeConfig {
  return WIDGET_SIZE_CONSTRAINTS[widgetType] || {
    minW: 2, minH: 2, maxW: 12, maxH: 12, defaultW: 4, defaultH: 3
  };
}
