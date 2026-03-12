import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, X, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useIssueFeed, type FeedFilters } from "@/hooks/useIssueFeed";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { categoryLabels, formatCategory, formatStatus } from "@/lib/issueHelpers";
import IssueCard from "@/components/issues/IssueCard";
import PublicLayout from "@/components/layouts/PublicLayout";
import type { Database } from "@/integrations/supabase/types";

type IssueCategory = Database["public"]["Enums"]["issue_category"];
type IssueStatus = Database["public"]["Enums"]["issue_status"];
type PriorityLabel = Database["public"]["Enums"]["priority_label"];

const CATEGORIES: IssueCategory[] = [
  "pothole", "garbage", "sewer_overflow", "water_leakage",
  "street_light", "road_damage", "other",
];
const STATUSES: IssueStatus[] = [
  "reported", "verified", "assigned", "in_progress", "resolved",
];
const PRIORITIES: PriorityLabel[] = ["low", "medium", "high"];
const SORT_OPTIONS = [
  { value: "recent", label: "Latest" },
  { value: "priority", label: "Highest Priority" },
  { value: "upvoted", label: "Most Upvoted" },
  { value: "reported", label: "Most Reported" },
] as const;

export default function ExploreIssues() {
  const { user } = useAuth();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(0);

  // Filter state
  const [pincode, setPincode] = useState("");
  const [category, setCategory] = useState<IssueCategory | "">("");
  const [status, setStatus] = useState<IssueStatus | "">("");
  const [priority, setPriority] = useState<PriorityLabel | "">("");
  const [sortBy, setSortBy] = useState<FeedFilters["sortBy"]>("recent");

  const filters: FeedFilters = {
    ...(pincode && { pincode }),
    ...(category && { category: category as IssueCategory }),
    ...(status && { status: status as IssueStatus }),
    ...(priority && { priority: priority as PriorityLabel }),
    sortBy,
    page,
    pageSize: 20,
  };

  const { data, isLoading, isFetching } = useIssueFeed(filters);

  // User votes
  const [userVotes, setUserVotes] = useState<Record<string, "up" | "down">>({});
  useEffect(() => {
    if (!user || !data?.issues.length) return;
    const issueIds = data.issues.map((i) => i.id);
    supabase
      .from("votes")
      .select("issue_id, vote_type")
      .eq("user_id", user.id)
      .in("issue_id", issueIds)
      .then(({ data: votes }) => {
        if (!votes) return;
        const map: Record<string, "up" | "down"> = {};
        votes.forEach((v) => (map[v.issue_id] = v.vote_type));
        setUserVotes((prev) => ({ ...prev, ...map }));
      });
  }, [user, data?.issues]);

  const activeFilterCount = [pincode, category, status, priority].filter(Boolean).length;

  const clearFilters = () => {
    setPincode("");
    setCategory("");
    setStatus("");
    setPriority("");
    setPage(0);
  };

  const removeFilter = (key: string) => {
    if (key === "pincode") setPincode("");
    if (key === "category") setCategory("");
    if (key === "status") setStatus("");
    if (key === "priority") setPriority("");
    setPage(0);
  };

  return (
    <PublicLayout>
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Explore City Issues
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Discover what's happening in your area — filter, vote, and track civic problems across the city.
          </p>
        </div>

        {/* Filter Bar */}
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <div className="flex items-center gap-2 mb-4">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>

            <Select
              value={sortBy}
              onValueChange={(v) => { setSortBy(v as FeedFilters["sortBy"]); setPage(0); }}
            >
              <SelectTrigger className="w-[180px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">
                Clear all
              </Button>
            )}
          </div>

          <CollapsibleContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-lg border border-border/50 bg-card mb-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Pincode</label>
                <Input
                  placeholder="e.g. 400001"
                  value={pincode}
                  onChange={(e) => { setPincode(e.target.value.replace(/\D/g, "").slice(0, 6)); setPage(0); }}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                <Select value={category} onValueChange={(v) => { setCategory(v as IssueCategory); setPage(0); }}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{formatCategory(c)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                <Select value={status} onValueChange={(v) => { setStatus(v as IssueStatus); setPage(0); }}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{formatStatus(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
                <Select value={priority} onValueChange={(v) => { setPriority(v as PriorityLabel); setPage(0); }}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {pincode && (
              <Badge variant="secondary" className="gap-1 pr-1">
                Pincode: {pincode}
                <button onClick={() => removeFilter("pincode")} className="ml-1 hover:text-foreground"><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {category && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {formatCategory(category)}
                <button onClick={() => removeFilter("category")} className="ml-1 hover:text-foreground"><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {status && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {formatStatus(status)}
                <button onClick={() => removeFilter("status")} className="ml-1 hover:text-foreground"><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {priority && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {priority.charAt(0).toUpperCase() + priority.slice(1)} priority
                <button onClick={() => removeFilter("priority")} className="ml-1 hover:text-foreground"><X className="h-3 w-3" /></button>
              </Badge>
            )}
          </div>
        )}

        {/* Results count */}
        {data && (
          <p className="text-sm text-muted-foreground mb-4">
            {data.totalCount} issue{data.totalCount !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-lg" />
            ))}
          </div>
        )}

        {/* Issue grid */}
        {!isLoading && data && data.issues.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {data.issues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  userVote={userVotes[issue.id] ?? null}
                  onVoteUpdate={(id, d) => {
                    if (d.user_vote) setUserVotes((prev) => ({ ...prev, [id]: d.user_vote }));
                    else setUserVotes((prev) => { const n = { ...prev }; delete n[id]; return n; });
                  }}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-3 mt-8">
              {page > 0 && (
                <Button variant="outline" onClick={() => setPage((p) => p - 1)} disabled={isFetching}>
                  Previous
                </Button>
              )}
              {data.hasMore && (
                <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={isFetching}>
                  {isFetching ? "Loading..." : "Load More"}
                </Button>
              )}
            </div>
          </>
        )}

        {/* Empty state */}
        {!isLoading && data && data.issues.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <AlertTriangle className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No issues found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              No civic issues match your current filters. Try a different pincode or category, or report a new issue in your area.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              <Button asChild>
                <Link to="/report">Report an Issue</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
