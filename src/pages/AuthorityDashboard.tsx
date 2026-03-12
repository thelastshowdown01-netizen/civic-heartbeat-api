import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2, Filter, ArrowUpDown, FileText, Clock,
  CheckCircle2, AlertTriangle, Loader2, Activity,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { formatCategory, formatStatus, statusColors } from "@/lib/issueHelpers";
import { Constants } from "@/integrations/supabase/types";
import type { Tables } from "@/integrations/supabase/types";
import { IssueActionCard } from "@/components/authority/IssueActionCard";

type Issue = Tables<"issues">;
const PAGE_SIZE = 20;

export default function AuthorityDashboard() {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  useEffect(() => {
    if (!authLoading && (!user || userRole !== "authority")) navigate("/");
  }, [authLoading, user, userRole, navigate]);

  // ── State ──
  const [activeTab, setActiveTab] = useState("reports");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(0);

  // Dialogs
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateIssueId, setUpdateIssueId] = useState<string | null>(null);
  const [updateNote, setUpdateNote] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectIssueId, setRejectIssueId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // ── Queries ──

  // Dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["authority-dashboard-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dashboard_stats");
      if (error) throw error;
      return data as {
        total_issues: number;
        resolved_issues: number;
        active_issues: number;
        high_priority_unresolved: number;
      };
    },
    staleTime: 30_000,
  });

  // Recent activity (last 5 status changes)
  const { data: recentActivity } = useQuery({
    queryKey: ["authority-recent-activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("status_logs")
        .select("id, issue_id, old_status, new_status, comment, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      // Fetch issue titles
      const issueIds = [...new Set(data.map((d) => d.issue_id))];
      const { data: issues } = await supabase
        .from("issues")
        .select("id, title, description")
        .in("id", issueIds);
      const issueMap = new Map(issues?.map((i) => [i.id, i.title || i.description.slice(0, 50)]) ?? []);
      return data.map((d) => ({ ...d, issueTitle: issueMap.get(d.issue_id) ?? "Unknown" }));
    },
    staleTime: 30_000,
  });

  // Live feed with filters
  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ["authority-live-feed", categoryFilter, sortBy, page],
    queryFn: async () => {
      let query = supabase.from("issues").select("*", { count: "exact" })
        .neq("status", "rejected");

      if (categoryFilter !== "all") query = query.eq("category", categoryFilter as any);

      switch (sortBy) {
        case "oldest": query = query.order("created_at", { ascending: true }); break;
        case "priority": query = query.order("priority_score", { ascending: false }); break;
        case "most_reported": query = query.order("reports_count", { ascending: false }); break;
        case "most_upvoted": query = query.order("upvotes_count", { ascending: false }); break;
        default: query = query.order("created_at", { ascending: false });
      }

      query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      const { data, error, count } = await query;
      if (error) throw error;
      return { issues: data as Issue[], total: count ?? 0 };
    },
    staleTime: 15_000,
    enabled: activeTab === "feed",
  });

  // Merged issues (reports_count > 1)
  const { data: mergedIssues, isLoading: mergedLoading } = useQuery({
    queryKey: ["authority-merged-issues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .gt("reports_count", 1)
        .neq("status", "rejected")
        .order("reports_count", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Issue[];
    },
    staleTime: 15_000,
    enabled: activeTab === "merged",
  });

  // ── Actions ──
  const handleStatusChange = async (issueId: string, newStatus: string, comment?: string) => {
    setActionLoading(true);
    const body: Record<string, unknown> = { issue_id: issueId, new_status: newStatus };
    if (comment) body.comment = comment;
    const { data, error } = await supabase.functions.invoke("update-issue-status", { body });
    setActionLoading(false);

    if (error || data?.error) {
      toast({ title: "Action failed", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Issue updated", description: `Status → ${newStatus.replace(/_/g, " ")}` });
      invalidateAll();
    }
  };

  const handleProgressSubmit = async () => {
    if (!updateIssueId || !updateNote.trim()) return;
    await handleStatusChange(updateIssueId, "in_progress", updateNote.trim());
    setUpdateDialogOpen(false);
    setUpdateIssueId(null);
    setUpdateNote("");
  };

  const handleRejectSubmit = async () => {
    if (!rejectIssueId || !rejectComment.trim()) return;
    await handleStatusChange(rejectIssueId, "rejected", rejectComment.trim());
    setRejectDialogOpen(false);
    setRejectIssueId(null);
    setRejectComment("");
  };

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["authority-dashboard-stats"] });
    qc.invalidateQueries({ queryKey: ["authority-recent-activity"] });
    qc.invalidateQueries({ queryKey: ["authority-live-feed"] });
    qc.invalidateQueries({ queryKey: ["authority-merged-issues"] });
  };

  // Action handlers for cards
  const cardActions = {
    onVerify: (id: string) => handleStatusChange(id, "verified"),
    onReject: (id: string) => { setRejectIssueId(id); setRejectDialogOpen(true); },
    onInProgress: (id: string) => { setUpdateIssueId(id); setUpdateDialogOpen(true); },
    onResolve: (id: string) => handleStatusChange(id, "resolved"),
    onAddUpdate: (id: string) => { setUpdateIssueId(id); setUpdateDialogOpen(true); },
  };

  const totalPages = Math.ceil((feedData?.total ?? 0) / PAGE_SIZE);

  if (authLoading || (!user && !authLoading)) {
    return (
      <DashboardLayout title="Authority Dashboard" icon={<Building2 className="h-5 w-5" />}>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Authority Dashboard" icon={<Building2 className="h-5 w-5" />}>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="feed">Live Feed</TabsTrigger>
            <TabsTrigger value="merged">Merged Issues</TabsTrigger>
          </TabsList>

          {/* ═══════════ TAB 1: Reports (Landing) ═══════════ */}
          <TabsContent value="reports" className="space-y-6">
            {/* 3 stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Total Problems"
                value={stats?.total_issues ?? 0}
                icon={<FileText className="h-5 w-5" />}
                loading={statsLoading}
              />
              <StatCard
                label="Resolved"
                value={stats?.resolved_issues ?? 0}
                icon={<CheckCircle2 className="h-5 w-5" />}
                accent="text-primary"
                loading={statsLoading}
              />
              <StatCard
                label="Active Problems"
                value={stats?.active_issues ?? 0}
                icon={<AlertTriangle className="h-5 w-5" />}
                accent="text-destructive"
                loading={statsLoading}
              />
            </div>

            {/* Recent activity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!recentActivity || recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                ) : (
                  recentActivity.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 text-sm">
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      <span className="flex-1 min-w-0 truncate text-foreground">
                        <span className="font-medium">{a.issueTitle}</span>
                        {" → "}
                        <Badge variant="outline" className={`text-[10px] ${statusColors[a.new_status] ?? ""}`}>
                          {formatStatus(a.new_status)}
                        </Badge>
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 2: Live Feed ═══════════ */}
          <TabsContent value="feed" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[150px] h-9 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Constants.public.Enums.issue_category.map((c) => (
                    <SelectItem key={c} value={c}>{formatCategory(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1.5 ml-auto">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(0); }}>
                  <SelectTrigger className="w-[155px] h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="priority">Highest Priority</SelectItem>
                    <SelectItem value="most_reported">Most Reported</SelectItem>
                    <SelectItem value="most_upvoted">Most Upvoted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {feedLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
              </div>
            ) : (feedData?.issues.length ?? 0) === 0 ? (
              <EmptyState
                icon={<FileText className="h-10 w-10" />}
                title="No issues found"
                description="Try adjusting your filters."
              />
            ) : (
              <>
                <div className="space-y-3">
                  {feedData!.issues.map((issue) => (
                    <IssueActionCard key={issue.id} issue={issue} {...cardActions} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, feedData!.total)} of {feedData!.total}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 0}>Prev</Button>
                      <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>Next</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ═══════════ TAB 3: Merged Issues ═══════════ */}
          <TabsContent value="merged" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Issues reported by multiple citizens that were automatically merged based on location and description similarity.
            </p>
            {mergedLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
              </div>
            ) : (mergedIssues?.length ?? 0) === 0 ? (
              <EmptyState
                icon={<Loader2 className="h-10 w-10" />}
                title="No merged issues yet"
                description="When multiple citizens report the same problem, they'll appear here as a single consolidated issue."
              />
            ) : (
              <div className="space-y-3">
                {mergedIssues!.map((issue) => (
                  <IssueActionCard key={issue.id} issue={issue} {...cardActions} showMergedExpand />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Progress Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={(o) => { if (!o) { setUpdateDialogOpen(false); setUpdateNote(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Progress Update</DialogTitle>
            <DialogDescription>Describe the action taken. This will mark the issue as Work In Progress.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Describe progress..." value={updateNote} onChange={(e) => setUpdateNote(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUpdateDialogOpen(false); setUpdateNote(""); }}>Cancel</Button>
            <Button onClick={handleProgressSubmit} disabled={actionLoading || !updateNote.trim()}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={(o) => { if (!o) { setRejectDialogOpen(false); setRejectComment(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Issue</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this issue.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason for rejection..." value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialogOpen(false); setRejectComment(""); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectSubmit} disabled={actionLoading || !rejectComment.trim()}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
