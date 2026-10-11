import type { ContentEntry } from '../content/types';
import { uid } from '../rules/core';
import type { Character } from '../rules/types';
import { migrateCharacter } from '../store/migrations';

export type BundleKind = 'character' | 'homebrew';
export type Decoded =
  | { ok: true; kind: 'character'; payload: Character }
  | { ok: true; kind: 'homebrew'; payload: ContentEntry[] }
  | { ok: false; error: 'invalid' };

const PREFIX = 'SCRL1:';
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function utf8Encode(s: string): number[] {
  const out: number[] = [];
  for (const ch of s) {
    let cp = ch.codePointAt(0)!;
    if (cp < 0x80) out.push(cp);
    else if (cp < 0x800) out.push(0xc0 | (cp >> 6), 0x80 | (cp & 63));
    else if (cp < 0x10000) out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
    else out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
  }
  return out;
}

function utf8Decode(bytes: number[]): string {
  let s = '';
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i];
    let cp: number;
    if (b < 0x80) (cp = b), (i += 1);
    else if (b < 0xe0) (cp = ((b & 31) << 6) | (bytes[i + 1] & 63)), (i += 2);
    else if (b < 0xf0) (cp = ((b & 15) << 12) | ((bytes[i + 1] & 63) << 6) | (bytes[i + 2] & 63)), (i += 3);
    else (cp = ((b & 7) << 18) | ((bytes[i + 1] & 63) << 12) | ((bytes[i + 2] & 63) << 6) | (bytes[i + 3] & 63)), (i += 4);
    s += String.fromCodePoint(cp);
  }
  return s;
}

/** URL-safe base64 of the UTF-8 bytes, without padding. */
export function toBase64(s: string): string {
  const b = utf8Encode(s);
  let out = '';
  for (let i = 0; i < b.length; i += 3) {
    const n = (b[i] << 16) | ((b[i + 1] ?? 0) << 8) | (b[i + 2] ?? 0);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    if (i + 1 < b.length) out += B64[(n >> 6) & 63];
    if (i + 2 < b.length) out += B64[n & 63];
  }
  return out;
}

export function fromBase64(s: string): string {
  const clean = s.replace(/[\s=]/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const v = [0, 1, 2, 3].map((k) => (i + k < clean.length ? B64.indexOf(clean[i + k]) : -2));
    if (v.some((x) => x === -1)) throw new Error('bad base64');
    const n = (v[0] << 18) | (v[1] << 12) | (Math.max(v[2], 0) << 6) | Math.max(v[3], 0);
    bytes.push((n >> 16) & 255);
    if (v[2] >= 0) bytes.push((n >> 8) & 255);
    if (v[3] >= 0) bytes.push(n & 255);
  }
  return utf8Decode(bytes);
}

export function encodeBundle(kind: BundleKind, payload: unknown, format: 'code' | 'json' = 'code'): string {
  const json = JSON.stringify({ app: 'scrollify', kind, v: 1, payload });
  return format === 'json' ? json : PREFIX + toBase64(json);
}

function isEntry(e: any): e is ContentEntry {
  return e && typeof e.id === 'string' && typeof e.category === 'string' && e.name && typeof e.name.en === 'string';
}

export function decodeBundle(text: string): Decoded {
  try {
    const trimmed = text.trim();
    const json = trimmed.startsWith(PREFIX) ? fromBase64(trimmed.slice(PREFIX.length)) : trimmed;
    const obj = JSON.parse(json);
    if (!obj || obj.app !== 'scrollify' || obj.v !== 1) return { ok: false, error: 'invalid' };
    if (obj.kind === 'character') return { ok: true, kind: 'character', payload: migrateCharacter(obj.payload) };
    if (obj.kind === 'homebrew' && Array.isArray(obj.payload) && obj.payload.every(isEntry)) {
      return { ok: true, kind: 'homebrew', payload: obj.payload };
    }
  } catch {
    // fall through
  }
  return { ok: false, error: 'invalid' };
}

export function prepareCharacterImport(c: Character, existingIds: Set<string>): Character {
  const now = Date.now();
  return existingIds.has(c.id) ? { ...c, id: uid('char'), updatedAt: now } : { ...c, updatedAt: now };
}
