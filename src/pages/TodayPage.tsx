import { useMemo } from "react";
import { Exercise, Session, SessionEntry, Template } from "../types";
import { makeId, parseTags, tagsToString } from "../utils/format";

const emptySet = () => ({ reps: 0, load: 0, unit: "lb" });

const defaultEntry = (category: SessionEntry["category"]): SessionEntry => ({
  id: makeId(),
  category,
  name: "",
  tags: [],
  sets: category === "lift" ? [emptySet()] : undefined,
  metric:
    category === "grappling"
      ? { type: "reps", value: 0 }
      : category === "cardio"
      ? { type: "minutes", value: 0 }
      : undefined,
  extras: category === "cardio" ? {} : undefined,
  notes: "",
});

type Props = {
  session: Session;
  exercises: Exercise[];
  templates: Template[];
  sessionTags: string;
  onSessionTagsChange: (value: string) => void;
  onChange: (session: Session) => void;
  onSave: () => void;
  onExport: () => void;
};

export default function TodayPage({
  session,
  exercises,
  templates,
  sessionTags,
  onSessionTagsChange,
  onChange,
  onSave,
  onExport,
}: Props) {
  const exerciseOptions = useMemo(() => {
    return exercises.map((exercise) => ({
      name: exercise.name,
      category: exercise.category,
      unit: exercise.default_unit ?? "lb",
    }));
  }, [exercises]);

  const handleAddEntry = (category: SessionEntry["category"]) => {
    onChange({
      ...session,
      entries: [...session.entries, defaultEntry(category)],
    });
  };

  const handleEntryChange = (index: number, next: SessionEntry) => {
    const updated = [...session.entries];
    updated[index] = next;
    onChange({ ...session, entries: updated });
  };

  const handleRemoveEntry = (index: number) => {
    const updated = session.entries.filter((_, idx) => idx !== index);
    onChange({ ...session, entries: updated });
  };

  const handleApplyTemplate = (template: Template) => {
    const entries = template.entries.map((entry) => ({
      ...entry,
      id: makeId(),
      sets: entry.sets?.map((set) => ({ ...set })) ?? entry.sets,
      extras: entry.extras ? { ...entry.extras } : entry.extras,
    }));
    onChange({
      ...session,
      type_tags: Array.from(
        new Set([...session.type_tags, ...template.type_tags])
      ),
      entries: [...session.entries, ...entries],
    });
  };

  return (
    <section className="card">
      <h2 className="section-title">Today</h2>
      <div className="row">
        <div>
          <label>Date</label>
          <input type="text" value={session.date} readOnly />
        </div>
        <div>
          <label>Session tags</label>
          <input
            type="text"
            placeholder="gi, nogi, bbb"
            value={sessionTags}
            onChange={(event) => onSessionTagsChange(event.target.value)}
          />
        </div>
      </div>
      <div>
        <label>Session notes</label>
        <textarea
          value={session.notes}
          onChange={(event) =>
            onChange({ ...session, notes: event.target.value })
          }
          placeholder="Session notes"
        />
      </div>
      <div className="inline-actions">
        <button className="primary" onClick={onSave}>
          Save session
        </button>
        <button className="secondary" onClick={onExport}>
          Export JSON
        </button>
      </div>
      <div className="card">
        <h3 className="section-title">Templates</h3>
        <div className="inline-actions">
          {templates.length === 0 && <span>No templates yet.</span>}
          {templates.map((template) => (
            <button
              key={template.name}
              className="secondary"
              onClick={() => handleApplyTemplate(template)}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>
      <div className="card">
        <h3 className="section-title">Add entry</h3>
        <div className="inline-actions">
          <button className="secondary" onClick={() => handleAddEntry("lift")}>
            Lift
          </button>
          <button
            className="secondary"
            onClick={() => handleAddEntry("grappling")}
          >
            Grappling
          </button>
          <button
            className="secondary"
            onClick={() => handleAddEntry("cardio")}
          >
            Cardio
          </button>
          <button
            className="secondary"
            onClick={() => handleAddEntry("mobility")}
          >
            Mobility
          </button>
        </div>
      </div>
      <div className="card">
        <h3 className="section-title">Entries</h3>
        <div className="list">
          {session.entries.length === 0 && <span>No entries yet.</span>}
          {session.entries.map((entry, index) => (
            <EntryEditor
              key={entry.id}
              entry={entry}
              exercises={exerciseOptions}
              onChange={(next) => handleEntryChange(index, next)}
              onRemove={() => handleRemoveEntry(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

type EntryProps = {
  entry: SessionEntry;
  exercises: { name: string; category: string; unit: string }[];
  onChange: (entry: SessionEntry) => void;
  onRemove: () => void;
};

function EntryEditor({ entry, exercises, onChange, onRemove }: EntryProps) {
  const exerciseMatches = exercises.filter(
    (exercise) => exercise.category === entry.category
  );

  const handleTagsChange = (value: string) => {
    onChange({ ...entry, tags: parseTags(value) });
  };

  const handleMetricChange = (updates: Partial<SessionEntry["metric"]>) => {
    if (!entry.metric) {
      return;
    }
    onChange({
      ...entry,
      metric: { ...entry.metric, ...updates },
    });
  };

  const handleExtrasChange = (key: string, value: string) => {
    onChange({
      ...entry,
      extras: {
        ...entry.extras,
        [key]: value === "" ? "" : Number(value) || value,
      },
    });
  };

  const updateSet = (setIndex: number, key: string, value: string) => {
    if (!entry.sets) {
      return;
    }
    const updated = entry.sets.map((set, idx) => {
      if (idx !== setIndex) {
        return set;
      }
      return {
        ...set,
        [key]:
          key === "notes"
            ? value
            : value === ""
            ? ""
            : Number(value) || value,
      };
    });
    onChange({ ...entry, sets: updated });
  };

  const addSet = () => {
    const last = entry.sets?.[entry.sets.length - 1];
    const unit = last?.unit ?? "lb";
    const updated = [...(entry.sets ?? []), { ...emptySet(), unit }];
    onChange({ ...entry, sets: updated });
  };

  const duplicateLastSet = () => {
    if (!entry.sets?.length) {
      return;
    }
    const last = entry.sets[entry.sets.length - 1];
    onChange({ ...entry, sets: [...entry.sets, { ...last }] });
  };

  const removeSet = (setIndex: number) => {
    if (!entry.sets) {
      return;
    }
    const updated = entry.sets.filter((_, idx) => idx !== setIndex);
    onChange({ ...entry, sets: updated });
  };

  return (
    <div className="entry-card">
      <header>
        <div className="row">
          <div>
            <label>Category</label>
            <select
              value={entry.category}
              onChange={(event) =>
                onChange({
                  ...defaultEntry(event.target.value as SessionEntry["category"]),
                  id: entry.id,
                  name: entry.name,
                  tags: entry.tags,
                })
              }
            >
              <option value="lift">Lift</option>
              <option value="grappling">Grappling</option>
              <option value="cardio">Cardio</option>
              <option value="mobility">Mobility</option>
            </select>
          </div>
          <div>
            <label>Name</label>
            <input
              list={`exercise-${entry.id}`}
              value={entry.name}
              onChange={(event) =>
                onChange({ ...entry, name: event.target.value })
              }
              placeholder="Exercise or movement"
            />
            <datalist id={`exercise-${entry.id}`}>
              {exerciseMatches.map((exercise) => (
                <option key={exercise.name} value={exercise.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label>Tags</label>
            <input
              value={tagsToString(entry.tags)}
              onChange={(event) => handleTagsChange(event.target.value)}
              placeholder="bbb, solo"
            />
          </div>
        </div>
      </header>
      {entry.category === "lift" && (
        <div>
          <div className="inline-actions">
            <button className="secondary" onClick={addSet}>
              Add set
            </button>
            <button className="secondary" onClick={duplicateLastSet}>
              Duplicate last set
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Reps</th>
                <th>Load</th>
                <th>Unit</th>
                <th>RPE</th>
                <th>Rest sec</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entry.sets?.map((set, idx) => (
                <tr key={`${entry.id}-set-${idx}`}>
                  <td>
                    <input
                      type="number"
                      value={set.reps}
                      onChange={(event) =>
                        updateSet(idx, "reps", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={set.load}
                      onChange={(event) =>
                        updateSet(idx, "load", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={set.unit}
                      onChange={(event) =>
                        updateSet(idx, "unit", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={set.rpe ?? ""}
                      onChange={(event) =>
                        updateSet(idx, "rpe", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={set.rest_sec ?? ""}
                      onChange={(event) =>
                        updateSet(idx, "rest_sec", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={set.notes ?? ""}
                      onChange={(event) =>
                        updateSet(idx, "notes", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <button
                      className="ghost"
                      onClick={() => removeSet(idx)}
                      type="button"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {entry.category === "grappling" && entry.metric && (
        <div className="row">
          <div>
            <label>Metric type</label>
            <select
              value={entry.metric.type}
              onChange={(event) =>
                handleMetricChange({ type: event.target.value as "reps" | "seconds" })
              }
            >
              <option value="reps">Reps</option>
              <option value="seconds">Seconds</option>
            </select>
          </div>
          <div>
            <label>Value</label>
            <input
              type="number"
              value={entry.metric.value}
              onChange={(event) =>
                handleMetricChange({ value: Number(event.target.value) })
              }
            />
          </div>
          <div>
            <label>Intensity</label>
            <input
              value={entry.extras?.intensity ?? ""}
              onChange={(event) =>
                handleExtrasChange("intensity", event.target.value)
              }
              placeholder="easy, moderate, hard"
            />
          </div>
        </div>
      )}
      {entry.category === "cardio" && entry.metric && (
        <div className="row">
          <div>
            <label>Minutes</label>
            <input
              type="number"
              value={entry.metric.value}
              onChange={(event) =>
                handleMetricChange({ value: Number(event.target.value) })
              }
            />
          </div>
          <div>
            <label>Distance</label>
            <input
              type="number"
              value={entry.extras?.distance ?? ""}
              onChange={(event) =>
                handleExtrasChange("distance", event.target.value)
              }
            />
          </div>
          <div>
            <label>Average output</label>
            <input
              type="number"
              value={entry.extras?.avg_output ?? ""}
              onChange={(event) =>
                handleExtrasChange("avg_output", event.target.value)
              }
            />
          </div>
          <div>
            <label>Zone notes</label>
            <input
              value={entry.extras?.zone ?? ""}
              onChange={(event) =>
                handleExtrasChange("zone", event.target.value)
              }
              placeholder="Zone 2"
            />
          </div>
        </div>
      )}
      {entry.category === "mobility" && (
        <div className="row">
          <div>
            <label>Metric</label>
            <select
              value={entry.metric?.type ?? "minutes"}
              onChange={(event) =>
                onChange({
                  ...entry,
                  metric: {
                    type: event.target.value as "minutes" | "reps" | "seconds",
                    value: entry.metric?.value ?? 0,
                  },
                })
              }
            >
              <option value="minutes">Minutes</option>
              <option value="reps">Reps</option>
              <option value="seconds">Seconds</option>
            </select>
          </div>
          <div>
            <label>Value</label>
            <input
              type="number"
              value={entry.metric?.value ?? 0}
              onChange={(event) =>
                onChange({
                  ...entry,
                  metric: {
                    type: entry.metric?.type ?? "minutes",
                    value: Number(event.target.value),
                  },
                })
              }
            />
          </div>
        </div>
      )}
      <div>
        <label>Entry notes</label>
        <textarea
          value={entry.notes ?? ""}
          onChange={(event) => onChange({ ...entry, notes: event.target.value })}
        />
      </div>
      <button className="ghost" onClick={onRemove} type="button">
        Remove entry
      </button>
    </div>
  );
}
