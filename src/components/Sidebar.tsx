import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Settings, 
  LogOut,
  Wifi,
  Loader2,
  Users,
  LayoutDashboard,
  Home as HomeIcon,
  Shield,
  Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useDevices } from '@/hooks/useDevices';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAdmin, user } = useAuth();
  const { data: devices = [], isLoading: devicesLoading } = useDevices();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    // ProtectedRoute will redirect to /login when user becomes null
  };

  const settingsMenuItem = { icon: Settings, label: 'Settings', path: '/settings', show: true };
  
  const adminMenuItems = [
    { icon: Shield, label: 'Admin Dashboard', path: '/admin', show: isAdmin },
    { icon: Server, label: 'Device Management', path: '/admin/devices', show: isAdmin },
    { icon: Users, label: 'User Management', path: '/users', show: isAdmin },
    { icon: LayoutDashboard, label: 'Dashboard Builder', path: '/builder', show: isAdmin },
  ].filter(item => item.show);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-2 py-4 border-b border-border">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold">IoT</span>
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold truncate">{import.meta.env.VITE_APP_NAME || "Anedya Dashboard Canvas"}</h2>
          <p className="text-xs text-muted-foreground truncate" title={user?.email || 'User'}>
            {user?.email || 'User'}
            {isAdmin && <span className="ml-1 text-primary">(Admin)</span>}
          </p>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="space-y-1 px-2">
          {/* Home Link */}
          <Button
            variant={location.pathname === '/home' || location.pathname === '/' ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 h-11",
              (location.pathname === '/home' || location.pathname === '/') && "bg-primary/10 text-primary hover:bg-primary/15"
            )}
            onClick={() => handleNavigation('/home')}
          >
            <HomeIcon className="h-5 w-5 shrink-0" />
            <span className="truncate">Home</span>
          </Button>

          {/* Devices Header */}
          <div className="pt-4 pb-1 px-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Devices
            </h3>
          </div>

          {devicesLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : devices.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-2">
              No devices assigned to you.
            </p>
          ) : (
            devices.map((device) => {
              const isActive = location.pathname === device.path;
              
              return (
                <Button
                  key={device.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-11 pl-6",
                    isActive && "bg-primary/10 text-primary hover:bg-primary/15"
                  )}
                  onClick={() => handleNavigation(device.path)}
                >
                  <Wifi className="h-[18px] w-[18px] shrink-0" />
                  <span className="truncate">{device.title}</span>
                </Button>
              );
            })
          )}
        </div>
        
        <div className="my-4 border-t border-border" />
        
        <div className="space-y-1 px-2">
          <Button
            variant={location.pathname === settingsMenuItem.path ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 h-11",
              location.pathname === settingsMenuItem.path && "bg-primary/10 text-primary hover:bg-primary/15"
            )}
            onClick={() => handleNavigation(settingsMenuItem.path)}
          >
            <settingsMenuItem.icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{settingsMenuItem.label}</span>
          </Button>
        </div> 


        {adminMenuItems.length > 0 && (
          <>
          {/* Admin Header */}
          <div className="my-4 border-t border-border" />
          <div className="pt-4 pb-1 px-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Admin
            </h3>
          </div>

            <div className="space-y-1 px-2">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-11",
                      isActive && "bg-primary/10 text-primary hover:bg-primary/15"
                    )}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </>
        )}
      </nav>

      <div className="p-2 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sheet */}
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-card">
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;
