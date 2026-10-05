import { useMemo, useState } from 'react';
import AnatomyScene from '../anatomy/scene';
import { useAtlas } from '../anatomy/useAtlas';
import type { SceneState, SystemId, View } from '../anatomy/anatomy';
import { MUSCLE_PARTS } from '../data/muscleParts.generated';
import { MUSCLE_BY_ID } from '../data/muscles';
import { useT } from '../i18n/useT';
import type { MuscleId } from '../types';

interface Props {
  primary: MuscleId[];
  secondary: MuscleId[];
  /** Minimal viewer for embedding (e.g. the course editor preview). */
  compact?: boolean;
}

const PRESETS: { key: string; label: { ru: string; en: string }; systems: SystemId[] }[] = [
  { key: 'muscles', label: { ru: 'Мышцы', en: 'Muscles' }, systems: ['muscular'] },
  { key: 'withBones', label: { ru: 'Мышцы + скелет', en: 'Muscles + bones' }, systems: ['muscular', 'skeletal'] },
  { key: 'skeleton', label: { ru: 'Скелет', en: 'Skeleton' }, systems: ['skeletal'] },
  {
    key: 'all',
    label: { ru: 'Все системы', en: 'All systems' },
    systems: ['skeletal', 'muscular', 'cardiac', 'arterial', 'venous', 'nervous', 'respiratory', 'digestive', 'urinary', 'reproductive', 'lymphatic', 'endocrine', 'connective', 'sensory'],
  },
];

const VIEWS: { key: View; label: { ru: string; en: string } }[] = [
  { key: 'three-quarter', label: { ru: '¾', en: '¾' } },
  { key: 'front', label: { ru: 'Спереди', en: 'Front' } },
  { key: 'back', label: { ru: 'Сзади', en: 'Back' } },
  { key: 'side', label: { ru: 'Сбоку', en: 'Side' } },
];

function partsFor(muscles: MuscleId[]): string[] {
  const out = new Set<string>();
  for (const m of muscles) for (const id of MUSCLE_PARTS[m] ?? []) out.add(id);
  return [...out];
}

