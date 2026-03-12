import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FooterCTA = () => {
  const { user } = useAuth();

  return (
    <section className="bg-primary text-primary-foreground py-20">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Your city needs your voice.
        </h2>
        <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
          Every report brings your neighborhood one step closer to better infrastructure. Start making a difference today.
        </p>
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
      </div>
    </section>
  );
};

export default FooterCTA;
