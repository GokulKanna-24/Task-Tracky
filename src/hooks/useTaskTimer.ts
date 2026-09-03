import { useCallback } from "react";
import { timeEngine } from "@/engines/time";
import { useActiveTimer } from "./useTasks";
import { toast } from "sonner";

export function useTaskTimer(taskId: string | undefined, userId: string | null | undefined) {
  const activeTimer = useActiveTimer(userId);
  const isRunningOnThis = !!activeTimer && activeTimer.taskId === taskId;
  const isRunningOnOther = !!activeTimer && activeTimer.taskId !== taskId;

  const start = useCallback(async () => {
    if (!taskId || !userId) return;
    const res = await timeEngine.start(taskId, userId);
    if (!res.ok && res.message) {
      toast.error(res.message, {
        description: "Stop the current timer or switch tasks first.",
        action: { label: "Stop & start", onClick: async () => {
          if (activeTimer) await timeEngine.stop(activeTimer.taskId, userId);
          await timeEngine.start(taskId, userId);
          toast.success("Timer switched.");
        } },
      });
    } else {
      toast.success("Timer started.");
    }
  }, [taskId, userId, activeTimer]);

  const pause = useCallback(async () => {
    if (!taskId || !userId) return;
    await timeEngine.pause(taskId, userId);
    toast.success("Timer paused.");
  }, [taskId, userId]);

  const resume = useCallback(async () => {
    if (!taskId || !userId) return;
    const res = await timeEngine.resume(taskId, userId);
    if (res.ok) toast.success("Timer resumed.");
    else if (res.message) toast.error(res.message);
  }, [taskId, userId]);

  const stop = useCallback(async () => {
    if (!taskId || !userId) return;
    await timeEngine.stop(taskId, userId);
    toast.success("Timer stopped.");
  }, [taskId, userId]);

  return { start, pause, resume, stop, isRunningOnThis, isRunningOnOther, activeTimer };
}