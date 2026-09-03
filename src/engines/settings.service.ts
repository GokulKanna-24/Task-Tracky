import { db } from "@/database/db";
import { DEFAULT_SETTINGS, type AppSettings } from "@/engines/settings.types";

class SettingsService {
  async get(): Promise<AppSettings> {
    const s = await db.settings.get("global");
    return s ?? DEFAULT_SETTINGS;
  }
  async update(changes: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.get();
    const merged = { ...current, ...changes, id: "global" as const };
    await db.settings.put(merged);
    return merged;
  }
  async ensure(): Promise<void> {
    const s = await db.settings.get("global");
    if (!s) await db.settings.put(DEFAULT_SETTINGS);
  }
}

export const settingsService = new SettingsService();