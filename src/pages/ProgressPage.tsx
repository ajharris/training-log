import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Session, SessionSummary } from "../types";
import { StorageState, loadSession } from "../utils/storage";
import { sum } from "../utils/format";

type Props = {
  sessions: SessionSummary[];
  storageState: StorageState;
};

type ChartPoint = {
  label: string;
  value: number;
  extra?: number;
};

export default function ProgressPage({ sessions, storageState }: Props) {
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [liftName, setLiftName] = useState<string>("");
  const [grapplingName, setGrapplingName] = useState<string>("");
  const [cardioName, setCardioName] = useState<string>("");

  useEffect(() => {
    let active = true;
    Promise.all(
      sessions.map((summary) => loadSession(storageState, summary.date))
    ).then((loaded) => {
      if (!active) {
        return;
      }
      setAllSessions(loaded.filter(Boolean) as Session[]);
    });
    return () => {
      active = false;
    };
  }, [sessions, storageState]);

  const liftOptions = useMemo(() => {
    const names = new Set(
      allSessions.flatMap((session) =>
        session.entries
          .filter((entry) => entry.category === "lift")
          .map((entry) => entry.name)
      )
    );
    return Array.from(names).filter(Boolean).sort();
  }, [allSessions]);

  const grapplingOptions = useMemo(() => {
    const names = new Set(
      allSessions.flatMap((session) =>
        session.entries
          .filter((entry) => entry.category === "grappling")
          .map((entry) => entry.name)
      )
    );
    return Array.from(names).filter(Boolean).sort();
  }, [allSessions]);

  const cardioOptions = useMemo(() => {
    const names = new Set(
      allSessions.flatMap((session) =>
        session.entries
          .filter((entry) => entry.category === "cardio")
          .map((entry) => entry.name)
      )
    );
    return Array.from(names).filter(Boolean).sort();
  }, [allSessions]);

  const liftData = useMemo<ChartPoint[]>(() => {
    if (!liftName) {
      return [];
    }
    return allSessions
      .map((session) => {
        const entries = session.entries.filter(
          (entry) => entry.category === "lift" && entry.name === liftName
        );
        const top = Math.max(
          0,
          ...entries.flatMap((entry) =>
            entry.sets?.map((set) => Number(set.load)) ?? []
          )
        );
        const totalReps = sum(
          entries.flatMap((entry) =>
            entry.sets?.map((set) => Number(set.reps)) ?? []
          )
        );
        return { label: session.date, value: top, extra: totalReps };
      })
      .filter((point) => point.value > 0 || point.extra)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allSessions, liftName]);

  const grapplingData = useMemo<ChartPoint[]>(() => {
    if (!grapplingName) {
      return [];
    }
    const bucket = new Map<string, number>();
    for (const session of allSessions) {
      const week = toWeekLabel(session.date);
      const total = sum(
        session.entries
          .filter(
            (entry) =>
              entry.category === "grappling" && entry.name === grapplingName
          )
          .map((entry) => entry.metric?.value ?? 0)
      );
      if (total) {
        bucket.set(week, (bucket.get(week) ?? 0) + total);
      }
    }
    return Array.from(bucket.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allSessions, grapplingName]);

  const cardioData = useMemo<ChartPoint[]>(() => {
    if (!cardioName) {
      return [];
    }
    const bucket = new Map<string, number>();
    for (const session of allSessions) {
      const week = toWeekLabel(session.date);
      const total = sum(
        session.entries
          .filter(
            (entry) => entry.category === "cardio" && entry.name === cardioName
          )
          .map((entry) => entry.metric?.value ?? 0)
      );
      if (total) {
        bucket.set(week, (bucket.get(week) ?? 0) + total);
      }
    }
    return Array.from(bucket.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allSessions, cardioName]);

  return (
    <section className="card">
      <h2 className="section-title">Progress</h2>
      <div className="card">
        <h3 className="section-title">Lift trend</h3>
        <div className="row">
          <div>
            <label>Lift</label>
            <select value={liftName} onChange={(e) => setLiftName(e.target.value)}>
              <option value="">Select a lift</option>
              {liftOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <LineChart data={liftData}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#1d4ed8" />
              <Line type="monotone" dataKey="extra" stroke="#94a3b8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="entry-meta">
          Blue line shows top set load. Gray line shows total reps per session.
        </p>
      </div>
      <div className="card">
        <h3 className="section-title">Grappling volume</h3>
        <div className="row">
          <div>
            <label>Movement</label>
            <select
              value={grapplingName}
              onChange={(e) => setGrapplingName(e.target.value)}
            >
              <option value="">Select a movement</option>
              {grapplingOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={grapplingData}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0f172a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card">
        <h3 className="section-title">Cardio minutes</h3>
        <div className="row">
          <div>
            <label>Cardio activity</label>
            <select
              value={cardioName}
              onChange={(e) => setCardioName(e.target.value)}
            >
              <option value="">Select a cardio entry</option>
              {cardioOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={cardioData}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#1d4ed8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

function toWeekLabel(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const weekNumber =
    1 +
    Math.round(
      (date.getTime() - firstThursday.getTime()) / 604800000
    );
  return `${date.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}
