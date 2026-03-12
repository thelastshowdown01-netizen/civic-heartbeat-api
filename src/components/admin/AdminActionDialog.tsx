import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type ActionType = "assign" | "reject" | null;

interface AdminActionDialogProps {
  action: ActionType;
  issueId: string | null;
  onClose: () => void;
  onConfirm: (data: { authority_name?: string; comment?: string }) => void;
  loading?: boolean;
}

export default function AdminActionDialog({
  action, issueId, onClose, onConfirm, loading,
}: AdminActionDialogProps) {
  const [authorityName, setAuthorityName] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (action === "assign") {
      onConfirm({ authority_name: authorityName });
    } else if (action === "reject") {
      onConfirm({ comment });
    }
    setAuthorityName("");
    setComment("");
  };

  return (
    <Dialog open={!!action && !!issueId} onOpenChange={() => { onClose(); setAuthorityName(""); setComment(""); }}>
      <DialogContent className="sm:max-w-md">
        {action === "assign" && (
          <>
            <DialogHeader>
              <DialogTitle>Assign Authority</DialogTitle>
              <DialogDescription>
                Enter the department or authority name to assign this issue.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="authority">Authority / Department Name</Label>
              <Input
                id="authority"
                placeholder="e.g. Public Works Department"
                value={authorityName}
                onChange={(e) => setAuthorityName(e.target.value)}
              />
            </div>
          </>
        )}
        {action === "reject" && (
          <>
            <DialogHeader>
              <DialogTitle>Reject Issue</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting this issue. This will be visible to the reporter.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="comment">Rejection Reason</Label>
              <Textarea
                id="comment"
                placeholder="Reason for rejection..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>
          </>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (action === "assign" && !authorityName.trim()) || (action === "reject" && !comment.trim())}
          >
            {loading ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
