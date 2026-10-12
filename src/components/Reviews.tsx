import { useMemo, useState } from 'react';
import { useAuth } from '../store/useAuth';
import { useReviews } from '../store/useReviews';
import { useT } from '../i18n/useT';

function Stars({ value, onPick }: { value: number; onPick?: (n: number) => void }) {
  return (
    <span className={`stars${onPick ? ' pick' : ''}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" className={`star${n <= value ? ' on' : ''}`} disabled={!onPick} onClick={() => onPick?.(n)} aria-label={`${n}`}>★</button>
      ))}
    </span>
  );
}

function timeAgo(ts: number): string {
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d <= 0) return 'сегодня';
  if (d === 1) return 'вчера';
  return `${d} дн. назад`;
}

/** Public course reviews with an average rating and a leave-review form for
 *  enrolled students (the owning trainer only reads them). */
export default function Reviews({ courseId, workoutId, canReview, title }: { courseId: string; workoutId?: string; canReview: boolean; title?: string }) {
  const { t } = useT();
  const user = useAuth((s) => s.user);
  const reviews = useReviews((s) => s.reviews.filter((r) => r.courseId === courseId && r.workoutId === workoutId));
  const submit = useReviews((s) => s.submit);
  const remove = useReviews((s) => s.remove);
  const mine = user ? reviews.find((r) => r.userId === user.id) : undefined;

  // Per-workout reviews are a short questionnaire (rating + quick questions).
  const questionnaire = !!workoutId;
  const [rating, setRating] = useState(mine?.rating ?? 5);
  const [text, setText] = useState(mine?.text ?? '');
  const [recommend, setRecommend] = useState<boolean | undefined>(mine?.recommend);
  const [difficulty, setDifficulty] = useState<'easy' | 'ok' | 'hard' | undefined>(mine?.difficultyFit);
  const [editing, setEditing] = useState(false);

  const { avg, count } = useMemo(() => {
    const count = reviews.length;
    const avg = count ? reviews.reduce((n, r) => n + r.rating, 0) / count : 0;
    return { avg, count };
  }, [reviews]);

  const send = () => {
    if (!user) return;
    if (!questionnaire && !text.trim()) return; // course review needs text
    submit({ courseId, workoutId, userId: user.id, userName: user.name, rating, text, recommend, difficultyFit: difficulty });
    setEditing(false);
  };
  const DIFF_LABEL = { easy: t('diffEasy'), ok: t('diffOk'), hard: t('diffHard') };

  return (
    <div className="card reviews-card">
      <div className="reviews-head">
        <h2 style={{ margin: 0 }}>💬 {title ?? t('reviews')}</h2>
        {count > 0 && (
          <div className="reviews-avg">
            <Stars value={Math.round(avg)} />
            <span><b>{avg.toFixed(1)}</b> {t('reviewOutOf')} · {count} {t('reviewCount')}</span>
          </div>
        )}
      </div>

      {reviews.length === 0 && <p className="placeholder" style={{ margin: '10px 0' }}>{t('reviewsNone')}</p>}

      <div className="reviews-list">
        {reviews.map((r) => (
          <div key={r.id} className="review-item">
            <div className="review-top">
              <span className="review-name">{r.userName}</span>
              <Stars value={r.rating} />
              <span className="review-time">{timeAgo(r.createdAt)}</span>
              {user?.id === r.userId && <button className="btn ghost small" onClick={() => remove(r.id)}>🗑</button>}
            </div>
            {(r.recommend !== undefined || r.difficultyFit) && (
              <div className="review-tags">
                {r.recommend === true && <span className="rtag ok">{t('recommendBadge')}</span>}
                {r.recommend === false && <span className="rtag no">{t('qNo')}</span>}
                {r.difficultyFit && <span className="rtag">💪 {DIFF_LABEL[r.difficultyFit]}</span>}
              </div>
            )}
            {r.text && <div className="review-text">{r.text}</div>}
          </div>
        ))}
      </div>

      {canReview && user && (
        (mine && !editing) ? (
          <div className="review-mine">✅ {t('reviewThanks')}
            <button className="btn ghost small" style={{ marginLeft: 10 }} onClick={() => setEditing(true)}>{t('reviewEdit')}</button>
          </div>
        ) : (
          <div className="review-form">
            <div className="small-label">{mine ? t('reviewYours') : t('reviewLeave')}</div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label>{t('reviewRating')}</label>
              <Stars value={rating} onPick={setRating} />
            </div>

            {questionnaire && (
              <>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>{t('qRecommend')}</label>
                  <div className="pick-row">
                    <button className={`pick-btn${recommend === true ? ' on' : ''}`} onClick={() => setRecommend(true)}>{t('qYes')}</button>
                    <button className={`pick-btn${recommend === false ? ' on' : ''}`} onClick={() => setRecommend(false)}>{t('qNo')}</button>
                  </div>
                </div>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>{t('qDifficulty')}</label>
                  <div className="pick-row">
                    {(['easy', 'ok', 'hard'] as const).map((d) => (
                      <button key={d} className={`pick-btn${difficulty === d ? ' on' : ''}`} onClick={() => setDifficulty(d)}>{DIFF_LABEL[d]}</button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="field">
              <textarea value={text} placeholder={questionnaire ? t('workoutReviewPh') : t('reviewTextPh')} onChange={(e) => setText(e.target.value)} />
            </div>
            <button className="btn primary" disabled={!questionnaire && !text.trim()} onClick={send}>{t('reviewSubmit')}</button>
          </div>
        )
      )}
    </div>
  );
}
