import { Link } from "react-router-dom";
import { format } from "date-fns";
import { MoreHorizontal, Eye, CheckCircle, UserPlus, Play, XCircle, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCategory, formatStatus, statusColors, priorityColors } from "@/lib/issueHelpers";
import type { Tables } from "@/integrations/supabase/types";

type Issue = Tables<"issues">;

interface AdminIssueTableProps {
  issues: Issue[];
  onAction: (issueId: string, action: string) => void;
}

export default function AdminIssueTable({ issues, onAction }: AdminIssueTableProps) {
  if (issues.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No issues found matching your filters.
      </div>
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
            <TableHead>Authority</TableHead>
            <TableHead className="text-center">Reports</TableHead>
            <TableHead className="text-center">Votes</TableHead>
            <TableHead>Created</TableHead>
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
              <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                {issue.authority_name || "—"}
              </TableCell>
              <TableCell className="text-center text-xs">{issue.reports_count}</TableCell>
              <TableCell className="text-center text-xs">
                <span className="text-primary">↑{issue.upvotes_count}</span>
                {" / "}
                <span className="text-destructive">↓{issue.downvotes_count}</span>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {format(new Date(issue.created_at), "MMM d, yyyy")}
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
                      <Link to={`/admin/issues/${issue.id}`} className="flex items-center gap-2">
                        <Eye className="h-4 w-4" /> Review Issue
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {issue.status === "reported" && (
                      <>
                        <DropdownMenuItem onClick={() => onAction(issue.id, "verify")}>
                          <CheckCircle className="h-4 w-4 mr-2" /> Verify Issue
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAction(issue.id, "reject")} className="text-destructive">
                          <XCircle className="h-4 w-4 mr-2" /> Reject Issue
                        </DropdownMenuItem>
                      </>
                    )}
                    {issue.status === "verified" && (
                      <DropdownMenuItem onClick={() => onAction(issue.id, "assign")}>
                        <UserPlus className="h-4 w-4 mr-2" /> Assign Authority
                      </DropdownMenuItem>
                    )}
                    {issue.status === "assigned" && (
                      <DropdownMenuItem onClick={() => onAction(issue.id, "in_progress")}>
                        <Play className="h-4 w-4 mr-2" /> Mark In Progress
                      </DropdownMenuItem>
                    )}
                    {issue.status === "in_progress" && (
                      <DropdownMenuItem onClick={() => onAction(issue.id, "resolve")}>
                        <Award className="h-4 w-4 mr-2" /> Mark Resolved
                      </DropdownMenuItem>
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
