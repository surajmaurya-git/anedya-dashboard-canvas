import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import DeviceManagement from "./pages/DeviceManagement";
import AdminDashboard from "./pages/AdminDashboard";
import Setup from "./pages/Setup";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";
import TemplateBuilder from "./pages/TemplateBuilder";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useDevices } from "@/hooks/useDevices";
import DashboardLayout from "@/components/DashboardLayout";

const queryClient = new QueryClient();

const refreshIntervalMs = 60 * 1000; // 1 minute

/**
 * Inner component that renders dynamic device routes.
 * Must be inside QueryClientProvider & BrowserRouter to use hooks.
 */
const AppRoutes = () => {
  const { data: devices = [], isLoading } = useDevices();

  return (
    <Routes>
      {/* Redirect / to /home instead of /login */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/setup" element={<Setup />} />
      <Route path="/login" element={<Login />} />

      {/* Dynamic device routes from Supabase */}
      {devices.map((device) => (
        <Route
          key={device.id}
          path={device.path}
          element={
            <ProtectedRoute>
              <Home
                title={device.title}
                pollIntervalMs={refreshIntervalMs}
                nodeId={device.node_id}
              />
            </ProtectedRoute>
          }
        />
      ))}

      {/* General Home Page */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <div className="flex flex-col h-full items-center justify-center p-8 bg-muted/20">
                <div className="text-center max-w-md">
                  <h2 className="text-3xl font-bold mb-4">Welcome back</h2>
                  <p className="text-muted-foreground mb-8">
                    Select a device from the sidebar to view its dashboard.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                      <div className="flex items-center justify-center space-x-3 text-primary mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wifi"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/></svg>
                        <h3 className="text-lg font-semibold text-foreground">Devices</h3>
                      </div>
                      <p className="text-4xl font-bold">{isLoading ? "-" : devices.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      
      {/* Admin Only Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/devices"
        element={
          <ProtectedRoute adminOnly>
            <DeviceManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute adminOnly>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/builder"
        element={
          <ProtectedRoute adminOnly>
            <TemplateBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/help"
        element={
          <ProtectedRoute>
            <PlaceholderPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider defaultTheme="classic" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
