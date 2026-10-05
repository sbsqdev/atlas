import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { useT } from '../i18n/useT';
import { MUSCLES } from '../data/muscles';
import AnatomyPanel from '../components/AnatomyPanel';
import { useAtlas } from '../anatomy/useAtlas';
import { inferMuscles } from '../lib/inferMuscles';
import type { Bi, Exercise, MuscleId, Workout } from '../types';

let n = 0;
const newId = (p: string) => `${p}-${Date.now().toString(36)}-${(n++).toString(36)}`;

/** Coach grants/revokes course access by student email (e.g. after purchase). */
function AccessByEmail({ courseId }: { courseId: string }) {
  const { t } = useT();
  const grantAccess = useAuth((s) => s.grantAccess);
  const revokeAccess = useAuth((s) => s.revokeAccess);
  const accounts = useAuth((s) => s.accounts);
  const granted = useStore((s) => s.courses.find((c) => c.id === courseId)?.grantedEmails ?? []);
  const [email, setEmail] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    const res = grantAccess(courseId, email);
    if (res.ok) { setEmail(''); setErr(null); }
    else setErr(res.error ? t(res.error) : t('fillFields'));
  };

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h2 style={{ marginTop: 0 }}>{t('accessByEmail')}</h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 0 }}>{t('accessByEmailHint')}</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('studentEmail')}
          style={{ flex: 1, minWidth: 220, background: 'var(--panel)', border: '1px solid var(--border-strong)', borderRadius: 11, padding: '11px 13px', color: 'var(--text)' }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button className="btn primary" onClick={submit}>{t('grant')}</button>
      </div>
      {err && <p style={{ color: '#c2503f', fontSize: 13, margin: '8px 0 0' }}>{err}</p>}

      <h4 style={{ margin: '18px 0 8px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--muted)' }}>
        {t('grantedStudents')}
      </h4>
      {granted.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>{t('noGranted')}</p>
      ) : (
        <div className="granted-list">
          {granted.map((g) => {
            const has = accounts.some((a) => a.email.toLowerCase() === g.toLowerCase() && a.role === 'student');
            return (
              <div key={g} className="granted-row">
                <span className="granted-email">{g}</span>
                <span className={`granted-status ${has ? 'ok' : 'pending'}`}>
                  {has ? `● ${t('accessActive')}` : `○ ${t('accessPending')}`}
                </span>
                <button className="btn small ghost danger" onClick={() => revokeAccess(courseId, g)}>{t('revoke')}</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

/** AI auto-detect: coach writes which muscles work; map to regions via DeepSeek
 *  (or local keyword fallback). */
function AutoDetect({ draft, onChange }: { draft: Exercise; onChange: (e: Exercise) => void }) {
  const { t } = useT();
  const [note, setNote] = useState(draft.muscleNote ?? '');
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<'deepseek' | 'local' | 'none' | null>(null);

  const run = async () => {
    if (!note.trim()) return;
    setBusy(true);
    setSource(null);
    const res = await inferMuscles({ name: draft.name.en || draft.name.ru, description: draft.description.en, note });
    setBusy(false);
    if (!res.primary.length && !res.secondary.length) { setSource('none'); return; }
    setSource(res.source);
    onChange({ ...draft, muscleNote: note, primary: res.primary, secondary: res.secondary });
  };

  return (
    <div className="field">
      <label>{t('muscleNoteLabel')}</label>
      <textarea
        value={note}
        onChange={(e) => { setNote(e.target.value); onChange({ ...draft, muscleNote: e.target.value }); }}
        placeholder="напр.: работают ягодичные и бицепс бедра, поясница стабилизирует"
      />
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
        <button className="btn small primary" onClick={run} disabled={busy || !note.trim()}>
          {busy ? t('detecting') : t('autoDetect')}
        </button>
        {source === 'deepseek' && <span style={{ fontSize: 12, color: 'var(--accent-2)' }}>{t('byAI')}</span>}
        {source === 'local' && <span style={{ fontSize: 12, color: 'var(--sand)' }}>{t('byKeywords')}</span>}
        {source === 'none' && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{t('noneDetected')}</span>}
      </div>
    </div>
  );
}

/** Search BodyParts3D structures by name and add them as highlighted parts. */
function NamedPartsPicker({ draft, onChange }: { draft: Exercise; onChange: (e: Exercise) => void }) {
  const { t, lang } = useT();
  const { atlas } = useAtlas();
  const [q, setQ] = useState('');

  const extra = draft.extraParts ?? [];
  const nameById = (id: string) => atlas?.parts.find((p) => p.id === id)?.name ?? id;

  const results = (() => {
    if (!atlas || q.trim().length < 2) return [] as { label: string; ids: string[] }[];
    const needle = q.toLowerCase();
    const parts = atlas.parts.filter((p) => p.name.toLowerCase().includes(needle)).slice(0, 8)
      .map((p) => ({ label: p.name, ids: [p.id] }));
    const concepts = atlas.concepts.filter((c) => c.name.toLowerCase().includes(needle) && c.elements.length > 1).slice(0, 4)
      .map((c) => ({ label: `${c.name} (${c.elements.length})`, ids: c.elements }));
    return [...concepts, ...parts];
  })();

  const add = (ids: string[]) => onChange({ ...draft, extraParts: [...new Set([...extra, ...ids])] });
  const remove = (id: string) => onChange({ ...draft, extraParts: extra.filter((x) => x !== id) });

  return (
    <div className="field">
      <label>{t('searchStructures')}</label>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={lang === 'ru' ? 'gluteus, soleus, biceps femoris…' : 'gluteus, soleus, biceps femoris…'} />
      {results.length > 0 && (
        <div className="search-results">
          {results.map((r, i) => (
            <button key={i} className="search-result" onClick={() => { add(r.ids); setQ(''); }}>+ {r.label}</button>
          ))}
        </div>
      )}
      {extra.length > 0 && (
        <>
          <div className="small-label">{t('namedStructures')}</div>
          <div className="muscle-grid">
            {extra.map((id) => (
              <span key={id} className="muscle-btn on-primary">
                {nameById(id)}
                <button className="chip-x" onClick={() => remove(id)}>×</button>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Coach analytics: each student's workouts done and videos watched. */
function CourseStudents({ courseId }: { courseId: string }) {
  const { t } = useT();
  const course = useStore((s) => s.courses.find((c) => c.id === courseId));
  const accounts = useAuth((s) => s.accounts);
  const completedForUser = useAuth((s) => s.completedForUser);
  const watchedForUser = useAuth((s) => s.watchedForUser);
  if (!course) return null;

  const totalW = course.workouts.length;
  const totalEx = course.workouts.reduce((n, w) => n + w.exercises.length, 0);
  const students = accounts.filter(
    (a) => a.role === 'student' && (a.enrolledCourseIds?.includes(courseId) || (course.grantedEmails ?? []).some((g) => g.toLowerCase() === a.email.toLowerCase())),
  );

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h2 style={{ marginTop: 0 }}>{t('studentsProgress')}</h2>
      {students.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>{t('noStudents')}</p>
      ) : (
        <div className="student-stats">
          {students.map((s) => {
            const done = completedForUser(s.id, courseId).filter((w) => course.workouts.some((x) => x.id === w)).length;
            const watched = watchedForUser(s.id, courseId).length;
            const pct = totalW ? Math.round((done / totalW) * 100) : 0;
            return (
              <div key={s.id} className="student-row">
                <div className="student-id">
                  <strong>{s.name}</strong>
                  <span>{s.email}</span>
                </div>
                <div className="student-metrics">
                  <div className="progress-track" style={{ width: 120 }}><span style={{ width: `${pct}%` }} /></div>
                  <span className="metric">{done}/{totalW} {t('workouts')} · {pct}%</span>
                  <span className="metric">▶ {watched}/{totalEx} {t('videosWord')} {t('watchedLabel')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="shareline" style={{ marginTop: 12, marginBottom: 0 }}>{t('crossDeviceNote')}</p>
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
        <AutoDetect draft={draft} onChange={setDraft} />
        <div className="editor-muscles">
          <div>
            <MusclePicker exercise={draft} onChange={setDraft} />
            <NamedPartsPicker draft={draft} onChange={setDraft} />
          </div>
          <div className="editor-preview-wrap">
            <AnatomyPanel primary={draft.primary} secondary={draft.secondary} extraParts={draft.extraParts} compact />
          </div>
        </div>
        <div className="row-actions" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
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

      <AccessByEmail courseId={course.id} />
      <CourseStudents courseId={course.id} />

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
