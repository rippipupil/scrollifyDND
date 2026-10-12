import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { spellIcon } from '../content/spellIcons';

/** Round spell badge: the spell's icon in white on its school colour. */
export function SpellIcon({ refKey, school, size = 30 }: { refKey?: string; school?: string; size?: number }) {
  const icon = spellIcon(refKey, school);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: icon.color, alignItems: 'center', justifyContent: 'center' }} testID={`spell-icon-${icon.id}`}>
      <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 512 512">
        {icon.paths.map((d, i) => (
          <Path key={i} d={d} fill="#fff" />
        ))}
      </Svg>
    </View>
  );
}
