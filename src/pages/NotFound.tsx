import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import PublicLayout from "@/components/layouts/PublicLayout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PublicLayout>
      <div className="flex items-center justify-center py-20">
        <EmptyState
          icon={<Search className="h-6 w-6 text-muted-foreground" />}
          title="Page Not Found"
          description="The page you're looking for doesn't exist or may have been moved."
          action={
            <div className="flex gap-3">
              <Button asChild variant="outline">
                <Link to="/issues">Explore Issues</Link>
              </Button>
              <Button asChild>
                <Link to="/">Go Home</Link>
              </Button>
            </div>
          }
        />
      </div>
    </PublicLayout>
  );
};

export default NotFound;
