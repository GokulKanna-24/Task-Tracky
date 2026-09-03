import { Tag } from "lucide-react";

export function TaskLabels({ labels, className }: { labels: string[]; className?: string }) {
  if (!labels?.length) return null;
  return (
    <div className={`flex flex-wrap items-center gap-1 ${className ?? ""}`}>
      {labels.map((l) => (
        <span key={l} className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          <Tag className="h-2.5 w-2.5" />
          {l}
        </span>
      ))}
    </div>
  );
}