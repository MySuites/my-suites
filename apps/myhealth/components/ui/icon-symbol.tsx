import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';
import { hslToHex } from '../../utils/colors';


type IconSymbolName = keyof typeof MAPPING;

/**
 * Add SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'person.fill': 'person',
  'figure.walk': 'directions-walk',
  'gearshape.fill': 'settings',
  'dumbbell.fill': 'fitness-center',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'chevron.down': 'keyboard-arrow-down',
  'chevron.up': 'keyboard-arrow-up',
  'bolt.fill': 'flash-on',
  'plus': 'add',
  'pencil': 'edit',
  'list.bullet.clipboard': 'list',
  'scale.3d': 'scale',
  'play.fill': 'play-arrow',
  'ellipsis': 'menu',
  'menu': 'menu',
  'line.3.horizontal': 'menu',
  'magnifyingglass': 'search',
  'xmark.circle.fill': 'cancel',
  'scalemass.fill': 'monitor-weight',
  'arrow.up': 'arrow-upward',
  'arrow.down': 'arrow-downward',
  'trash.fill': 'delete',
  'minus.circle.fill': 'remove-circle',
  'plus.circle': 'add-circle',
  'checkmark': 'check',
  'xmark': 'close',
  'arrow.counterclockwise': 'refresh',
  'checkmark.circle.fill': 'check-circle',
  'timer': 'timer',
  'calendar': 'calendar-today',
  'moon.zzz.fill': 'nightlight',
} as const;



/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  const safeColor = (typeof color === 'string' && color.startsWith('hsl')) ? hslToHex(color) : color;
  return <MaterialIcons color={safeColor} size={size} name={MAPPING[name]} style={style} />;
}

