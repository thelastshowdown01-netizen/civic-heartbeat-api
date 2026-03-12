import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DEMO_ACCOUNTS = {
  citizen: { email: "citizen1@demo.sustaincity.in", password: "DemoPass123!", home: "/dashboard" },
  authority: { email: "authority@demo.sustaincity.in", password: "DemoPass123!", home: "/authority" },
} as const;

type DemoRole = keyof typeof DEMO_ACCOUNTS;

type DemoContextType = {
  isDemoMode: boolean;
  activeRole: DemoRole | null;
  activateDemo: () => Promise<void>;
  exitDemo: () => Promise<void>;
  switchRole: (role: DemoRole) => Promise<void>;
};

const DemoContext = createContext<DemoContextType>({
  isDemoMode: false,
  activeRole: null,
  activateDemo: async () => {},
  exitDemo: async () => {},
  switchRole: async () => {},
});

export const useDemo = () => useContext(DemoContext);

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [isDemoMode, setIsDemoMode] = useState(() => sessionStorage.getItem("demo_mode") === "true");
  const [activeRole, setActiveRole] = useState<DemoRole | null>(() => (sessionStorage.getItem("demo_role") as DemoRole) || null);
  const navigate = useNavigate();

  const signInAs = useCallback(async (role: DemoRole) => {
    const account = DEMO_ACCOUNTS[role];
    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInWithPassword({ email: account.email, password: account.password });
    if (error) {
      toast.error(`Demo login failed: ${error.message}`);
      return false;
    }
    setActiveRole(role);
    sessionStorage.setItem("demo_role", role);
    return true;
  }, []);

  const activateDemo = useCallback(async () => {
    setIsDemoMode(true);
    sessionStorage.setItem("demo_mode", "true");
    const ok = await signInAs("citizen");
    if (ok) {
      toast.success("Demo mode activated — signed in as Citizen");
      navigate("/dashboard");
    }
  }, [signInAs, navigate]);

  const exitDemo = useCallback(async () => {
    await supabase.auth.signOut();
    setIsDemoMode(false);
    setActiveRole(null);
    sessionStorage.removeItem("demo_mode");
    sessionStorage.removeItem("demo_role");
    toast.info("Demo mode ended");
    navigate("/");
  }, [navigate]);

  const switchRole = useCallback(async (role: DemoRole) => {
    const ok = await signInAs(role);
    if (ok) {
      toast.success(`Switched to ${role.charAt(0).toUpperCase() + role.slice(1)} view`);
      navigate(DEMO_ACCOUNTS[role].home);
    }
  }, [signInAs, navigate]);

  return (
    <DemoContext.Provider value={{ isDemoMode, activeRole, activateDemo, exitDemo, switchRole }}>
      {children}
    </DemoContext.Provider>
  );
};
