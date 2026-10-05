import { useState } from 'react';
import { useT } from '../i18n/useT';

const ACTIVITY = [
  { key: 'actSedentary', f: 1.2 },
  { key: 'actLight', f: 1.375 },
  { key: 'actModerate', f: 1.55 },
  { key: 'actActive', f: 1.725 },
  { key: 'actVery', f: 1.9 },
] as const;

const GOAL = [
  { key: 'goalLose', adj: 0.85 },
  { key: 'goalMaintain', adj: 1.0 },
  { key: 'goalGain', adj: 1.1 },
] as const;

function MacroCalc() {
  const { t } = useT();
  const [sex, setSex] = useState<'male' | 'female'>('female');
  const [age, setAge] = useState('28');
  const [weight, setWeight] = useState('62');
  const [height, setHeight] = useState('168');
  const [act, setAct] = useState(2);
  const [goal, setGoal] = useState(1);
  const [out, setOut] = useState<{ kcal: number; p: number; f: number; c: number } | null>(null);

  const calc = () => {
    const w = parseFloat(weight), h = parseFloat(height), a = parseFloat(age);
    if (!w || !h || !a) return;
    const bmr = 10 * w + 6.25 * h - 5 * a + (sex === 'male' ? 5 : -161);
    const kcal = Math.round(bmr * ACTIVITY[act].f * GOAL[goal].adj);
    const p = Math.round(w * 2.0);
    const f = Math.round(w * 1.0);
    const c = Math.max(0, Math.round((kcal - p * 4 - f * 9) / 4));
    setOut({ kcal, p, f, c });
  };

  return (
    <div className="card calc">
      <h3>{t('macroCalc')}</h3>
      <p className="calc-desc">{t('macroDesc')}</p>
      <div className="field">
        <label>{t('sex')}</label>
        <div className="seg">
          <button className={sex === 'female' ? 'active' : ''} onClick={() => setSex('female')}>{t('female')}</button>
          <button className={sex === 'male' ? 'active' : ''} onClick={() => setSex('male')}>{t('male')}</button>
        </div>
      </div>
      <div className="field-row">
        <div className="field"><label>{t('age')}</label><input value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" /></div>
        <div className="field"><label>{t('weightKg')}</label><input value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" /></div>
      </div>
      <div className="field"><label>{t('heightCm')}</label><input value={height} onChange={(e) => setHeight(e.target.value)} inputMode="decimal" /></div>
      <div className="field">
        <label>{t('activity')}</label>
        <select value={act} onChange={(e) => setAct(Number(e.target.value))}>
          {ACTIVITY.map((a, i) => <option key={a.key} value={i}>{t(a.key)}</option>)}
        </select>
      </div>
      <div className="field">
        <label>{t('goal')}</label>
        <div className="seg">
          {GOAL.map((g, i) => (
            <button key={g.key} className={goal === i ? 'active' : ''} onClick={() => setGoal(i)}>{t(g.key)}</button>
          ))}
        </div>
      </div>
      <button className="btn primary" onClick={calc} style={{ width: '100%', justifyContent: 'center' }}>{t('calculate')}</button>
      {out && (
        <div className="calc-out">
          <div className="big-num">{out.kcal} <small>kcal / {t('perDay')}</small></div>
          <div className="macro-row">
            <div className="macro p"><span>{out.p}g</span><small>{t('protein')}</small></div>
            <div className="macro f"><span>{out.f}g</span><small>{t('fats')}</small></div>
            <div className="macro c"><span>{out.c}g</span><small>{t('carbs')}</small></div>
          </div>
        </div>
      )}
    </div>
  );
}

function OneRMCalc() {
  const { t } = useT();
  const [w, setW] = useState('40');
  const [reps, setReps] = useState('8');
  const [out, setOut] = useState<number | null>(null);
  const calc = () => {
    const weight = parseFloat(w), r = parseFloat(reps);
    if (!weight || !r) return;
    setOut(Math.round(weight * (1 + r / 30)));
  };
  return (
    <div className="card calc">
      <h3>{t('oneRM')}</h3>
      <p className="calc-desc">{t('oneRMDesc')}</p>
      <div className="field-row">
        <div className="field"><label>{t('liftedWeight')}</label><input value={w} onChange={(e) => setW(e.target.value)} inputMode="decimal" /></div>
        <div className="field"><label>{t('reps')}</label><input value={reps} onChange={(e) => setReps(e.target.value)} inputMode="numeric" /></div>
      </div>
      <button className="btn primary" onClick={calc} style={{ width: '100%', justifyContent: 'center' }}>{t('calculate')}</button>
      {out !== null && (
        <div className="calc-out"><div className="big-num">{out} <small>kg · {t('estimated1RM')}</small></div></div>
      )}
    </div>
  );
}

function BmiCalc() {
  const { t, lang } = useT();
  const [w, setW] = useState('62');
  const [h, setH] = useState('168');
  const [out, setOut] = useState<{ v: number; cat: string } | null>(null);
  const calc = () => {
    const weight = parseFloat(w), height = parseFloat(h) / 100;
    if (!weight || !height) return;
    const v = weight / (height * height);
    const cats: Record<string, [string, string, string]> = {
      under: ['Недостаток', 'Underweight', 'Zayıf'],
      normal: ['Норма', 'Normal', 'Normal'],
      over: ['Избыток', 'Overweight', 'Fazla kilolu'],
      obese: ['Ожирение', 'Obese', 'Obez'],
    };
    const k = v < 18.5 ? 'under' : v < 25 ? 'normal' : v < 30 ? 'over' : 'obese';
    const idx = lang === 'ru' ? 0 : lang === 'en' ? 1 : 2;
    setOut({ v: Math.round(v * 10) / 10, cat: cats[k][idx] });
  };
  return (
    <div className="card calc">
      <h3>{t('bmiCalc')}</h3>
      <div className="field-row">
        <div className="field"><label>{t('weightKg')}</label><input value={w} onChange={(e) => setW(e.target.value)} inputMode="decimal" /></div>
        <div className="field"><label>{t('heightCm')}</label><input value={h} onChange={(e) => setH(e.target.value)} inputMode="decimal" /></div>
      </div>
      <button className="btn primary" onClick={calc} style={{ width: '100%', justifyContent: 'center' }}>{t('calculate')}</button>
      {out && (
        <div className="calc-out"><div className="big-num">{out.v} <small>{t('bmiResult')} · {out.cat}</small></div></div>
      )}
    </div>
  );
}

export default function Calculators() {
  const { t } = useT();
  return (
    <div>
      <h1>{t('calculators')}</h1>
      <p className="sub">{t('macroDesc')}</p>
      <div className="grid cols-3">
        <MacroCalc />
        <OneRMCalc />
        <BmiCalc />
      </div>
    </div>
  );
}
