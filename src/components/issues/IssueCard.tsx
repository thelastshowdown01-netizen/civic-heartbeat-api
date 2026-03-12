import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp, ThumbsDown, MapPin, Users, Clock, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  formatCategory,
  formatStatus,
  statusColors,
  priorityColors,
  categoryIcons,
} from "@/lib/issueHelpers";

type Issue = {
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
  latitude: number | null;
  longitude: number | null;
};

type Props = {
  issue: Issue;
  userVote?: "up" | "down" | null;
  onVoteUpdate?: (issueId: string, data: any) => void;
};


export default function IssueCard({ issue, userVote, onVoteUpdate }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [voting, setVoting] = useState(false);
  const [localVote, setLocalVote] = useState(userVote ?? null);
  const [localUpvotes, setLocalUpvotes] = useState(issue.upvotes_count);
  const [localDownvotes, setLocalDownvotes] = useState(issue.downvotes_count);

  const handleVote = async (voteType: "up" | "down") => {
    if (!user) {
      toast({ title: "Sign in to vote", description: "You need an account to upvote or downvote issues.", variant: "destructive" });
      return;
    }
    if (voting) return;
    setVoting(true);

    // Optimistic update
    const prevVote = localVote;
    const prevUp = localUpvotes;
    const prevDown = localDownvotes;

    if (localVote === voteType) {
      // Toggle off
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
        body: { issue_id: issue.id, vote_type: localVote === voteType ? "remove" : voteType },
      });
      if (error) throw error;
      setLocalUpvotes(data.upvotes_count);
      setLocalDownvotes(data.downvotes_count);
      setLocalVote(data.user_vote);
      onVoteUpdate?.(issue.id, data);
    } catch {
      // Rollback
      setLocalVote(prevVote);
      setLocalUpvotes(prevUp);
      setLocalDownvotes(prevDown);
      toast({ title: "Vote failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setVoting(false);
    }
  };

  const relativeTime = formatDistanceToNow(new Date(issue.created_at), { addSuffix: true });

  return (
    <Card className="border-border/50 hover:shadow-md hover:border-primary/20 transition-all duration-200">
      <CardContent className="p-5">
        {/* Top row: category icon + title */}
        <div className="flex items-start gap-3 mb-3">
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
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
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

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-4">
          {issue.pincode && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {issue.pincode}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" /> {issue.reports_count} report{issue.reports_count !== 1 ? "s" : ""}
          </span>
          {issue.authority_name && (
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {issue.authority_name}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {relativeTime}
          </span>
        </div>

        {/* Vote row */}
        <div className="flex items-center gap-1 border-t border-border/50 pt-3">
          <Button
            variant={localVote === "up" ? "default" : "ghost"}
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => handleVote("up")}
            disabled={voting}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            {localUpvotes}
          </Button>
          <Button
            variant={localVote === "down" ? "destructive" : "ghost"}
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => handleVote("down")}
            disabled={voting}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            {localDownvotes}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
