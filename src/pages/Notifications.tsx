import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow, isToday, isYesterday } from "date-fns";
import {
  Bell, BellOff, CheckCheck, Filter, Info, ShieldCheck, UserCheck,
  ArrowRight, RefreshCw, XCircle, Activity, CheckCircle2, Plus,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/useAuth";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/hooks/useNotifications";
import PublicLayout from "@/components/layouts/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const typeConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  issue_verified: { label: "Verified", icon: ShieldCheck, className: "bg-info/15 text-info" },
  authority_assigned: { label: "Assigned", icon: UserCheck, className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  status_changed: { label: "Status Update", icon: RefreshCw, className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  issue_resolved: { label: "Resolved", icon: CheckCircle2, className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  issue_rejected: { label: "Rejected", icon: XCircle, className: "bg-destructive/15 text-destructive" },
  issue_created: { label: "Created", icon: Info, className: "bg-muted text-muted-foreground" },
};

const defaultType = { label: "Update", icon: Activity, className: "bg-muted text-muted-foreground" };

function getTypeConfig(type: string | null) {
  return type && typeConfig[type] ? typeConfig[type] : defaultType;
}

const Notifications = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadCount } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const shouldRedirect = !authLoading && !user;

  const filtered = useMemo(() => {
    if (!notifications) return [];
    return filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;
  }, [notifications, filter]);

  const grouped = useMemo(() => {
    const today: typeof filtered = [];
    const yesterday: typeof filtered = [];
    const earlier: typeof filtered = [];
    for (const n of filtered) {
      const d = new Date(n.created_at);
      if (isToday(d)) today.push(n);
      else if (isYesterday(d)) yesterday.push(n);
      else earlier.push(n);
    }
    return { today, yesterday, earlier };
  }, [filtered]);

  // Summary stats
  const totalCount = notifications?.length ?? 0;
  const statusUpdateCount = notifications?.filter((n) => n.type === "status_changed").length ?? 0;
  const resolvedCount = notifications?.filter((n) => n.type === "issue_resolved").length ?? 0;

  const summaryCards = [
    { label: "Total Updates", value: totalCount, icon: Bell, color: "text-foreground" },
    { label: "Unread", value: unreadCount ?? 0, icon: BellOff, color: "text-accent" },
    { label: "Status Updates", value: statusUpdateCount, icon: RefreshCw, color: "text-info" },
    { label: "Resolved", value: resolvedCount, icon: CheckCircle2, color: "text-primary" },
  ];

  if (shouldRedirect) {
    navigate("/login");
    return null;
  }

  const handleMarkRead = (id: string, isRead: boolean) => {
    if (!isRead) markAsRead.mutate(id);
  };

  const renderGroup = (label: string, items: typeof filtered) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          {label}
        </h3>
        <div className="space-y-2">
          {items.map((n) => {
            const cfg = getTypeConfig(n.type);
            const Icon = cfg.icon;
            return (
              <Card
                key={n.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  !n.is_read ? "border-l-4 border-l-primary bg-primary/[0.03]" : ""
                }`}
                onClick={() => handleMarkRead(n.id, n.is_read)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`mt-0.5 rounded-full p-1.5 ${cfg.className}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${!n.is_read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                        {n.message}
                      </p>
                      {!n.is_read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cfg.className}`}>
                        {cfg.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  {n.issue_id && (
                    <Link
                      to={`/issues/${n.issue_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0"
                    >
                      <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
                        View Issue <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Updates Center</h1>
          <p className="text-muted-foreground mt-1">
            Stay informed on the progress of your reported issues.
          </p>
        </div>

        {/* Summary Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summaryCards.map((c) => (
              <Card key={c.label}>
                <CardHeader className="p-4 pb-2 flex-row items-center gap-2 space-y-0">
                  <c.icon className={`h-4 w-4 ${c.color}`} />
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {c.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold text-foreground">{c.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
              <Filter className="h-3.5 w-3.5 mr-1" /> Unread
              {(unreadCount ?? 0) > 0 && (
                <Badge className="ml-1 h-5 px-1.5 text-[10px]">{unreadCount}</Badge>
              )}
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={!unreadCount || markAllAsRead.isPending}
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark All as Read
          </Button>
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {filter === "unread" ? "All caught up!" : "No updates yet"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {filter === "unread"
                    ? "You've read all your notifications. Check back later for new updates."
                    : "You'll see issue progress and action updates here once you report a civic issue."}
                </p>
              </div>
              {filter === "all" && (
                <Link to="/report">
                  <Button className="mt-2 gap-1">
                    <Plus className="h-4 w-4" /> Report an Issue
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {renderGroup("Today", grouped.today)}
            {renderGroup("Yesterday", grouped.yesterday)}
            {renderGroup("Earlier", grouped.earlier)}
          </div>
        )}
      </div>
    </PublicLayout>
  );
};

export default Notifications;
