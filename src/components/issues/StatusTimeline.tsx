import { formatDistanceToNow, format } from "date-fns";
import { Check, Clock, Circle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatStatus } from "@/lib/issueHelpers";

type StatusLog = {
  id: string;
  new_status: string;
  old_status: string | null;
  comment: string | null;
  created_at: string;
};

type Props = {
  currentStatus: string;
  statusLogs: StatusLog[];
  resolvedAt: string | null;
};

const LIFECYCLE_STAGES = ["reported", "verified", "assigned", "in_progress", "resolved"] as const;

const stageIndex = (status: string) => LIFECYCLE_STAGES.indexOf(status as any);

export default function StatusTimeline({ currentStatus, statusLogs, resolvedAt }: Props) {
  const isRejected = currentStatus === "rejected";
  const currentIdx = isRejected ? -1 : stageIndex(currentStatus);

  // Map logs by new_status for timestamps/comments
  const logByStatus: Record<string, StatusLog> = {};
  statusLogs.forEach((log) => {
    // Keep the latest log per status
    if (!logByStatus[log.new_status] || log.created_at > logByStatus[log.new_status].created_at) {
      logByStatus[log.new_status] = log;
    }
  });

  return (
    <div className="space-y-0">
      {LIFECYCLE_STAGES.map((stage, idx) => {
        const isCompleted = currentIdx > idx;
        const isCurrent = currentIdx === idx;
        const isPending = currentIdx < idx;
        const log = logByStatus[stage];
        const isLast = idx === LIFECYCLE_STAGES.length - 1;

        return (
          <div key={stage} className="flex gap-3">
            {/* Vertical line + icon */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "border-primary bg-primary/10 text-primary",
                  isPending && "border-border bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : isCurrent ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-[2rem]",
                    isCompleted ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className={cn("pb-6", isLast && "pb-0")}>
              <p
                className={cn(
                  "font-medium text-sm leading-8",
                  (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {formatStatus(stage)}
              </p>
              {log && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(log.created_at), "MMM d, yyyy · h:mm a")}
                </p>
              )}
              {log?.comment && (
                <p className="text-xs text-foreground/80 mt-1 bg-muted rounded-md px-3 py-2 max-w-sm">
                  "{log.comment}"
                </p>
              )}
              {isCurrent && !log?.comment && (
                <p className="text-xs text-muted-foreground mt-0.5 italic">Current stage</p>
              )}
            </div>
          </div>
        );
      })}

      {/* Rejected branch */}
      {isRejected && (
        <div className="flex gap-3 mt-2">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 border-destructive bg-destructive/10 text-destructive">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="font-medium text-sm leading-8 text-destructive">Rejected</p>
            {logByStatus["rejected"] && (
              <>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(logByStatus["rejected"].created_at), "MMM d, yyyy · h:mm a")}
                </p>
                {logByStatus["rejected"].comment && (
                  <p className="text-xs text-foreground/80 mt-1 bg-destructive/5 rounded-md px-3 py-2 max-w-sm">
                    "{logByStatus["rejected"].comment}"
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
