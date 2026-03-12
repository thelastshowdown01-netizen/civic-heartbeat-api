import { Eye, Building2, ThumbsUp, GitMerge, BarChart3, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { statusColors, formatStatus } from "@/lib/issueHelpers";

const pillars = [
  {
    icon: Eye,
    title: "Transparent Status Tracking",
    desc: "Follow every issue from reported to resolved — every status change is logged and visible to all.",
  },
  {
    icon: Building2,
    title: "Authority Visibility",
    desc: "See exactly which department or authority is handling the issue and at what stage.",
  },
  {
    icon: ThumbsUp,
    title: "Community Validation",
    desc: "Public votes and multiple citizen reports surface the issues that matter most.",
  },
  {
    icon: GitMerge,
    title: "Smart Issue Consolidation",
    desc: "Duplicate complaints are grouped into one master issue for cleaner action and better prioritization.",
  },
  {
    icon: BarChart3,
    title: "Data-Driven Prioritization",
    desc: "Severity, report volume, and community signals determine which issues get attention first.",
  },
];

const statusFlow = ["reported", "verified", "assigned", "in_progress", "resolved"];

const TrustSection = () => {
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Transparency That Builds Public Trust
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            Every issue is tracked, every authority is visible, and every resolution is public — accountability by design.
          </p>
        </div>

        {/* Status progression strip */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-14 flex-wrap">
          {statusFlow.map((status, i) => (
            <div key={status} className="flex items-center gap-1 sm:gap-2">
              <Badge
                className={`${statusColors[status]} border-0 text-[11px] sm:text-xs px-2 sm:px-3 py-1`}
              >
                {formatStatus(status)}
              </Badge>
              {i < statusFlow.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Top row: 3 pillars */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
          {pillars.slice(0, 3).map((p) => (
            <Card
              key={p.title}
              className="border-border/50 text-center hover:shadow-md hover:border-primary/20 transition-all"
            >
              <CardContent className="p-8">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <p.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom row: 2 pillars centered */}
        <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {pillars.slice(3).map((p) => (
            <Card
              key={p.title}
              className="border-border/50 text-center hover:shadow-md hover:border-primary/20 transition-all"
            >
              <CardContent className="p-8">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <p.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
