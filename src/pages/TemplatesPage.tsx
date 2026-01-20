import { Exercise, SessionEntry, Template } from "../types";
import { makeId, parseTags, tagsToString } from "../utils/format";

const defaultTemplateEntry = (category: SessionEntry["category"]) => ({
  id: makeId(),
  category,
  name: "",
  tags: [],
  sets: category === "lift" ? [{ reps: 0, load: 0, unit: "lb" }] : undefined,
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
  templates: Template[];
  exercises: Exercise[];
  onTemplatesChange: (templates: Template[]) => void;
  onExercisesChange: (exercises: Exercise[]) => void;
};

export default function TemplatesPage({
  templates,
  exercises,
  onTemplatesChange,
  onExercisesChange,
}: Props) {
  const handleAddExercise = () => {
    onExercisesChange([
      ...exercises,
      { name: "", category: "lift", default_unit: "lb" },
    ]);
  };

  const updateExercise = (index: number, exercise: Exercise) => {
    const updated = [...exercises];
    updated[index] = exercise;
    onExercisesChange(updated);
  };

  const removeExercise = (index: number) => {
    onExercisesChange(exercises.filter((_, idx) => idx !== index));
  };

  const handleAddTemplate = () => {
    onTemplatesChange([
      ...templates,
      { name: "New template", type_tags: [], entries: [] },
    ]);
  };

  const updateTemplate = (index: number, template: Template) => {
    const updated = [...templates];
    updated[index] = template;
    onTemplatesChange(updated);
  };

  const removeTemplate = (index: number) => {
    onTemplatesChange(templates.filter((_, idx) => idx !== index));
  };

  return (
    <section className="card">
      <h2 className="section-title">Templates and exercises</h2>
      <div className="card">
        <h3 className="section-title">Exercises</h3>
        <div className="inline-actions">
          <button className="secondary" onClick={handleAddExercise}>
            Add exercise
          </button>
        </div>
        <div className="list">
          {exercises.length === 0 && <span>No exercises yet.</span>}
          {exercises.map((exercise, index) => (
            <div key={`${exercise.name}-${index}`} className="entry-card">
              <div className="row">
                <div>
                  <label>Name</label>
                  <input
                    value={exercise.name}
                    onChange={(event) =>
                      updateExercise(index, {
                        ...exercise,
                        name: event.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label>Category</label>
                  <select
                    value={exercise.category}
                    onChange={(event) =>
                      updateExercise(index, {
                        ...exercise,
                        category: event.target.value as Exercise["category"],
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
                  <label>Default unit</label>
                  <input
                    value={exercise.default_unit ?? ""}
                    onChange={(event) =>
                      updateExercise(index, {
                        ...exercise,
                        default_unit: event.target.value,
                      })
                    }
                    placeholder="lb, kg, bw"
                  />
                </div>
                <div>
                  <label>Aliases</label>
                  <input
                    value={exercise.aliases?.join(", ") ?? ""}
                    onChange={(event) =>
                      updateExercise(index, {
                        ...exercise,
                        aliases: event.target.value
                          .split(",")
                          .map((alias) => alias.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Chin-ups"
                  />
                </div>
              </div>
              <button
                className="ghost"
                onClick={() => removeExercise(index)}
                type="button"
              >
                Remove exercise
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3 className="section-title">Templates</h3>
        <div className="inline-actions">
          <button className="secondary" onClick={handleAddTemplate}>
            Add template
          </button>
        </div>
        <div className="list">
          {templates.length === 0 && <span>No templates yet.</span>}
          {templates.map((template, index) => (
            <TemplateEditor
              key={`${template.name}-${index}`}
              template={template}
              onChange={(next) => updateTemplate(index, next)}
              onRemove={() => removeTemplate(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

type TemplateEditorProps = {
  template: Template;
  onChange: (template: Template) => void;
  onRemove: () => void;
};

function TemplateEditor({ template, onChange, onRemove }: TemplateEditorProps) {
  const handleTagChange = (value: string) => {
    onChange({ ...template, type_tags: parseTags(value) });
  };

  const addEntry = (category: SessionEntry["category"]) => {
    const entries = [...template.entries, defaultTemplateEntry(category)];
    onChange({ ...template, entries });
  };

  const updateEntry = (index: number, entry: SessionEntry) => {
    const entries = [...template.entries];
    entries[index] = entry;
    onChange({ ...template, entries });
  };

  const removeEntry = (index: number) => {
    onChange({
      ...template,
      entries: template.entries.filter((_, idx) => idx !== index),
    });
  };

  return (
    <div className="entry-card">
      <div className="row">
        <div>
          <label>Name</label>
          <input
            value={template.name}
            onChange={(event) =>
              onChange({ ...template, name: event.target.value })
            }
          />
        </div>
        <div>
          <label>Template tags</label>
          <input
            value={tagsToString(template.type_tags)}
            onChange={(event) => handleTagChange(event.target.value)}
            placeholder="bbb, solo"
          />
        </div>
      </div>
      <div className="inline-actions">
        <button className="secondary" onClick={() => addEntry("lift")}>
          Add lift
        </button>
        <button className="secondary" onClick={() => addEntry("grappling")}>
          Add grappling
        </button>
        <button className="secondary" onClick={() => addEntry("cardio")}>
          Add cardio
        </button>
        <button className="secondary" onClick={() => addEntry("mobility")}>
          Add mobility
        </button>
      </div>
      <div className="list">
        {template.entries.length === 0 && <span>No entries yet.</span>}
        {template.entries.map((entry, index) => (
          <TemplateEntryEditor
            key={`${entry.id}-${index}`}
            entry={entry}
            onChange={(next) => updateEntry(index, next)}
            onRemove={() => removeEntry(index)}
          />
        ))}
      </div>
      <button className="ghost" onClick={onRemove} type="button">
        Remove template
      </button>
    </div>
  );
}

type TemplateEntryProps = {
  entry: SessionEntry;
  onChange: (entry: SessionEntry) => void;
  onRemove: () => void;
};

function TemplateEntryEditor({ entry, onChange, onRemove }: TemplateEntryProps) {
  const handleTagsChange = (value: string) => {
    onChange({ ...entry, tags: parseTags(value) });
  };

  const updateSet = (setIndex: number, key: string, value: string) => {
    const sets = entry.sets ?? [];
    const nextSets = sets.map((set, idx) => {
      if (idx !== setIndex) {
        return set;
      }
      return {
        ...set,
        [key]: value === "" ? "" : Number(value) || value,
      };
    });
    onChange({ ...entry, sets: nextSets });
  };

  const addSet = () => {
    onChange({
      ...entry,
      sets: [...(entry.sets ?? []), { reps: 0, load: 0, unit: "lb" }],
    });
  };

  const removeSet = (setIndex: number) => {
    onChange({
      ...entry,
      sets: entry.sets?.filter((_, idx) => idx !== setIndex),
    });
  };

  return (
    <div className="entry-card">
      <div className="row">
        <div>
          <label>Category</label>
          <select
            value={entry.category}
            onChange={(event) =>
              onChange({
                ...defaultTemplateEntry(event.target.value as SessionEntry["category"]),
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
            value={entry.name}
            onChange={(event) =>
              onChange({ ...entry, name: event.target.value })
            }
          />
        </div>
        <div>
          <label>Tags</label>
          <input
            value={tagsToString(entry.tags)}
            onChange={(event) => handleTagsChange(event.target.value)}
          />
        </div>
      </div>
      {entry.category === "lift" && (
        <div>
          <div className="inline-actions">
            <button className="secondary" onClick={addSet}>
              Add set
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entry.sets?.map((set, idx) => (
                <tr key={`${entry.id}-template-set-${idx}`}>
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
      {entry.category === "grappling" && (
        <div className="row">
          <div>
            <label>Metric type</label>
            <select
              value={entry.metric?.type ?? "reps"}
              onChange={(event) =>
                onChange({
                  ...entry,
                  metric: {
                    type: event.target.value as "reps" | "seconds",
                    value: entry.metric?.value ?? 0,
                  },
                })
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
              value={entry.metric?.value ?? 0}
              onChange={(event) =>
                onChange({
                  ...entry,
                  metric: {
                    type: entry.metric?.type ?? "reps",
                    value: Number(event.target.value),
                  },
                })
              }
            />
          </div>
          <div>
            <label>Intensity</label>
            <input
              value={entry.extras?.intensity ?? ""}
              onChange={(event) =>
                onChange({
                  ...entry,
                  extras: {
                    ...entry.extras,
                    intensity: event.target.value,
                  },
                })
              }
            />
          </div>
        </div>
      )}
      {entry.category === "cardio" && (
        <div className="row">
          <div>
            <label>Minutes</label>
            <input
              type="number"
              value={entry.metric?.value ?? 0}
              onChange={(event) =>
                onChange({
                  ...entry,
                  metric: { type: "minutes", value: Number(event.target.value) },
                })
              }
            />
          </div>
          <div>
            <label>Distance</label>
            <input
              type="number"
              value={entry.extras?.distance ?? ""}
              onChange={(event) =>
                onChange({
                  ...entry,
                  extras: { ...entry.extras, distance: event.target.value },
                })
              }
            />
          </div>
          <div>
            <label>Average output</label>
            <input
              type="number"
              value={entry.extras?.avg_output ?? ""}
              onChange={(event) =>
                onChange({
                  ...entry,
                  extras: { ...entry.extras, avg_output: event.target.value },
                })
              }
            />
          </div>
          <div>
            <label>Zone notes</label>
            <input
              value={entry.extras?.zone ?? ""}
              onChange={(event) =>
                onChange({
                  ...entry,
                  extras: { ...entry.extras, zone: event.target.value },
                })
              }
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
        <label>Notes</label>
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
