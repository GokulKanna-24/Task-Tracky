import { useUsers } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

export function TaskAssignees({ userIds, className, max = 3 }: { userIds: string[]; className?: string; max?: number }) {
  const users = useUsers();
  const assigned = userIds.map((id) => users.find((u) => u.id === id)).filter(Boolean);
  if (!assigned.length) {
    return <span className={cn("text-xs text-muted-foreground italic", className)}>Unassigned</span>;
  }
  const shown = assigned.slice(0, max);
  const extra = assigned.length - shown.length;
  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {shown.map((u: any) => (
        <div
          key={u.id}
          title={u.fullName}
          className="h-6 w-6 rounded-full border-2 border-background bg-primary text-primary-foreground grid place-items-center text-[10px] font-semibold"
        >
          {u.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
      ))}
      {extra > 0 && (
        <div className="h-6 w-6 rounded-full border-2 border-background bg-muted text-muted-foreground grid place-items-center text-[10px] font-semibold">
          +{extra}
        </div>
      )}
    </div>
  );
}