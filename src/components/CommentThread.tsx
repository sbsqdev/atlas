import { useState } from 'react';
import { useComments, type Comment } from '../store/useComments';
import { useAuth } from '../store/useAuth';
import { useT } from '../i18n/useT';
import CircleRecorder from './CircleRecorder';

const REACTIONS = ['👍', '🔥', '❤️', '💪'];

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

function timeAgo(ts: number, lang: string, justNow: string): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return justNow;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}${lang === 'en' ? 'm' : lang === 'tr' ? 'dk' : 'м'}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}${lang === 'en' ? 'h' : lang === 'tr' ? 's' : 'ч'}`;
  const d = Math.floor(h / 24);
  return `${d}${lang === 'en' ? 'd' : lang === 'tr' ? 'g' : 'д'}`;
}

function Bubble({ c, onReply }: { c: Comment; onReply: (id: string) => void }) {
  const { t, lang } = useT();
  const user = useAuth((s) => s.user);
  const react = useComments((s) => s.react);
  const remove = useComments((s) => s.remove);
  const mine = user?.id === c.authorId;

  return (
    <div className={`bubble-row ${mine ? 'me' : ''}`}>
      {!mine && <span className="bubble-avatar" style={{ background: c.role === 'trainer' ? 'var(--accent)' : 'var(--sand)' }}>{initials(c.authorName)}</span>}
      <div className={`bubble ${c.role === 'trainer' ? 'coach' : ''} ${mine ? 'mine' : ''}`}>
        <div className="bubble-head">
          <span className="bubble-name">{c.authorName}</span>
          {c.role === 'trainer' && <span className="role-badge">{t('trainer')}</span>}
          <span className="bubble-time">{timeAgo(c.createdAt, lang, t('justNow'))}</span>
        </div>
        {c.circle && <video className="circle-msg" src={c.circle} controls loop playsInline preload="metadata" />}
        {c.text && <div className="bubble-text">{c.text}</div>}
        <div className="bubble-actions">
          {REACTIONS.map((e) => {
            const users = c.reactions[e] ?? [];
            const on = user ? users.includes(user.id) : false;
            return (
              <button key={e} className={`react ${on ? 'on' : ''}`} onClick={() => user && react(c.id, e, user.id)}>
                {e}{users.length > 0 && <span className="react-n">{users.length}</span>}
              </button>
            );
          })}
          <button className="react reply-btn" onClick={() => onReply(c.id)}>↩ {t('reply')}</button>
          {mine && <button className="react reply-btn" onClick={() => remove(c.id)}>🗑</button>}
        </div>
      </div>
    </div>
  );
}

export default function CommentThread({ threadKey, title }: { threadKey: string; title?: string }) {
  const { t } = useT();
  const user = useAuth((s) => s.user);
  const comments = useComments((s) => s.comments.filter((c) => c.threadKey === threadKey));
  const add = useComments((s) => s.add);

  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [recording, setRecording] = useState(false);

  const roots = comments.filter((c) => !c.parentId).sort((a, b) => a.createdAt - b.createdAt);
  const repliesOf = (id: string) => comments.filter((c) => c.parentId === id).sort((a, b) => a.createdAt - b.createdAt);

  const post = () => {
    if (!user || !text.trim()) return;
    add(threadKey, user, text);
    setText('');
  };
  const postReply = (rootId: string) => {
    if (!user || !replyText.trim()) return;
    add(threadKey, user, replyText, rootId);
    setReplyText('');
    setReplyTo(null);
  };

  const sendCircle = (dataUrl: string) => {
    if (user) add(threadKey, user, '', undefined, dataUrl);
    setRecording(false);
  };

  return (
    <div className="thread">
      <h2>💬 {title ?? t('discussion')}</h2>
      <div className="thread-list">
        {roots.length === 0 && <p className="placeholder" style={{ padding: 24 }}>{t('noComments')}</p>}
        {roots.map((c) => (
          <div key={c.id} className="thread-item">
            <Bubble c={c} onReply={(id) => { setReplyTo(replyTo === id ? null : id); setReplyText(''); }} />
            <div className="reply-list">
              {repliesOf(c.id).map((r) => (
                <Bubble key={r.id} c={r} onReply={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyText(''); }} />
              ))}
            </div>
            {replyTo === c.id && (
              <div className="thread-input reply">
                <input
                  autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t('writeMessage')} onKeyDown={(e) => e.key === 'Enter' && postReply(c.id)}
                />
                <button className="btn small primary" onClick={() => postReply(c.id)}>{t('send')}</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {recording && user && (
        <div className="modal-backdrop" onClick={() => setRecording(false)}>
          <div className="modal circle-modal" onClick={(e) => e.stopPropagation()}>
            <CircleRecorder onSend={sendCircle} onCancel={() => setRecording(false)} />
          </div>
        </div>
      )}

      <div className="thread-input">
        <button className="btn circle-btn" title={t('recordCircle')} onClick={() => setRecording(true)} disabled={!user}>🎥</button>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('writeMessage')} onKeyDown={(e) => e.key === 'Enter' && post()} />
        <button className="btn primary" onClick={post}>{t('send')}</button>
      </div>
    </div>
  );
}
