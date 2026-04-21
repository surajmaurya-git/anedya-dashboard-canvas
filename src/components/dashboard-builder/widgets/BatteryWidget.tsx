import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { WidgetConfig } from '@/store/useBuilderStore';
import { useWidgetData } from '@/hooks/useWidgetData';
import { useValueStoreData } from '@/hooks/useValueStoreData';
import { Skeleton } from '@/components/ui/skeleton';
import { Battery } from 'lucide-react';
import { ValueMapping } from './ValueDisplayWidget';

interface BatteryWidgetProps {
  config: WidgetConfig;
  nodeId?: string;
  pollIntervalMs?: number;
  isEditMode?: boolean;
}

export function BatteryWidget({ config, nodeId, pollIntervalMs, isEditMode }: BatteryWidgetProps) {
  const dataSource = config.config.dataSource || 'valuestore';
  const deviceKey = config.config.deviceKey || '';
  const min = config.config.min ?? 0;
  const max = config.config.max ?? 100;
  
  // Conditionally use hooks based on data source
  const isVar = dataSource === 'variable';
  const isVs = dataSource === 'valuestore';

  const varData = useWidgetData(
    isVar && !isEditMode && deviceKey ? nodeId : undefined,
    isVar && !isEditMode && deviceKey ? deviceKey : undefined,
    pollIntervalMs
  );

  const vsData = useValueStoreData(
    isVs && !isEditMode && deviceKey ? nodeId : undefined,
    isVs && !isEditMode && deviceKey ? deviceKey : undefined,
    pollIntervalMs
  );

  let value: number | null | undefined = undefined;
  
  if (isEditMode || !deviceKey) {
    value = undefined;
  } else if (isVar) {
    value = varData.value as number;
  } else if (isVs) {
    value = vsData.value as number;
  }

  const isLoading = isEditMode || !deviceKey ? false : (isVar ? varData.isLoading : vsData.loading);
  const isError = isEditMode || !deviceKey ? false : (isVar ? !!varData.error : !!vsData.error);

  const getMappedColor = (val: string | number | null): string => {
    // Default color if no rules match or no rules defined
    const defaultColor = '#22c55e'; // Green
    if (val === null || val === undefined) return defaultColor;
    
    const rules = config.config.valueMappings as ValueMapping[] || [];
    const numVal = Number(val);
    const isNum = !isNaN(numVal);
    
    for (const rule of rules) {
      if (!rule.compareValue || !rule.color) continue;
      
      const compNum = Number(rule.compareValue);
      const isCompNum = !isNaN(compNum);

      let matched = false;
      switch (rule.operator) {
        case '==':
          matched = isNum && isCompNum ? numVal === compNum : String(val) === rule.compareValue;
          break;
        case '!=':
          matched = isNum && isCompNum ? numVal !== compNum : String(val) !== rule.compareValue;
          break;
        case '>':
          matched = isNum && isCompNum && numVal > compNum;
          break;
        case '<':
          matched = isNum && isCompNum && numVal < compNum;
          break;
        case '>=':
          matched = isNum && isCompNum && numVal >= compNum;
          break;
        case '<=':
          matched = isNum && isCompNum && numVal <= compNum;
          break;
        case 'contains':
          matched = String(val).toLowerCase().includes(rule.compareValue.toLowerCase());
          break;
        case 'startsWith':
          matched = String(val).toLowerCase().startsWith(rule.compareValue.toLowerCase());
          break;
      }

      if (matched) return rule.color;
    }
    
    return defaultColor;
  };

  // Safe display value fallback
  let displayValue = value;
  // If edit mode and no key provided, preview with some fill
  if (isEditMode && value === undefined) {
    displayValue = (max - min) * 0.65 + min; // 65% full for preview
  }

  // Calculate percentage
  let percentage = 0;
  if (displayValue !== undefined && displayValue !== null) {
    const range = max - min;
    const clampedValue = Math.max(min, Math.min(max, Number(displayValue)));
    percentage = range > 0 ? ((clampedValue - min) / range) * 100 : 0;
  }

  const batteryColor = getMappedColor(displayValue as number);
  const displayString = displayValue !== undefined && displayValue !== null 
    ? `${Number(displayValue).toFixed(1)}${config.config.unit ? ` ${config.config.unit}` : '%'}` 
    : '--';

  return (
    <Card className="w-full h-full flex flex-col hover:border-primary transition-colors min-h-0 bg-card border-border shadow-sm">
      <CardContent className="p-4 flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-3 shrink-0">
          <Battery size={16} className="text-muted-foreground" />
          <h3 className="font-semibold text-sm text-foreground truncate" title={config.title}>
            {config.title || 'Battery Level'}
          </h3>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-20 w-10 md:h-12 md:w-32 rounded-sm" />
          </div>
        ) : isError ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-destructive font-medium">Failed to load data</p>
          </div>
        ) : !deviceKey && !isEditMode ? (
          <div className="flex-1 flex items-center justify-center text-center p-2">
            <p className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">No key assigned</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-2 min-h-0">
            {/* Value text */}
            <div className="text-xl font-bold tracking-tight text-foreground text-center" style={{ color: batteryColor }}>
              {displayString}
            </div>

            {/* Battery Body (Horizontal) */}
            <div className="relative flex items-center shrink-0">
              {/* Main Outer Rim */}
              <div 
                className="relative border-4 rounded-md overflow-hidden bg-muted/20"
                style={{ 
                  width: '100%', 
                  maxWidth: '180px',
                  minWidth: '100px',
                  height: '40px',
                  borderColor: 'hsl(var(--border))'
                }}
              >
                {/* Fill */}
                <div 
                  className="absolute left-0 top-0 bottom-0 transition-all duration-700 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: batteryColor,
                    opacity: 0.9
                  }}
                />
              </div>
              {/* Battery cap/terminal */}
              <div 
                className="w-2 rounded-r-sm shadow-sm"
                style={{ 
                  height: '16px',
                  backgroundColor: 'hsl(var(--border))',
                  marginLeft: '2px' // slight gap or flush
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
