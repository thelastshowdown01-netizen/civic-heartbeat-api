import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  ThumbsUp, Users, MapPin, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Play, Award, Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatCategory, formatStatus, statusColors, priorityColors, categoryIcons,
} from "@/lib/issueHelpers";
import { MergedReportsPanel } from "./MergedReportsPanel";
import type { Tables } from "@/integrations/supabase/types";

type Issue = Tables<"issues">;

interface IssueActionCardProps {
  issue: Issue;
  onVerify: (id: string) => void;
  onReject: (id: string) => void;
  onInProgress: (id: string) => void;
  onResolve: (id: string) => void;
  onAddUpdate: (id: string) => void;
  showMergedExpand?: boolean;
}

export function IssueActionCard({
  issue,
  onVerify,
  onReject,
  onInProgress,
  onResolve,
  onAddUpdate,
  showMergedExpand = false,
}: IssueActionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusActions = getStatusActions(issue.status);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4 space-y-3">
        {/* Top row: category icon, title, badges */}
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">{categoryIcons[issue.category] ?? "📋"}</span>
          <div className="flex-1 min-w-0">
            <Link
              to={`/issues/${issue.id}`}
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
            >
              {issue.title || issue.description.slice(0, 60)}
            </Link>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {issue.description}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className={`text-[10px] ${priorityColors[issue.priority]}`}>
              {issue.priority}
            </Badge>
            <Badge variant="outline" className={`text-[10px] ${statusColors[issue.status]}`}>
              {formatStatus(issue.status)}
            </Badge>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {issue.pincode || "N/A"}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" /> {issue.upvotes_count}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {issue.reports_count} {issue.reports_count === 1 ? "report" : "reports"}
          </span>
          <span>{formatCategory(issue.category)}</span>
          <span className="ml-auto">{formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {statusActions.includes("verify") && (
            <Button size="sm" variant="outline" onClick={() => onVerify(issue.id)} className="text-xs h-7">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Verify
            </Button>
          )}
          {statusActions.includes("reject") && (
            <Button size="sm" variant="outline" onClick={() => onReject(issue.id)} className="text-xs h-7 text-destructive border-destructive/30 hover:bg-destructive/10">
              <XCircle className="h-3 w-3 mr-1" /> Reject
            </Button>
          )}
          {statusActions.includes("in_progress") && (
            <Button size="sm" variant="outline" onClick={() => onInProgress(issue.id)} className="text-xs h-7">
              <Play className="h-3 w-3 mr-1" /> Mark WIP
            </Button>
          )}
          {statusActions.includes("resolve") && (
            <Button size="sm" variant="outline" onClick={() => onResolve(issue.id)} className="text-xs h-7 text-primary border-primary/30 hover:bg-primary/10">
              <Award className="h-3 w-3 mr-1" /> Resolve
            </Button>
          )}
          {statusActions.includes("update") && (
            <Button size="sm" variant="ghost" onClick={() => onAddUpdate(issue.id)} className="text-xs h-7">
              <Eye className="h-3 w-3 mr-1" /> Add Update
            </Button>
          )}

          {/* Expand merged reports */}
          {(showMergedExpand || issue.reports_count > 1) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="text-xs h-7 ml-auto"
            >
              <Users className="h-3 w-3 mr-1" />
              {issue.reports_count} reports
              {expanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </Button>
          )}
        </div>

        {/* Expanded reports panel */}
        {expanded && (
          <div className="pt-2 border-t border-border">
            <MergedReportsPanel issueId={issue.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getStatusActions(status: string): string[] {
  switch (status) {
    case "reported":
      return ["verify", "reject"];
    case "verified":
      return ["in_progress", "reject", "update"];
    case "assigned":
      return ["in_progress", "update"];
    case "in_progress":
      return ["resolve", "update"];
    case "resolved":
      return [];
    case "rejected":
      return [];
    default:
      return [];
  }
}
