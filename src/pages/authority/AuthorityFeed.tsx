import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Filter, ArrowUpDown, FileText, Loader2, Activity,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import PublicLayout from "@/components/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatCategory } from "@/lib/issueHelpers";
import { Constants } from "@/integrations/supabase/types";
import type { Tables } from "@/integrations/supabase/types";
import { IssueActionCard } from "@/components/authority/IssueActionCard";

type Issue = Tables<"issues">;
const PAGE_SIZE = 20;

export default function AuthorityFeed() {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  useEffect(() => {
    if (!authLoading && (!user || userRole !== "authority")) navigate("/");
  }, [authLoading, user, userRole, navigate]);

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(0);

  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateIssueId, setUpdateIssueId] = useState<string | null>(null);
  const [updateNote, setUpdateNote] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectIssueId, setRejectIssueId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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
      toast({ title: "Issue updated", description: `Status → ${newStatus.replace(/_/g, " ")}` });
      qc.invalidateQueries({ queryKey: ["authority-live-feed"] });
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
      <DashboardLayout title="Live Feed" icon={<Activity className="h-5 w-5" />}>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Live Feed" icon={<Activity className="h-5 w-5" />}>
      <div className="space-y-4">
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
