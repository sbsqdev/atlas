import { useState } from 'react';
import { useAuth } from '../store/useAuth';
import { useSocial, type Friend } from '../store/useSocial';
import { useT } from '../i18n/useT';
import { useGamification } from './Achievements';

const DAY_DOTS = 7;

function Dots({ on }: { on: boolean[] }) {
  return (
    <div className="mini-dots">
      {Array.from({ length: DAY_DOTS }).map((_, i) => (
        <span key={i} className={`mini-dot${on[i] ? ' on' : ''}`} />
      ))}
    </div>
  );
}

export default function Friends() {
  const { t } = useT();
  const user = useAuth((s) => s.user);
  const friends = useSocial((s) => s.friends);
  const addFriend = useSocial((s) => s.addFriend);
  const removeFriend = useSocial((s) => s.removeFriend);
  const cheer = useSocial((s) => s.cheer);
  const g = useGamification();
  const [name, setName] = useState('');

  // "You" as a leaderboard row built from real gamification data.
  const me = {
    id: 'me',
    name: user?.name ?? t('friendsYou'),
    color: '#8b5cf6',
    streak: g.streak,
    last7: g.last7,
    weekly: g.totalDone,
  };
  const activeFriends = friends.filter((f) => f.last7.slice(-7).some(Boolean)).length;

  const board: (Friend & { me?: boolean })[] = [{ ...me, me: true }, ...friends]
    .sort((a, b) => b.weekly - a.weekly || b.streak - a.streak);

  return (
    <div>
      <h1>🤝 {t('friends')}</h1>
      <p className="sub">{t('friendsTagline')}</p>

      <div className="card together-card">
        <div className="together-big">🔥 <b>{activeFriends}</b></div>
        <div className="together-text">{t('togetherEffect')}: <b>{activeFriends}</b> {t('togetherEffectDesc')}</div>
      </div>

      <h2 style={{ marginTop: 22 }}>🏆 {t('friendsLeaderboard')}</h2>
      <div className="board">
        {board.map((row, i) => (
          <div key={row.id} className={`board-row${row.me ? ' me' : ''}`}>
            <span className="board-rank">{i + 1}</span>
            <span className="avatar board-av" style={{ background: row.color }}>{row.name[0]?.toUpperCase()}</span>
            <div className="board-main">
              <div className="board-name">{row.me ? `${row.name} · ${t('friendsYou')}` : row.name}</div>
              <Dots on={row.last7} />
            </div>
            <span className="board-streak">🔥 {row.streak}</span>
            <span className="board-weekly"><b>{row.weekly}</b></span>
            {!row.me && (
              <button className={`btn small cheer-btn${(row as Friend).cheered ? ' on' : ''}`} onClick={() => cheer(row.id)}>
                {(row as Friend).cheered ? `👏 ${t('cheered')}` : `👊 ${t('cheer')}`}
              </button>
            )}
            {!row.me && (
              <button className="btn ghost small" onClick={() => removeFriend(row.id)} aria-label="remove">🗑</button>
            )}
          </div>
        ))}
      </div>

      {friends.length === 0 && <p className="placeholder" style={{ marginTop: 12 }}>{t('friendsEmpty')}</p>}

      <div className="add-habit" style={{ marginTop: 16, maxWidth: 480 }}>
        <input value={name} placeholder={t('friendNamePh')} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) { addFriend(name); setName(''); } }} />
        <button className="btn primary" disabled={!name.trim()} onClick={() => { if (name.trim()) { addFriend(name); setName(''); } }}>
          + {t('friendsAdd')}
        </button>
      </div>

      <p className="hint" style={{ marginTop: 16 }}>ℹ️ {t('localDemoNote')}</p>
    </div>
  );
}
