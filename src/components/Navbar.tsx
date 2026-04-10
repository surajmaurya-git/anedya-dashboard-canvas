import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Settings, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/ThemeProvider';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, mode, setMode } = useTheme();

  const toggleTheme = () => {
    // Only toggle mode if in modern theme (as per request)
    // Or just toggle mode globally, and let ThemeProvider enforce constraints
    if (theme === 'modern') {
        setMode(mode === 'dark' ? 'light' : 'dark');
    }
  };
  
  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          
          {/* <div className="hidden md:flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">IoT</span>
            </div>
            <span className="font-semibold text-lg">Dashboard</span>
          </div> */}
        </div>

        <div className="flex items-center gap-2">
          {theme === 'modern' && (
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {mode === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}

         {/* <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-destructive" />
            <span className="sr-only">Notifications</span>
          </Button> */}
          
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
          
          <div className="flex items-center gap-3 ml-2 pl-3 border-l border-border">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" alt={user?.username} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:block text-sm font-medium">{user?.username || 'Profile'}</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
