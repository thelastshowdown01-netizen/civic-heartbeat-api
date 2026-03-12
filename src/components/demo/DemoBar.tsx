import { useDemo } from "@/hooks/useDemo";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, User, Shield, Landmark, Home, FileText, Search, Bell, LayoutDashboard } from "lucide-react";

const ROLES = [
  { key: "citizen" as const, label: "Citizen", icon: User, color: "bg-emerald-500" },
  { key: "admin" as const, label: "Admin", icon: Shield, color: "bg-amber-500" },
  { key: "authority" as const, label: "Authority", icon: Landmark, color: "bg-blue-500" },
];

const NAV_LINKS = [
  { path: "/", label: "Home", icon: Home },
  { path: "/report", label: "Report", icon: FileText },
  { path: "/issues", label: "Explore", icon: Search },
  { path: "/dashboard", label: "My Reports", icon: LayoutDashboard },
  { path: "/notifications", label: "Notifications", icon: Bell },
  { path: "/admin", label: "Admin", icon: Shield },
  { path: "/authority", label: "Authority", icon: Landmark },
];

const DemoBar = () => {
  const { isDemoMode, activeRole, switchRole, exitDemo } = useDemo();
  const navigate = useNavigate();

  if (!isDemoMode) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-foreground/90 backdrop-blur-md text-background border-t border-background/10">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
        {/* Role indicator */}
        <div className="flex items-center gap-2 mr-2">
          <span className="text-[10px] uppercase tracking-widest font-semibold opacity-60">Demo</span>
          {ROLES.map((r) => (
            <button
              key={r.key}
              onClick={() => switchRole(r.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeRole === r.key
                  ? `${r.color} text-white shadow-lg scale-105`
                  : "bg-background/10 text-background/70 hover:bg-background/20"
              }`}
            >
              <r.icon className="h-3 w-3" />
              {r.label}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-background/20 hidden sm:block" />

        {/* Quick nav */}
        <div className="flex items-center gap-1 flex-wrap">
          {NAV_LINKS.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-background/60 hover:text-background hover:bg-background/10 transition-colors"
            >
              <link.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{link.label}</span>
            </button>
          ))}
        </div>

        {/* Exit */}
        <div className="ml-auto">
          <Button variant="ghost" size="sm" onClick={exitDemo} className="text-background/70 hover:text-background hover:bg-background/10 h-7 text-xs gap-1">
            <X className="h-3 w-3" /> Exit Demo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DemoBar;
