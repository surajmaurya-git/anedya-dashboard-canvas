import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";
import GeneralHome from "./pages/GeneralHome";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import DeviceManagement from "./pages/DeviceManagement";
import AdminDashboard from "./pages/AdminDashboard";
import Setup from "./pages/Setup";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";
import TemplateBuilder from "./pages/TemplateBuilder";
import TemplateManagement from "./pages/TemplateManagement";
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
            <GeneralHome />
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
        path="/admin/templates"
        element={
          <ProtectedRoute adminOnly>
            <TemplateManagement />
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
