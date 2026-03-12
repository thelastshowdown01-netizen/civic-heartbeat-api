import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  FileText, CheckCircle2, AlertTriangle, Activity, Filter, ArrowUpDown,
  MapPin, Clock, Building2, Users, ChevronRight, Bell, Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import PublicLayout from "@/components/layouts/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Constants } from "@/integrations/supabase/types";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  formatCategory,
  formatStatus,
  statusColors,
  priorityColors,
  categoryIcons,
} from "@/lib/issueHelpers";

type ReportWithIssue = {
  id: string;
  description: string;
  pincode: string | null;
  created_at: string;
  issue_id: string;
  issues: {
    id: string;
    title: string | null;
    description: string;
    category: string;
    pincode: string | null;
    status: string;
    priority: string;
    priority_score: number;
    upvotes_count: number;
    downvotes_count: number;
    reports_count: number;
    authority_name: string | null;
    created_at: string;
  };
};


export default function UserDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  // Fetch user's reports with joined issue data
  const { data: reports, isLoading } = useQuery({
    queryKey: ["my-reports", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issue_reports")
        .select("id, description, pincode, created_at, issue_id, issues(id, title, description, category, pincode, status, priority, priority_score, upvotes_count, downvotes_count, reports_count, authority_name, created_at)")
        .eq("reporter_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ReportWithIssue[];
    },
  });

  const { data: notifications } = useNotifications();

  // Compute summary stats
  const stats = useMemo(() => {
    if (!reports) return { total: 0, active: 0, resolved: 0, highPriority: 0 };
    const total = reports.length;
    const active = reports.filter((r) => !["resolved", "rejected"].includes(r.issues.status)).length;
    const resolved = reports.filter((r) => r.issues.status === "resolved").length;
    const highPriority = reports.filter((r) => r.issues.priority === "high" && !["resolved", "rejected"].includes(r.issues.status)).length;
    return { total, active, resolved, highPriority };
  }, [reports]);

  // Filter and sort
  const filteredReports = useMemo(() => {
    if (!reports) return [];
    let result = [...reports];

    if (statusFilter !== "all") result = result.filter((r) => r.issues.status === statusFilter);
    if (categoryFilter !== "all") result = result.filter((r) => r.issues.category === categoryFilter);
    if (priorityFilter !== "all") result = result.filter((r) => r.issues.priority === priorityFilter);

    switch (sortBy) {
      case "oldest":
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "priority":
        result.sort((a, b) => b.issues.priority_score - a.issues.priority_score);
        break;
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [reports, statusFilter, categoryFilter, priorityFilter, sortBy]);

  const recentNotifications = (notifications ?? []).slice(0, 5);

  if (authLoading || !user) {
    return (
      <PublicLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="space-y-6">
        <PageHeader
          icon={<FileText className="h-6 w-6 text-primary" />}
          title="My Reports"
          description="Track the civic issues you've reported and stay informed on progress."
          actions={
            <Link to="/report">
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Report Issue
              </Button>
            </Link>
          }
        />

        {/* Summary Cards */}
        <div className="card-grid-4">
          <StatCard icon={<FileText className="h-5 w-5" />} label="Total Reports" value={stats.total} accent="text-primary" />
          <StatCard icon={<Activity className="h-5 w-5" />} label="Active" value={stats.active} accent="text-info" />
          <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Resolved" value={stats.resolved} accent="text-primary" />
          <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="High Priority" value={stats.highPriority} accent="text-destructive" />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reports list - 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Constants.public.Enums.issue_status.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Constants.public.Enums.issue_category.map((c) => (
                    <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[110px] h-9 text-xs">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {Constants.public.Enums.priority_label.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1.5 ml-auto">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="priority">Highest Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reports */}
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
              </div>
            ) : filteredReports.length === 0 ? (
              reports && reports.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-7 w-7 text-muted-foreground" />}
                  title="No reports yet"
                  description="You haven't reported any civic issues yet. Start by reporting a problem in your area to make it visible and trackable."
                  action={
                    <Link to="/report">
                      <Button className="gap-1.5">
                        <Plus className="h-4 w-4" /> Report an Issue
                      </Button>
                    </Link>
                  }
                />
              ) : (
                /* Filter empty state */
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground text-sm">No reports match your current filters.</p>
                    <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setStatusFilter("all"); setCategoryFilter("all"); setPriorityFilter("all"); }}>
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              )
            ) : (
              <div className="space-y-3">
                {filteredReports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            )}
          </div>

          {/* Recent Updates sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  Recent Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentNotifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent updates.</p>
                ) : (
                  recentNotifications.map((n) => (
                    <div key={n.id} className="flex gap-3 items-start">
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.is_read ? "bg-muted-foreground/30" : "bg-primary"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground leading-snug line-clamp-2">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                        {n.issue_id && (
                          <Link to={`/issues/${n.issue_id}`} className="text-xs text-primary hover:underline">
                            View issue →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

/* ─── Summary Card ─── */
function SummaryCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted">
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Report Card ─── */
function ReportCard({ report }: { report: ReportWithIssue }) {
  const issue = report.issues;
  const relativeTime = formatDistanceToNow(new Date(report.created_at), { addSuffix: true });

  return (
    <Card className="border-border/50 hover:shadow-md hover:border-primary/20 transition-all duration-200">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5 shrink-0" aria-hidden>
            {categoryIcons[issue.category] ?? "📋"}
          </span>
          <div className="min-w-0 flex-1">
            <Link to={`/issues/${issue.id}`} className="hover:underline">
              <h3 className="font-semibold text-foreground leading-snug line-clamp-1">
                {issue.title || formatCategory(issue.category)}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {issue.description}
            </p>
          </div>
          <Link to={`/issues/${issue.id}`}>
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mt-3 mb-3">
          <Badge variant="outline" className={statusColors[issue.status]}>
            {formatStatus(issue.status)}
          </Badge>
          <Badge variant="outline" className={priorityColors[issue.priority]}>
            {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {formatCategory(issue.category)}
          </Badge>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {(issue.pincode ?? report.pincode) && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {issue.pincode ?? report.pincode}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {relativeTime}
          </span>
          {issue.authority_name && (
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {issue.authority_name}
            </span>
          )}
          {issue.reports_count > 1 && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" /> Merged with {issue.reports_count - 1} other report{issue.reports_count > 2 ? "s" : ""}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
