import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Cpu, Activity, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Password reset state
  const [isResetting, setIsResetting] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/home";

  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate, from]);

  useEffect(() => {
    // Check if initial admin setup is required
    const checkSetupStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('setup-admin', {
          method: 'GET',
        });
        
        if (!error && data && data.needsSetup === true) {
          setNeedsSetup(true);
        } else {
          setNeedsSetup(false);
        }
      } catch (err) {
        console.error("Failed to check setup status:", err);
        setNeedsSetup(false);
      }
    };
    
    checkSetupStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      }
      // On success, the AuthContext listener will update state and the useEffect will navigate
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!email) {
        throw new Error("Please enter your email adress");
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?type=recovery`,
      });

      if (error) {
        setError(error.message);
      } else {
        setResetEmailSent(true);
        toast.success("Password reset email sent!");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we are in a recovery state (user clicked link in email)
  const isRecoveryMode = new URLSearchParams(location.search).get('type') === 'recovery';
  const [newPassword, setNewPassword] = useState("");

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setError(error.message);
      } else {
        toast.success("Password updated successfully!");
        navigate("/home");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-chart-1/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <img src="/favicon.png" alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {import.meta.env.VITE_APP_NAME || "Anedya Dashboard Canvas"}
          </h1>
          <p className="text-muted-foreground">
            {isRecoveryMode 
              ? "Update your password" 
              : isResetting 
                ? "Reset your password" 
                : "Real-Time Monitoring & Control"}
          </p>
        </div>

        {needsSetup && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 text-center shadow-lg animate-in fade-in slide-in-from-top-4">
            <Shield className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground mb-2">First-Time Setup Required</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your system is ready, but no administrator account exists yet. Let's create one now.
            </p>
            <Button onClick={() => navigate("/setup")} className="w-full h-11" variant="default">
              Start Configuration Wizard
            </Button>
          </div>
        )}

        <Card className="border-border/50 shadow-xl overflow-hidden backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">
              {isRecoveryMode 
                ? "New Password" 
                : isResetting 
                  ? "Password Reset" 
                  : "Welcome back"}
            </CardTitle>
            <CardDescription className="text-center">
              {isRecoveryMode 
                ? "Enter a new secure password" 
                : isResetting 
                  ? "Enter your email to receive a reset link" 
                  : "Enter your credentials to access the dashboard"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isRecoveryMode ? (
              // ── Password Update Form (After clicking email link) ──
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? <Activity className="h-4 w-4 animate-spin" /> : "Update Password"}
                </Button>
              </form>
            ) : isResetting ? (
              // ── Password Reset Request Form ──
              resetEmailSent ? (
                <div className="text-center space-y-4 py-4">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm">Check your email for a reset link.</p>
                  <Button variant="outline" className="w-full h-11" onClick={() => setIsResetting(false)}>
                    Back to login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <Button type="submit" className="w-full h-11" disabled={isLoading}>
                      {isLoading ? <Activity className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="w-full h-11" 
                      onClick={() => {
                        setIsResetting(false);
                        setError("");
                      }}
                      disabled={isLoading}
                    >
                      Back to login
                    </Button>
                  </div>
                </form>
              )
            ) : (
              // ── Standard Login Form ──
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="h-11 transition-all focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Button 
                      type="button" 
                      variant="link" 
                      className="p-0 h-auto text-xs text-muted-foreground"
                      onClick={() => {
                        setIsResetting(true);
                        setError("");
                      }}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="h-11 pr-10 transition-all focus-visible:ring-primary"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 mt-4 rounded-lg bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                    <p className="text-sm text-destructive font-medium">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 font-medium mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Activity className="h-4 w-4 animate-spin" />
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
