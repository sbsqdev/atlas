import { useState } from 'react';
import MuscleModel from './MuscleModel';
import { MUSCLE_BY_ID } from '../data/muscles';
import { useT } from '../i18n/useT';
import type { MuscleId } from '../types';

interface Props {
  primary: MuscleId[];
  secondary: MuscleId[];
  /** smaller viewer height, used in aggregate workout view */
  small?: boolean;
}

/** 3D viewer + front/back toggle + a colour legend of the active muscles. */
export default function MusclePanel({ primary, secondary, small }: Props) {
  const { t, tr } = useT();
  const [view, setView] = useState<'front' | 'back'>('front');

  return (
    <div className="muscle-panel">
      <div className={`viewer${small ? ' small' : ''}`}>
        <MuscleModel primary={primary} secondary={secondary} view={view} />
      </div>

      <div className="viewer-bar">
        <div className="seg" role="tablist">
          <button
            className={view === 'front' ? 'active' : ''}
            onClick={() => setView('front')}
          >
            {t('front')}
          </button>
          <button
            className={view === 'back' ? 'active' : ''}
            onClick={() => setView('back')}
          >
            {t('back')}
          </button>
        </div>
        <span className="hint">{t('rotateHint')}</span>
      </div>

      <div className="legend">
        {primary.length > 0 && (
          <div>
            <h4>{t('primaryMuscles')}</h4>
            <div className="tags">
              {primary.map((id) => (
                <span key={id} className="mtag primary">
                  <span className="dot" />
                  {tr(MUSCLE_BY_ID[id]?.name)}
                </span>
              ))}
            </div>
          </div>
        )}
        {secondary.length > 0 && (
          <div>
            <h4>{t('secondaryMuscles')}</h4>
            <div className="tags">
              {secondary.map((id) => (
                <span key={id} className="mtag secondary">
                  <span className="dot" />
                  {tr(MUSCLE_BY_ID[id]?.name)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
