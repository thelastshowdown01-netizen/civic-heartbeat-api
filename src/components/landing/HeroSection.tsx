import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ChevronDown, ThumbsUp, MapPin, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { formatCategory, formatStatus, statusColors, priorityColors } from "@/lib/issueHelpers";

const mockIssues = [
  {
    id: 1,
    category: "pothole",
    title: "Large pothole near MG Road junction causing traffic",
    status: "in_progress",
    priority: "high",
    upvotes: 47,
    pincode: "560001",
  },
  {
    id: 2,
    category: "water_leakage",
    title: "Pipeline burst flooding residential area since 3 days",
    status: "assigned",
    priority: "high",
    upvotes: 32,
    pincode: "560034",
  },
  {
    id: 3,
    category: "street_light",
    title: "Multiple street lights non-functional on 5th Cross",
    status: "verified",
    priority: "medium",
    upvotes: 18,
    pincode: "560011",
  },
];

const trustChips = [
  "Real-Time Tracking",
  "Duplicate Merging",
  "Smart Prioritization",
  "Authority Visibility",
  "Community Voting",
];

const HeroSection = () => {
  const { user } = useAuth();
  const { activateDemo } = useDemo();

  return (
    <section className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
      <div className="md:grid md:grid-cols-2 gap-12 items-center">
        {/* Left Column */}
        <div className="text-center md:text-left">
          <Badge variant="secondary" className="mb-6 text-xs tracking-wide uppercase font-medium px-4 py-1">
            Civic Resolution Platform
          </Badge>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Report. Prioritize. Resolve.
            <br />
            Civic Issues{" "}
            <span className="text-primary">That Matter.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed mx-auto md:mx-0">
            Submit civic problems with photos and location. The platform merges
            duplicates, scores urgency, assigns authorities, and lets you track
            every step — transparently.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start mb-8">
            {user ? (
              <Link to="/report">
                <Button size="lg" className="gap-2 text-base px-8">
                  Report an Issue <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
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

          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            {trustChips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/* Right Column — Product Mock */}
        <div className="hidden md:block">
          <div className="rounded-xl border border-border bg-card p-5 shadow-lg">
            {/* Mini Stats Bar */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { icon: FileText, label: "Total Issues", value: "142" },
                { icon: CheckCircle, label: "Resolved", value: "89" },
                { icon: AlertTriangle, label: "High Priority", value: "12" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg bg-muted/50 p-3 text-center"
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <stat.icon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground">
                      {stat.label}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Mock Issue Cards */}
            <div className="space-y-3">
              {mockIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-lg border border-border bg-background p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                      {formatCategory(issue.category)}
                    </span>
                    <div className="flex gap-1.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[issue.status]}`}
                      >
                        {formatStatus(issue.status)}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityColors[issue.priority]}`}
                      >
                        {issue.priority}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground line-clamp-1 mb-2">
                    {issue.title}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" /> {issue.upvotes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {issue.pincode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
