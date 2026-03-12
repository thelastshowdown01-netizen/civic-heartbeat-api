import { CheckCircle2, Eye, Plus, GitMerge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SubmissionSuccessProps {
  actionTaken: "created_new_issue" | "attached_to_existing_issue";
  issueId: string;
  matchReason?: string | null;
  onReportAnother: () => void;
}

const SubmissionSuccess = ({ actionTaken, issueId, matchReason, onReportAnother }: SubmissionSuccessProps) => {
  const isMerged = actionTaken === "attached_to_existing_issue";

  return (
    <Card className="max-w-lg mx-auto border-none shadow-lg">
      <CardContent className="pt-10 pb-8 px-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Issue Submitted Successfully</h2>
          {isMerged ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <GitMerge className="w-4 h-4 text-muted-foreground" />
                <Badge variant="secondary">Merged with existing report</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                A similar issue was already reported in your area. Your report has been linked to strengthen it and help prioritize faster.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your report has been created and is now under review. You'll be able to track its progress as it moves through resolution.
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button variant="default" className="gap-2" onClick={() => window.location.href = `/#issues`}>
            <Eye className="w-4 h-4" />
            Explore Issues
          </Button>
          <Button variant="outline" className="gap-2" onClick={onReportAnother}>
            <Plus className="w-4 h-4" />
            Report Another
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          You can track status updates from the issues feed.
        </p>
      </CardContent>
    </Card>
  );
};

export default SubmissionSuccess;
