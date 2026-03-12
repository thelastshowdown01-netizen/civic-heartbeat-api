import { Camera, GitMerge, BarChart3, Building2, ThumbsUp, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Camera,
    title: "Photo & Location Reporting",
    desc: "Submit issues with photo evidence and precise location data for faster resolution.",
  },
  {
    icon: GitMerge,
    title: "Smart Duplicate Merging",
    desc: "Similar reports are automatically detected and merged to prevent noise.",
  },
  {
    icon: BarChart3,
    title: "Priority-Based Resolution",
    desc: "Issues are auto-scored using category severity, votes, and report frequency.",
  },
  {
    icon: Building2,
    title: "Authority Assignment",
    desc: "Each issue is routed to the responsible department with full accountability.",
  },
  {
    icon: ThumbsUp,
    title: "Community Voting",
    desc: "Citizens upvote issues that matter most, driving urgency through engagement.",
  },
  {
    icon: Filter,
    title: "Pincode-Based Discovery",
    desc: "Filter and track issues in your specific neighborhood or area.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="bg-muted/30 py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            Built for Real Civic Impact
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every feature is designed to make issue reporting efficient and resolution transparent.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <Card key={f.title} className="border-border/50 bg-card/80">
              <CardContent className="p-6">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
