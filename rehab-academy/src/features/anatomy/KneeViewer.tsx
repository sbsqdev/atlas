import { Component, forwardRef, Suspense, useEffect, useImperativeHandle, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, useGLTF, useProgress } from '@react-three/drei';
import { Color, type Mesh, type MeshStandardMaterial, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

/* Licensed knee model (BodyParts3D, CC BY 4.0) rendered with React Three
   Fiber. Mesh names in knee.glb are the structure ids used in content. */

export const MODEL_URL = `${import.meta.env.BASE_URL}models/knee.glb`;
const TARGET = new Vector3(0, 0.03, 0);
const HOME = new Vector3(0.32, 0.18, 0.95);

const BASE: Record<string, Color> = {
  bone: new Color('#E6DCC3'),
  muscle: new Color('#B85C55'),
  fascia: new Color('#C9D6D2'),
};
const SELECT = new Color('#28B8C7');
const FOUND = new Color('#16A085');
const WRONG = new Color('#D64550');

export interface ViewerHandle { zoom: (factor: number) => void; reset: () => void }
export interface ViewerProps {
  selected?: string | null;
  found?: string[];
  flash?: string | null;
  hidden?: Set<string>;
  isolated?: string | null;
  ghost?: boolean;
  autoRotate?: boolean;
  onPick?: (id: string) => void;
  onHover?: (id: string | null) => void;
  className?: string;
}

function Model({ selected, found = [], flash, hidden, isolated, ghost, onPick, onHover }: ViewerProps) {
  const { scene } = useGLTF(MODEL_URL);
  const meshes = useMemo(() => {
    const root = scene.clone(true);
    const list: Mesh[] = [];
    root.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.material = (m.material as MeshStandardMaterial).clone();
      list.push(m);
    });
    return { root, list };
  }, [scene]);

  useEffect(() => {
    for (const m of meshes.list) {
      const id = m.name;
      const group = (m.userData.group as string) ?? 'muscle';
      const mat = m.material as MeshStandardMaterial;
      m.visible = isolated ? id === isolated : !hidden?.has(id);
      const isSel = id === selected;
      const isFound = found.includes(id);
      mat.color.copy(id === flash ? WRONG : isSel ? SELECT : isFound ? FOUND : BASE[group] ?? BASE.muscle);
      mat.emissive.copy(isSel ? SELECT : isFound ? FOUND : new Color(0x000000));
      mat.emissiveIntensity = isSel ? 0.35 : isFound ? 0.25 : 0;
      const translucent = !!ghost && !isSel && !isFound;
      mat.transparent = translucent;
      mat.opacity = translucent ? (group === 'bone' ? 0.35 : 0.18) : 1;
      mat.depthWrite = !translucent;
      mat.needsUpdate = true;
    }
  }, [meshes, selected, found, flash, hidden, isolated, ghost]);

  const pick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 4) return; // a drag, not a click
    onPick?.(e.object.name);
  };
  return (
    <primitive
      object={meshes.root}
      onClick={pick}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover?.(e.object.name); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { onHover?.(null); document.body.style.cursor = ''; }}
    />
  );
}

const Controls = forwardRef<ViewerHandle, { autoRotate?: boolean }>(({ autoRotate }, ref) => {
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  useImperativeHandle(ref, () => ({
    zoom(factor) {
      const c = controls.current;
      if (!c) return;
      const offset = camera.position.clone().sub(c.target).multiplyScalar(factor);
      const len = Math.min(3, Math.max(0.25, offset.length()));
      camera.position.copy(c.target).add(offset.setLength(len));
      c.update();
    },
    reset() {
      camera.position.copy(HOME);
      controls.current?.target.copy(TARGET);
      controls.current?.update();
    },
  }), [camera]);
  return <OrbitControls ref={controls} makeDefault target={TARGET} enableDamping dampingFactor={0.12} minDistance={0.25} maxDistance={3} autoRotate={autoRotate} autoRotateSpeed={1.2} />;
});
Controls.displayName = 'Controls';

class LoadBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function Loading({ text }: { text: string }) {
  const { active, progress } = useProgress();
  if (!active) return null;
  return <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-navy-500">{text} {Math.round(progress)}%</div>;
}

export const KneeViewer = forwardRef<ViewerHandle, ViewerProps & { errorText: string; loadingText: string }>(
  ({ className, autoRotate, errorText, loadingText, ...props }, ref) => (
    <div className={className} data-testid="knee-viewer">
      <LoadBoundary fallback={<div className="grid h-full place-items-center p-6 text-center text-sm text-error">{errorText}</div>}>
        <div className="relative h-full w-full">
          <Canvas camera={{ position: HOME.toArray(), fov: 35, near: 0.01, far: 20 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
            <hemisphereLight args={['#ffffff', '#8aa1b4', 1.1]} />
            <directionalLight position={[1.5, 2, 2]} intensity={1.6} />
            <directionalLight position={[-2, 1, -1.5]} intensity={0.6} />
            <Suspense fallback={null}>
              <Model {...props} />
            </Suspense>
            <Controls ref={ref} autoRotate={autoRotate} />
          </Canvas>
          <Loading text={loadingText} />
        </div>
      </LoadBoundary>
    </div>
  ),
);
KneeViewer.displayName = 'KneeViewer';

useGLTF.preload(MODEL_URL);
