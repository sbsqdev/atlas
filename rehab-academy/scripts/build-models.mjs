// Builds public/models/{knee,foot}.glb — regional anatomy models extracted from
// BodyParts3D 4.0 (© The Database Center for Life Science, CC BY 4.0), using
// the processed chunks already shipped in ../public/models (see that folder's
// ATTRIBUTION.md). Every mesh is a real dataset structure; nothing is invented.
//
// Usage: node scripts/build-models.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..', '..', 'public', 'models');
const OUT = join(here, '..', 'public', 'models');

// Each model: stable node id -> BodyParts3D structure name(s) (right limb).
// Several names under one id are merged into a single node (e.g. all metatarsals).
const MODELS = {
  knee: {
    centre: 'patella',
    label: 'around the knee',
    missing: 'cruciate and collateral ligaments, menisci, patellar ligament, quadriceps tendon',
    parts: [
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
    ],
  },
  foot: {
    centre: 'talus',
    label: 'of the leg, ankle and foot',
    missing: 'plantar aponeurosis (plantar fascia), ankle ligaments',
    parts: [
      ['tibia', 'Right tibia', 'bone'],
      ['fibula', 'Right fibula', 'bone'],
      ['talus', 'Right talus', 'bone'],
      ['calcaneus', 'Right calcaneus', 'bone'],
      ['navicular', 'Navicular bone of right foot', 'bone'],
      ['cuboid', 'Right cuboid bone', 'bone'],
      ['cuneiforms', ['Right medial cuneiform bone', 'Right intermediate cuneiform bone', 'Right lateral cuneiform bone'], 'bone'],
      ['metatarsals', ['Right first metatarsal bone', 'Right second metatarsal bone', 'Right third metatarsal bone', 'Right fourth metatarsal bone', 'Right fifth metatarsal bone'], 'bone'],
      ['phalanges', /phalanx of right (big|second|third|fourth|little) toe$/i, 'bone'],
      ['gastrocnemius_medial', 'Medial head of right gastrocnemius', 'muscle'],
      ['gastrocnemius_lateral', 'Lateral head of right gastrocnemius', 'muscle'],
      ['soleus', 'Right soleus', 'muscle'],
      ['calcaneal_tendon', 'Right calcaneal tendon', 'fascia'],
      ['tibialis_anterior', 'Right tibialis anterior', 'muscle'],
      ['tibialis_posterior', 'Right tibialis posterior', 'muscle'],
      ['fibularis_longus', 'Right fibularis longus', 'muscle'],
      ['fibularis_brevis', 'Right fibularis brevis', 'muscle'],
      ['extensor_digitorum_longus', 'Right extensor digitorum longus', 'muscle'],
      ['extensor_hallucis_longus', 'Right extensor hallucis longus', 'muscle'],
      ['flexor_digitorum_longus', 'Right flexor digitorum longus', 'muscle'],
      ['flexor_hallucis_longus', 'Right flexor hallucis longus', 'muscle'],
      ['abductor_hallucis', 'Right abductor hallucis', 'muscle'],
      ['flexor_digitorum_brevis', 'Right flexor digitorum brevis', 'muscle'],
      ['long_plantar_ligament', 'Right long plantar ligament', 'fascia'],
    ],
  },
};

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

function readPart(p) {
  const buf = chunk(p.chunk);
  const pos = new Float32Array(buf, p.positions, p.vertexCount * 3).slice();
  const nIn = new (p.normalType === 8 ? Int8Array : Int16Array)(buf, p.normals, p.vertexCount * 3);
  const div = p.normalType === 8 ? 127 : 32767;
  const nrm = new Float32Array(nIn.length);
  for (let i = 0; i < nIn.length; i++) nrm[i] = Math.max(nIn[i] / div, -1);
  const idx = new Uint32Array(new (p.indexType === 16 ? Uint16Array : Uint32Array)(buf, p.indices, p.indexCount));
  return { pos, nrm, idx };
}

