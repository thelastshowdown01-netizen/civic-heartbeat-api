import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const HeroSection = () => {
  const { user } = useAuth();

  return (
    <section className="relative max-w-6xl mx-auto px-4 py-20 md:py-32 text-center">
      <Badge variant="secondary" className="mb-6 text-xs tracking-wide uppercase font-medium px-4 py-1">
        Crowdsourced Civic Infrastructure
      </Badge>
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
        Empowering Citizens to{" "}
        <span className="text-primary">Build Better Cities</span>
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
        Report civic issues, track resolution progress, and hold authorities accountable
        — all in one transparent platform.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
        {user ? (
          <Button size="lg" className="gap-2 text-base px-8">
            Report an Issue <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Link to="/signup">
            <Button size="lg" className="gap-2 text-base px-8">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <a href="#issues">
          <Button variant="outline" size="lg" className="gap-2 text-base px-8">
            Explore Issues <ChevronDown className="h-4 w-4" />
          </Button>
        </a>
      </div>
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
        <span>✓ Transparent Status Tracking</span>
        <span>✓ Data-Driven Prioritization</span>
        <span>✓ Community-Powered Resolution</span>
      </div>
    </section>
  );
};

export default HeroSection;
