import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { encodeBundle, type BundleKind } from './codec';

function safeName(s: string): string {
  return (s || 'scrollify').replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 40);
}

/** Shares a bundle as a `.scrollify.json` file (download on web). */
export async function shareBundleFile(kind: BundleKind, payload: unknown, baseName: string): Promise<void> {
  const json = encodeBundle(kind, payload, 'json');
  const filename = `${safeName(baseName)}.scrollify.json`;
  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: filename });
}

export async function copyText(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
}

/** Lets the user pick a file and returns its text, or null if cancelled. */
export async function pickBundleText(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  if (Platform.OS === 'web') {
    if (asset.file) return await asset.file.text();
    return await (await fetch(asset.uri)).text();
  }
  return await new File(asset.uri).text();
}

export const QR_MAX_CHARS = 2000;
