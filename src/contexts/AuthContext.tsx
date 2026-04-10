import { createContext, useContext, useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  role: 'viewer' | 'editor' | 'admin';
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');
  const [isLoading, setIsLoading] = useState(true);
  const adminFetchVersionRef = useRef(0);

  useEffect(() => {
    // Use ONLY onAuthStateChange - it fires INITIAL_SESSION immediately
    // with the cached session. Do NOT also call getSession() as that
    // causes race conditions and AbortError in Supabase JS v2.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        // Synchronously update session/user state
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Fetch admin status in background — fire-and-forget
          // Using setTimeout to avoid calling Supabase during the auth callback
          // which can cause deadlocks in the Supabase client
          const userId = currentSession.user.id;
          const version = ++adminFetchVersionRef.current;

          setTimeout(async () => {
            try {
              const { data, error } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", userId)
                .single();

              if (version !== adminFetchVersionRef.current) return;
              if (error && error.code !== "PGRST116") {
                console.warn("Error fetching profile status:", error.message);
              }
              const currentRole = data?.role as any || 'viewer';
              setIsAdmin(currentRole === 'admin');
              setRole(currentRole);
            } catch (err) {
              if (version !== adminFetchVersionRef.current) return;
              console.warn("fetchAdminStatus failed:", err);
              setIsAdmin(false);
              setRole('viewer');
            }
          }, 0);
        } else {
          setIsAdmin(false);
          setRole('viewer');
        }

        // Always stop the loading spinner once we've processed the first event
        setIsLoading(false);
      }
    );

    // Safety net: if onAuthStateChange somehow never fires
    const safetyTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn("Server logout error, forcing local session clear:", error);
      }
    } catch (e) {
      console.warn("Logout exception:", e);
    } finally {
      // Force immediate local state clear to redirect user
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setRole('viewer');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isAdmin,
        role,
        isLoading,
        logout,
      }}
    >
      {isLoading ? (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
