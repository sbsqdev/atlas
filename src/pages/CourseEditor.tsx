import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useT } from '../i18n/useT';
import { MUSCLES } from '../data/muscles';
import type { Bi, Exercise, MuscleId, Workout } from '../types';

let n = 0;
const newId = (p: string) => `${p}-${Date.now().toString(36)}-${(n++).toString(36)}`;

const emptyExercise = (): Exercise => ({
  id: newId('exe'),
  name: { ru: '', en: '' },
  description: { ru: '', en: '' },
  prescription: { ru: '', en: '' },
  note: { ru: '', en: '' },
  videoUrl: '',
  primary: [],
  secondary: [],
});

/** Bilingual two-column text input. */
function BiField({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: Bi;
  onChange: (v: Bi) => void;
  textarea?: boolean;
}) {
  const { t } = useT();
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div className="field">
      <label>{label}</label>
      <div className="field-row">
        <Tag
          placeholder={`RU · ${t('fieldRu')}`}
          value={value.ru}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            onChange({ ...value, ru: e.target.value })
          }
        />
        <Tag
          placeholder={`EN · ${t('fieldEn')}`}
          value={value.en}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            onChange({ ...value, en: e.target.value })
          }
        />
      </div>
    </div>
  );
}

/** Tri-state muscle picker: off → primary → secondary → off. */
function MusclePicker({ exercise, onChange }: { exercise: Exercise; onChange: (e: Exercise) => void }) {
  const { t, tr } = useT();
  const stateOf = (id: MuscleId): 'off' | 'primary' | 'secondary' =>
    exercise.primary.includes(id) ? 'primary' : exercise.secondary.includes(id) ? 'secondary' : 'off';

  const cycle = (id: MuscleId) => {
    const s = stateOf(id);
    let primary = exercise.primary.filter((m) => m !== id);
    let secondary = exercise.secondary.filter((m) => m !== id);
    if (s === 'off') primary = [...primary, id];
    else if (s === 'primary') secondary = [...secondary, id];
    onChange({ ...exercise, primary, secondary });
  };

  return (
    <div className="field">
      <label>{t('targetMuscles')}</label>
      <div className="muscle-grid">
        {MUSCLES.map((m) => {
          const s = stateOf(m.id);
          return (
            <button
              key={m.id}
              type="button"
              className={`muscle-btn ${s === 'primary' ? 'on-primary' : s === 'secondary' ? 'on-secondary' : ''}`}
              onClick={() => cycle(m.id)}
            >
              {tr(m.name)}
              {s !== 'off' && (
                <span className="state">{s === 'primary' ? t('markPrimary') : 'syn.'}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExerciseModal({
  initial,
  onSave,
  onClose,
}: {
  initial: Exercise;
  onSave: (e: Exercise) => void;
  onClose: () => void;
}) {
  const { t } = useT();
  const [draft, setDraft] = useState<Exercise>(initial);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t('addExercise')}</h2>
        <BiField label={t('title')} value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
        <BiField
          label={t('prescription')}
          value={draft.prescription}
          onChange={(prescription) => setDraft({ ...draft, prescription })}
        />
        <BiField
          label={t('description')}
          value={draft.description}
          onChange={(description) => setDraft({ ...draft, description })}
          textarea
        />
        <BiField
          label={t('coachNote')}
          value={draft.note ?? { ru: '', en: '' }}
          onChange={(note) => setDraft({ ...draft, note })}
        />
        <div className="field">
          <label>{t('videoUrl')}</label>
          <input
            value={draft.videoUrl ?? ''}
            placeholder="https://..."
            onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value })}
          />
        </div>
        <MusclePicker exercise={draft} onChange={setDraft} />
        <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
          <button className="btn ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn primary" onClick={() => onSave(draft)}>{t('save')}</button>
        </div>
      </div>
    </div>
  );
}

export default function CourseEditor() {
  const { courseId } = useParams();
  const { t, tr } = useT();
  const navigate = useNavigate();

  const course = useStore((s) => s.courses.find((c) => c.id === courseId));
  const updateCourse = useStore((s) => s.updateCourse);
  const addWorkout = useStore((s) => s.addWorkout);
  const updateWorkout = useStore((s) => s.updateWorkout);
  const deleteWorkout = useStore((s) => s.deleteWorkout);
  const addExercise = useStore((s) => s.addExercise);
  const updateExercise = useStore((s) => s.updateExercise);
  const deleteExercise = useStore((s) => s.deleteExercise);

  // modal state: which workout we're adding/editing an exercise in
  const [editing, setEditing] = useState<{ workoutId: string; exercise: Exercise; isNew: boolean } | null>(null);

  if (!course) return <p className="placeholder">404</p>;

  const addNewWorkout = () => {
    const w: Workout = {
      id: newId('wk'),
      title: { ru: `Тренировка ${course.workouts.length + 1}`, en: `Workout ${course.workouts.length + 1}` },
      exercises: [],
    };
    addWorkout(course.id, w);
  };

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/dashboard">{t('dashboard')}</Link>
        <span>›</span>
        <span>{tr(course.title)}</span>
      </div>

      <div className="toolbar">
        <h1 style={{ margin: 0 }}>{t('editCourse')}</h1>
        <span className="spacer" />
        <button className="btn small" onClick={() => navigate(`/course/${course.id}`)}>
          👁 {t('openCourse')}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <BiField label={t('title')} value={course.title} onChange={(title) => updateCourse(course.id, { title })} />
        <BiField label={t('level')} value={course.level} onChange={(level) => updateCourse(course.id, { level })} />
        <BiField
          label={t('summary')}
          value={course.summary}
          onChange={(summary) => updateCourse(course.id, { summary })}
          textarea
        />
      </div>

      <div className="toolbar">
        <h2 style={{ margin: 0 }}>{t('workoutsTitle')}</h2>
        <span className="spacer" />
        <button className="btn primary small" onClick={addNewWorkout}>+ {t('addWorkout')}</button>
      </div>

      {course.workouts.map((w) => (
        <div key={w.id} className="card workout-section" style={{ marginBottom: 18 }}>
          <div className="field" style={{ marginBottom: 10 }}>
            <div className="field-row">
              <input
                value={w.title.ru}
                placeholder="RU"
                onChange={(e) => updateWorkout(course.id, w.id, { title: { ...w.title, ru: e.target.value } })}
              />
              <input
                value={w.title.en}
                placeholder="EN"
                onChange={(e) => updateWorkout(course.id, w.id, { title: { ...w.title, en: e.target.value } })}
              />
            </div>
          </div>

          {w.exercises.length === 0 ? (
            <p className="placeholder" style={{ padding: '18px' }}>{t('emptyWorkout')}</p>
          ) : (
            <div className="exercise-list">
              {w.exercises.map((e, i) => (
                <div key={e.id} className="exercise-row">
                  <span className="idx">{i + 1}</span>
                  <div className="body">
                    <div className="name">{tr(e.name)}</div>
                    <div className="presc">{tr(e.prescription)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn ghost small"
                      onClick={() => setEditing({ workoutId: w.id, exercise: e, isNew: false })}
                    >
                      ✎
                    </button>
                    <button
                      className="btn ghost small danger"
                      onClick={() => deleteExercise(course.id, w.id, e.id)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="row-actions">
            <button
              className="btn small"
              onClick={() => setEditing({ workoutId: w.id, exercise: emptyExercise(), isNew: true })}
            >
              + {t('addExercise')}
            </button>
            <button
              className="btn small danger"
              onClick={() => {
                if (confirm(`${t('delete')}: ${tr(w.title)}?`)) deleteWorkout(course.id, w.id);
              }}
            >
              🗑 {t('delete')}
            </button>
          </div>
        </div>
      ))}

      {editing && (
        <ExerciseModal
          initial={editing.exercise}
          onClose={() => setEditing(null)}
          onSave={(ex) => {
            setEditing({ ...editing, exercise: ex });
            // Persist immediately using the latest draft.
            if (editing.isNew) addExercise(course.id, editing.workoutId, ex);
            else updateExercise(course.id, editing.workoutId, ex.id, ex);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
