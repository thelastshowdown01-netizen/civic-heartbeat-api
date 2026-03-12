import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-16 text-center space-y-4">
        {icon && (
          <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-foreground text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {description}
          </p>
        </div>
        {action && <div className="mt-2">{action}</div>}
      </CardContent>
    </Card>
  );
}
