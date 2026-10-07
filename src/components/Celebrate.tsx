import { useEffect, useMemo } from 'react';
import { useT } from '../i18n/useT';

/** A lightweight confetti + message overlay shown when a goal is completed.
 *  Pure CSS animation — no dependencies. */
export default function Celebrate({ show, title, onClose }: { show: boolean; title?: string; onClose: () => void }) {
  const { t } = useT();
  const pieces = useMemo(
    () => Array.from({ length: 44 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      dur: 1.6 + Math.random() * 1.4,
      color: ['#8b5cf6', '#a78bfa', '#f59e0b', '#fbbf24', '#34d399', '#f472b6'][i % 6],
      rot: Math.random() * 360,
      size: 7 + Math.random() * 7,
    })),
    [show],
  );

  // Auto-dismiss after a few seconds so it never blocks the UI.
  useEffect(() => {
    if (!show) return;
    const id = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(id);
  }, [show, onClose]);

  if (!show) return null;
  return (
    <div className="celebrate" role="dialog" aria-live="polite" onClick={onClose}>
      <div className="confetti">
        {pieces.map((p, i) => (
          <span key={i} style={{
            left: `${p.left}%`, background: p.color, width: p.size, height: p.size,
            animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, transform: `rotate(${p.rot}deg)`,
          }} />
        ))}
      </div>
      <div className="celebrate-card" onClick={(e) => e.stopPropagation()}>
        <div className="celebrate-emoji">🏆</div>
        <h2>{title || t('celebrateTitle')}</h2>
        <p>{t('celebrateBody')}</p>
        <button className="btn primary" onClick={onClose}>{t('niceBtn')}</button>
      </div>
    </div>
  );
}
