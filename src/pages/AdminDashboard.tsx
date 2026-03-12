import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, Filter, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import AdminStatsCards from "@/components/admin/AdminStatsCards";
import AdminIssueTable from "@/components/admin/AdminIssueTable";
import AdminActionDialog from "@/components/admin/AdminActionDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Constants } from "@/integrations/supabase/types";
import type { Tables } from "@/integrations/supabase/types";

type Issue = Tables<"issues">;

const PAGE_SIZE = 20;

export default function AdminDashboard() {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && (!user || userRole !== "admin")) {
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

  // Dialog state
  const [dialogAction, setDialogAction] = useState<"assign" | "reject" | null>(null);
  const [dialogIssueId, setDialogIssueId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Moderation queue
  const { data: moderationIssues, isLoading: modLoading } = useQuery({
    queryKey: ["admin-moderation"],
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

  // Urgent issues
  const { data: urgentIssues, isLoading: urgentLoading } = useQuery({
    queryKey: ["admin-urgent"],
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
    queryKey: ["admin-all-issues", statusFilter, categoryFilter, priorityFilter, pincodeFilter, sortBy, page],
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

  const handleAction = async (issueId: string, action: string) => {
    if (action === "assign" || action === "reject") {
      setDialogIssueId(issueId);
      setDialogAction(action);
      return;
    }

    const statusMap: Record<string, string> = {
      verify: "verified",
      in_progress: "in_progress",
      resolve: "resolved",
    };

    const newStatus = statusMap[action];
    if (!newStatus) return;

    setActionLoading(true);
    const { data, error } = await supabase.functions.invoke("update-issue-status", {
      body: { issue_id: issueId, new_status: newStatus },
    });
    setActionLoading(false);

    if (error || data?.error) {
      toast({ title: "Action failed", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Issue updated", description: `Status changed to ${newStatus.replace(/_/g, " ")}.` });
      invalidateAll();
    }
  };

  const handleDialogConfirm = async (formData: { authority_name?: string; comment?: string }) => {
    if (!dialogIssueId || !dialogAction) return;
    setActionLoading(true);

    const body: Record<string, unknown> = { issue_id: dialogIssueId };
    if (dialogAction === "assign") {
      body.new_status = "assigned";
      body.authority_name = formData.authority_name;
    } else if (dialogAction === "reject") {
      body.new_status = "rejected";
      body.comment = formData.comment;
    }

    const { data, error } = await supabase.functions.invoke("update-issue-status", { body });
    setActionLoading(false);

    if (error || data?.error) {
      toast({ title: "Action failed", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Issue updated" });
      setDialogAction(null);
      setDialogIssueId(null);
      invalidateAll();
    }
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-moderation"] });
    queryClient.invalidateQueries({ queryKey: ["admin-urgent"] });
    queryClient.invalidateQueries({ queryKey: ["admin-all-issues"] });
    queryClient.invalidateQueries({ queryKey: ["admin-status-counts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const totalPages = Math.ceil((allIssuesData?.total ?? 0) / PAGE_SIZE);

  if (authLoading || (!user && !authLoading)) {
    return (
      <DashboardLayout title="Admin Dashboard" icon={<Shield className="h-5 w-5" />}>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Dashboard" icon={<Shield className="h-5 w-5" />}>
      <div className="space-y-6">
        <p className="page-description">
          Monitor, manage, and resolve civic issues across the city.
        </p>

        {/* Stats */}
        <AdminStatsCards />

        {/* Tabs */}
        <Tabs defaultValue="moderation" className="space-y-4">
          <TabsList>
            <TabsTrigger value="moderation">
              Moderation Queue
              {(moderationIssues?.length ?? 0) > 0 && (
                <span className="ml-1.5 text-xs bg-destructive/15 text-destructive rounded-full px-1.5 py-0.5">
                  {moderationIssues?.length}
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

          <TabsContent value="moderation">
            {modLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <AdminIssueTable issues={moderationIssues ?? []} onAction={handleAction} />
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
                <AdminIssueTable issues={allIssuesData?.issues ?? []} onAction={handleAction} />
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
              <AdminIssueTable issues={urgentIssues ?? []} onAction={handleAction} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AdminActionDialog
        action={dialogAction}
        issueId={dialogIssueId}
        onClose={() => { setDialogAction(null); setDialogIssueId(null); }}
        onConfirm={handleDialogConfirm}
        loading={actionLoading}
      />
    </DashboardLayout>
  );
}
