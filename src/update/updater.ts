import { File, Paths } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { Linking, Platform } from 'react-native';
import { parseManifest, type UpdateManifest } from './version';

const DEFAULT_MANIFEST = 'https://github.com/rippipupil/scrollifyDND/releases/latest/download/latest.json';

/** Build number inlined into the bundle at build time (CI's run number); 1 for local/dev builds. */
export function currentBuild(): number {
  return Number(process.env.EXPO_PUBLIC_APP_BUILD) || 1;
}

export function currentVersion(): string {
  return `1.0.${currentBuild()}`;
}

/** Reads latest.json published next to the APK. Null when offline, unreachable or malformed. */
export async function fetchManifest(): Promise<UpdateManifest | null> {
  const url = process.env.EXPO_PUBLIC_UPDATE_MANIFEST_URL || DEFAULT_MANIFEST;
  try {
    const res = await fetch(`${url}?t=${Date.now()}`);
    if (!res.ok) return null;
    return parseManifest(await res.json());
  } catch {
    return null;
  }
}

/** Downloads the APK and hands it to Android's package installer (keeps the app's data). */
export async function downloadAndInstall(m: UpdateManifest, onProgress: (fraction: number) => void): Promise<void> {
  if (Platform.OS !== 'android') {
    await Linking.openURL(m.apk);
    return;
  }
  const dest = new File(Paths.cache, `scrollify-${m.versionCode}.apk`);
  if (dest.exists) dest.delete();
  const file = await File.downloadFileAsync(m.apk, dest, {
    idempotent: true,
    onProgress: (p) => onProgress(p.totalBytes > 0 ? p.bytesWritten / p.totalBytes : 0),
  });
  onProgress(1);
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: file.contentUri,
    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
    type: 'application/vnd.android.package-archive',
  });
}