/** Concatenates several dataset parts into one mesh. */
function mergeParts(parts) {
  const total = parts.reduce((s, x) => s + x.pos.length, 0);
  const pos = new Float32Array(total), nrm = new Float32Array(total);
  const idx = new Uint32Array(parts.reduce((s, x) => s + x.idx.length, 0));
  let v = 0, k = 0;
  for (const x of parts) {
    pos.set(x.pos, v); nrm.set(x.nrm, v);
    for (let i = 0; i < x.idx.length; i++) idx[k + i] = x.idx[i] + v / 3;
    v += x.pos.length; k += x.idx.length;
  }
  return { pos, nrm, idx: v / 3 < 65536 ? Uint16Array.from(idx) : idx };
}

function buildModel(name, def) {
  const meshes = [];
  for (const [id, source, group] of def.parts) {
    const found = source instanceof RegExp ? atlas.parts.filter((x) => source.test(x.name))
      : (Array.isArray(source) ? source : [source]).map((n) => atlas.parts.find((x) => x.name === n));
    if (!found.length || found.some((x) => !x)) throw new Error(`${name}: structure not found in dataset: ${source}`);
    const geo = mergeParts(found.map(readPart));
    meshes.push({ id, group, names: found.map((x) => x.name), conceptIds: found.map((x) => x.conceptId), ...geo });
  }

  // Re-centre the model on its anchor structure, keep metric scale.
  const anchor = meshes.find((m) => m.id === def.centre).pos;
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < anchor.length; i += 3) { cx += anchor[i]; cy += anchor[i + 1]; cz += anchor[i + 2]; }
  const n = anchor.length / 3; cx /= n; cy /= n; cz /= n;
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
    nodes.push({ name: m.id, mesh: gltfMeshes.length - 1, extras: { sourceNames: m.names, fma: m.conceptIds, group: m.group } });
  }
  const binBuf = Buffer.concat(bin);
  const gltf = {
    asset: {
      version: '2.0',
      generator: 'rehab-academy build-models',
      copyright: `BodyParts3D, © The Database Center for Life Science, CC BY 4.0 (adapted: ${name} subset, recentred)`,
    },
    scene: 0,
    scenes: [{ name, nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes: gltfMeshes,
    materials: groups.map((g) => ({ name: g, pbrMetallicRoughness: { baseColorFactor: COLORS[g], metallicFactor: 0.05, roughnessFactor: 0.6 }, doubleSided: true })),
    accessors,
    bufferViews,
    buffers: [{ byteLength: binBuf.byteLength }],
  };
  let json = Buffer.from(JSON.stringify(gltf));
  json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
  const binPadded = Buffer.concat([binBuf, Buffer.alloc((4 - (binBuf.length % 4)) % 4)]);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + json.length + 8 + binPadded.length, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(json.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(binPadded.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  writeFileSync(join(OUT, `${name}.glb`), Buffer.concat([header, jh, json, bh, binPadded]));
  const verts = meshes.reduce((s, m) => s + m.pos.length / 3, 0);
  console.log(`${name}.glb: ${meshes.length} structures, ${verts} vertices, ${(binBuf.length / 1024).toFixed(0)} KB geometry`);
  return `## ${name}.glb\n\nSubset of ${meshes.length} right lower-limb structures ${def.label}\n(${meshes.flatMap((m) => m.names).join('; ')}),\nre-centred on the ${def.centre}, normals dequantized, packed as glTF 2.0.\n\nNot included (no separate meshes exist in BodyParts3D 4.0): ${def.missing}.\nThe app lists these as structures without a licensed 3D asset.\n`;
}

const sections = Object.entries(MODELS).map(([name, def]) => buildModel(name, def));
writeFileSync(join(OUT, 'ATTRIBUTION.md'), `# 3D model attribution

BodyParts3D, © The Database Center for Life Science, licensed under CC BY 4.0
(https://creativecommons.org/licenses/by/4.0/). Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/
Publication: Mitsuhashi et al. (2009) https://doi.org/10.1093/nar/gkn613

Source processing: see the Human Atlas repository ATTRIBUTION.md. Educational use only — not a clinical tool.

${sections.join('\n')}`);
