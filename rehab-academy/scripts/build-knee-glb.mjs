// Builds public/models/knee.glb — a knee-region anatomy model extracted from
// BodyParts3D 4.0 (© The Database Center for Life Science, CC BY 4.0), using
// the processed chunks already shipped in ../public/models (see that folder's
// ATTRIBUTION.md). Every mesh is a real dataset structure; nothing is invented.
//
// Usage: node scripts/build-knee-glb.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..', '..', 'public', 'models');
const OUT = join(here, '..', 'public', 'models');

// Stable node id -> exact BodyParts3D structure name (right limb).
const STRUCTURES = [
  ['femur', 'Right femur', 'bone'],
  ['patella', 'Right patella', 'bone'],
  ['tibia', 'Right tibia', 'bone'],
  ['fibula', 'Right fibula', 'bone'],
  ['rectus_femoris', 'Right rectus femoris', 'muscle'],
  ['vastus_lateralis', 'Right vastus lateralis', 'muscle'],
  ['vastus_medialis', 'Right vastus medialis', 'muscle'],
  ['vastus_intermedius', 'Right vastus intermedius', 'muscle'],
  ['biceps_femoris_long', 'Long head of right biceps femoris', 'muscle'],
  ['biceps_femoris_short', 'Short head of right biceps femoris', 'muscle'],
  ['semitendinosus', 'Right semitendinosus', 'muscle'],
  ['semimembranosus', 'Right semimembranosus', 'muscle'],
  ['gastrocnemius_medial', 'Medial head of right gastrocnemius', 'muscle'],
  ['gastrocnemius_lateral', 'Lateral head of right gastrocnemius', 'muscle'],
  ['popliteus', 'Right popliteus', 'muscle'],
  ['sartorius', 'Right sartorius', 'muscle'],
  ['gracilis', 'Right gracilis', 'muscle'],
  ['iliotibial_tract', 'Right iliotibial tract', 'fascia'],
];

