import { useEffect, useState } from "react";
import { sharingEngine, type PublicTaskView, type ShareLink } from "@/engines/sharing";

export function useShareLinks(taskId: string | undefined) {
  const [links, setLinks] = useState<ShareLink[]>([]);
  useEffect(() => {
    if (!taskId) return;
    let active = true;
    sharingEngine.getByTask(taskId).then((l) => active && setLinks(l));
    return () => { active = false; };
  }, [taskId]);
  return links;
}

export function usePublicTask(token: string | undefined) {
  const [view, setView] = useState<PublicTaskView | null | undefined>(undefined);
  useEffect(() => {
    if (!token) { setView(null); return; }
    let active = true;
    sharingEngine.getPublicTaskView(token).then((v) => active && setView(v));
    return () => { active = false; };
  }, [token]);
  return view;
}