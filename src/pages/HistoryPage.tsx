import { ChangeEvent } from "react";
import { SessionSummary } from "../types";

const formatTags = (tags: string[]) => (tags.length ? tags.join(", ") : "-");

type Props = {
  sessions: SessionSummary[];
  onSelect: (date: string) => void;
  onImport: (file: File) => void;
};

export default function HistoryPage({ sessions, onSelect, onImport }: Props) {
  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
      event.target.value = "";
    }
  };

  return (
    <section className="card">
      <h2 className="section-title">History</h2>
      <div className="row">
        <div>
          <label>Import session JSON</label>
          <input type="file" accept="application/json" onChange={handleImport} />
        </div>
      </div>
      <ul className="list">
        {sessions.length === 0 && <li>No sessions saved yet.</li>}
        {sessions.map((session) => (
          <li key={session.date} className="entry-card">
            <div className="row">
              <div>
                <strong>{session.date}</strong>
                <div className="entry-meta">
                  <span>{session.entryCount} entries</span>
                  <span>{formatTags(session.type_tags)}</span>
                </div>
              </div>
              <div>
                <button
                  className="primary"
                  onClick={() => onSelect(session.date)}
                >
                  Open
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
