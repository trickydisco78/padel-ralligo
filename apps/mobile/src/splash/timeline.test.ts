import { at, backOut, easeOut, markFrame, seg, TOTAL_MS, wordFrame } from './timeline';

/** Progress (0..1) at a given millisecond of the intro. */
const p = (ms: number) => ms / TOTAL_MS;

describe('timeline maths', () => {
  it('seg is 0 before the segment, 1 after it and linear inside', () => {
    expect(seg(0.1, 0.2, 0.6)).toBe(0);
    expect(seg(0.7, 0.2, 0.6)).toBe(1);
    expect(seg(0.4, 0.2, 0.6)).toBeCloseTo(0.5);
  });

  it('easeOut runs from 0 to 1 and only ever rises', () => {
    expect(easeOut(0)).toBe(0);
    expect(easeOut(1)).toBe(1);
    expect(easeOut(0.5)).toBeGreaterThan(0.5);
  });

  it('backOut runs from 0 to 1 and overshoots on the way, so balls pop', () => {
    expect(backOut(0)).toBeCloseTo(0);
    expect(backOut(1)).toBeCloseTo(1);
    expect(Math.max(...[0.5, 0.6, 0.7, 0.8, 0.9].map(backOut))).toBeGreaterThan(1);
  });

  it('runs for 2700 ms and the wordmark segment ends exactly at the end', () => {
    expect(TOTAL_MS).toBe(2700);
    expect(at(2700)).toBe(1);
  });
});

describe('markFrame', () => {
  it('shows nothing at the start: no balls, no cell, every line undrawn', () => {
    const f = markFrame(0);
    expect(f.centreBall).toBeCloseTo(0);
    expect([f.ball1, f.ball2, f.ball3, f.ball4]).toEqual([0, 0, 0, 0]);
    expect(f.cell.width).toBe(0);
    expect(f.netOffset).toBe(42);
    expect(f.centreOffset).toBe(32);
    expect(f.outlineOffset).toBeCloseTo(249.13);
  });

  it('is the finished mark at the end: lines drawn, four balls, the fourth cell filled, opening ball gone', () => {
    const f = markFrame(1);
    expect(f.centreBall).toBeCloseTo(0);
    expect([f.netOffset, f.centreOffset, f.outlineOffset]).toEqual([0, 0, 0]);
    expect([f.ball1, f.ball2, f.ball3, f.ball4].map((r) => +r.toFixed(3))).toEqual([4.5, 4.5, 4.5, 4.5]);
    expect(f.cell).toEqual({ x: 52, y: 52, width: 28, height: 28 });
  });

  it('pops the opening ball first, then loses it as the lines draw out', () => {
    expect(markFrame(p(250)).centreBall).toBeCloseTo(6);
    expect(markFrame(p(900)).centreBall).toBeCloseTo(0);
    expect(markFrame(p(140)).netOffset).toBe(42);
    expect(markFrame(p(400)).netOffset).toBeLessThan(42);
    expect(markFrame(p(650)).netOffset).toBe(0);
  });

  it('draws the centre lines, then the court outline', () => {
    expect(markFrame(p(390)).centreOffset).toBe(32);
    expect(markFrame(p(800)).centreOffset).toBe(0);
    expect(markFrame(p(590)).outlineOffset).toBeCloseTo(249.13);
    expect(markFrame(p(1200)).outlineOffset).toBe(0);
  });

  it('brings the three balls in one after another', () => {
    expect(markFrame(p(1099)).ball1).toBe(0);
    const mid = markFrame(p(1300));
    expect(mid.ball1).toBeGreaterThan(0);
    expect(mid.ball2).toBeGreaterThan(0);
    expect(mid.ball3).toBe(0);
    expect(markFrame(p(1700)).ball3).toBeCloseTo(4.5);
  });

  it('grows the fourth cell from its middle, then lands its ball', () => {
    expect(markFrame(p(1699)).cell.width).toBe(0);
    const grow = markFrame(p(1850)).cell;
    expect(grow.width).toBeGreaterThan(0);
    expect(grow.width).toBeLessThan(28);
    expect(grow.x + grow.width / 2).toBeCloseTo(66);
    expect(markFrame(p(1999)).ball4).toBe(0);
    expect(markFrame(p(2150)).ball4).toBeGreaterThan(0);
    expect(markFrame(p(2300)).ball4).toBeCloseTo(4.5);
  });
});

describe('wordFrame', () => {
  it('is hidden and 12 below until 2200 ms', () => {
    expect(wordFrame(p(2200))).toEqual({ opacity: 0, translateY: 12 });
    expect(wordFrame(0)).toEqual({ opacity: 0, translateY: 12 });
  });

  it('rises and fades in between 2200 and 2700 ms', () => {
    const mid = wordFrame(p(2450));
    expect(mid.opacity).toBeCloseTo(0.5);
    expect(mid.translateY).toBeCloseTo(6);
  });

  it('is fully opaque and in place when the intro has finished', () => {
    expect(wordFrame(1)).toEqual({ opacity: 1, translateY: 0 });
  });
});
