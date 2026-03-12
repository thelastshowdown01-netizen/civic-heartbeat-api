import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: string;
  loading?: boolean;
  onClick?: () => void;
  active?: boolean;
}

export function StatCard({ label, value, icon, accent, loading, onClick, active }: StatCardProps) {
  return (
    <Card
      className={`transition-all ${onClick ? "cursor-pointer hover:shadow-md hover:border-primary/30" : ""} ${active ? "ring-2 ring-primary border-primary" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col gap-2">
        <div className={`flex items-center gap-2 ${accent ?? "text-muted-foreground"}`}>
          {icon}
          <span className="text-xs font-medium truncate">{label}</span>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <span className="text-2xl font-bold text-foreground">{value}</span>
        )}
      </CardContent>
    </Card>
  );
}
