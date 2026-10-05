import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { MuscleId } from '../types';

type Shape = 'box' | 'sphere';

interface Patch {
  shape: Shape;
  /** [x, y, z] centre */
  pos: [number, number, number];
  /** box → [w, h, d]; sphere → [r] */
  size: number[];
  /** also render the mirror image at -x */
  mirror?: boolean;
}

/**
 * Approximate placement of each muscle region on a stylised figure that faces
 * +Z. Front-of-body muscles sit at positive z, back muscles at negative z, so
 * rotating the model reveals the right group.
 */
const MUSCLE_PATCHES: Record<MuscleId, Patch[]> = {
  traps: [{ shape: 'box', pos: [0, 2.02, -0.24], size: [0.78, 0.4, 0.14] }],
  shoulders: [{ shape: 'sphere', pos: [0.78, 2.08, 0], size: [0.27], mirror: true }],
  chest: [{ shape: 'box', pos: [0.3, 1.9, 0.26], size: [0.5, 0.48, 0.14], mirror: true }],
  lats: [{ shape: 'box', pos: [0.44, 1.5, -0.2], size: [0.3, 0.72, 0.16], mirror: true }],
  biceps: [{ shape: 'box', pos: [0.96, 1.62, 0.1], size: [0.24, 0.72, 0.16], mirror: true }],
  triceps: [{ shape: 'box', pos: [0.96, 1.62, -0.1], size: [0.24, 0.72, 0.16], mirror: true }],
  forearms: [{ shape: 'box', pos: [1.08, 0.62, 0], size: [0.22, 0.86, 0.22], mirror: true }],
  abs: [{ shape: 'box', pos: [0, 1.26, 0.27], size: [0.52, 0.74, 0.12] }],
  obliques: [{ shape: 'box', pos: [0.5, 1.2, 0.2], size: [0.18, 0.64, 0.22], mirror: true }],
  lowerBack: [{ shape: 'box', pos: [0, 0.95, -0.26], size: [0.54, 0.56, 0.12] }],
  glutes: [{ shape: 'sphere', pos: [0.3, 0.28, -0.22], size: [0.31], mirror: true }],
  quads: [{ shape: 'box', pos: [0.33, -0.72, 0.17], size: [0.42, 1.34, 0.2], mirror: true }],
  hamstrings: [{ shape: 'box', pos: [0.33, -0.72, -0.17], size: [0.42, 1.34, 0.2], mirror: true }],
  adductors: [{ shape: 'box', pos: [0.15, -0.64, 0.05], size: [0.18, 1.04, 0.24], mirror: true }],
  abductors: [{ shape: 'box', pos: [0.54, -0.1, 0], size: [0.18, 0.64, 0.34], mirror: true }],
  calves: [{ shape: 'box', pos: [0.33, -2.3, -0.12], size: [0.3, 1.02, 0.18], mirror: true }],
};

type PatchState = 'primary' | 'secondary' | 'off';

const STYLE: Record<PatchState, { color: string; emissive: string; intensity: number; opacity: number }> = {
  primary: { color: '#f97316', emissive: '#ea580c', intensity: 0.6, opacity: 1 },
  secondary: { color: '#fbbf24', emissive: '#b45309', intensity: 0.4, opacity: 0.92 },
  off: { color: '#9aa6b8', emissive: '#000000', intensity: 0, opacity: 0.5 },
};
const BODY = '#e2e8f0';

function PatchMesh({ patch, state }: { patch: Patch; state: PatchState }) {
  const positions: [number, number, number][] = patch.mirror
    ? [patch.pos, [-patch.pos[0], patch.pos[1], patch.pos[2]]]
    : [patch.pos];
  const s = STYLE[state];

  return (
    <>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos}>
          {patch.shape === 'box' ? (
            <boxGeometry args={[patch.size[0], patch.size[1], patch.size[2]]} />
          ) : (
            <sphereGeometry args={[patch.size[0], 20, 20]} />
          )}
          <meshStandardMaterial
            color={s.color}
            emissive={s.emissive}
            emissiveIntensity={s.intensity}
            roughness={0.55}
            metalness={0.05}
            transparent
            opacity={s.opacity}
          />
        </mesh>
      ))}
    </>
  );
}