const atlas = JSON.parse(readFileSync(join(SRC, 'atlas.json'), 'utf8'));
const chunkCache = new Map();
function chunk(i) {
  if (!chunkCache.has(i)) {
    const c = atlas.chunks[i];
    const file = join(SRC, (c.gzip ?? c.url).split('/').pop());
    const raw = readFileSync(file);
    const buf = raw[0] === 0x1f && raw[1] === 0x8b ? gunzipSync(raw) : raw;
    chunkCache.set(i, buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  }
  return chunkCache.get(i);
}

const meshes = [];
for (const [id, name, group] of STRUCTURES) {
  const p = atlas.parts.find((x) => x.name === name);
  if (!p) throw new Error(`Structure not found in dataset: ${name}`);
  const buf = chunk(p.chunk);
  const pos = new Float32Array(buf, p.positions, p.vertexCount * 3).slice();
  const nIn = new (p.normalType === 8 ? Int8Array : Int16Array)(buf, p.normals, p.vertexCount * 3);
  const div = p.normalType === 8 ? 127 : 32767;
  const nrm = new Float32Array(nIn.length);
  for (let i = 0; i < nIn.length; i++) nrm[i] = Math.max(nIn[i] / div, -1);
  const idx = new (p.indexType === 16 ? Uint16Array : Uint32Array)(buf, p.indices, p.indexCount).slice();
  meshes.push({ id, name, group, conceptId: p.conceptId, pos, nrm, idx });
}

// Re-centre the model on the knee joint (patella centre), keep metric scale.
const pat = meshes.find((m) => m.id === 'patella').pos;
let cx = 0, cy = 0, cz = 0;
for (let i = 0; i < pat.length; i += 3) { cx += pat[i]; cy += pat[i + 1]; cz += pat[i + 2]; }
const n = pat.length / 3; cx /= n; cy /= n; cz /= n;
for (const m of meshes) for (let i = 0; i < m.pos.length; i += 3) { m.pos[i] -= cx; m.pos[i + 1] -= cy; m.pos[i + 2] -= cz; }

// ---- Write glTF 2.0 binary ----
const COLORS = { bone: [0.89, 0.86, 0.76, 1], muscle: [0.72, 0.36, 0.33, 1], fascia: [0.78, 0.84, 0.82, 1] };
const groups = Object.keys(COLORS);
const bin = [];
let offset = 0;
const bufferViews = [], accessors = [], gltfMeshes = [], nodes = [];
function push(typed, target) {
  const pad = (4 - (offset % 4)) % 4;
  if (pad) { bin.push(Buffer.alloc(pad)); offset += pad; }
  const b = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength);
  bin.push(b);
  bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: b.byteLength, target });
  offset += b.byteLength;
  return bufferViews.length - 1;
}
for (const m of meshes) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < m.pos.length; i += 3) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], m.pos[i + k]); max[k] = Math.max(max[k], m.pos[i + k]); }
  const pv = push(m.pos, 34962), nv = push(m.nrm, 34962), iv = push(m.idx, 34963);
  accessors.push({ bufferView: pv, componentType: 5126, count: m.pos.length / 3, type: 'VEC3', min, max });
  const pa = accessors.length - 1;
  accessors.push({ bufferView: nv, componentType: 5126, count: m.nrm.length / 3, type: 'VEC3' });
  const na = accessors.length - 1;
  accessors.push({ bufferView: iv, componentType: m.idx instanceof Uint16Array ? 5123 : 5125, count: m.idx.length, type: 'SCALAR' });
  const ia = accessors.length - 1;
  gltfMeshes.push({ name: m.id, primitives: [{ attributes: { POSITION: pa, NORMAL: na }, indices: ia, material: groups.indexOf(m.group) }] });
  nodes.push({ name: m.id, mesh: gltfMeshes.length - 1, extras: { sourceName: m.name, fma: m.conceptId, group: m.group } });
}
const binBuf = Buffer.concat(bin);
const gltf = {
  asset: {
    version: '2.0',
    generator: 'rehab-academy build-knee-glb',
    copyright: 'BodyParts3D, © The Database Center for Life Science, CC BY 4.0 (adapted: knee-region subset, recentred)',
  },
  scene: 0,
  scenes: [{ name: 'knee', nodes: nodes.map((_, i) => i) }],
  nodes,
  meshes: gltfMeshes,
  materials: groups.map((g) => ({ name: g, pbrMetallicRoughness: { baseColorFactor: COLORS[g], metallicFactor: 0.05, roughnessFactor: 0.6 }, doubleSided: true })),
  accessors,
  bufferViews,
  buffers: [{ byteLength: binBuf.byteLength }],
};
let json = Buffer.from(JSON.stringify(gltf));
const jpad = (4 - (json.length % 4)) % 4;
json = Buffer.concat([json, Buffer.alloc(jpad, 0x20)]);
const bpad = (4 - (binBuf.length % 4)) % 4;
const binPadded = Buffer.concat([binBuf, Buffer.alloc(bpad)]);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + json.length + 8 + binPadded.length, 8);
const jh = Buffer.alloc(8); jh.writeUInt32LE(json.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
const bh = Buffer.alloc(8); bh.writeUInt32LE(binPadded.length, 0); bh.writeUInt32LE(0x004e4942, 4);
writeFileSync(join(OUT, 'knee.glb'), Buffer.concat([header, jh, json, bh, binPadded]));

writeFileSync(join(OUT, 'ATTRIBUTION.md'), `# knee.glb attribution

BodyParts3D, © The Database Center for Life Science, licensed under CC BY 4.0
(https://creativecommons.org/licenses/by/4.0/). Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/
Publication: Mitsuhashi et al. (2009) https://doi.org/10.1093/nar/gkn613

Adaptations: subset of ${meshes.length} right lower-limb structures around the knee
(${meshes.map((m) => m.name).join('; ')}), re-centred on the patella, normals dequantized,
packed as glTF 2.0. Source processing: see the Human Atlas repository ATTRIBUTION.md.

Not included (no separate meshes exist in BodyParts3D 4.0): cruciate and collateral
ligaments, menisci, patellar ligament, quadriceps tendon. The app lists these as
structures without a licensed 3D asset. Educational use only — not a clinical tool.
`);
const verts = meshes.reduce((s, m) => s + m.pos.length / 3, 0);
console.log(`knee.glb: ${meshes.length} structures, ${verts} vertices, ${(binBuf.length / 1024).toFixed(0)} KB geometry`);
