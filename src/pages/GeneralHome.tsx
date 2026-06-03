import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDevices } from "@/hooks/useDevices";
import DashboardLayout from "@/components/DashboardLayout";
import { DynamicDashboard } from "@/components/dashboard-builder/DynamicDashboard";
import GeometricLoader from "@/components/GeometricLoader";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, RotateCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function GeneralHome() {
  const { data: devices = [], isLoading: isDevicesLoading } = useDevices();
  const [templateSchema, setTemplateSchema] = useState<any>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchHomeTemplate = async (showLoader = true) => {
    if (showLoader) {
      setLoadingTemplate(true);
    }
    try {
      // 1. Fetch where type = 'home' and is_default = true
      let { data: defaultHome, error } = await supabase
        .from("dashboard_templates")
        .select("schema")
        .eq("type", "home")
        .eq("is_default", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching default home template:", error);
      }

      // 2. If no default, check if we have any template of type 'home'
      if (!defaultHome) {
        const { data: anyHome, error: anyHomeError } = await supabase
          .from("dashboard_templates")
          .select("schema")
          .eq("type", "home")
          .limit(1)
          .maybeSingle();

        if (anyHomeError) {
          console.error("Error fetching fallback home template:", anyHomeError);
        }
        defaultHome = anyHome;
      }

      if (defaultHome?.schema) {
        const parsed = typeof defaultHome.schema === 'string' 
          ? JSON.parse(defaultHome.schema) 
          : defaultHome.schema;
        
        if (parsed && parsed.layout && parsed.layout.length > 0) {
          setTemplateSchema(parsed);
        } else {
          setTemplateSchema(null);
        }
      } else {
        setTemplateSchema(null);
      }
    } catch (err) {
      console.error("Failed to parse home template schema:", err);
      setTemplateSchema(null);
    } finally {
      setLoadingTemplate(false);
    }
  };

  useEffect(() => {
    fetchHomeTemplate(true);
  }, []);

  if (isDevicesLoading || loadingTemplate) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-120px)]">
          <GeometricLoader />
        </div>
      </DashboardLayout>
    );
  }

  // If we have a home template schema configured, render it!
  if (templateSchema) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Home Dashboard
              </h1>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  {refreshInterval > 0 && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      refreshInterval > 0 ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                </span>
                <span>Auto Refresh</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <Select
                  value={refreshInterval.toString()}
                  onValueChange={(val) => setRefreshInterval(Number(val))}
                >
                  <SelectTrigger className="w-[110px] h-8">
                    <SelectValue placeholder="Refresh" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Off</SelectItem>
                    <SelectItem value="5000">5s</SelectItem>
                    <SelectItem value="10000">10s</SelectItem>
                    <SelectItem value="30000">30s</SelectItem>
                    <SelectItem value="60000">60s</SelectItem>
                    <SelectItem value="300000">5min</SelectItem>
                    <SelectItem value="600000">10min</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 ml-1"
                onClick={async () => {
                  setIsSpinning(true);
                  setRefreshTrigger(prev => prev + 1);
                  await fetchHomeTemplate(false);
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                  setIsSpinning(false);
                }}
                title="Refresh Data"
              >
                <RotateCw
                  className={`h-4 w-4 ${isSpinning ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
          <DynamicDashboard
            key={`${templateSchema?.id || 'home'}-${refreshTrigger}`}
            schema={templateSchema}
            nodeId=""
            pollIntervalMs={refreshInterval}
          />
        </div>
      </DashboardLayout>
    );
  }

  // Fallback state: Render the static welcome card
  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-120px)] items-center justify-center p-8 animate-in fade-in duration-500">
        <div className="text-center max-w-md space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Activity className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground text-sm">
              Select a device from the sidebar to view its dashboard, or create a home template in Dashboard Canvas.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <Card className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-center space-x-3 text-primary mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wifi"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/></svg>
                  <h3 className="text-lg font-semibold text-foreground">Total Connected Devices</h3>
                </div>
                <p className="text-4xl font-extrabold tracking-tight">{devices.length}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
