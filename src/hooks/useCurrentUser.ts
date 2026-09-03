import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/database/db";
import { getCurrentUser } from "@/engines/session";
import { useEffect, useState } from "react";
import type { User } from "@/engines/user.types";

export function useCurrentUser(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);
  return { user, loading };
}

export function useUsers() {
  return useLiveQuery(() => db.users.toArray(), [], []);
}

export function useUser(id: string | null | undefined) {
  return useLiveQuery(async () => (id ? await db.users.get(id) : undefined), [id]);
}