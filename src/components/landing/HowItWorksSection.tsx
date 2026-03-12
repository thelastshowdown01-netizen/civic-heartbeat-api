import { FileText, Search, BarChart3, Building2, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "Report",
    desc: "Submit an issue with photo, location, and category.",
  },
  {
    icon: Search,
    title: "Detect",
    desc: "System checks for similar existing reports and merges duplicates.",
  },
  {
    icon: BarChart3,
    title: "Prioritize",
    desc: "Issues are auto-scored based on severity, votes, and frequency.",
  },
  {
    icon: Building2,
    title: "Assign",
    desc: "Responsible authority department gets notified and assigned.",
  },
  {
    icon: CheckCircle,
    title: "Resolve",
    desc: "Track progress through every status change until resolved.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="bg-muted/30 py-20 scroll-mt-16">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight mb-3">How It Works</h2>
          <p className="text-muted-foreground">
            From report to resolution in five transparent steps.
          </p>
        </div>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border hidden sm:block" />
          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={step.title} className="flex gap-5 items-start relative">
                <div className="relative z-10 h-12 w-12 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shrink-0">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-primary">Step {i + 1}</span>
                    <h3 className="font-semibold text-lg">{step.title}</h3>
                  </div>
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
