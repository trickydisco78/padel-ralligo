import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors, type ColorToken } from '../../../theme/tokens';
import { type IconName, iconPaths } from './paths';

export type IconProps = {
  name: IconName;
  /** A design-system colour. Defaults to `ink`. */
  color?: ColorToken;
  /** Pixels. 24 by default, 20 in buttons, 16 in pills. */
  size?: number;
  /** Fills the shape with the colour: the active tab icon. Other icons are stroked only. */
  filled?: boolean;
  /** Use 2.8 for the check and cross in accept and decline buttons. */
  strokeWidth?: number;
  /** Set when the icon stands alone. Decorative icons next to text are hidden from assistive technology. */
  accessibilityLabel?: string;
};

/** A line icon on a 24 grid with round caps and joins. Draws in the given colour. */
export function Icon({
  name,
  color = 'ink',
  size = 24,
  filled = false,
  strokeWidth = 1.8,
  accessibilityLabel,
}: IconProps) {
  const tone = colors[color];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessible={accessibilityLabel !== undefined}
      accessibilityRole={accessibilityLabel !== undefined ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={accessibilityLabel === undefined}
      importantForAccessibility={accessibilityLabel === undefined ? 'no-hide-descendants' : 'auto'}>
      {iconPaths[name].map((shape, index) => {
        const common = {
          stroke: tone,
          strokeWidth,
          strokeLinecap: 'round' as const,
          strokeLinejoin: 'round' as const,
          fill: filled ? tone : 'none',
        };
        if (shape.kind === 'path') return <Path key={index} d={shape.d} {...common} />;
        if (shape.kind === 'circle') return <Circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} {...common} />;
        return (
          <Rect key={index} x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} {...common} />
        );
      })}
    </Svg>
  );
}
