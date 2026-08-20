import { cn } from "@/lib/utils";
import { BlogStatus } from "@/lib/mock-db";

const CONFIG: Record<BlogStatus, { label: string; dot: string }> = {
  draft: { label: "Draft", dot: "bg-status-draft" },
  submitted_for_review: { label: "In review", dot: "bg-status-review" },
  approved: { label: "Approved", dot: "bg-status-approved" },
  rejected: { label: "Rejected", dot: "bg-status-rejected" },
  published: { label: "Published", dot: "bg-status-published" },
};

export function StatusBadge({ status }: { status: BlogStatus }) {
  const config = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex min-w-[6.75rem] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium font-mono",
        "bg-ink/5 text-ink/70 dark:bg-white/5"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
