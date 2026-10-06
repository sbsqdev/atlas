import { useEffect, useState } from 'react';
import type { Atlas } from './anatomy';

/** Resolve a public asset path against Vite's base (works on subpath hosts). */
function assetUrl(u: string): string {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  return `${base}/${u.replace(/^\//, '')}`;
}

let cache: Promise<Atlas> | null = null;

/** Load and parse the atlas manifest once, with chunk URLs resolved to BASE_URL. */
function loadAtlas(): Promise<Atlas> {
  if (!cache) {
    cache = fetch(assetUrl('/models/atlas.json'))
      .then((r) => {
        if (!r.ok) throw new Error('Could not load the anatomy manifest.');
        return r.json();
      })
      .then((atlas: Atlas) => ({
        ...atlas,
        // Keep every field (incl. per-system `system`) and resolve URLs to BASE_URL.
        chunks: atlas.chunks.map((c) => ({
          ...c,
          url: assetUrl(c.url),
          gzip: c.gzip ? assetUrl(c.gzip) : undefined,
        })),
      }))
      .catch((e) => {
        cache = null; // allow retry on next mount
        throw e;
      });
  }
  return cache;
}

export interface AtlasLoad {
  atlas: Atlas | null;
  error: string | null;
}

export function useAtlas(): AtlasLoad {
  const [state, setState] = useState<AtlasLoad>({ atlas: null, error: null });
  useEffect(() => {
    let alive = true;
    loadAtlas()
      .then((atlas) => alive && setState({ atlas, error: null }))
      .catch((e) => alive && setState({ atlas: null, error: e instanceof Error ? e.message : 'Load failed.' }));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}
