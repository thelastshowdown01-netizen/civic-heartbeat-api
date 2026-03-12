import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, ThumbsUp, MapPin, Users } from "lucide-react";
import { Constants } from "@/integrations/supabase/types";
import { formatCategory, formatStatus, statusColors, priorityColors } from "@/lib/issueHelpers";
import { useIssueFeed, type FeedFilters } from "@/hooks/useIssueFeed";
import { formatDistanceToNow } from "date-fns";

type SortOption = FeedFilters["sortBy"];

const FilterDiscoverSection = () => {
  const [pincode, setPincode] = useState("");
  const [category, setCategory] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [applied, setApplied] = useState<FeedFilters>({ pageSize: 3 });

  const { data, isLoading } = useIssueFeed(applied);

  const handleApply = () => {
    setApplied({
      pincode: pincode || undefined,
      category: (category || undefined) as FeedFilters["category"],
      status: (status || undefined) as FeedFilters["status"],
      priority: (priority || undefined) as FeedFilters["priority"],
      sortBy,
      pageSize: 3,
    });
  };

  const handleClear = () => {
    setPincode("");
    setCategory("");
    setStatus("");
    setPriority("");
    setSortBy("recent");
    setApplied({ pageSize: 3 });
  };

  const removeFilter = (key: keyof FeedFilters) => {
    if (key === "pincode") setPincode("");
    if (key === "category") setCategory("");
    if (key === "status") setStatus("");
    if (key === "priority") setPriority("");
    const next = { ...applied, [key]: undefined };
    setApplied(next);
  };

  const activeFilters = Object.entries(applied).filter(
    ([k, v]) => v !== undefined && k !== "pageSize" && k !== "sortBy"
  );

  return (
    <section className="py-20 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            Explore Civic Issues in Your Area
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Filter by pincode, category, status, or priority — find exactly what's happening in your locality.
          </p>
        </div>

        {/* Filter Card */}
        <Card className="rounded-xl shadow-sm border-border/60 bg-card/80 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-3 items-end">
              <div className="flex-1 min-w-0 w-full lg:w-auto">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Pincode</label>
                <Input
                  placeholder="e.g. 400001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="w-full lg:w-[160px]">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    {Constants.public.Enums.issue_category.map((cat) => (
                      <SelectItem key={cat} value={cat}>{formatCategory(cat)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full lg:w-[140px]">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    {Constants.public.Enums.issue_status.map((s) => (
                      <SelectItem key={s} value={s}>{formatStatus(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full lg:w-[130px]">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    {Constants.public.Enums.priority_label.map((p) => (
                      <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full lg:w-[150px]">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sort By</label>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Latest</SelectItem>
                    <SelectItem value="upvoted">Most Upvoted</SelectItem>
                    <SelectItem value="priority">Highest Priority</SelectItem>
                    <SelectItem value="reported">Most Reported</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 w-full lg:w-auto shrink-0">
                <Button onClick={handleApply} className="gap-2 flex-1 lg:flex-none">
                  <Search className="h-4 w-4" /> Explore
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground">
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active filter chips + count */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-sm font-medium text-muted-foreground">
            {data ? `${data.totalCount} issue${data.totalCount !== 1 ? "s" : ""} found` : "Loading…"}
          </span>
          {activeFilters.map(([key, value]) => (
            <Badge key={key} variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 text-xs">
              <span className="capitalize">{key}:</span> {String(value)}
              <button onClick={() => removeFilter(key as keyof FeedFilters)} className="ml-0.5 hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>

        {/* Results preview */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-14" />
                    <Skeleton className="h-5 w-14" />
                  </div>
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !data?.issues.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-base font-medium">No issues match your filters</p>
            <p className="text-sm mt-1">Try broadening your search criteria.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.issues.map((issue) => (
              <Card
                key={issue.id}
                className="border-border/50 hover:shadow-sm hover:border-primary/20 transition-all"
              >
                <CardContent className="p-4">
                  {/* Category + time */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                      {formatCategory(issue.category)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-sm leading-snug line-clamp-1 mb-2">
                    {issue.title || `${formatCategory(issue.category)} Issue`}
                  </h3>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[issue.status]}`}>
                      {formatStatus(issue.status)}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityColors[issue.priority]}`}>
                      {issue.priority}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" /> {issue.upvotes_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {issue.reports_count}
                      </span>
                    </div>
                    {issue.pincode && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {issue.pincode}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FilterDiscoverSection;
