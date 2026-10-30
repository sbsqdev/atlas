import { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useLang } from '@/features/forms/SiteForm';
import { cn } from '@/lib/cn';
import Figure, { Props } from './Figure';
import type { Exercise } from './library';

type View = 'main' | 'side' | 'front';

function CameraView({ ex, view, nonce }: { ex: Exercise; view: View; nonce: number }) {
  const { camera } = useThree();
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  useEffect(() => {
    const target = ex.camera?.target ?? [0, 0.85, 0];
    const main = ex.camera?.pos ?? [2.3, 1.45, 2.9];
    const pos: [number, number, number] = view === 'side' ? [target[0] + 3.1, target[1] + 0.25, target[2]] : view === 'front' ? [target[0], target[1] + 0.3, target[2] + 3.2] : main;
    camera.position.set(...pos);
    controls?.target.set(...target);
    controls?.update();
  }, [ex, view, nonce, camera, controls]);
  return null;
}

const T = {
  ru: { play: 'Пуск', pause: 'Пауза', main: '3/4', side: 'Сбоку', front: 'Спереди', reps: 'Повтор', slow: 'Медленно', reset: 'Сбросить вид', drag: 'Крутите мышкой или пальцем' },
  kk: { play: 'Бастау', pause: 'Кідірту', main: '3/4', side: 'Бүйірден', front: 'Алдынан', reps: 'Қайталау', slow: 'Баяу', reset: 'Көріністі қайтару', drag: 'Тышқанмен не саусақпен айналдырыңыз' },
};

/** 3D figure performing the exercise, with play/pause, speed and camera views. */
export default function ExercisePlayer({ ex, className }: { ex: Exercise; className?: string }) {
  const lang = useLang();
  const c = T[lang];
  const [playing, setPlaying] = useState(true);
  const [slow, setSlow] = useState(false);
  const [view, setView] = useState<View>('main');
  const [nonce, setNonce] = useState(0);
  const [rep, setRep] = useState(1);
  const key = useRef(ex.id);
  useEffect(() => { if (key.current !== ex.id) { key.current = ex.id; setRep(1); setView('main'); } }, [ex.id]);

  const btn = 'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors';
  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#EAF2F7] to-[#D6E3EC]', className)} data-testid="exercise-player" data-exercise={ex.id}>
      <Canvas key={ex.id} shadows dpr={[1, 2]} camera={{ fov: 38, near: 0.05, far: 30, position: [2.1, 1.35, 2.5] }} gl={{ preserveDrawingBuffer: true }}>
        <hemisphereLight args={['#ffffff', '#9fb3c8', 0.9]} />
        <directionalLight position={[2.5, 4, 2.5]} intensity={1.3} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-2} shadow-camera-right={2} shadow-camera-top={2} shadow-camera-bottom={-2} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[2.6, 48]} />
          <meshStandardMaterial color="#F4F7FA" />
        </mesh>
        <gridHelper args={[5, 20, '#C5D3E0', '#DCE5EE']} position={[0, 0.001, 0]} />
        <Props ex={ex} />
        <Figure ex={ex} playing={playing} speed={slow ? 0.5 : 1} onRep={(n) => setRep(n + 1)} />
        <OrbitControls makeDefault enablePan={false} minDistance={1.2} maxDistance={6} maxPolarAngle={Math.PI / 2 - 0.02} />
        <CameraView ex={ex} view={view} nonce={nonce} />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
        <span className="rounded-full bg-white/85 px-3 py-1 text-[12.5px] font-semibold text-navy shadow-sm" data-testid="exercise-rep">{c.reps} {rep}</span>
        <span className="hidden rounded-full bg-white/70 px-3 py-1 text-[12px] text-navy-500 sm:block">{c.drag}</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 p-3">
        <button type="button" onClick={() => setPlaying((p) => !p)} className={cn(btn, 'bg-navy text-white')} data-testid="exercise-play">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {playing ? c.pause : c.play}
        </button>
        <button type="button" onClick={() => setSlow((x) => !x)} aria-pressed={slow} className={cn(btn, slow ? 'bg-teal text-white' : 'bg-white/90 text-navy')}>{c.slow} ×0.5</button>
        <span className="ml-auto flex gap-1 rounded-full bg-white/90 p-1">
          {(['main', 'side', 'front'] as View[]).map((vw) => (
            <button key={vw} type="button" onClick={() => { setView(vw); setNonce((n) => n + 1); }} className={cn('rounded-full px-2.5 py-1 text-[12.5px] font-semibold', view === vw ? 'bg-navy text-white' : 'text-navy-500')} data-testid={`exercise-view-${vw}`}>{c[vw]}</button>
          ))}
          <button type="button" onClick={() => setNonce((n) => n + 1)} aria-label={c.reset} className="rounded-full px-2 text-navy-500"><RotateCcw className="h-3.5 w-3.5" /></button>
        </span>
      </div>
    </div>
  );
}
