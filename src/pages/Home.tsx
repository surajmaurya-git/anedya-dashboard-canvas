import React from "react";
import {
  Activity,
  Calendar,
  Clock,
  Hash,
  Link,
  RotateCw,
  Signal,
  Tag,
  Wifi,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import GeometricLoader from "@/components/GeometricLoader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DynamicDashboard } from "@/components/dashboard-builder/DynamicDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useIoTData } from "@/hooks/useIoTData";

interface HomeProps {
  title: string;
  subtitle?: string;
  pollIntervalMs?: number;
  nodeId: string;
}

const Home: React.FC<HomeProps> = ({
  title,
  subtitle = "Real-time IoT sensor monitoring",
  pollIntervalMs = 60000,
  nodeId,
}) => {
  const [refreshInterval, setRefreshInterval] = React.useState<number>(0);
  const [isSpinning, setIsSpinning] = React.useState(false);

  const [dashboardSchema, setDashboardSchema] = React.useState<any>(null);
  React.useEffect(() => {
    const loadTemplate = async () => {
      try {
        const { data } = await supabase
          .from("dashboard_templates")
          .select("schema")
          .eq("name", "default")
          .single();

        if (data?.schema) {
          const schema = data.schema as any;
          if (schema.layout && schema.widgets && schema.layout.length > 0) {
            setDashboardSchema(schema);
          }
        }
      } catch {
        setDashboardSchema(null);
      }
    };

    loadTemplate();
  }, []);

  const tagsToDisplay: { name: string; key: string }[] = [
    {
      name: "Serial Number",
      key: "serialNumber",
    },
    {
      name: "Device Network",
      key: "networkType",
    },
  ];

  const {
    currentData,
    isLoading,
    isRefetching,
    error,
    deviceStatus,
    nodeDetails,
    refetch,
    signalStrength,
    gatewayError,
  } = useIoTData({
    updateInterval: refreshInterval,
    nodeId: nodeId,
    apiKey: import.meta.env.VITE_ANEDYA_API_KEY,
  });

  const handleRefresh = async () => {
    setIsSpinning(true);

    await Promise.all([
      refetch(),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);

    setIsSpinning(false);
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <p className="text-destructive font-medium">{error}</p>
            <p className="text-muted-foreground text-sm">
              Please check your connection and try again
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            {/* <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {nodeDetails?.node_name || title}
            </h1>
            <p className="text-muted-foreground mt-1">{subtitle}</p> */}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                deviceStatus === "online"
                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                  : deviceStatus === "offline"
                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                    : "bg-gray-500/10 text-gray-500 border-gray-500/20"
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  deviceStatus === "online"
                    ? "bg-green-500"
                    : deviceStatus === "offline"
                      ? "bg-red-500"
                      : "bg-gray-500"
                }`}
              />
              <span className="font-medium capitalize">
                {deviceStatus === "unknown" ? "Unknown" : deviceStatus}
              </span>
              {deviceStatus === "offline" && currentData?.deviceLastHeartbeat ? (
                <span className="text-xs text-muted-foreground ml-1">
                  (Last Online:{" "}
                  {new Date(
                    currentData.deviceLastHeartbeat * 1000
                  ).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  )
                </span>
              ) : null}
            </div>

            <span className="text-border">|</span>

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
              onClick={handleRefresh}
              title="Refresh Data"
            >
              <RotateCw
                className={`h-4 w-4 ${isSpinning || isLoading || isRefetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {nodeDetails && (
          <Card className="overflow-hidden border-none shadow-md">
            <div className="h-48 w-full relative group">
              <img
                src="/cold-room-banner.jpeg"
                alt="Cold Room Facility"
                className="w-full h-full object-cover transition-transform duration-500 "
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-4 left-6 text-white">
                <h3 className="text-xl font-bold">{nodeDetails.node_name}</h3>
                <p className="text-white/80 text-sm">{nodeDetails.node_desc}</p>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4" />
                    Created
                  </span>
                  <span className="block pl-6 font-medium">
                    {nodeDetails.created
                      ? new Date(nodeDetails.created).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground flex items-center gap-2 mb-1">
                    <Link className="h-4 w-4" />
                    Binding Status
                  </span>
                  <span
                    className={`block pl-6 font-medium ${nodeDetails.bindingstatus ? "text-green-600" : "text-red-600"}`}
                  >
                    {nodeDetails.bindingstatus ? "Bound" : "Unbound"}
                  </span>
                </div>

                {nodeDetails.tags && tagsToDisplay.length > 0
                  ? tagsToDisplay.map((displayTag) => {
                      const matchedTag = nodeDetails.tags?.find(
                        (tag) => tag.key === displayTag.key
                      );
                      if (!matchedTag) return null;

                      let Icon = Tag;
                      if (displayTag.key === "serialNumber") Icon = Hash;
                      if (displayTag.key === "networkType") Icon = Wifi;

                      return (
                        <div key={displayTag.key}>
                          <span className="font-medium text-muted-foreground flex items-center gap-2 mb-1">
                            <Icon className="h-4 w-4" />
                            {displayTag.name}
                          </span>
                          <span className="block pl-6 font-medium">
                            {matchedTag.value}
                          </span>
                        </div>
                      );
                    })
                  : nodeDetails.tags &&
                    nodeDetails.tags.map((tag, index) => (
                      <div key={index}>
                        <span className="font-medium text-muted-foreground flex items-center gap-2 mb-1">
                          <Tag className="h-4 w-4" />
                          {tag.key}
                        </span>
                        <span className="block pl-6 font-medium">{tag.value}</span>
                      </div>
                    ))}

                {signalStrength !== null && signalStrength !== undefined && deviceStatus !== "offline" && (
                  <div>
                    <span className="font-medium text-muted-foreground flex items-center gap-2 mb-1">
                      <Signal className="h-4 w-4" />
                      Network Strength
                    </span>
                    {(() => {
                      const networkTypeTag = nodeDetails.tags?.find(
                        (tag) =>
                          tag.key === "networkType" || tag.key === "Network Type"
                      );
                      const isSim = networkTypeTag
                        ? networkTypeTag.value.toLowerCase().includes("sim")
                        : false;

                      let statusText = "";
                      let statusColor = "";

                      if (isSim) {
                        if (signalStrength < 10) {
                          statusText = "Bad";
                          statusColor = "text-red-500";
                        } else if (signalStrength < 15) {
                          statusText = "Fair";
                          statusColor = "text-yellow-500";
                        } else if (signalStrength < 20) {
                          statusText = "Good";
                          statusColor = "text-green-500";
                        } else {
                          statusText = "Excellent";
                          statusColor = "text-green-600";
                        }
                      } else if (signalStrength < 0) {
                        if (signalStrength < -70) {
                          statusText = "Bad";
                          statusColor = "text-red-500";
                        } else if (signalStrength < -60) {
                          statusText = "Fair";
                          statusColor = "text-yellow-500";
                        } else if (signalStrength < -50) {
                          statusText = "Good";
                          statusColor = "text-green-500";
                        } else {
                          statusText = "Excellent";
                          statusColor = "text-green-600";
                        }
                      } else if (signalStrength < 20) {
                        statusText = "Bad";
                        statusColor = "text-red-500";
                      } else if (signalStrength < 50) {
                        statusText = "Fair";
                        statusColor = "text-yellow-500";
                      } else if (signalStrength < 80) {
                        statusText = "Good";
                        statusColor = "text-green-500";
                      } else {
                        statusText = "Excellent";
                        statusColor = "text-green-600";
                      }

                      return (
                        <span className={`block pl-6 font-medium ${statusColor}`}>
                          {statusText}{" "}
                          <span className="text-xs text-muted-foreground">
                            ({signalStrength})
                          </span>
                        </span>
                      );
                    })()}
                  </div>
                )}

                {gatewayError && (
                  <div className="md:col-span-2 lg:col-span-2">
                    <span className="font-medium text-muted-foreground flex items-center gap-2 mb-1">
                      <Tag className="h-4 w-4 text-destructive" />
                      Device Error
                    </span>
                    <span className="block pl-6 font-medium text-destructive">
                      {gatewayError.message}
                    </span>
                    <span className="block pl-6 text-xs text-muted-foreground">
                      {new Date(gatewayError.timestamp * 1000).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <GeometricLoader />
        ) : dashboardSchema &&
          dashboardSchema.layout &&
          dashboardSchema.layout.length > 0 ? (
          <DynamicDashboard
            schema={dashboardSchema}
            nodeId={nodeId}
            pollIntervalMs={refreshInterval > 0 ? refreshInterval : pollIntervalMs}
          />
        ) : (
         
            <CardContent className="py-12">
              <div className="mx-auto max-w-xl rounded-xl border bg-muted/30 p-6 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Activity className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">No dashboard template found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create and save a template from the Builder page to display this
                  device dashboard.
                </p>
              </div>
            </CardContent>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Home;
