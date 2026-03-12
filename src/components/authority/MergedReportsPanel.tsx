import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, MapPin, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MergedReportsPanelProps {
  issueId: string;
}

export function MergedReportsPanel({ issueId }: MergedReportsPanelProps) {
  const { data: reports, isLoading } = useQuery({
    queryKey: ["issue-reports", issueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issue_reports")
        .select("id, description, pincode, latitude, longitude, created_at, reporter_id")
        .eq("issue_id", issueId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (!reports || reports.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-3 text-center">
        No individual reports linked to this issue.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MessageSquare className="h-4 w-4 text-primary" />
        <span>{reports.length} {reports.length === 1 ? "person" : "people"} reported this problem</span>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {reports.map((r) => (
          <div
            key={r.id}
            className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5"
          >
            <p className="text-sm text-foreground leading-relaxed">{r.description}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {r.pincode && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {r.pincode}
                </span>
              )}
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> Citizen
              </span>
              <span>{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
