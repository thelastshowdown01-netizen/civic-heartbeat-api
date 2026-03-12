import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTrendingIssues(limit = 5) {
  return useQuery({
    queryKey: ["trending-issues", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issues")
        .select("id, title, description, category, priority, priority_score, upvotes_count, reports_count, status, pincode, created_at")
        .not("status", "in", '("resolved","rejected")')
        .order("priority_score", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}
