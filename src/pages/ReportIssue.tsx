import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GitMerge, BarChart3, UserCheck, Eye } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReportForm from "@/components/report/ReportForm";
import SubmissionSuccess from "@/components/report/SubmissionSuccess";
import PublicLayout from "@/components/layouts/PublicLayout";

const steps = [
  { icon: GitMerge, label: "Similar issues merged", desc: "Duplicate reports are combined automatically." },
  { icon: BarChart3, label: "Priority calculated", desc: "Urgent problems surface faster based on reports and votes." },
  { icon: UserCheck, label: "Authority assigned", desc: "The right department gets notified." },
  { icon: Eye, label: "Track progress", desc: "Follow status updates from report to resolution." },
];

interface SubmissionResult {
  action_taken: "created_new_issue" | "attached_to_existing_issue";
  issue_id: string;
  duplicate_match_reason?: string | null;
}

const ReportIssue = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<SubmissionResult | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login?redirect=/report", { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) return null;
  if (!user) return null;

  if (result) {
    return (
      <PublicLayout>
        <SubmissionSuccess
          actionTaken={result.action_taken}
          issueId={result.issue_id}
          matchReason={result.duplicate_match_reason}
          onReportAnother={() => setResult(null)}
        />
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Report a Civic Issue"
          description="Help improve your city — it takes under a minute."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Form column */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6 md:p-8">
                <ReportForm onSuccess={setResult} />
              </CardContent>
            </Card>
          </div>

          {/* Info panel */}
          <div className="hidden lg:block">
            <div className="sticky top-8 space-y-6">
              <Card>
                <CardContent className="p-6 space-y-5">
                  <h3 className="font-semibold text-foreground">What happens next?</h3>
                  <div className="space-y-4">
                    {steps.map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <step.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{step.label}</p>
                          <p className="text-xs text-muted-foreground">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">Similar reports merged automatically</Badge>
                <Badge variant="secondary" className="text-xs">Urgent issues prioritized faster</Badge>
                <Badge variant="secondary" className="text-xs">Status updates stay visible</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ReportIssue;