/** Neutral mannequin that gives the figure its silhouette. */
function Mannequin() {
  const mat = (
    <meshStandardMaterial color={BODY} roughness={0.85} metalness={0} />
  );
  return (
    <group>
      {/* head */}
      <mesh position={[0, 2.78, 0]}>
        <sphereGeometry args={[0.42, 24, 24]} />
        {mat}
      </mesh>
      {/* neck */}
      <mesh position={[0, 2.35, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.3, 16]} />
        {mat}
      </mesh>
      {/* torso */}
      <mesh position={[0, 1.45, 0]}>
        <boxGeometry args={[1.1, 1.7, 0.5]} />
        {mat}
      </mesh>
      {/* pelvis */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[1.0, 0.7, 0.48]} />
        {mat}
      </mesh>
      {/* upper arms */}
      {[1, -1].map((s) => (
        <mesh key={`ua${s}`} position={[s * 0.96, 1.62, 0]}>
          <cylinderGeometry args={[0.17, 0.15, 1.0, 16]} />
          {mat}
        </mesh>
      ))}
      {/* forearms */}
      {[1, -1].map((s) => (
        <mesh key={`fa${s}`} position={[s * 1.08, 0.62, 0]}>
          <cylinderGeometry args={[0.13, 0.11, 0.95, 16]} />
          {mat}
        </mesh>
      ))}
      {/* thighs */}
      {[1, -1].map((s) => (
        <mesh key={`th${s}`} position={[s * 0.33, -0.72, 0]}>
          <cylinderGeometry args={[0.28, 0.22, 1.5, 18]} />
          {mat}
        </mesh>
      ))}
      {/* shins */}
      {[1, -1].map((s) => (
        <mesh key={`sh${s}`} position={[s * 0.33, -2.3, 0]}>
          <cylinderGeometry args={[0.2, 0.13, 1.4, 16]} />
          {mat}
        </mesh>
      ))}
    </group>
  );
}

function Figure({
  primary,
  secondary,
  targetY,
}: {
  primary: Set<MuscleId>;
  secondary: Set<MuscleId>;
  targetY: number;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    // Ease the model toward the requested front/back orientation.
    g.rotation.y += (targetY - g.rotation.y) * 0.12;
  });

  const patches = useMemo(
    () => Object.entries(MUSCLE_PATCHES) as [MuscleId, Patch[]][],
    [],
  );

  return (
    <group ref={group}>
      <Mannequin />
      {patches.map(([id, list]) => {
        const state: PatchState = primary.has(id)
          ? 'primary'
          : secondary.has(id)
            ? 'secondary'
            : 'off';
        return list.map((patch, i) => (
          <PatchMesh key={`${id}-${i}`} patch={patch} state={state} />
        ));
      })}
    </group>
  );
}

export interface MuscleModelProps {
  primary: MuscleId[];
  secondary: MuscleId[];
  /** 'front' | 'back' — orientation the model eases toward. */
  view: 'front' | 'back';
}

export default function MuscleModel({ primary, secondary, view }: MuscleModelProps) {
  const primarySet = useMemo(() => new Set(primary), [primary]);
  const secondarySet = useMemo(() => new Set(secondary), [secondary]);
  const targetY = view === 'front' ? 0 : Math.PI;

  return (
    <Canvas camera={{ position: [0, 0.3, 7], fov: 42 }} dpr={[1, 2]}>
      <color attach="background" args={['#0b1120']} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 6]} intensity={1.1} />
      <directionalLight position={[-4, 2, -6]} intensity={0.5} />
      <Suspense fallback={null}>
        <Figure primary={primarySet} secondary={secondarySet} targetY={targetY} />
      </Suspense>
      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={11}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
