export type EntryCategory = "lift" | "grappling" | "cardio" | "mobility";

export type LiftSet = {
  reps: number;
  load: number;
  unit: string;
  rpe?: number;
  rest_sec?: number;
  notes?: string;
};

export type Metric = {
  type: "reps" | "seconds" | "minutes";
  value: number;
};

export type SessionEntry = {
  id: string;
  category: EntryCategory;
  name: string;
  tags: string[];
  sets?: LiftSet[];
  metric?: Metric;
  extras?: Record<string, number | string>;
  notes?: string;
};

export type Session = {
  id: string;
  date: string;
  type_tags: string[];
  notes: string;
  entries: SessionEntry[];
};

export type Exercise = {
  name: string;
  category: EntryCategory;
  default_unit?: string;
  aliases?: string[];
};

export type Template = {
  name: string;
  type_tags: string[];
  entries: Omit<SessionEntry, "id">[];
};

export type SessionSummary = {
  id: string;
  date: string;
  type_tags: string[];
  entryCount: number;
};
