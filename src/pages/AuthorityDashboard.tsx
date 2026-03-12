import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Filter, ArrowUpDown, Play, Award, Eye, MessageSquarePlus, Inbox, CheckCircle, XCircle } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal, FileText, Clock, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatCategory, formatStatus, statusColors, priorityColors } from "@/lib/issueHelpers";
import { Constants } from "@/integrations/supabase/types";
import type { Tables } from "@/integrations/supabase/types";

type Issue = Tables<"issues">;

const PAGE_SIZE = 20;

export default function AuthorityDashboard() {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && (!user || userRole !== "authority")) {
      navigate("/");
    }
  }, [authLoading, user, userRole, navigate]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [pincodeFilter, setPincodeFilter] = useState("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [page, setPage] = useState(0);

  // Dialog states
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateIssueId, setUpdateIssueId] = useState<string | null>(null);
  const [updateNote, setUpdateNote] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectIssueId, setRejectIssueId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch review queue (reported issues needing verification)
  const { data: reviewQueue, isLoading: reviewLoading } = useQuery({
    queryKey: ["authority-review-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .eq("status", "reported")
        .order("priority_score", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Issue[];
    },
    staleTime: 15_000,
  });

  // Fetch urgent issues
  const { data: urgentIssues, isLoading: urgentLoading } = useQuery({
    queryKey: ["authority-urgent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .eq("priority", "high")
        .not("status", "in", '("resolved","rejected")')
        .order("priority_score", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Issue[];
    },
    staleTime: 15_000,
  });

  // All issues with filters
  const { data: allIssuesData, isLoading: allLoading } = useQuery({
    queryKey: ["authority-all-issues", statusFilter, categoryFilter, priorityFilter, pincodeFilter, sortBy, page],
    queryFn: async () => {
      let query = supabase.from("issues").select("*", { count: "exact" });

      if (statusFilter !== "all") query = query.eq("status", statusFilter as any);
      if (categoryFilter !== "all") query = query.eq("category", categoryFilter as any);
      if (priorityFilter !== "all") query = query.eq("priority", priorityFilter as any);
      if (pincodeFilter.trim()) query = query.eq("pincode", pincodeFilter.trim());

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
  });

  // Compute stats
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

  const { data: statusCounts, isLoading: countsLoading } = useQuery({
    queryKey: ["authority-status-counts"],
    queryFn: async () => {
      const statuses = ["reported", "verified", "assigned", "in_progress", "resolved"] as const;
      const results: Record<string, number> = {};
      await Promise.all(
        statuses.map(async (s) => {
          const { count } = await supabase
            .from("issues")
            .select("id", { count: "exact", head: true })
            .eq("status", s);
          results[s] = count ?? 0;
        })
      );
      return results;
    },
    staleTime: 30_000,
  });

  const handleStatusChange = async (issueId: string, newStatus: string, comment?: string) => {
    setActionLoading(true);
    const body: Record<string, unknown> = { issue_id: issueId, new_status: newStatus };
    if (comment) body.comment = comment;

    const { data, error } = await supabase.functions.invoke("update-issue-status", { body });
    setActionLoading(false);

    if (error || data?.error) {
      toast({ title: "Action failed", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Issue updated", description: `Status changed to ${newStatus.replace(/_/g, " ")}.` });
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
    queryClient.invalidateQueries({ queryKey: ["authority-review-queue"] });
    queryClient.invalidateQueries({ queryKey: ["authority-urgent"] });
    queryClient.invalidateQueries({ queryKey: ["authority-all-issues"] });
    queryClient.invalidateQueries({ queryKey: ["authority-dashboard-stats"] });
    queryClient.invalidateQueries({ queryKey: ["authority-status-counts"] });
  };

  const totalPages = Math.ceil((allIssuesData?.total ?? 0) / PAGE_SIZE);
  const loading = statsLoading || countsLoading;

  const statCards = [
    { label: "Total Issues", value: stats?.total_issues ?? 0, icon: <FileText className="h-5 w-5" /> },
    { label: "Needs Review", value: statusCounts?.reported ?? 0, icon: <Clock className="h-5 w-5" />, accent: "text-accent" },
    { label: "Verified", value: statusCounts?.verified ?? 0, icon: <CheckCircle2 className="h-5 w-5" /> },
    { label: "In Progress", value: statusCounts?.in_progress ?? 0, icon: <Loader2 className="h-5 w-5" />, accent: "text-primary" },
    { label: "Resolved", value: statusCounts?.resolved ?? 0, icon: <CheckCircle2 className="h-5 w-5" />, accent: "text-primary" },
    { label: "High Priority", value: stats?.high_priority_unresolved ?? 0, icon: <AlertTriangle className="h-5 w-5" />, accent: "text-destructive" },
  ];

  if (authLoading || (!user && !authLoading)) {
    return (
      <DashboardLayout title="Authority Dashboard" icon={<Building2 className="h-5 w-5" />}>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Authority Dashboard" icon={<Building2 className="h-5 w-5" />}>
      <div className="space-y-6">
        <p className="page-description">
          Review, verify, and resolve civic issues in your department.
        </p>

        {/* Stats */}
        <div className="card-grid-6">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} loading={loading} />
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="review" className="space-y-4">
          <TabsList>
            <TabsTrigger value="review">
              Review Queue
              {(reviewQueue?.length ?? 0) > 0 && (
                <span className="ml-1.5 text-xs bg-destructive/15 text-destructive rounded-full px-1.5 py-0.5">
                  {reviewQueue?.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All Issues</TabsTrigger>
            <TabsTrigger value="urgent">
              Urgent
              {(urgentIssues?.length ?? 0) > 0 && (
                <span className="ml-1.5 text-xs bg-destructive/15 text-destructive rounded-full px-1.5 py-0.5">
                  {urgentIssues?.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="review">
            {reviewLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <IssueTable
                issues={reviewQueue ?? []}
                onVerify={(id) => handleStatusChange(id, "verified")}
                onReject={(id) => { setRejectIssueId(id); setRejectDialogOpen(true); }}
                onInProgress={(id) => handleStatusChange(id, "in_progress")}
                onResolve={(id) => handleStatusChange(id, "resolved")}
                onAddUpdate={(id) => { setUpdateIssueId(id); setUpdateDialogOpen(true); }}
              />
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border">
              <Filter className="h-4 w-4 text-muted-foreground" />

              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Constants.public.Enums.issue_status.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Constants.public.Enums.issue_category.map((c) => (
                    <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[120px] h-9 text-xs">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {Constants.public.Enums.priority_label.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Pincode"
                value={pincodeFilter}
                onChange={(e) => { setPincodeFilter(e.target.value); setPage(0); }}
                className="w-[110px] h-9 text-xs"
              />

              <div className="flex items-center gap-1.5 ml-auto">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(0); }}>
                  <SelectTrigger className="w-[150px] h-9 text-xs">
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

            {allLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <>
                <IssueTable
                  issues={allIssuesData?.issues ?? []}
                  onVerify={(id) => handleStatusChange(id, "verified")}
                  onReject={(id) => { setRejectIssueId(id); setRejectDialogOpen(true); }}
                  onInProgress={(id) => handleStatusChange(id, "in_progress")}
                  onResolve={(id) => handleStatusChange(id, "resolved")}
                  onAddUpdate={(id) => { setUpdateIssueId(id); setUpdateDialogOpen(true); }}
                />
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, allIssuesData?.total ?? 0)} of {allIssuesData?.total}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 0}>
                        Previous
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="urgent">
            {urgentLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <IssueTable
                issues={urgentIssues ?? []}
                onVerify={(id) => handleStatusChange(id, "verified")}
                onReject={(id) => { setRejectIssueId(id); setRejectDialogOpen(true); }}
                onInProgress={(id) => handleStatusChange(id, "in_progress")}
                onResolve={(id) => handleStatusChange(id, "resolved")}
                onAddUpdate={(id) => { setUpdateIssueId(id); setUpdateDialogOpen(true); }}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Progress Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={(open) => {
        if (!open) { setUpdateDialogOpen(false); setUpdateIssueId(null); setUpdateNote(""); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Progress Update</DialogTitle>
            <DialogDescription>
              Provide a brief note about the progress made on this issue. This will be visible in the issue timeline.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Describe the progress or action taken..."
            value={updateNote}
            onChange={(e) => setUpdateNote(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUpdateDialogOpen(false); setUpdateNote(""); }}>
              Cancel
            </Button>
            <Button onClick={handleProgressSubmit} disabled={actionLoading || !updateNote.trim()}>
              {actionLoading ? "Submitting…" : "Submit Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={(open) => {
        if (!open) { setRejectDialogOpen(false); setRejectIssueId(null); setRejectComment(""); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Issue</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this issue. This will be visible to the reporter.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialogOpen(false); setRejectComment(""); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectSubmit} disabled={actionLoading || !rejectComment.trim()}>
              {actionLoading ? "Rejecting…" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}


/* ─── Reusable Issue Table ─── */
interface IssueTableProps {
  issues: Issue[];
  onVerify: (id: string) => void;
  onReject: (id: string) => void;
  onInProgress: (id: string) => void;
  onResolve: (id: string) => void;
  onAddUpdate: (id: string) => void;
}

function IssueTable({ issues, onVerify, onReject, onInProgress, onResolve, onAddUpdate }: IssueTableProps) {
  if (issues.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="h-8 w-8 text-muted-foreground" />}
        title="No issues found"
        description="No issues match the current view."
      />
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[180px]">Issue</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Pincode</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead className="text-center">Reports</TableHead>
            <TableHead className="text-center">Votes</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <TableRow key={issue.id}>
              <TableCell className="font-medium max-w-[220px] truncate">
                {issue.title || formatCategory(issue.category)}
              </TableCell>
              <TableCell>
                <span className="text-xs">{formatCategory(issue.category)}</span>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {issue.pincode || "—"}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-xs ${statusColors[issue.status]}`}>
                  {formatStatus(issue.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-xs ${priorityColors[issue.priority]}`}>
                  {issue.priority}
                </Badge>
              </TableCell>
              <TableCell className="text-center text-xs">{issue.reports_count}</TableCell>
              <TableCell className="text-center text-xs">
                <span className="text-primary">↑{issue.upvotes_count}</span>
                {" / "}
                <span className="text-destructive">↓{issue.downvotes_count}</span>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(issue.updated_at), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/issues/${issue.id}`} className="flex items-center gap-2">
                        <Eye className="h-4 w-4" /> View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {issue.status === "reported" && (
                      <>
                        <DropdownMenuItem onClick={() => onVerify(issue.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" /> Verify Issue
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onReject(issue.id)} className="text-destructive">
                          <XCircle className="h-4 w-4 mr-2" /> Reject Issue
                        </DropdownMenuItem>
                      </>
                    )}
                    {(issue.status === "verified" || issue.status === "assigned") && (
                      <>
                        <DropdownMenuItem onClick={() => onInProgress(issue.id)}>
                          <Play className="h-4 w-4 mr-2" /> Mark In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onReject(issue.id)} className="text-destructive">
                          <XCircle className="h-4 w-4 mr-2" /> Reject Issue
                        </DropdownMenuItem>
                      </>
                    )}
                    {issue.status === "in_progress" && (
                      <>
                        <DropdownMenuItem onClick={() => onAddUpdate(issue.id)}>
                          <MessageSquarePlus className="h-4 w-4 mr-2" /> Add Progress Update
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onResolve(issue.id)}>
                          <Award className="h-4 w-4 mr-2" /> Mark Resolved
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
