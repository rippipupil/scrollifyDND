import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/** Portraits are stored inside the character as a small square JPEG, so backups and shared sheets carry them. */
export const PORTRAIT_SIZE = 256;

/** Lets the player take or pick a photo, crops it square and returns it as a data URI (null if cancelled or denied). */
export async function pickPortrait(source: 'camera' | 'library'): Promise<string | null> {
  const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 };
  const res = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (res.canceled || !res.assets?.length) return null;
  const image = await ImageManipulator.manipulate(res.assets[0].uri).resize({ width: PORTRAIT_SIZE, height: PORTRAIT_SIZE }).renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  return saved.base64 ? `data:image/jpeg;base64,${saved.base64}` : saved.uri;
}
