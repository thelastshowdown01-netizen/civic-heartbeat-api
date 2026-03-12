import { useTrendingIssues } from "@/hooks/useTrendingIssues";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp, Users, MapPin } from "lucide-react";
import { formatCategory, formatStatus, statusColors, priorityColors } from "@/lib/issueHelpers";
import { formatDistanceToNow } from "date-fns";

const IssueFeedPreview = () => {
  const { data: issues, isLoading } = useTrendingIssues(6);

  return (
    <section id="issues" className="bg-muted/30 py-20 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            Trending Issues
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            The most pressing civic issues reported by the community right now.
          </p>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !issues?.length ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">No issues reported yet</p>
            <p className="text-sm mt-1">Be the first to report a civic issue in your area.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {issues.map((issue) => (
              <Card key={issue.id} className="border-border/50 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                      {formatCategory(issue.category)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm mb-3 line-clamp-2">
                    {issue.title || `${formatCategory(issue.category)} Issue`}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[issue.status]}`}>
                      {formatStatus(issue.status)}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityColors[issue.priority]}`}>
                      {issue.priority}
                    </span>
                  </div>
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

export default IssueFeedPreview;
