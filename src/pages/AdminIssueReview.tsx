import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft, MapPin, Clock, Users, Building2, ThumbsUp, ThumbsDown,
  AlertTriangle, FileText, Shield, CheckCircle, XCircle, UserPlus,
  Play, Award, MessageSquare, ExternalLink, Layers, Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  formatCategory, formatStatus, statusColors, priorityColors,
} from "@/lib/issueHelpers";
import StatusTimeline from "@/components/issues/StatusTimeline";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const categoryIcons: Record<string, string> = {
  pothole: "🕳️", garbage: "🗑️", sewer_overflow: "🚰", water_leakage: "💧",
  street_light: "💡", road_damage: "🚧", other: "📋",
};

export default function AdminIssueReview() {
  const { id } = useParams<{ id: string }>();
  const { user, userRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [actionLoading, setActionLoading] = useState(false);
  const [authorityName, setAuthorityName] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);

  // Fetch issue
  const { data: issue, isLoading: issueLoading } = useQuery({
    queryKey: ["issue", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("issues").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch status logs with admin names
  const { data: statusLogs = [] } = useQuery({
    queryKey: ["status_logs_admin", id],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from("status_logs")
        .select("*")
        .eq("issue_id", id!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      // Fetch profile names for changed_by_id
      const uniqueIds = [...new Set(logs.map((l) => l.changed_by_id))];
      if (uniqueIds.length === 0) return logs.map((l) => ({ ...l, admin_name: "System" }));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", uniqueIds);
      const nameMap: Record<string, string> = {};
      profiles?.forEach((p) => { nameMap[p.id] = p.full_name || "Admin"; });
      return logs.map((l) => ({ ...l, admin_name: nameMap[l.changed_by_id] || "Admin" }));
    },
    enabled: !!id,
  });

  // Fetch linked reports with reporter profiles
  const { data: reports = [] } = useQuery({
    queryKey: ["issue_reports_admin", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issue_reports")
        .select("*")
        .eq("issue_id", id!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const uniqueIds = [...new Set(data.map((r) => r.reporter_id))];
      if (uniqueIds.length === 0) return data.map((r) => ({ ...r, reporter_name: "Anonymous Citizen" }));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", uniqueIds);
      const nameMap: Record<string, string> = {};
      profiles?.forEach((p) => { nameMap[p.id] = p.full_name || "Anonymous Citizen"; });
      return data.map((r) => ({ ...r, reporter_name: nameMap[r.reporter_id] || "Anonymous Citizen" }));
    },
    enabled: !!id,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["issue", id] });
    queryClient.invalidateQueries({ queryKey: ["status_logs_admin", id] });
  };

  const handleAction = async (newStatus: string, extra?: { comment?: string; authority_name?: string }) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-issue-status", {
        body: { issue_id: id, new_status: newStatus, ...extra },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Issue updated", description: `Status changed to ${formatStatus(newStatus)}.` });
      invalidateAll();
      setShowRejectForm(false);
      setShowAssignForm(false);
      setRejectComment("");
      setAuthorityName("");
    } catch (err: any) {
      toast({ title: "Action failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!adminNote.trim() || !issue) return;
    setActionLoading(true);
    try {
      // Insert a status log with same status as current (note only)
      const { error } = await supabase.from("status_logs").insert({
        issue_id: id!,
        changed_by_id: user!.id,
        old_status: issue.status,
        new_status: issue.status,
        comment: adminNote.trim(),
      });
      if (error) throw error;
      toast({ title: "Note added" });
      setAdminNote("");
      setShowNoteForm(false);
      queryClient.invalidateQueries({ queryKey: ["status_logs_admin", id] });
    } catch (err: any) {
      toast({ title: "Failed to add note", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  // Auth guard
  if (authLoading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex items-center justify-center py-20">
          <Skeleton className="h-8 w-48" />
        </div>
      </DashboardLayout>
    );
  }

  if (userRole !== "admin") {
    return (
      <DashboardLayout title="Access Denied">
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <Shield className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground">Admin access required.</p>
          <Button asChild variant="outline"><Link to="/">Go Home</Link></Button>
        </div>
      </DashboardLayout>
    );
  }

  if (issueLoading) {
    return (
      <DashboardLayout title="Loading Issue...">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-6 w-40 mb-6" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
            </div>
            <Skeleton className="h-96 rounded-lg" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!issue) {
    return (
      <DashboardLayout title="Issue Not Found">
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <AlertTriangle className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Issue Not Found</h2>
          <Button asChild variant="outline"><Link to="/admin"><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Link></Button>
        </div>
      </DashboardLayout>
    );
  }

  const firstImage = reports.find((r) => r.image_url)?.image_url;
  const adminNotes = statusLogs.filter((l) => l.comment);
  const severityNote = issue.priority === "high" && issue.reports_count > 2
    ? `High priority — ${formatCategory(issue.category)} with ${issue.reports_count} citizen reports`
    : issue.priority === "high"
    ? `High priority issue requiring immediate attention`
    : issue.reports_count > 3
    ? `Multiple reports (${issue.reports_count}) indicate widespread concern`
    : null;

  return (
    <DashboardLayout title="Issue Review">
      <div className="max-w-6xl mx-auto">
        {/* Back link */}
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Admin Dashboard
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-3xl mt-0.5" aria-hidden>
              {categoryIcons[issue.category] ?? "📋"}
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                {issue.title || formatCategory(issue.category)}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Issue Review · Administrative Action Panel
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className={statusColors[issue.status]}>
              {formatStatus(issue.status)}
            </Badge>
            <Badge variant="outline" className={priorityColors[issue.priority]}>
              {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)} Priority
            </Badge>
            <Badge variant="secondary">{formatCategory(issue.category)}</Badge>
            {issue.reports_count > 1 && (
              <Badge variant="secondary" className="gap-1">
                <Layers className="h-3 w-3" /> {issue.reports_count} merged reports
              </Badge>
            )}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            {issue.pincode && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {issue.pincode}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Reported {format(new Date(issue.created_at), "MMM d, yyyy · h:mm a")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> {issue.reports_count} report{issue.reports_count !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            {firstImage && (
              <div className="rounded-lg overflow-hidden border border-border/50 bg-muted">
                <img
                  src={firstImage}
                  alt={issue.title || "Issue photo"}
                  className="w-full max-h-96 object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {/* Description */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" /> Full Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {issue.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                  <span>Category: {formatCategory(issue.category)}</span>
                  {issue.pincode && <span>Pincode: {issue.pincode}</span>}
                  {issue.latitude && issue.longitude && (
                    <span>Coordinates: {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Authority assignment status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" /> Authority Assignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {issue.authority_name ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-primary border-primary/30">
                      {issue.authority_name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Assigned</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No authority assigned yet.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Priority & Community Signals */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" /> Priority & Community Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 rounded-md bg-muted">
                    <p className="text-2xl font-bold text-foreground">{issue.priority_score}</p>
                    <p className="text-xs text-muted-foreground">Priority Score</p>
                  </div>
                  <div className="text-center p-3 rounded-md bg-muted">
                    <p className="text-2xl font-bold text-foreground">{issue.reports_count}</p>
                    <p className="text-xs text-muted-foreground">Reports</p>
                  </div>
                  <div className="text-center p-3 rounded-md bg-muted">
                    <p className="text-2xl font-bold text-primary">{issue.upvotes_count}</p>
                    <p className="text-xs text-muted-foreground">Upvotes</p>
                  </div>
                  <div className="text-center p-3 rounded-md bg-muted">
                    <p className="text-2xl font-bold text-destructive">{issue.downvotes_count}</p>
                    <p className="text-xs text-muted-foreground">Downvotes</p>
                  </div>
                </div>
                {severityNote && (
                  <div className="text-xs text-accent-foreground bg-accent/10 border border-accent/20 rounded-md px-3 py-2">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    {severityNote}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Linked Reports */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" /> Linked Reports ({reports.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No linked reports found.</p>
                ) : (
                  <div className="space-y-4">
                    {reports.map((r: any, idx: number) => (
                      <div key={r.id} className="flex gap-3 p-3 rounded-md border border-border/50 bg-muted/30">
                        {r.image_url && (
                          <img
                            src={r.image_url}
                            alt="Report image"
                            className="w-16 h-16 rounded object-cover shrink-0 border border-border/50"
                          />
                        )}
                        {!r.image_url && (
                          <div className="w-16 h-16 rounded bg-muted flex items-center justify-center shrink-0">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-foreground">
                              {(r as any).reporter_name}
                            </span>
                            <Badge variant="secondary" className="text-[10px] h-4">
                              Report #{idx + 1}
                            </Badge>
                            {idx > 0 && (
                              <Badge variant="outline" className="text-[10px] h-4 text-muted-foreground">
                                Merged
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-foreground/80 line-clamp-2">{r.description}</p>
                          <div className="flex gap-3 mt-1 text-[11px] text-muted-foreground">
                            <span>{format(new Date(r.created_at), "MMM d, yyyy")}</span>
                            {r.pincode && <span>📍 {r.pincode}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Duplicate Review */}
            {issue.reports_count > 1 && (
              <Card className="border-accent/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="h-4 w-4 text-accent" /> Duplicate Review
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80 mb-2">
                    Consolidated from <strong>{issue.reports_count}</strong> citizen reports.
                  </p>
                  {issue.reports_count > 2 && (
                    <Badge variant="outline" className="text-xs border-accent/30 text-accent">
                      Possible duplicates consolidated
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Internal Admin Notes */}
            <Card className="bg-muted/30 border-muted-foreground/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" /> Internal Admin Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {adminNotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No admin notes yet.</p>
                ) : (
                  <div className="space-y-3">
                    {adminNotes.map((note: any) => (
                      <div key={note.id} className="p-3 rounded-md bg-background border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-foreground">{note.admin_name}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {format(new Date(note.created_at), "MMM d, yyyy · h:mm a")}
                          </span>
                          {note.old_status !== note.new_status && (
                            <Badge variant="outline" className="text-[10px] h-4">
                              {formatStatus(note.old_status)} → {formatStatus(note.new_status)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-foreground/80">{note.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Admin Actions */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Admin Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {issue.status === "reported" && (
                  <>
                    <Button
                      className="w-full justify-start gap-2"
                      onClick={() => handleAction("verified")}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="h-4 w-4" /> Verify Issue
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full justify-start gap-2"
                      onClick={() => setShowRejectForm(true)}
                      disabled={actionLoading}
                    >
                      <XCircle className="h-4 w-4" /> Reject Issue
                    </Button>
                  </>
                )}

                {issue.status === "verified" && (
                  <Button
                    className="w-full justify-start gap-2"
                    onClick={() => setShowAssignForm(true)}
                    disabled={actionLoading}
                  >
                    <UserPlus className="h-4 w-4" /> Assign Authority
                  </Button>
                )}

                {issue.status === "assigned" && (
                  <Button
                    className="w-full justify-start gap-2"
                    onClick={() => handleAction("in_progress")}
                    disabled={actionLoading}
                  >
                    <Play className="h-4 w-4" /> Mark In Progress
                  </Button>
                )}

                {issue.status === "in_progress" && (
                  <Button
                    className="w-full justify-start gap-2"
                    onClick={() => handleAction("resolved")}
                    disabled={actionLoading}
                  >
                    <Award className="h-4 w-4" /> Mark Resolved
                  </Button>
                )}

                {/* Reject from non-terminal statuses */}
                {["verified", "assigned"].includes(issue.status) && (
                  <Button
                    variant="destructive"
                    className="w-full justify-start gap-2"
                    onClick={() => setShowRejectForm(true)}
                    disabled={actionLoading}
                  >
                    <XCircle className="h-4 w-4" /> Reject Issue
                  </Button>
                )}

                <Separator />

                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setShowNoteForm(true)}
                  disabled={actionLoading}
                >
                  <MessageSquare className="h-4 w-4" /> Add Admin Note
                </Button>

                <Button asChild variant="ghost" className="w-full justify-start gap-2">
                  <Link to={`/issues/${id}`}>
                    <ExternalLink className="h-4 w-4" /> View Public Page
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Assign Authority Form */}
            {showAssignForm && (
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Assign Authority</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="authority-name" className="text-xs">Authority / Department Name</Label>
                    <Input
                      id="authority-name"
                      placeholder="e.g. Public Works Department"
                      value={authorityName}
                      onChange={(e) => setAuthorityName(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAction("assigned", { authority_name: authorityName })}
                      disabled={actionLoading || !authorityName.trim()}
                    >
                      {actionLoading ? "Assigning..." : "Confirm Assignment"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setShowAssignForm(false); setAuthorityName(""); }}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reject Form */}
            {showRejectForm && (
              <Card className="border-destructive/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-destructive">Reject Issue</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="reject-comment" className="text-xs">Rejection Reason</Label>
                    <Textarea
                      id="reject-comment"
                      placeholder="Provide a reason visible to the reporter..."
                      value={rejectComment}
                      onChange={(e) => setRejectComment(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleAction("rejected", { comment: rejectComment })}
                      disabled={actionLoading || !rejectComment.trim()}
                    >
                      {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setShowRejectForm(false); setRejectComment(""); }}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add Note Form */}
            {showNoteForm && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Add Admin Note</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="admin-note" className="text-xs">Internal Note</Label>
                    <Textarea
                      id="admin-note"
                      placeholder="Add an internal note..."
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleAddNote}
                      disabled={actionLoading || !adminNote.trim()}
                    >
                      {actionLoading ? "Saving..." : "Save Note"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setShowNoteForm(false); setAdminNote(""); }}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Issue Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusTimeline
                  currentStatus={issue.status}
                  statusLogs={statusLogs}
                  resolvedAt={issue.resolved_at}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
