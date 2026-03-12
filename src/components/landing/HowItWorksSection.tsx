import { Camera, GitMerge, TrendingUp, Building2, CheckCircle2, ChevronRight } from "lucide-react";

const steps = [
  {
    icon: Camera,
    title: "Report the Issue",
    desc: "Upload a photo, describe the problem, and tag your pincode — takes under a minute.",
  },
  {
    icon: GitMerge,
    title: "Duplicates Are Merged",
    desc: "Similar or nearby reports are automatically grouped into a single master issue.",
  },
  {
    icon: TrendingUp,
    title: "Priority Is Determined",
    desc: "Issues are ranked by severity, report volume, and community votes — urgent cases surface first.",
  },
  {
    icon: Building2,
    title: "Authority Is Assigned",
    desc: "The responsible department takes ownership with clear accountability.",
  },
  {
    icon: CheckCircle2,
    title: "Tracked to Resolution",
    desc: "Follow every status change from reported to resolved — fully transparent.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="bg-muted/30 py-20 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            From Citizen Report to Civic Resolution
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            Five structured steps that turn everyday complaints into tracked, transparent government action.
          </p>
        </div>

        {/* Desktop: horizontal flow */}
        <div className="hidden lg:flex items-start justify-center gap-2">
          {steps.map((step, i) => (
            <div key={step.title} className="contents">
              <div className="flex flex-col items-center text-center flex-1 max-w-[200px] group">
                <span className="text-xs font-bold text-primary mb-2">Step {i + 1}</span>
                <div className="h-14 w-14 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-1.5">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="flex items-center pt-10 shrink-0">
                  <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: vertical timeline */}
        <div className="lg:hidden relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={step.title} className="flex gap-5 items-start relative">
                <div className="relative z-10 flex flex-col items-center shrink-0">
                  <span className="text-[10px] font-bold text-primary mb-1">Step {i + 1}</span>
                  <div className="h-12 w-12 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="pt-4">
                  <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
