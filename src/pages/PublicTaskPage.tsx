import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { sharingEngine, type PublicTaskView } from "@/engines/sharing/sharing.engine";
import { formatDateTime, formatDuration, formatDate } from "@/shared/utils/time";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/engines/task/task.types";
import { Clock, Calendar, History, MessageSquare, Users, Tag, AlertCircle, CheckCircle2 } from "lucide-react";

export default function PublicTaskPage() {
  const { shareToken } = useParams();
  const [view, setView] = useState<PublicTaskView | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "notfound">("loading");

  useEffect(() => {
    if (!shareToken) { setStatus("notfound"); return; }
    sharingEngine.getPublicTaskView(shareToken).then((v) => {
      setView(v);
      setStatus(v ? "ok" : "notfound");
    });
  }, [shareToken]);

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" /></div>;
  }
  if (status === "notfound" || !view) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Link unavailable</h1>
        <p className="max-w-sm text-sm text-muted-foreground">This share link is invalid, expired, or has been revoked.</p>
        <Link to="/" className="text-sm text-primary hover:underline">Go home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-2xl p-4 md:p-8 space-y-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          Shared via Task-Tracky · read-only
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium">{STATUS_LABELS[view.status as keyof typeof STATUS_LABELS] ?? view.status}</span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs">{PRIORITY_LABELS[view.priority as keyof typeof PRIORITY_LABELS] ?? view.priority} priority</span>
            {view.dueDate && <span className="text-xs text-muted-foreground">Due {formatDate(view.dueDate)}</span>}
          </div>
          <h1 className="mt-3 text-2xl font-display font-semibold tracking-tight">{view.title}</h1>
          {view.description && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{view.description}</p>}

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span><span>{view.progress}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${view.progress}%` }} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span>{view.assignees.length ? view.assignees.map((a) => a.displayName).join(", ") : "Unassigned"}</span></div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span>{formatDuration(view.timeSummary.totalSeconds)}{view.timeSummary.active && " · live"}</span></div>
          </div>
          {view.labels.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              {view.labels.map((l) => <span key={l} className="rounded-md bg-muted px-2 py-0.5 text-xs">{l}</span>)}
            </div>
          )}
        </div>

        {view.schedule.length > 0 && (
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><Calendar className="h-4 w-4" /> Schedule</h2>
            <div className="space-y-2">
              {view.schedule.map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span>{formatDateTime(s.startAt)}</span>
                  <span className="text-muted-foreground">{formatDuration(Math.floor((s.endAt - s.startAt) / 1000))}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {view.timeline.length > 0 && (
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><History className="h-4 w-4" /> Activity</h2>
            <ol className="relative space-y-2.5 border-l pl-4 ml-1">
              {view.timeline.map((t, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                  <p className="text-xs text-muted-foreground">{new Date(t.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  <p className="text-sm">{t.message}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {view.comments.length > 0 && (
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><MessageSquare className="h-4 w-4" /> Public comments</h2>
            <div className="space-y-2">
              {view.comments.map((c, i) => (
                <div key={i} className="rounded-lg border px-3 py-2">
                  <p className="text-xs font-medium">{c.authorName}</p>
                  <p className="text-sm">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="pt-2 text-center text-xs text-muted-foreground">Powered by Task-Tracky</p>
      </div>
    </div>
  );
}