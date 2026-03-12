import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ClipboardList, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import PublicLayout from "@/components/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";
import { IssueActionCard } from "@/components/authority/IssueActionCard";

type Issue = Tables<"issues">;

export default function AuthorityMerged() {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  useEffect(() => {
    if (!authLoading && (!user || userRole !== "authority")) navigate("/");
  }, [authLoading, user, userRole, navigate]);

  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateIssueId, setUpdateIssueId] = useState<string | null>(null);
  const [updateNote, setUpdateNote] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectIssueId, setRejectIssueId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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
      qc.invalidateQueries({ queryKey: ["authority-merged-issues"] });
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

  if (authLoading || (!user && !authLoading)) {
    return (
      <PublicLayout>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </PublicLayout>
    );
  }

  return (
    <DashboardLayout title="Merged Issues" icon={<ClipboardList className="h-5 w-5" />}>
      <div className="space-y-4">
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
