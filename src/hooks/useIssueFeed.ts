import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type IssueStatus = Database["public"]["Enums"]["issue_status"];
type IssueCategory = Database["public"]["Enums"]["issue_category"];
type PriorityLabel = Database["public"]["Enums"]["priority_label"];

export type FeedFilters = {
  pincode?: string;
  category?: IssueCategory;
  status?: IssueStatus;
  priority?: PriorityLabel;
  authorityName?: string;
  sortBy?: "recent" | "priority" | "upvoted" | "reported";
  page?: number;
  pageSize?: number;
};
  sortBy?: "recent" | "priority" | "upvoted" | "reported";
  page?: number;
  pageSize?: number;
};

const SORT_MAP: Record<string, { column: string; ascending: boolean }> = {
  recent: { column: "created_at", ascending: false },
  priority: { column: "priority_score", ascending: false },
  upvoted: { column: "upvotes_count", ascending: false },
  reported: { column: "reports_count", ascending: false },
};

export function useIssueFeed(filters: FeedFilters = {}) {
  const {
    pincode,
    category,
    status,
    priority,
    authorityName,
    sortBy = "recent",
    page = 0,
    pageSize = 20,
  } = filters;

  return useQuery({
    queryKey: ["issue-feed", filters],
    queryFn: async () => {
      let query = supabase
        .from("issues")
        .select(
          "id, title, description, category, image_url, pincode, status, priority, priority_score, upvotes_count, downvotes_count, reports_count, authority_name, created_at, latitude, longitude",
          { count: "exact" }
        );

      // Exclude rejected from public feed unless explicitly filtering for it
      if (!status) {
        query = query.neq("status", "rejected");
      } else {
        query = query.eq("status", status);
      }

      if (pincode) query = query.eq("pincode", pincode);
      if (category) query = query.eq("category", category);
      if (priority) query = query.eq("priority", priority);
      if (authorityName) query = query.eq("authority_name", authorityName);

      const sort = SORT_MAP[sortBy] || SORT_MAP.recent;
      query = query.order(sort.column, { ascending: sort.ascending });

      const from = page * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        issues: data ?? [],
        totalCount: count ?? 0,
        hasMore: (count ?? 0) > from + pageSize,
        page,
        pageSize,
      };
    },
  });
}
