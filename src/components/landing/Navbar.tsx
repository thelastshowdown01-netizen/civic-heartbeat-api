import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const { user, loading, signOut, userRole, roleLoading } = useAuth();
  const { data: unreadCount } = useUnreadCount();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">🏙️ Sustain City</span>
        </Link>
        <div className="flex items-center gap-3">
          {user && userRole === "authority" ? (
            <>
              <Link to="/authority" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Reports</Link>
              <Link to="/authority/feed" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Live Feed</Link>
              <Link to="/authority/merged" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Merged Issues</Link>
            </>
          ) : (
            <>
              <a href="#issues" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Explore Issues</a>
              <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">How It Works</a>
            </>
          )}
           {loading ? null : user ? (
            <>
              {userRole !== "authority" && (
                <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
                  My Reports
                </Link>
              )}
              <Link to="/notifications" className="relative text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="h-4.5 w-4.5" />
                {(unreadCount ?? 0) > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                    {unreadCount! > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <span className="text-xs text-muted-foreground hidden md:inline border border-border rounded-full px-2 py-0.5">
                {roleLoading ? "…" : userRole}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
