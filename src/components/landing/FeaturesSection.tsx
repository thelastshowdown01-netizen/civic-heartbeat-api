import { Camera, GitMerge, BarChart3, Building2, ThumbsUp, Filter } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Photo & Location Reporting",
    desc: "Attach photos, drop a pin, and add your pincode. Every report carries the evidence needed for faster action.",
  },
  {
    icon: GitMerge,
    title: "Smart Duplicate Merging",
    desc: "When 50 people report the same pothole, they see one unified issue — not 50 separate threads.",
  },
  {
    icon: BarChart3,
    title: "Priority-Based Resolution",
    desc: "Sewer overflows rank higher than cosmetic cracks. Auto-scoring ensures the most urgent problems surface first.",
  },
  {
    icon: Building2,
    title: "Authority Assignment",
    desc: "Every issue is routed to the right department. You see who's responsible and what stage it's in.",
  },
  {
    icon: ThumbsUp,
    title: "Community Voting",
    desc: "Upvote issues that affect your daily commute. The more votes, the higher the urgency signal.",
  },
  {
    icon: Filter,
    title: "Pincode-Based Discovery",
    desc: "Enter your pincode. See exactly what's broken, pending, or resolved in your neighborhood.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="bg-muted/30 py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Not Just Reporting — Smarter Civic Resolution
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            From photo-based complaints to authority-tracked resolution, every step is designed to fix real problems faster.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border/50 bg-card/80 p-6 hover:shadow-md hover:border-primary/20 transition-all"
            >
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-base mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
