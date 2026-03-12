import { Eye, BarChart3, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const pillars = [
  {
    icon: Eye,
    title: "Full Transparency",
    desc: "Every status change is logged and visible. Citizens see exactly where their report stands.",
  },
  {
    icon: BarChart3,
    title: "Data-Driven Priority",
    desc: "Issues are ranked by real community engagement, not arbitrary decisions.",
  },
  {
    icon: Shield,
    title: "Public Accountability",
    desc: "Assigned authorities are visible. Resolution timelines are tracked publicly.",
  },
];

const TrustSection = () => {
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            Built on Trust & Transparency
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A platform designed for public accountability at every step.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {pillars.map((p) => (
            <Card key={p.title} className="border-border/50 text-center">
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
