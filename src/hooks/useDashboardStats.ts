import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DashboardStats = {
  total_issues: number;
  resolved_issues: number;
  active_issues: number;
  high_priority_unresolved: number;
  most_reported_category: string | null;
  most_affected_pincode: string | null;
};

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dashboard_stats");
      if (error) throw error;
      return data as DashboardStats;
    },
    staleTime: 60_000,
  });
}
