import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, FileText, MapPin, TrendingUp, Activity, BarChart3 } from "lucide-react";
import { formatCategory } from "@/lib/issueHelpers";

const DashboardPreview = () => {
  const { data: stats, isLoading } = useDashboardStats();

  const resolutionRate =
    stats?.total_issues && stats.total_issues > 0
      ? Math.round((stats.resolved_issues / stats.total_issues) * 100)
      : 0;

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            City-Wide Civic Intelligence
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Real-time metrics on reported issues, resolution progress, and
            priority hotspots — powered by citizen data.
          </p>
        </div>

        {/* Primary Metrics — Top Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Total Issues */}
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Issues
                </span>
              </div>
              {isLoading ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                <p className="text-3xl font-bold">{stats?.total_issues ?? 0}</p>
              )}
            </CardContent>
          </Card>

          {/* Resolved */}
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Resolved
                </span>
              </div>
              {isLoading ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold">
                    {stats?.resolved_issues ?? 0}
                  </p>
                  <span className="text-xs font-medium text-muted-foreground">
                    ({resolutionRate}%)
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* High Priority */}
          <Card className="border-destructive/30 border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  High Priority
                </span>
              </div>
              {isLoading ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                <p className="text-3xl font-bold text-destructive">
                  {stats?.high_priority_unresolved ?? 0}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Most Affected Area */}
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Most Affected
                </span>
              </div>
              {isLoading ? (
                <Skeleton className="h-9 w-24" />
              ) : (
                <p className="text-2xl font-bold">
                  {stats?.most_affected_pincode ?? "—"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Supporting Insights — Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Most Reported Category */}
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Trending Category
                </span>
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {stats?.most_reported_category
                    ? formatCategory(stats.most_reported_category)
                    : "—"}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Resolution Progress */}
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Resolution Progress
                </span>
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-full" />
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overall</span>
                    <span className="font-semibold">{resolutionRate}%</span>
                  </div>
                  <Progress value={resolutionRate} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Issues */}
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Active Issues
                </span>
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-xl font-bold">
                    {stats?.active_issues ?? 0}
                  </p>
                  <Badge
                    variant="outline"
                    className="text-xs border-primary/30 text-primary"
                  >
                    In Progress
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;
