import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Anchor, Exercise, Joint, Pose, Prop, Segment } from './library';

/* A simple articulated figure animated from the exercise's key poses. Every
   frame the joint angles are interpolated, then the whole body is shifted so
   the anchor points stay on the floor (or the lowest point rests on it). */

const BODY = '#8EA3B8';
const FOCUS = '#18B6C6';
const DARK = '#3E5871';
const D2R = Math.PI / 180;

type Refs = Partial<Record<Joint | Anchor | 'pelvisPt' | 'chest' | 'headTop', THREE.Object3D | null>>;

function Bone({ to, r, color, from = [0, 0, 0] }: { to: [number, number, number]; r: number; color: string; from?: [number, number, number] }) {
  const { pos, quat, len } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { pos: a.add(b).multiplyScalar(0.5), quat: q, len: dir.length() };
  }, [from, to]);
  return (
    <mesh position={pos} quaternion={quat} castShadow>
      <capsuleGeometry args={[r, len, 6, 14]} />
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.05} />
    </mesh>
  );
}

function Ball({ r, color, position }: { r: number; color: string; position?: [number, number, number] }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[r, 20, 16]} />
      <meshStandardMaterial color={color} roughness={0.55} />
    </mesh>
  );
}

const ease = (x: number) => x * x * (3 - 2 * x);

/** Joint angles at time t (seconds) of the looped key sequence. */
function poseAt(ex: Exercise, t: number): { pose: Pose; loop: number } {
  const total = ex.keys.reduce((s, k) => s + k.move + (k.hold ?? 0), 0);
  const loop = Math.floor(t / total);
  let x = t - loop * total;
  for (let i = 0; i < ex.keys.length; i++) {
    const k = ex.keys[i];
    const prev = ex.keys[(i - 1 + ex.keys.length) % ex.keys.length];
    if (x < k.move) {
      const f = ease(x / k.move);
      const out: Pose = {};
      const joints = new Set([...Object.keys(prev.pose), ...Object.keys(k.pose)]) as Set<Joint>;
      joints.forEach((j) => {
        const a = prev.pose[j] ?? [0, 0, 0];
        const b = k.pose[j] ?? [0, 0, 0];
        out[j] = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
      });
      return { pose: out, loop };
    }
    x -= k.move;
    if (x < (k.hold ?? 0)) return { pose: k.pose, loop };
    x -= k.hold ?? 0;
  }
  return { pose: ex.keys[0].pose, loop };
}

const JOINTS: Joint[] = ['root', 'spine', 'head', 'lShoulder', 'lElbow', 'rShoulder', 'rElbow', 'lHip', 'lKnee', 'lAnkle', 'rHip', 'rKnee', 'rAnkle'];
// Points that can touch the floor, with the radius of the body around them.
const CONTACT: [keyof Refs, number][] = [
  ['pelvisPt', 0.11], ['chest', 0.13], ['headTop', 0.1], ['head', 0.1], ['lShoulder', 0.07], ['rShoulder', 0.07], ['lElbow', 0.045], ['rElbow', 0.045],
  ['lHand', 0.045], ['rHand', 0.045], ['lKnee', 0.06], ['rKnee', 0.06], ['lAnkle', 0.05], ['rAnkle', 0.05], ['lToe', 0.035], ['rToe', 0.035], ['lHeel', 0.04], ['rHeel', 0.04],
];

