import { useEffect, useMemo, useState } from "react";
import {
  initStorage,
  chooseDirectory,
  loadExercises,
  loadTemplates,
  listSessions,
  loadSession,
  saveSession,
  saveTemplates,
  saveExercises,
  importSessionsFromFile,
  exportSession,
  StorageState,
} from "./utils/storage";
import { Exercise, Session, SessionSummary, Template } from "./types";
import { makeId, parseTags, tagsToString, todayDate } from "./utils/format";
import TodayPage from "./pages/TodayPage";
import HistoryPage from "./pages/HistoryPage";
import ProgressPage from "./pages/ProgressPage";
import TemplatesPage from "./pages/TemplatesPage";

type View = "today" | "history" | "progress" | "templates";

const emptySession = (date: string): Session => ({
  id: makeId(),
  date,
  type_tags: [],
  notes: "",
  entries: [],
});

export default function App() {
  const [view, setView] = useState<View>("today");
  const [storageState, setStorageState] = useState<StorageState>({
    mode: "fallback",
    directoryHandle: null,
  });
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    initStorage().then(setStorageState).catch(console.error);
  }, []);

  useEffect(() => {
    loadExercises(storageState).then(setExercises).catch(console.error);
    loadTemplates(storageState).then(setTemplates).catch(console.error);
    listSessions(storageState).then(setSessions).catch(console.error);
  }, [storageState]);

  useEffect(() => {
    if (view !== "today") {
      return;
    }
    const date = todayDate();
    loadSession(storageState, date)
      .then((session) => setActiveSession(session ?? emptySession(date)))
      .catch(console.error);
  }, [storageState, view]);

  const sessionTags = useMemo(
    () => tagsToString(activeSession?.type_tags ?? []),
    [activeSession]
  );

  const setSessionTags = (value: string) => {
    if (!activeSession) {
      return;
    }
    setActiveSession({
      ...activeSession,
      type_tags: parseTags(value),
    });
  };

  const handleSaveSession = async () => {
    if (!activeSession) {
      return;
    }
    await saveSession(storageState, activeSession);
    setStatus(`Saved session for ${activeSession.date}`);
    const updatedSessions = await listSessions(storageState);
    setSessions(updatedSessions);
  };

  const handleChooseDirectory = async () => {
    const nextState = await chooseDirectory();
    setStorageState(nextState);
    setStatus("Connected to repository folder.");
  };

  const handleLoadSession = async (date: string) => {
    const session = await loadSession(storageState, date);
    if (session) {
      setActiveSession(session);
      setView("today");
    }
  };

  const handleUpdateSession = (session: Session) => {
    setActiveSession(session);
  };

  const handleTemplatesChange = async (nextTemplates: Template[]) => {
    setTemplates(nextTemplates);
    await saveTemplates(storageState, nextTemplates);
  };

  const handleExercisesChange = async (nextExercises: Exercise[]) => {
    setExercises(nextExercises);
    await saveExercises(storageState, nextExercises);
  };

  const handleImportSessions = async (file: File) => {
    const imported = await importSessionsFromFile(file);
    if (storageState.mode === "fallback") {
      const existing = await loadSessionFallbackAll();
      const merged = mergeSessions(existing, imported);
      localStorage.setItem(
        "training-log:sessions",
        JSON.stringify(merged)
      );
    } else {
      for (const session of imported) {
        await saveSession(storageState, session);
      }
    }
    setSessions(await listSessions(storageState));
    setStatus(`Imported ${imported.length} sessions.`);
  };

  const handleExportSession = () => {
    if (!activeSession) {
      return;
    }
    exportSession(activeSession);
  };

  return (
    <div className="app">
      <header>
        <h1>Training Log</h1>
        <nav>
          <button
            className={view === "today" ? "active" : ""}
            onClick={() => setView("today")}
          >
            Today
          </button>
          <button
            className={view === "history" ? "active" : ""}
            onClick={() => setView("history")}
          >
            History
          </button>
          <button
            className={view === "progress" ? "active" : ""}
            onClick={() => setView("progress")}
          >
            Progress
          </button>
          <button
            className={view === "templates" ? "active" : ""}
            onClick={() => setView("templates")}
          >
            Templates
          </button>
        </nav>
      </header>
      <main>
        <div className="card">
          <div className="row">
            <div>
              <label>Storage</label>
              <div className="inline-actions">
                <button className="secondary" onClick={handleChooseDirectory}>
                  Choose repo folder
                </button>
                {storageState.mode === "fallback" && (
                  <span className="badge">Fallback mode</span>
                )}
                {storageState.mode === "filesystem" && (
                  <span className="badge">File system mode</span>
                )}
              </div>
            </div>
            <div>
              <label>Status</label>
              <div className="notice">
                {status ||
                  "Pick your repo folder to enable direct JSON writes."}
              </div>
            </div>
          </div>
        </div>
        {view === "today" && activeSession && (
          <TodayPage
            session={activeSession}
            exercises={exercises}
            templates={templates}
            sessionTags={sessionTags}
            onSessionTagsChange={setSessionTags}
            onChange={handleUpdateSession}
            onSave={handleSaveSession}
            onExport={handleExportSession}
          />
        )}
        {view === "history" && (
          <HistoryPage
            sessions={sessions}
            onSelect={handleLoadSession}
            onImport={handleImportSessions}
          />
        )}
        {view === "progress" && (
          <ProgressPage sessions={sessions} storageState={storageState} />
        )}
        {view === "templates" && (
          <TemplatesPage
            templates={templates}
            exercises={exercises}
            onTemplatesChange={handleTemplatesChange}
            onExercisesChange={handleExercisesChange}
          />
        )}
      </main>
    </div>
  );
}

async function loadSessionFallbackAll(): Promise<Session[]> {
  const raw = localStorage.getItem("training-log:sessions");
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as Session[];
  } catch {
    return [];
  }
}

function mergeSessions(existing: Session[], imported: Session[]): Session[] {
  const byDate = new Map<string, Session>();
  for (const session of existing) {
    byDate.set(session.date, session);
  }
  for (const session of imported) {
    byDate.set(session.date, session);
  }
  return Array.from(byDate.values());
}
