/** What the published build says about itself (latest.json next to the APK). */
export interface UpdateManifest {
  versionCode: number;
  versionName: string;
  apk: string;
  notes?: string;
}

export function parseManifest(raw: unknown): UpdateManifest | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  if (typeof m.versionCode !== 'number' || !Number.isInteger(m.versionCode) || m.versionCode < 1) return null;
  if (typeof m.apk !== 'string' || !/^https:\/\//.test(m.apk)) return null;
  return {
    versionCode: m.versionCode,
    versionName: typeof m.versionName === 'string' ? m.versionName : String(m.versionCode),
    apk: m.apk,
    ...(typeof m.notes === 'string' && m.notes ? { notes: m.notes } : {}),
  };
}

export function isNewer(currentCode: number, m: UpdateManifest | null): boolean {
  return !!m && m.versionCode > currentCode;
}
