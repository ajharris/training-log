import { Exercise, Session, SessionSummary, Template } from "../types";
import { loadDirectoryHandle, storeDirectoryHandle } from "./handleStore";

const supportsFileSystemAccess = "showDirectoryPicker" in window;

type StorageMode = "filesystem" | "fallback";

export type StorageState = {
  mode: StorageMode;
  directoryHandle: FileSystemDirectoryHandle | null;
};

export async function initStorage(): Promise<StorageState> {
  if (!supportsFileSystemAccess) {
    return { mode: "fallback", directoryHandle: null };
  }
  const handle = await loadDirectoryHandle();
  if (handle) {
    const permission = await handle.queryPermission({ mode: "readwrite" });
    if (permission === "granted") {
      return { mode: "filesystem", directoryHandle: handle };
    }
  }
  return { mode: "fallback", directoryHandle: null };
}

export async function chooseDirectory(): Promise<StorageState> {
  if (!supportsFileSystemAccess) {
    return { mode: "fallback", directoryHandle: null };
  }
  const handle = await window.showDirectoryPicker({ mode: "readwrite" });
  await storeDirectoryHandle(handle);
  return { mode: "filesystem", directoryHandle: handle };
}

async function getDirectory(
  state: StorageState,
  path: string,
  create = false
): Promise<FileSystemDirectoryHandle> {
  if (!state.directoryHandle) {
    throw new Error("Directory handle is not available.");
  }
  const parts = path.split("/").filter(Boolean);
  let current = state.directoryHandle;
  for (const part of parts) {
    current = await current.getDirectoryHandle(part, { create });
  }
  return current;
}

async function readJsonFile<T>(
  state: StorageState,
  path: string,
  fallbackValue: T
): Promise<T> {
  if (!state.directoryHandle) {
    return fallbackValue;
  }
  try {
    const parts = path.split("/");
    const fileName = parts.pop() ?? "";
    const dir = await getDirectory(state, parts.join("/"));
    const handle = await dir.getFileHandle(fileName);
    const file = await handle.getFile();
    const text = await file.text();
    return JSON.parse(text) as T;
  } catch {
    return fallbackValue;
  }
}

async function writeJsonFile<T>(
  state: StorageState,
  path: string,
  data: T
): Promise<void> {
  if (!state.directoryHandle) {
    return;
  }
  const parts = path.split("/");
  const fileName = parts.pop() ?? "";
  const dir = await getDirectory(state, parts.join("/"), true);
  const handle = await dir.getFileHandle(fileName, { create: true });
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

export async function loadExercises(state: StorageState): Promise<Exercise[]> {
  if (state.mode === "fallback") {
    return loadFromLocalStorage<Exercise[]>("exercises", []);
  }
  return readJsonFile(state, "data/exercises.json", []);
}

export async function saveExercises(
  state: StorageState,
  data: Exercise[]
): Promise<void> {
  if (state.mode === "fallback") {
    saveToLocalStorage("exercises", data);
    return;
  }
  await writeJsonFile(state, "data/exercises.json", data);
}

export async function loadTemplates(state: StorageState): Promise<Template[]> {
  if (state.mode === "fallback") {
    return loadFromLocalStorage<Template[]>("templates", []);
  }
  return readJsonFile(state, "data/templates.json", []);
}

export async function saveTemplates(
  state: StorageState,
  data: Template[]
): Promise<void> {
  if (state.mode === "fallback") {
    saveToLocalStorage("templates", data);
    return;
  }
  await writeJsonFile(state, "data/templates.json", data);
}

export async function listSessions(
  state: StorageState
): Promise<SessionSummary[]> {
  if (state.mode === "fallback") {
    const sessions = loadFromLocalStorage<Session[]>("sessions", []);
    return sessions
      .map((session) => ({
        id: session.id,
        date: session.date,
        type_tags: session.type_tags,
        entryCount: session.entries.length,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }
  if (!state.directoryHandle) {
    return [];
  }
  try {
    const dir = await getDirectory(state, "data/sessions");
    const results: SessionSummary[] = [];
    for await (const entry of dir.values()) {
      if (entry.kind === "file" && entry.name.endsWith(".json")) {
        const file = await entry.getFile();
        const text = await file.text();
        const parsed = JSON.parse(text) as Session;
        results.push({
          id: parsed.id,
          date: parsed.date,
          type_tags: parsed.type_tags,
          entryCount: parsed.entries.length,
        });
      }
    }
    return results.sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

export async function loadSession(
  state: StorageState,
  date: string
): Promise<Session | null> {
  if (state.mode === "fallback") {
    const sessions = loadFromLocalStorage<Session[]>("sessions", []);
    return sessions.find((session) => session.date === date) ?? null;
  }
  return readJsonFile(state, `data/sessions/${date}.json`, null);
}

export async function saveSession(
  state: StorageState,
  session: Session
): Promise<void> {
  if (state.mode === "fallback") {
    const sessions = loadFromLocalStorage<Session[]>("sessions", []);
    const updated = sessions.filter((item) => item.date !== session.date);
    updated.push(session);
    saveToLocalStorage("sessions", updated);
    return;
  }
  await writeJsonFile(state, `data/sessions/${session.date}.json`, session);
}

export async function importSessionsFromFile(file: File): Promise<Session[]> {
  const text = await file.text();
  const parsed = JSON.parse(text) as Session | Session[];
  return Array.isArray(parsed) ? parsed : [parsed];
}

export function exportSession(session: Session) {
  const blob = new Blob([JSON.stringify(session, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${session.date}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function loadFromLocalStorage<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(`training-log:${key}`);
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToLocalStorage<T>(key: string, data: T): void {
  localStorage.setItem(`training-log:${key}`, JSON.stringify(data));
}
