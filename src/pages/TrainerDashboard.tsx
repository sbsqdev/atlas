import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { useT } from '../i18n/useT';
import { makeCode } from '../store/hash';
import type { Course } from '../types';

let n = 0;
const newId = (p: string) => `${p}-${Date.now().toString(36)}-${(n++).toString(36)}`;

function CoachProfile() {
  const { t, lang } = useT();
  const user = useAuth((s) => s.user);
  const account = useAuth((s) => s.accounts.find((a) => a.id === user?.id));
  const updateProfile = useAuth((s) => s.updateProfile);
  const [name, setName] = useState(account?.name ?? '');
  const [brandName, setBrandName] = useState(account?.brandName ?? '');
  const [brandColor, setBrandColor] = useState(account?.brandColor ?? '#8b5cf6');
  const [bio, setBio] = useState(account?.bio ?? '');
  const [saved, setSaved] = useState(false);

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h2 style={{ marginTop: 0 }}>{t('coachProfile')}</h2>
      <div className="field-row">
        <div className="field"><label>{t('name')}</label><input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} /></div>
        <div className="field"><label>{t('brandName')}</label><input value={brandName} onChange={(e) => { setBrandName(e.target.value); setSaved(false); }} /></div>
      </div>
      <div className="field">
        <label>{t('brandColor')}</label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="color" value={brandColor} onChange={(e) => { setBrandColor(e.target.value); setSaved(false); }} style={{ width: 54, height: 40, padding: 2 }} />
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>{brandColor}</span>
          <span className="pill" style={{ ['--accent-dim' as string]: brandColor + '22', background: brandColor + '22', color: brandColor }}>
            {lang === 'ru' ? 'Пример' : lang === 'tr' ? 'Örnek' : 'Preview'}
          </span>
        </div>
      </div>
      <div className="field"><label>{t('bioLabel')}</label><textarea value={bio} onChange={(e) => { setBio(e.target.value); setSaved(false); }} /></div>
      <button className="btn primary" onClick={() => { updateProfile({ name, brandName, brandColor, bio }); setSaved(true); }}>
        {saved ? `✓ ${t('copied')}` : t('saveProfile')}
      </button>
    </div>
  );
}

function CodeRow({ courseId, code }: { courseId: string; code: string }) {
  const { t } = useT();
  const updateCourse = useStore((s) => s.updateCourse);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  };
  return (
    <div className="code-row">
      <div>
        <div className="code-label">{t('inviteCodeLabel')}</div>
        <div className="code-value">{code}</div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn small" onClick={copy}>{copied ? `✓ ${t('copied')}` : `⧉ ${t('copyCode')}`}</button>
        <button className="btn small ghost" onClick={() => updateCourse(courseId, { code: makeCode() })}>↻ {t('regenCode')}</button>
      </div>
    </div>
  );
}

export default function TrainerDashboard() {
  const { t, tr, lang } = useT();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);

  const courses = useStore((s) => s.courses);
  const addCourse = useStore((s) => s.addCourse);
  const deleteCourse = useStore((s) => s.deleteCourse);
  const reset = useStore((s) => s.reset);

  const mine = courses.filter((c) => c.trainerId === user?.id);

  const create = () => {
    const course: Course = {
      id: newId('course'),
      trainerId: user!.id,
      code: makeCode(),
      title: { ru: 'Новый курс', en: 'New course', tr: 'Yeni kurs' },
      summary: { ru: '', en: '' },
      level: { ru: 'Начальный', en: 'Beginner', tr: 'Başlangıç' },
      workouts: [],
    };
    addCourse(course);
    navigate(`/dashboard/course/${course.id}`);
  };

  return (
    <div>
      <div className="toolbar">
        <h1 style={{ margin: 0 }}>{t('dashboard')}</h1>
        <span className="spacer" />
        <button className="btn ghost small" onClick={() => { if (confirm(t('confirmReset'))) reset(); }}>↺ {t('resetDemo')}</button>
        <button className="btn primary" onClick={create}>+ {t('newCourse')}</button>
      </div>

      <CoachProfile />

      <h2>{t('myCourses')}</h2>
      {mine.length === 0 ? (
        <p className="placeholder">{t('noCoursesYet')}</p>
      ) : (
        <div className="grid cols-2">
          {mine.map((course) => {
            const total = course.workouts.reduce((a, w) => a + w.exercises.length, 0);
            return (
              <div key={course.id} className="card">
                <span className="pill">{tr(course.level)}</span>
                <h3>{tr(course.title)}</h3>
                <p>{tr(course.summary) || (lang === 'ru' ? 'Без описания' : lang === 'tr' ? 'Açıklama yok' : 'No description')}</p>
                <div className="meta" style={{ marginBottom: 12 }}>
                  <span>📋 {course.workouts.length} {t('workouts')}</span>
                  <span>🏋️ {total} {t('exercises')}</span>
                </div>
                <CodeRow courseId={course.id} code={course.code} />
                <p className="shareline">{t('shareCodeHint')}</p>
                <div className="row-actions">
                  <button className="btn small" onClick={() => navigate(`/dashboard/course/${course.id}`)}>✎ {t('edit')}</button>
                  <button className="btn small" onClick={() => navigate(`/course/${course.id}`)}>👁 {t('openCourse')}</button>
                  <button className="btn small danger" onClick={() => { if (confirm(`${t('delete')}: ${tr(course.title)}?`)) deleteCourse(course.id); }}>🗑 {t('delete')}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
