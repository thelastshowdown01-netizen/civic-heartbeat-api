import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Filter, ArrowUpDown, Play, Award, Eye, MessageSquarePlus, Inbox } from "lucide-react";
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

  // Progress update dialog
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateIssueId, setUpdateIssueId] = useState<string | null>(null);
  const [updateNote, setUpdateNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch all assigned issues
  const { data: allIssues, isLoading } = useQuery({
    queryKey: ["authority-issues", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .eq("assignee_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Issue[];
    },
    enabled: !!user,
    staleTime: 15_000,
  });

  // Compute stats client-side
  const stats = useMemo(() => {
    const issues = allIssues ?? [];
    const assigned = issues.filter((i) => i.status === "assigned").length;
    const inProgress = issues.filter((i) => i.status === "in_progress").length;
    const resolved = issues.filter((i) => i.status === "resolved").length;
    const highPriority = issues.filter(
      (i) => i.priority === "high" && i.status !== "resolved" && i.status !== "rejected"
    ).length;
    return { total: issues.length, assigned, inProgress, resolved, highPriority };
  }, [allIssues]);

  // Filter & sort
  const filteredIssues = useMemo(() => {
    let list = allIssues ?? [];
    if (statusFilter !== "all") list = list.filter((i) => i.status === statusFilter);
    if (categoryFilter !== "all") list = list.filter((i) => i.category === categoryFilter);
    if (priorityFilter !== "all") list = list.filter((i) => i.priority === priorityFilter);
    if (pincodeFilter.trim()) list = list.filter((i) => i.pincode === pincodeFilter.trim());

    const sorted = [...list];
    switch (sortBy) {
      case "oldest": sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
      case "priority": sorted.sort((a, b) => b.priority_score - a.priority_score); break;
      case "most_reported": sorted.sort((a, b) => b.reports_count - a.reports_count); break;
      default: sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return sorted;
  }, [allIssues, statusFilter, categoryFilter, priorityFilter, pincodeFilter, sortBy]);

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
      queryClient.invalidateQueries({ queryKey: ["authority-issues"] });
    }
  };

  const handleProgressSubmit = async () => {
    if (!updateIssueId || !updateNote.trim()) return;
    await handleStatusChange(updateIssueId, "in_progress", updateNote.trim());
    setUpdateDialogOpen(false);
    setUpdateIssueId(null);
    setUpdateNote("");
  };

  const statCards = [
    { label: "Total Assigned", value: stats.total, icon: <FileText className="h-5 w-5" /> },
    { label: "New Assignments", value: stats.assigned, icon: <Clock className="h-5 w-5" />, accent: "text-accent" },
    { label: "In Progress", value: stats.inProgress, icon: <Loader2 className="h-5 w-5" />, accent: "text-primary" },
    { label: "Resolved", value: stats.resolved, icon: <CheckCircle2 className="h-5 w-5" />, accent: "text-primary" },
    { label: "High Priority", value: stats.highPriority, icon: <AlertTriangle className="h-5 w-5" />, accent: "text-destructive" },
  ];

  if (authLoading || (!user && !authLoading)) {
    return (
      <DashboardLayout title="Department Work Queue" icon={<Building2 className="h-5 w-5" />}>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Department Work Queue" icon={<Building2 className="h-5 w-5" />}>
      <div className="space-y-6">
        {/* Subtitle */}
        <p className="text-sm text-muted-foreground">
          Manage assigned civic issues, update progress, and move toward resolution.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {statCards.map((card) => (
            <Card key={card.label}>
              <CardContent className="p-4 flex flex-col gap-2">
                <div className={`flex items-center gap-2 ${card.accent ?? "text-muted-foreground"}`}>
                  {card.icon}
                  <span className="text-xs font-medium truncate">{card.label}</span>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <span className="text-2xl font-bold text-foreground">{card.value}</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border">
          <Filter className="h-4 w-4 text-muted-foreground" />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {["assigned", "in_progress", "resolved"].map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
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

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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

          <Input
            placeholder="Pincode"
            value={pincodeFilter}
            onChange={(e) => setPincodeFilter(e.target.value)}
            className="w-[110px] h-9 text-xs"
          />

          <div className="flex items-center gap-1.5 ml-auto">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="priority">Highest Priority</SelectItem>
                <SelectItem value="most_reported">Most Reported</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Work Queue Table */}
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : filteredIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="p-4 rounded-full bg-muted">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No issues assigned yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Assigned civic issues will appear here as they are routed to your department.
            </p>
          </div>
        ) : (
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
                  <TableHead>Assigned</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.map((issue) => (
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
                          {issue.status === "assigned" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(issue.id, "in_progress")}>
                              <Play className="h-4 w-4 mr-2" /> Mark In Progress
                            </DropdownMenuItem>
                          )}
                          {issue.status === "in_progress" && (
                            <>
                              <DropdownMenuItem onClick={() => {
                                setUpdateIssueId(issue.id);
                                setUpdateDialogOpen(true);
                              }}>
                                <MessageSquarePlus className="h-4 w-4 mr-2" /> Add Progress Update
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(issue.id, "resolved")}>
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
        )}
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
    </>
  );
}
