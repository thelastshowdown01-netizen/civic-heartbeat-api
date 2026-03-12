import { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Building2, Bell, LogOut, FileText, Activity, ClipboardList,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount } from "@/hooks/useNotifications";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  icon?: ReactNode;
}

const authorityNavItems = [
  { to: "/authority", label: "Reports", icon: FileText },
  { to: "/authority/feed", label: "Live Feed", icon: Activity },
  { to: "/authority/merged", label: "Merged Issues", icon: ClipboardList },
];

function DashboardSidebar() {
  const { signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Brand */}
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg">🏙️</span>
            {!collapsed && (
              <span className="text-sm font-bold text-sidebar-foreground">Sustain City</span>
            )}
          </Link>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>
            <Building2 className="h-3.5 w-3.5 mr-1" />
            {!collapsed && (
              <span>Authority</span>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {authorityNavItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.to}
                      end={item.to === "/authority"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 mr-2 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom sign out */}
        <div className="mt-auto p-3 border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={signOut}
                className="hover:bg-sidebar-accent text-sidebar-foreground"
              >
                <LogOut className="h-4 w-4 mr-2 shrink-0" />
                {!collapsed && <span>Sign Out</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

function DashboardHeader({ title, icon }: { title: string; icon?: ReactNode }) {
  const { user, userRole } = useAuth();
  const { data: unreadCount } = useUnreadCount();

  return (
    <header className="h-14 border-b border-border bg-background flex items-center px-4 gap-3 shrink-0">
      <SidebarTrigger className="shrink-0" />

      {/* Page title */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {icon && <span className="text-primary shrink-0">{icon}</span>}
        <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/notifications"
          className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
        >
          <Bell className="h-4.5 w-4.5" />
          {(unreadCount ?? 0) > 0 && (
            <span className="absolute top-0.5 right-0.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
              {unreadCount! > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {/* User info */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {user?.email?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <span className="text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5 capitalize">
            {userRole}
          </span>
        </div>
      </div>
    </header>
  );
}

const DashboardLayout = ({ children, title, icon }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader title={title} icon={icon} />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
