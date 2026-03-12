import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft, MapPin, Clock, Users, Building2, ThumbsUp, ThumbsDown,
  AlertTriangle, FileText, Info, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  formatCategory, formatStatus, statusColors, priorityColors,
} from "@/lib/issueHelpers";
import StatusTimeline from "@/components/issues/StatusTimeline";
import Navbar from "@/components/landing/Navbar";

const categoryIcons: Record<string, string> = {
  pothole: "🕳️", garbage: "🗑️", sewer_overflow: "🚰", water_leakage: "💧",
  street_light: "💡", road_damage: "🚧", other: "📋",
};

const NEXT_STEPS: Record<string, string> = {
  reported: "This issue is awaiting verification by a city official. Once verified, it will be assigned to the relevant department.",
  verified: "This issue has been verified and will soon be assigned to the responsible authority or department.",
  assigned: "An authority has been assigned. Work is expected to begin shortly.",
  in_progress: "The assigned authority is actively working on resolving this issue.",
  resolved: "This issue has been resolved. Thank you to everyone who reported and supported it.",
  rejected: "This issue was reviewed and rejected by an administrator. See notes for details.",
};

export default function IssueDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch issue
  const { data: issue, isLoading: issueLoading } = useQuery({
    queryKey: ["issue", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch status logs
  const { data: statusLogs = [] } = useQuery({
    queryKey: ["status_logs", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("status_logs")
        .select("*")
        .eq("issue_id", id!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch reports (for images)
  const { data: reports = [] } = useQuery({
    queryKey: ["issue_reports", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issue_reports")
        .select("id, image_url, description, created_at")
        .eq("issue_id", id!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Voting state
  const [localVote, setLocalVote] = useState<"up" | "down" | null>(null);
  const [localUpvotes, setLocalUpvotes] = useState(0);
  const [localDownvotes, setLocalDownvotes] = useState(0);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    if (issue) {
      setLocalUpvotes(issue.upvotes_count);
      setLocalDownvotes(issue.downvotes_count);
    }
  }, [issue]);

  // Fetch user vote
  useEffect(() => {
    if (!user || !id) return;
    supabase
      .from("votes")
      .select("vote_type")
      .eq("user_id", user.id)
      .eq("issue_id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setLocalVote(data.vote_type);
      });
  }, [user, id]);

  const handleVote = async (voteType: "up" | "down") => {
    if (!user) {
      toast({ title: "Sign in to vote", description: "You need an account to upvote or downvote issues.", variant: "destructive" });
      return;
    }
    if (voting) return;
    setVoting(true);

    const prevVote = localVote;
    const prevUp = localUpvotes;
    const prevDown = localDownvotes;

    if (localVote === voteType) {
      setLocalVote(null);
      if (voteType === "up") setLocalUpvotes((v) => v - 1);
      else setLocalDownvotes((v) => v - 1);
    } else {
      if (localVote === "up") setLocalUpvotes((v) => v - 1);
      if (localVote === "down") setLocalDownvotes((v) => v - 1);
      setLocalVote(voteType);
      if (voteType === "up") setLocalUpvotes((v) => v + 1);
      else setLocalDownvotes((v) => v + 1);
    }

    try {
      const { data, error } = await supabase.functions.invoke("vote-issue", {
        body: { issue_id: id, vote_type: localVote === voteType ? "remove" : voteType },
      });
      if (error) throw error;
      setLocalUpvotes(data.upvotes_count);
      setLocalDownvotes(data.downvotes_count);
      setLocalVote(data.user_vote);
    } catch {
      setLocalVote(prevVote);
      setLocalUpvotes(prevUp);
      setLocalDownvotes(prevDown);
      toast({ title: "Vote failed", variant: "destructive" });
    } finally {
      setVoting(false);
    }
  };

  const firstImage = reports.find((r) => r.image_url)?.image_url;

  // Loading
  if (issueLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 pt-24 pb-16">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-10 w-3/4 mb-3" />
          <div className="flex gap-2 mb-6">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
            </div>
            <Skeleton className="h-80 rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  // Not found
  if (!issue) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 pt-24 pb-16 flex flex-col items-center justify-center text-center py-32">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Issue Not Found</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            This issue may have been removed or the link is incorrect.
          </p>
          <Button asChild variant="outline">
            <Link to="/issues"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Issues</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        {/* Back link */}
        <Link
          to="/issues"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Explore Issues
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-3xl mt-0.5" aria-hidden>
              {categoryIcons[issue.category] ?? "📋"}
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                {issue.title || formatCategory(issue.category)}
              </h1>
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
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            {issue.pincode && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {issue.pincode}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Reported {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> {issue.reports_count} report{issue.reports_count !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Two-column layout */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
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
                  <FileText className="h-4 w-4 text-muted-foreground" /> Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {issue.description}
                </p>
              </CardContent>
            </Card>

            {/* Authority */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" /> Assigned Authority
                </CardTitle>
              </CardHeader>
              <CardContent>
                {issue.authority_name ? (
                  <p className="text-sm font-medium text-foreground">{issue.authority_name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No authority assigned yet — this issue is awaiting review and assignment.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Community Signals */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" /> Community Signals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant={localVote === "up" ? "default" : "ghost"}
                    size="sm"
                    className="h-9 gap-2"
                    onClick={() => handleVote("up")}
                    disabled={voting}
                  >
                    <ThumbsUp className="h-4 w-4" /> {localUpvotes}
                  </Button>
                  <Button
                    variant={localVote === "down" ? "destructive" : "ghost"}
                    size="sm"
                    className="h-9 gap-2"
                    onClick={() => handleVote("down")}
                    disabled={voting}
                  >
                    <ThumbsDown className="h-4 w-4" /> {localDownvotes}
                  </Button>
                  <span className="text-sm text-muted-foreground ml-2">
                    {issue.reports_count} citizen report{issue.reports_count !== 1 ? "s" : ""}
                  </span>
                </div>

                {issue.reports_count > 1 && (
                  <p className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
                    <Info className="h-3 w-3 inline mr-1" />
                    Multiple similar complaints have been merged into this single issue for efficient tracking.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Linked reports */}
            {reports.length > 1 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Linked Reports ({reports.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reports.slice(0, 5).map((r, idx) => (
                    <div key={r.id} className="flex items-start gap-3 text-sm">
                      <span className="text-muted-foreground text-xs mt-0.5 shrink-0">#{idx + 1}</span>
                      <div className="min-w-0">
                        <p className="text-foreground/90 line-clamp-2">{r.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {reports.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      + {reports.length - 5} more report{reports.length - 5 !== 1 ? "s" : ""}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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

            {/* What happens next */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" /> What Happens Next
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {NEXT_STEPS[issue.status] || "Status update will follow."}
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button asChild variant="outline" className="w-full justify-start gap-2">
                  <Link to="/report">
                    <ExternalLink className="h-4 w-4" /> Report Similar Issue
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start gap-2">
                  <Link to="/issues">
                    <ArrowLeft className="h-4 w-4" /> Back to Explore Issues
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
