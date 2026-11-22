import { colors } from '@padel/ui';
import { render } from '@testing-library/react-native';
import type { SharedValue } from 'react-native-reanimated';

import { FourthMark, MARK_COLORS } from './fourth-mark';

// Plain host elements, so the test reads the raw props (the real SVG nodes encode colours as numbers).
jest.mock('react-native-svg', () => ({ __esModule: true, default: 'Svg', Circle: 'Circle', Rect: 'Rect', Path: 'Path' }));

type HostNode = { type: string; props: Record<string, any>; children?: HostNode[] | null };
type Props = HostNode['props'];
const collect = (node: unknown, type: string): Props[] => {
  if (!node || typeof node !== 'object') return [];
  const n = node as HostNode;
  return [...(n.type === type ? [n.props] : []), ...(n.children ?? []).flatMap((c) => collect(c, type))];
};

const shared = (value: number) => ({ value }) as SharedValue<number>;

async function mark(progress: number, extra: Partial<React.ComponentProps<typeof FourthMark>> = {}) {
  const view = await render(<FourthMark size={168} progress={shared(progress)} {...extra} />);
  const tree = view.toJSON();
  const [cell, outline] = collect(tree, 'Rect') as [Props, Props];
  const [opening, b1, b2, b3, b4] = collect(tree, 'Circle') as [Props, Props, Props, Props, Props];
  const [netL, netR, centreU, centreD] = collect(tree, 'Path') as [Props, Props, Props, Props];
  return { cell, outline, opening, b1, b2, b3, b4, netL, netR, centreU, centreD };
}

describe('FourthMark', () => {
  it('draws nothing at the start of the intro', async () => {
    const m = await mark(0);
    expect(m.cell.width).toBe(0);
    expect([m.opening.r, m.b1.r, m.b2.r, m.b3.r, m.b4.r]).toEqual([0, 0, 0, 0, 0]);
    expect([m.netL.strokeDashoffset, m.netR.strokeDashoffset]).toEqual([42, 42]);
    expect([m.centreU.strokeDashoffset, m.centreD.strokeDashoffset]).toEqual([32, 32]);
    expect(m.outline.strokeDashoffset).toBeCloseTo(249.13);
  });

  it('is the finished mark at the end: lines drawn, four balls, the fourth cell filled', async () => {
    const m = await mark(1);
    expect([m.netL, m.netR, m.centreU, m.centreD, m.outline].map((l) => l.strokeDashoffset)).toEqual([0, 0, 0, 0, 0]);
    expect([m.b1.r, m.b2.r, m.b3.r, m.b4.r]).toEqual([4.5, 4.5, 4.5, 4.5]);
    expect(m.opening.r).toBe(0);
    expect(m.cell).toMatchObject({ x: 52, y: 52, width: 28, height: 28 });
  });

  it('pulses only the last ball', async () => {
    const m = await mark(1, { pulse: shared(1.18) });
    expect(m.b4.r).toBeCloseTo(4.5 * 1.18);
    expect(m.b1.r).toBe(4.5);
  });

  it('uses the design tokens: ink square and white balls by default', async () => {
    const m = await mark(1);
    expect(m.cell.fill).toBe(colors.ink);
    expect(m.b1.fill).toBe(colors.surface);
    expect(m.b4.fill).toBe(colors.surface);
    expect(m.opening.fill).toBe(colors.pink100);
    expect(m.outline.stroke).toBe(colors.surface);
  });

  it('has a white-square variant with a pink ball in it', async () => {
    const m = await mark(1, { colors: MARK_COLORS.white });
    expect(m.cell.fill).toBe(colors.surface);
    expect(m.b4.fill).toBe(colors.pink500);
  });
});
