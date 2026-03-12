import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowRight, Eye } from "lucide-react";

const trustChips = [
  "Real-Time Tracking",
  "Community Voting",
  "Authority Visibility",
  "Smart Prioritization",
];

const FooterCTA = () => {
  const { user } = useAuth();

  return (
    <section className="bg-primary text-primary-foreground py-24">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Your City Needs Your Voice.
        </h2>
        <p className="text-primary-foreground/80 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Every report makes a local problem visible. Every vote helps prioritize what's urgent. Start reporting — and track real progress from complaint to resolution.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          {user ? (
            <Button size="lg" variant="secondary" className="gap-2 text-base px-8">
              Report an Issue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="gap-2 text-base px-8">
                Start Reporting Now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <a href="#issues">
            <Button
              size="lg"
              variant="outline"
              className="gap-2 text-base px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Eye className="h-4 w-4" /> Explore Issues
            </Button>
          </a>
        </div>

        <p className="text-primary-foreground/50 text-sm mb-10">
          Start in seconds — no complexity, just civic action.
        </p>

        {/* Trust Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {trustChips.map((chip) => (
            <span
              key={chip}
              className="border border-primary-foreground/20 text-primary-foreground/70 text-xs rounded-full px-3 py-1"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FooterCTA;
