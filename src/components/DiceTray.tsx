import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';
import { useT } from '../i18n/useT';
import { rolledDice, type RolledDie } from '../rules/dice';
import type { RollEntry } from '../store/rolls';
import { useTheme } from '../theme';
import { rollDetail } from './RollToast';

const MAX_SHOWN = 12;
const SPIN_MS = 520;
const STAGGER_MS = 40;

/** Regular polygon points in a 100×100 box (top-down silhouette of the die). */
function polygon(n: number, rotationDeg: number, r = 46): string {
  return Array.from({ length: n }, (_, i) => {
    const a = ((rotationDeg + (360 / n) * i) * Math.PI) / 180;
    return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
  }).join(' ');
}

function DieShape({ sides, fill, stroke }: { sides: number; fill: string; stroke: string }) {
  const common = { fill, stroke, strokeWidth: 4, strokeLinejoin: 'round' as const };
  switch (sides) {
    case 4:
      return <Polygon points={polygon(3, -90, 50)} {...common} />;
    case 6:
      return <Polygon points="10,10 90,10 90,90 10,90" {...common} />;
    case 8:
      return <Polygon points={polygon(4, -90)} {...common} />;
    case 10:
    case 100:
      return <Polygon points="50,4 92,42 50,96 8,42" {...common} />;
    case 12:
      return <Polygon points={polygon(5, -90)} {...common} />;
    case 20:
      return (
        <>
          <Polygon points={polygon(6, -90)} {...common} />
          <Polygon points={polygon(3, 90, 30)} fill="none" stroke={stroke} strokeWidth={2} opacity={0.25} />
          <Line x1="50" y1="4" x2="50" y2="20" stroke={stroke} strokeWidth={2} opacity={0.25} />
        </>
      );
    default:
      return <Circle cx="50" cy="50" r="44" {...common} />;
  }
}

function Die({ die, index, size, animate, onSettled }: { die: RolledDie; index: number; size: number; animate: boolean; onSettled?: () => void }) {
  const th = useTheme();
  const progress = useRef(new Animated.Value(animate ? 0 : 1)).current;
  // Each die flies in from its own random spot with its own spin.
  const start = useMemo(
    () => ({
      x: (Math.random() - 0.5) * 220,
      y: -40 - Math.random() * 60,
      spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 360),
      rest: (Math.random() - 0.5) * 24,
    }),
    [],
  );
  const [face, setFace] = useState(animate ? 1 + Math.floor(Math.random() * die.sides) : die.value);

  useEffect(() => {
    if (!animate) return;
    const delay = index * STAGGER_MS;
    const flicker = setInterval(() => setFace(1 + Math.floor(Math.random() * die.sides)), 55);
    const anim = Animated.timing(progress, { toValue: 1, duration: SPIN_MS, delay, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' });
    anim.start(() => {
      clearInterval(flicker);
      setFace(die.value);
      onSettled?.();
    });
    return () => {
      clearInterval(flicker);
      anim.stop();
    };
    // Runs once per mounted die: a new roll mounts new dice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const crit = die.sides === 20 && !die.dropped && (die.value === 20 || die.value === 1);
  const settled = face === die.value;
  const fill = die.dropped ? th.surfaceAlt : crit && settled ? (die.value === 20 ? th.success : th.danger) : th.surface;
  const ink = crit && settled ? th.accentText : th.text;
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        opacity: die.dropped ? 0.45 : 1,
        transform: [
          { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [start.x, 0] }) },
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [start.y, 0] }) },
          { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: [`${start.spin}deg`, `${start.rest}deg`] }) },
          { scale: progress.interpolate({ inputRange: [0, 0.75, 1], outputRange: [0.55, 1.12, 1] }) },
        ],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <DieShape sides={die.sides} fill={fill} stroke={th.text} />
      </Svg>
      <View style={{ position: 'absolute', top: die.sides === 4 ? size * 0.12 : 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: ink, fontWeight: '800', fontSize: size * (die.sides === 100 ? 0.26 : 0.32), textDecorationLine: die.dropped ? 'line-through' : 'none' }}>{face}</Text>
      </View>
    </Animated.View>
  );
}

/** Top-down dice tray: the last roll's dice tumble in, then the total appears. */
export function DiceTray({ entry }: { entry: RollEntry | null }) {
  const th = useTheme();
  const { t } = useT();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [settledId, setSettledId] = useState<number | null>(null);
  const totalOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => {});
  }, []);

  const dice = entry ? rolledDice(entry.result) : [];
  const shown = dice.slice(0, MAX_SHOWN);
  const size = shown.length > 6 ? 48 : shown.length > 3 ? 58 : 70;
  const animate = !reduceMotion;
  const done = !entry || !animate || settledId === entry.id || shown.length === 0;

  useEffect(() => {
    if (!entry) return;
    totalOpacity.setValue(done ? 1 : 0);
  }, [entry, done, totalOpacity]);

  const onLastSettled = () => {
    if (!entry) return;
    setSettledId(entry.id);
    Animated.timing(totalOpacity, { toValue: 1, duration: 160, useNativeDriver: Platform.OS !== 'web' }).start();
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const nat = entry?.result.natural;
  const color = nat === 20 ? th.success : nat === 1 ? th.danger : th.accent;
  return (
    <View style={{ backgroundColor: th.surfaceAlt, borderColor: th.border, borderWidth: 1, borderRadius: 16, padding: 12, minHeight: 180, gap: 8, overflow: 'hidden' }} testID="dice-tray">
      {!entry ? (
        <View style={{ flex: 1, minHeight: 156, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: th.textMuted }}>{t('dice.trayHint')}</Text>
        </View>
      ) : (
        <>
          <View key={entry.id} style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 10, minHeight: 90 }}>
            {shown.map((d, i) => (
              <Die key={i} die={d} index={i} size={size} animate={animate} onSettled={i === shown.length - 1 ? onLastSettled : undefined} />
            ))}
            {dice.length > MAX_SHOWN ? <Text style={{ color: th.textMuted, fontWeight: '700' }}>+{dice.length - MAX_SHOWN}</Text> : null}
          </View>
          <Animated.View style={{ opacity: totalOpacity, alignItems: 'center' }}>
            <Text style={{ fontSize: 40, fontWeight: '800', color }} testID="tray-total">
              {entry.result.total}
            </Text>
            <Text style={{ color: th.textMuted, fontSize: 12 }}>{rollDetail(entry)}</Text>
            {done && nat === 20 ? <Text style={{ color: th.success, fontWeight: '700' }}>{t('dice.natural20')}</Text> : null}
            {done && nat === 1 ? <Text style={{ color: th.danger, fontWeight: '700' }}>{t('dice.natural1')}</Text> : null}
          </Animated.View>
        </>
      )}
    </View>
  );
}
