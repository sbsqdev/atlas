import { useState } from 'react';
import { useAuth } from '../store/useAuth';
import { useSocial, CLAN_GOAL, type Friend } from '../store/useSocial';
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

const CLAN_EMOJI = ['⚔️', '🔥', '🐺', '🦁', '🛡️', '⚡', '🚀', '💎'];

function ClanSection({ myWeekly }: { myWeekly: number }) {
  const { t } = useT();
  const friends = useSocial((s) => s.friends);
  const clan = useSocial((s) => s.clan);
  const rivals = useSocial((s) => s.rivals);
  const createClan = useSocial((s) => s.createClan);
  const leaveClan = useSocial((s) => s.leaveClan);
  const toggleMember = useSocial((s) => s.toggleMember);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(CLAN_EMOJI[0]);

  if (!clan) {
    return (
      <div className="card clan-create">
        <h2 style={{ marginTop: 0 }}>⚔️ {t('clans')}</h2>
        <p className="muted-sm" style={{ marginBottom: 12 }}>{t('clanHint')}</p>
        <div className="emoji-row">
          {CLAN_EMOJI.map((e) => (
            <button key={e} className={`emoji-opt${emoji === e ? ' on' : ''}`} onClick={() => setEmoji(e)}>{e}</button>
          ))}
        </div>
        <div className="add-habit" style={{ marginTop: 10 }}>
          <input value={name} placeholder={t('clanNamePh')} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) createClan(name, emoji); }} />
          <button className="btn primary" disabled={!name.trim()} onClick={() => createClan(name, emoji)}>{t('createClan')}</button>
        </div>
      </div>
    );
  }

  const memberFriends = friends.filter((f) => clan.memberIds.includes(f.id));
  const score = myWeekly + memberFriends.reduce((n, f) => n + f.weekly, 0);
  const pct = Math.min(100, Math.round((score / CLAN_GOAL) * 100));
  const board = [{ name: `${clan.emoji} ${clan.name}`, score, me: true }, ...rivals.map((r) => ({ name: `${r.emoji} ${r.name}`, score: r.score, me: false }))]
    .sort((a, b) => b.score - a.score);

  return (
    <div className="card clan-card">
      <div className="clan-head">
        <span className="clan-emoji">{clan.emoji}</span>
        <div><div className="clan-name">{clan.name}</div>
          <div className="muted-sm">{memberFriends.length + 1} {t('clanMembers').toLowerCase()}</div></div>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn ghost small" onClick={leaveClan}>{t('leaveClan')}</button>
      </div>

      <div className="clan-score-box">
        <div className="clan-score"><b>{score}</b> <span>{t('clanScore')}</span></div>
        <div className="goal-track" style={{ marginTop: 8 }}><span style={{ width: `${pct}%` }} /></div>
        <div className="muted-sm" style={{ marginTop: 5 }}>{t('clanGoalLine')}: {score}/{CLAN_GOAL}</div>
      </div>

      <div className="small-label">{t('clanMembers')}</div>
      <div className="clan-members">
        {friends.map((f) => (
          <button key={f.id} className={`clan-chip${clan.memberIds.includes(f.id) ? ' on' : ''}`} onClick={() => toggleMember(f.id)}>
            <span className="avatar" style={{ background: f.color, width: 22, height: 22, fontSize: 11 }}>{f.name[0]}</span>
            {f.name} {clan.memberIds.includes(f.id) ? '✓' : '+'}
          </button>
        ))}
      </div>

      <div className="small-label" style={{ marginTop: 14 }}>🏆 {t('clanBoard')}</div>
      <div className="board">
        {board.map((row, i) => (
          <div key={i} className={`board-row${row.me ? ' me' : ''}`}>
            <span className="board-rank">{i + 1}</span>
            <div className="board-main"><div className="board-name">{row.name}</div></div>
            <span className="board-weekly"><b>{row.score}</b></span>
          </div>
        ))}
      </div>
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

      <h2 style={{ marginTop: 26 }}>⚔️ {t('myClan')}</h2>
      <ClanSection myWeekly={g.totalDone} />

      <p className="hint" style={{ marginTop: 16 }}>ℹ️ {t('localDemoNote')}</p>
    </div>
  );
}
