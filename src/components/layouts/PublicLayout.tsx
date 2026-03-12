import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, Bell, Plus, Search, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount } from "@/hooks/useNotifications";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface PublicLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

const PublicLayout = ({ children, fullWidth }: PublicLayoutProps) => {
  const { user, loading, signOut, userRole } = useAuth();
  const { data: unreadCount } = useUnreadCount();
  const [mobileOpen, setMobileOpen] = useState(false);

  const publicLinks = [
    { to: "/issues", label: "Explore Issues" },
    { to: "/report", label: "Report an Issue" },
  ];

  const citizenLinks = [
    { to: "/issues", label: "Explore Issues" },
    { to: "/report", label: "Report an Issue" },
    { to: "/dashboard", label: "My Reports" },
  ];

  const navLinks = user ? citizenLinks : publicLinks;

  // Redirect admin/authority to their dashboards from nav
  const roleLink =
    userRole === "admin"
      ? { to: "/admin", label: "Admin Dashboard" }
      : userRole === "authority"
      ? { to: "/authority", label: "Work Queue" }
      : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Left: Logo + Desktop Nav */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <span className="text-xl font-bold text-primary">🏙️ Sustain City</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md transition-colors"
                  activeClassName="text-foreground bg-muted"
                >
                  {link.label}
                </NavLink>
              ))}
              {roleLink && (
                <NavLink
                  to={roleLink.to}
                  className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md transition-colors"
                  activeClassName="text-foreground bg-muted"
                >
                  {roleLink.label}
                </NavLink>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {loading ? null : user ? (
              <>
                {/* Notifications */}
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

                {/* Role badge - desktop only */}
                {userRole && (
                  <span className="hidden lg:inline text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5 capitalize">
                    {userRole}
                  </span>
                )}

                {/* Sign Out - desktop */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="hidden md:inline-flex gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Sheet Menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="text-left text-lg font-bold text-primary">
              🏙️ Sustain City
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col py-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                activeClassName="text-foreground bg-muted border-l-2 border-l-primary"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            {user && (
              <NavLink
                to="/notifications"
                className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                activeClassName="text-foreground bg-muted border-l-2 border-l-primary"
                onClick={() => setMobileOpen(false)}
              >
                Notifications
                {(unreadCount ?? 0) > 0 && (
                  <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                    {unreadCount! > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </NavLink>
            )}
            {roleLink && (
              <NavLink
                to={roleLink.to}
                className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                activeClassName="text-foreground bg-muted border-l-2 border-l-primary"
                onClick={() => setMobileOpen(false)}
              >
                {roleLink.label}
              </NavLink>
            )}

            <div className="border-t border-border mt-2 pt-2">
              {loading ? null : user ? (
                <button
                  onClick={() => { signOut(); setMobileOpen(false); }}
                  className="w-full px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-left"
                >
                  Sign Out
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-primary hover:bg-muted transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      {fullWidth ? (
        <main className="flex-1">{children}</main>
      ) : (
        <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
          {children}
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">🏙️ Sustain City</span>
              <span className="text-xs text-muted-foreground">— Civic Issue Resolution Platform</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/issues" className="hover:text-foreground transition-colors">Explore Issues</Link>
              <Link to="/report" className="hover:text-foreground transition-colors">Report Issue</Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Sustain City. Built for better cities.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
