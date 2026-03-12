import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { MapPin, AlertTriangle, Users, ArrowRight } from "lucide-react";

const Index = () => {
  const { user, loading, signOut, userRole } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border px-4 py-3 flex items-center justify-between max-w-6xl mx-auto">
        <h1 className="text-xl font-bold text-primary">🏙️ Sustain City</h1>
        <div className="flex items-center gap-2">
          {loading ? null : user ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.email} ({userRole})
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Report. Track. <span className="text-primary">Resolve.</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Crowdsourced civic issue reporting for your city. Potholes, garbage, leaks — report them, 
          vote on what matters most, and watch your neighborhood improve.
        </p>
        <div className="flex gap-3 justify-center">
          {user ? (
            <Button size="lg" className="gap-2">
              Report an Issue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Link to="/signup">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-16 grid md:grid-cols-3 gap-6">
        {[
          {
            icon: MapPin,
            title: "Pincode-Based Reporting",
            desc: "Report issues in your area with photo evidence and location data.",
          },
          {
            icon: AlertTriangle,
            title: "Smart Priority Scoring",
            desc: "Issues are auto-prioritized based on category, reports, and community votes.",
          },
          {
            icon: Users,
            title: "Community Powered",
            desc: "Upvote issues that matter. Duplicate reports are merged automatically.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-lg border border-border bg-card p-6 text-center"
          >
            <f.icon className="h-10 w-10 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Index;
