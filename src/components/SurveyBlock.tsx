import { useMemo, useState } from 'react';
import { useAuth } from '../store/useAuth';
import { useSurvey } from '../store/useSurvey';
import { useT } from '../i18n/useT';
import { MUSCLES, MUSCLE_BY_ID } from '../data/muscles';
import AnatomyPanel from './AnatomyPanel';
import type { MuscleId, SurveyResponse } from '../types';

const MOODS = ['😣', '😕', '🙂', '😃', '🔥']; // 1..5

/** Student fills the post-session survey; the owning trainer sees the summary. */
export default function SurveyBlock({ courseId, workoutId, isOwner }: { courseId: string; workoutId: string; isOwner: boolean }) {
  if (isOwner) return <SurveySummary workoutId={workoutId} />;
  return <SurveyForm courseId={courseId} workoutId={workoutId} />;
}

function SurveyForm({ courseId, workoutId }: { courseId: string; workoutId: string }) {
  const { t, tr } = useT();
  const user = useAuth((s) => s.user);
  const submit = useSurvey((s) => s.submit);
  const existing = useSurvey((s) => (user ? s.responses.find((x) => x.workoutId === workoutId && x.userId === user.id) : undefined));

  const [editing, setEditing] = useState(false);
  const [mood, setMood] = useState(existing?.mood ?? 3);
  const [rpe, setRpe] = useState(existing?.rpe ?? 6);
  const [sore, setSore] = useState<MuscleId[]>(existing?.soreMuscles ?? []);
  const [note, setNote] = useState(existing?.note ?? '');

  if (!user) return null;

  if (existing && !editing) {
    return (
      <div className="thread survey-block">
        <h2>📋 {t('survey')}</h2>
        <div className="survey-done">{t('surveyThanks')}
          <button className="btn ghost small" style={{ marginLeft: 10 }} onClick={() => setEditing(true)}>{t('surveyEdit')}</button>
        </div>
      </div>
    );
  }

  const toggle = (m: MuscleId) => setSore((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]));
  const send = () => {
    submit({ workoutId, courseId, userId: user.id, userName: user.name, rpe, mood, soreMuscles: sore, note });
    setEditing(false);
  };

  return (
    <div className="thread survey-block">
      <h2>📋 {t('survey')}</h2>
      <p className="sub" style={{ marginTop: 0 }}>{t('surveyHint')}</p>

      <div className="survey-field">
        <label>{t('surveyMood')}</label>
        <div className="mood-row">
          {MOODS.map((e, i) => (
            <button key={i} className={`mood-btn${mood === i + 1 ? ' on' : ''}`} onClick={() => setMood(i + 1)}>{e}</button>
          ))}
        </div>
      </div>

      <div className="survey-field">
        <label>{t('surveyRpe')} · <b style={{ color: 'var(--accent-2)' }}>{rpe}</b></label>
        <input type="range" min={1} max={10} value={rpe} onChange={(e) => setRpe(Number(e.target.value))} className="rpe-range" />
      </div>

      <div className="survey-field">
        <label>{t('surveySore')}</label>
        <div className="survey-atlas">
          <AnatomyPanel primary={sore} secondary={[]} />
          <div className="muscle-grid">
            {MUSCLES.map((m) => (
              <button key={m.id} className={`muscle-btn${sore.includes(m.id) ? ' on-primary' : ''}`} onClick={() => toggle(m.id)}>
                {tr(m.name)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="field">
        <label>{t('surveyNote')}</label>
        <textarea value={note} placeholder={t('surveyNotePh')} onChange={(e) => setNote(e.target.value)} />
      </div>

      <button className="btn primary" onClick={send}>{t('surveySubmit')}</button>
    </div>
  );
}

function SurveySummary({ workoutId }: { workoutId: string }) {
  const { t, tr } = useT();
  const responses = useSurvey((s) => s.responses.filter((x) => x.workoutId === workoutId));

  const { avgRpe, avgMood, topSore, comments } = useMemo(() => {
    if (!responses.length) return { avgRpe: 0, avgMood: 0, topSore: [] as { id: MuscleId; n: number }[], comments: [] as SurveyResponse[] };
    const avgRpe = responses.reduce((n, r) => n + r.rpe, 0) / responses.length;
    const avgMood = responses.reduce((n, r) => n + r.mood, 0) / responses.length;
    const freq = new Map<MuscleId, number>();
    responses.forEach((r) => r.soreMuscles.forEach((m) => freq.set(m, (freq.get(m) ?? 0) + 1)));
    const topSore = [...freq.entries()].map(([id, n]) => ({ id, n })).sort((a, b) => b.n - a.n);
    const comments = responses.filter((r) => r.note);
    return { avgRpe, avgMood, topSore, comments };
  }, [responses]);

  return (
    <div className="thread survey-block">
      <h2>📋 {t('surveyResults')}</h2>
      {responses.length === 0 ? (
        <p className="placeholder">{t('surveyNoResponses')}</p>
      ) : (
        <>
          <div className="grid cols-3" style={{ marginBottom: 16 }}>
            <div className="card game-stat"><div className="game-big"><b>{responses.length}</b></div><div className="game-sub">{t('surveyCount')}</div></div>
            <div className="card game-stat"><div className="game-big">💪 <b>{avgRpe.toFixed(1)}</b>/10</div><div className="game-sub">{t('surveyAvgRpe')}</div></div>
            <div className="card game-stat"><div className="game-big">{MOODS[Math.round(avgMood) - 1] ?? '🙂'} <b>{avgMood.toFixed(1)}</b>/5</div><div className="game-sub">{t('surveyAvgMood')}</div></div>
          </div>

          <div className="survey-field">
            <label>{t('surveyTopSore')}</label>
            <div className="survey-atlas">
              <AnatomyPanel primary={topSore.slice(0, 3).map((x) => x.id)} secondary={topSore.slice(3).map((x) => x.id)} />
              <div className="chips">
                {topSore.map((x) => (
                  <span key={x.id} className="chip primary">{tr(MUSCLE_BY_ID[x.id]?.name)} · {x.n}</span>
                ))}
              </div>
            </div>
          </div>

          {comments.length > 0 && (
            <div className="survey-field">
              <label>{t('surveyComments')}</label>
              <div className="survey-comments">
                {comments.map((r) => (
                  <div key={r.id} className="survey-comment">
                    <b>{r.userName}</b> · {MOODS[r.mood - 1]} · 💪{r.rpe}
                    <div>{r.note}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
