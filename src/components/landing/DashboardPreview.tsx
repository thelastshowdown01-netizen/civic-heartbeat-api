import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, FileText, MapPin } from "lucide-react";

const DashboardPreview = () => {
  const { data: stats, isLoading } = useDashboardStats();

  const cards = [
    {
      icon: FileText,
      label: "Total Issues",
      value: stats?.total_issues ?? 0,
    },
    {
      icon: CheckCircle,
      label: "Resolved",
      value: stats?.resolved_issues ?? 0,
    },
    {
      icon: AlertTriangle,
      label: "High Priority Active",
      value: stats?.high_priority_unresolved ?? 0,
    },
    {
      icon: MapPin,
      label: "Most Affected Area",
      value: stats?.most_affected_pincode ?? "—",
    },
  ];

  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            Live Civic Dashboard
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Real-time snapshot of civic issues across the platform.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <Card key={c.label} className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <c.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {c.label}
                  </span>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">{c.value}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;