export default function AnatomyPanel({ primary, secondary, compact }: Props) {
  const { t, tr, lang } = useT();
  const { atlas, error } = useAtlas();
  const [progress, setProgress] = useState(0);
  const [sceneError, setSceneError] = useState<string | null>(null);

  const [preset, setPreset] = useState('muscles');
  const [view, setView] = useState<View>('three-quarter');
  const [explode, setExplode] = useState(0);
  const [rotate, setRotate] = useState(false);
  const [isolate, setIsolate] = useState(false);
  const [reset, setReset] = useState(0);
  const [override, setOverride] = useState<string | null>(null);
  const [inspectedName, setInspectedName] = useState<string | null>(null);

  const { exerciseSelected, exerciseSecondary } = useMemo(() => {
    const prim = partsFor(primary);
    const primSet = new Set(prim);
    const sec = partsFor(secondary).filter((id) => !primSet.has(id));
    return { exerciseSelected: [...prim, ...sec], exerciseSecondary: sec };
  }, [primary, secondary]);

  const state: SceneState = useMemo(() => {
    const systems = PRESETS.find((p) => p.key === preset)!.systems;
    const selected = override ? [override] : exerciseSelected;
    const secondaryIds = override ? [] : exerciseSecondary;
    return {
      explode: compact ? 0 : explode,
      visible: compact ? ['muscular'] : systems,
      selected,
      secondary: secondaryIds,
      isolate: compact ? false : isolate,
      view,
      rotate: compact ? false : rotate,
      reset,
      inspectorOpen: false,
    };
  }, [compact, preset, override, exerciseSelected, exerciseSecondary, explode, isolate, view, rotate, reset]);

  const onSelect = (id: string) => {
    if (compact) return;
    setOverride(id);
    const part = atlas?.parts.find((p) => p.id === id);
    setInspectedName(part ? part.name : id);
  };

  const viewer = (
    <div className={`viewer anatomy${compact ? ' small' : ''}`}>
      {atlas && !error ? (
        <AnatomyScene atlas={atlas} state={state} onSelect={onSelect} onProgress={setProgress} onError={setSceneError} />
      ) : (
        <div className="viewer-loading">{error ?? (lang === 'ru' ? 'Загрузка 3D-анатомии…' : 'Loading 3D anatomy…')}</div>
      )}
      {atlas && progress < 100 && !sceneError && <div className="load-bar"><span style={{ width: `${progress}%` }} /></div>}
      {sceneError && <div className="viewer-loading err">{sceneError}</div>}
    </div>
  );

  // Compact preview (editor): viewer + view toggle only.
  if (compact) {
    return (
      <div className="muscle-panel editor-preview">
        {viewer}
        <div className="anatomy-controls">
          <div className="seg wrap">
            {VIEWS.map((v) => (
              <button key={v.key} className={view === v.key ? 'active' : ''} onClick={() => setView(v.key)}>
                {v.label[lang]}
              </button>
            ))}
          </div>
        </div>
        <p className="hint">
          {lang === 'ru' ? 'Так эти мышцы увидят ученики' : 'This is what students will see'}
        </p>
      </div>
    );
  }

  return (
    <div className="muscle-panel">
      {viewer}

      <div className="anatomy-controls">
        <div className="seg wrap">
          {PRESETS.map((p) => (
            <button key={p.key} className={preset === p.key ? 'active' : ''} onClick={() => setPreset(p.key)}>
              {p.label[lang]}
            </button>
          ))}
        </div>

        <div className="seg wrap">
          {VIEWS.map((v) => (
            <button key={v.key} className={view === v.key ? 'active' : ''} onClick={() => setView(v.key)}>
              {v.label[lang]}
            </button>
          ))}
        </div>

        <div className="ctl-row">
          <label className="explode">
            {lang === 'ru' ? 'Разложить' : 'Explode'}
            <input type="range" min={0} max={1} step={0.01} value={explode} onChange={(e) => setExplode(parseFloat(e.target.value))} />
          </label>
          <button className={`btn small ${rotate ? 'primary' : ''}`} onClick={() => setRotate((r) => !r)}>
            ⟳ {lang === 'ru' ? 'Вращать' : 'Rotate'}
          </button>
          <button className={`btn small ${isolate ? 'primary' : ''}`} onClick={() => setIsolate((i) => !i)}>
            ◎ {lang === 'ru' ? 'Изолировать' : 'Isolate'}
          </button>
          <button
            className="btn small"
            onClick={() => { setOverride(null); setInspectedName(null); setIsolate(false); setExplode(0); setReset((r) => r + 1); }}
          >
            ↺ {lang === 'ru' ? 'Сброс' : 'Reset'}
          </button>
        </div>

        {override && inspectedName && (
          <div className="inspected">
            <span>{inspectedName}</span>
            <button className="btn small" onClick={() => { setOverride(null); setInspectedName(null); }}>
              ← {lang === 'ru' ? 'К мышцам упражнения' : 'Back to exercise'}
            </button>
          </div>
        )}
      </div>

      <div className="legend">
        {primary.length > 0 && (
          <div>
            <h4>{t('primaryMuscles')}</h4>
            <div className="tags">
              {primary.map((id) => (<span key={id} className="mtag primary"><span className="dot" />{tr(MUSCLE_BY_ID[id]?.name)}</span>))}
            </div>
          </div>
        )}
        {secondary.length > 0 && (
          <div>
            <h4>{t('secondaryMuscles')}</h4>
            <div className="tags">
              {secondary.map((id) => (<span key={id} className="mtag secondary"><span className="dot" />{tr(MUSCLE_BY_ID[id]?.name)}</span>))}
            </div>
          </div>
        )}
        <p className="atlas-credit">
          {lang === 'ru'
            ? 'Модель: BodyParts3D 4.0 (CC BY 4.0). Нажмите на структуру, чтобы рассмотреть её.'
            : 'Model: BodyParts3D 4.0 (CC BY 4.0). Tap a structure to inspect it.'}
        </p>
      </div>
    </div>
  );
}
