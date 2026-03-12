import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, FileText, CheckCircle2, AlertTriangle, Activity,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PublicLayout from "@/components/layouts/PublicLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { formatStatus, statusColors } from "@/lib/issueHelpers";

export default function AuthorityReports() {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!user || userRole !== "authority")) navigate("/");
  }, [authLoading, user, userRole, navigate]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["authority-dashboard-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dashboard_stats");
      if (error) throw error;
      return data as {
        total_issues: number;
        resolved_issues: number;
        active_issues: number;
        high_priority_unresolved: number;
      };
    },
    staleTime: 30_000,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["authority-recent-activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("status_logs")
        .select("id, issue_id, old_status, new_status, comment, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      const issueIds = [...new Set(data.map((d) => d.issue_id))];
      const { data: issues } = await supabase
        .from("issues")
        .select("id, title, description")
        .in("id", issueIds);
      const issueMap = new Map(issues?.map((i) => [i.id, i.title || i.description.slice(0, 50)]) ?? []);
      return data.map((d) => ({ ...d, issueTitle: issueMap.get(d.issue_id) ?? "Unknown" }));
    },
    staleTime: 30_000,
  });

  if (authLoading || (!user && !authLoading)) {
    return (
      <PublicLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Problems"
            value={stats?.total_issues ?? 0}
            icon={<FileText className="h-5 w-5" />}
            loading={statsLoading}
          />
          <StatCard
            label="Resolved"
            value={stats?.resolved_issues ?? 0}
            icon={<CheckCircle2 className="h-5 w-5" />}
            accent="text-primary"
            loading={statsLoading}
          />
          <StatCard
            label="Active Problems"
            value={stats?.active_issues ?? 0}
            icon={<AlertTriangle className="h-5 w-5" />}
            accent="text-destructive"
            loading={statsLoading}
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!recentActivity || recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              recentActivity.map((a) => (
                <div key={a.id} className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  <span className="flex-1 min-w-0 truncate text-foreground">
                    <span className="font-medium">{a.issueTitle}</span>
                    {" → "}
                    <Badge variant="outline" className={`text-[10px] ${statusColors[a.new_status] ?? ""}`}>
                      {formatStatus(a.new_status)}
                    </Badge>
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
