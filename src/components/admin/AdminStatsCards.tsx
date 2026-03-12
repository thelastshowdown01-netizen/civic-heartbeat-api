import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, Clock, UserCheck, Loader2, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

export default function AdminStatsCards() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
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

  const { data: statusCounts, isLoading: countsLoading } = useQuery({
    queryKey: ["admin-status-counts"],
    queryFn: async () => {
      const statuses = ["reported", "assigned", "in_progress", "resolved"] as const;
      const results: Record<string, number> = {};
      await Promise.all(
        statuses.map(async (s) => {
          const { count } = await supabase
            .from("issues")
            .select("id", { count: "exact", head: true })
            .eq("status", s);
          results[s] = count ?? 0;
        })
      );
      return results;
    },
    staleTime: 30_000,
  });

  const loading = statsLoading || countsLoading;

  const cards = [
    { label: "Total Issues", value: stats?.total_issues ?? 0, icon: <FileText className="h-5 w-5" /> },
    { label: "Pending Verification", value: statusCounts?.reported ?? 0, icon: <Clock className="h-5 w-5" />, accent: "text-accent" },
    { label: "Assigned", value: statusCounts?.assigned ?? 0, icon: <UserCheck className="h-5 w-5" /> },
    { label: "In Progress", value: statusCounts?.in_progress ?? 0, icon: <Loader2 className="h-5 w-5" />, accent: "text-info" },
    { label: "Resolved", value: statusCounts?.resolved ?? 0, icon: <CheckCircle2 className="h-5 w-5" />, accent: "text-primary" },
    { label: "High Priority Unresolved", value: stats?.high_priority_unresolved ?? 0, icon: <AlertTriangle className="h-5 w-5" />, accent: "text-destructive" },
  ];

  return (
    <div className="card-grid-6">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} loading={loading} />
      ))}
    </div>
  );
}
