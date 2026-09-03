export interface AppSettings {
  id: string;
  theme: "light" | "dark" | "system";
  weekStartsOn: number; // 0 Sunday, 1 Monday
  workingDayStart: number; // hour 0-23
  workingDayEnd: number; // hour 0-23
  defaultEventDurationMinutes: number;
  timezone: "system" | string;
  showWeekends: boolean;
  showWorkload: boolean;
  showCompletedTasks: boolean;
  workloadThresholds: {
    moderate: number; // hours
    heavy: number; // hours
    overloaded: number; // hours
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: "global",
  theme: "system",
  weekStartsOn: 1,
  workingDayStart: 9,
  workingDayEnd: 18,
  defaultEventDurationMinutes: 60,
  timezone: "system",
  showWeekends: true,
  showWorkload: true,
  showCompletedTasks: true,
  workloadThresholds: { moderate: 4, heavy: 6, overloaded: 8 },
};