export default function Figure({ ex, playing, speed, onRep }: { ex: Exercise; playing: boolean; speed: number; onRep?: (n: number) => void }) {
  const refs = useRef<Refs>({});
  const set = (k: keyof Refs) => (o: THREE.Object3D | null) => { refs.current[k] = o; };
  const clock = useRef(0);
  const lastLoop = useRef(0);
  const band = useMemo(() => new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#E4572E' })), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const color = (s: Segment) => (ex.focus.includes(s) ? FOCUS : BODY);

  useFrame((_, dt) => {
    if (playing) clock.current += Math.min(dt, 0.1) * speed;
    // Tests can freeze the animation at a given second through window.__exerciseTime.
    const fixed = (window as { __exerciseTime?: number }).__exerciseTime;
    const { pose, loop } = poseAt(ex, fixed ?? clock.current);
    if (loop !== lastLoop.current) { lastLoop.current = loop; onRep?.(loop); }
    const r = refs.current;
    for (const j of JOINTS) {
      const a = pose[j] ?? [0, 0, 0];
      r[j]?.rotation.set(a[0] * D2R, a[1] * D2R, a[2] * D2R);
    }
    const root = r.root!;
    root.position.set(0, 1, 0);
    root.updateMatrixWorld(true);
    // Pin the anchors in x/z, then set the height.
    const ax = { x: 0, y: 0, z: 0 };
    for (const a of ex.anchors) { r[a]!.getWorldPosition(v); ax.x += v.x; ax.y += v.y; ax.z += v.z; }
    ax.x /= ex.anchors.length; ax.y /= ex.anchors.length; ax.z /= ex.anchors.length;
    let dy: number;
    if (ex.ground === 'min') {
      let min = Infinity;
      for (const [k, rad] of CONTACT) { const o = r[k]; if (!o) continue; o.getWorldPosition(v); min = Math.min(min, v.y - rad); }
      dy = -min;
    } else dy = ex.ground - ax.y;
    root.position.set(-ax.x, 1 + dy, -ax.z);
    root.updateMatrixWorld(true);
    // Resistance band from the hand to its fixed point.
    const bandProp = ex.props?.find((p): p is Extract<Prop, { kind: 'band' }> => p.kind === 'band');
    if (bandProp) {
      r[bandProp.from]!.getWorldPosition(v);
      band.geometry.setFromPoints([v.clone(), new THREE.Vector3(...bandProp.to)]);
    }
  });

  return (
    <group>
      <group ref={set('root')}>
        {/* Pelvis */}
        <Bone from={[-0.11, -0.02, 0]} to={[0.11, -0.02, 0]} r={0.1} color={color('pelvis')} />
        <object3D ref={set('pelvisPt')} position={[0, -0.05, 0]} />
        {/* Spine, chest, head */}
        <group ref={set('spine')} position={[0, 0.05, 0]}>
          <Bone to={[0, 0.24, 0]} r={0.11} color={color('torso')} />
          <Bone from={[0, 0.22, 0]} to={[0, 0.4, 0]} r={0.135} color={color('torso')} />
          <Bone from={[-0.17, 0.43, 0]} to={[0.17, 0.43, 0]} r={0.06} color={color('torso')} />
          <object3D ref={set('chest')} position={[0, 0.3, 0]} />
          <group ref={set('head')} position={[0, 0.5, 0]}>
            <Bone to={[0, 0.08, 0]} r={0.045} color={BODY} />
            <Ball r={0.1} color={DARK} position={[0, 0.17, 0.01]} />
            <Ball r={0.025} color={FOCUS} position={[0, 0.17, 0.105]} />
            <object3D ref={set('headTop')} position={[0, 0.17, 0]} />
          </group>
          {(['l', 'r'] as const).map((s) => (
            <group key={s} ref={set(`${s}Shoulder`)} position={[s === 'l' ? 0.2 : -0.2, 0.43, 0]}>
              <Ball r={0.055} color={BODY} />
              <Bone to={[0, -0.28, 0]} r={0.045} color={color(`${s}UpperArm`)} />
              <group ref={set(`${s}Elbow`)} position={[0, -0.28, 0]}>
                <Bone to={[0, -0.25, 0]} r={0.038} color={color(`${s}Forearm`)} />
                <Ball r={0.045} color={DARK} position={[0, -0.29, 0]} />
                <object3D ref={set(`${s}Hand`)} position={[0, -0.29, 0]} />
              </group>
            </group>
          ))}
        </group>
        {/* Legs */}
        {(['l', 'r'] as const).map((s) => (
          <group key={s} ref={set(`${s}Hip`)} position={[s === 'l' ? 0.1 : -0.1, -0.03, 0]}>
            <Bone to={[0, -0.44, 0]} r={0.07} color={color(`${s}Thigh`)} />
            <group ref={set(`${s}Knee`)} position={[0, -0.44, 0]}>
              <Ball r={0.06} color={BODY} />
              <Bone to={[0, -0.42, 0]} r={0.055} color={color(`${s}Shin`)} />
              <group ref={set(`${s}Ankle`)} position={[0, -0.42, 0]}>
                <Bone from={[0, -0.045, -0.05]} to={[0, -0.05, 0.16]} r={0.042} color={ex.focus.includes(`${s}Foot`) ? FOCUS : DARK} />
                <object3D ref={set(`${s}Toe`)} position={[0, -0.05, 0.17]} />
                <object3D ref={set(`${s}Heel`)} position={[0, -0.045, -0.06]} />
              </group>
            </group>
          </group>
        ))}
      </group>
      {ex.props?.some((p) => p.kind === 'band') && <primitive object={band} />}
    </group>
  );
}

/** Chairs, steps, walls and mats around the figure. */
export function Props({ ex }: { ex: Exercise }) {
  return (
    <>
      {ex.props?.map((p, i) => {
        if (p.kind === 'chair') return (
          <group key={i} position={[0, 0, p.z]}>
            <mesh position={[0, 0.4, 0]} castShadow receiveShadow><boxGeometry args={[0.44, 0.04, 0.42]} /><meshStandardMaterial color="#B98B5E" /></mesh>
            <mesh position={[0, 0.66, -0.2]} castShadow><boxGeometry args={[0.44, 0.48, 0.035]} /><meshStandardMaterial color="#B98B5E" /></mesh>
            {[[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]].map(([x, z]) => (
              <mesh key={`${x}${z}`} position={[x, 0.2, z]}><cylinderGeometry args={[0.018, 0.018, 0.4]} /><meshStandardMaterial color="#8A6440" /></mesh>
            ))}
          </group>
        );
        if (p.kind === 'box') return (
          <mesh key={i} position={[p.x, p.h / 2, p.z]} castShadow receiveShadow><boxGeometry args={[p.w, p.h, p.d]} /><meshStandardMaterial color="#94A3B8" /></mesh>
        );
        if (p.kind === 'wall') return (
          <mesh key={i} position={[0, 1.2, p.z]} receiveShadow><boxGeometry args={[3, 2.4, 0.04]} /><meshStandardMaterial color="#DCE5EE" /></mesh>
        );
        if (p.kind === 'mat') return null;
        if (p.kind === 'band') return (
          <mesh key={i} position={p.to}><cylinderGeometry args={[0.025, 0.025, 2 * p.to[1]]} /><meshStandardMaterial color="#64748B" /></mesh>
        );
        return null;
      })}
    </>
  );
}
