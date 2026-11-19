/**
 * The 26 design-system icons plus `alert`: 24 x 24 grid, drawn with a 1.8 stroke, round caps and joins.
 * Copied from the design system's Icon preview. Keep new icons to the same stroke and corner style.
 */

export type IconShape =
  | { kind: 'path'; d: string }
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'rect'; x: number; y: number; width: number; height: number; rx: number };

export const iconPaths = {
  home: [
    { kind: 'path', d: 'M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z' },
  ],
  search: [
    { kind: 'circle', cx: 11, cy: 11, r: 7 },
    { kind: 'path', d: 'M20 20l-3.5-3.5' },
  ],
  plus: [
    { kind: 'path', d: 'M12 5v14M5 12h14' },
  ],
  calendar: [
    { kind: 'rect', x: 4, y: 5, width: 16, height: 15, rx: 3 },
    { kind: 'path', d: 'M8 3v4M16 3v4M4 10h16' },
  ],
  pin: [
    { kind: 'path', d: 'M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z' },
    { kind: 'circle', cx: 12, cy: 9.5, r: 2.5 },
  ],
  clock: [
    { kind: 'circle', cx: 12, cy: 12, r: 9 },
    { kind: 'path', d: 'M12 7v5l3 2' },
  ],
  chat: [
    { kind: 'path', d: 'M4 5h16v11H9l-5 4z' },
  ],
  profile: [
    { kind: 'circle', cx: 12, cy: 8, r: 4 },
    { kind: 'path', d: 'M4 21c.7-4 4-6 8-6s7.3 2 8 6' },
  ],
  settings: [
    { kind: 'circle', cx: 12, cy: 12, r: 3 },
    { kind: 'path', d: 'M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8' },
  ],
  bell: [
    { kind: 'path', d: 'M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z' },
    { kind: 'path', d: 'M10 20a2 2 0 0 0 4 0' },
  ],
  heart: [
    { kind: 'path', d: 'M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z' },
  ],
  share: [
    { kind: 'path', d: 'M12 15V4M8 8l4-4 4 4M5 12v7h14v-7' },
  ],
  back: [
    { kind: 'path', d: 'M15 5l-7 7 7 7' },
  ],
  chevron: [
    { kind: 'path', d: 'M9 5l7 7-7 7' },
  ],
  check: [
    { kind: 'path', d: 'M5 12.5l4.5 4.5L19 7' },
  ],
  checkCircle: [
    { kind: 'circle', cx: 12, cy: 12, r: 9 },
    { kind: 'path', d: 'M7.5 12.5l3 3 6-6.5' },
  ],
  close: [
    { kind: 'path', d: 'M6 6l12 12M18 6L6 18' },
  ],
  filter: [
    { kind: 'path', d: 'M4 7h9M17 7h3M4 17h3M11 17h9' },
    { kind: 'circle', cx: 15, cy: 7, r: 2 },
    { kind: 'circle', cx: 9, cy: 17, r: 2 },
  ],
  compass: [
    { kind: 'circle', cx: 12, cy: 12, r: 9 },
    { kind: 'path', d: 'M15.5 8.5l-2 5-5 2 2-5z' },
  ],
  plane: [
    { kind: 'path', d: 'M3 13l18-8-6 15-3-6z' },
    { kind: 'path', d: 'M12 14l-5 5' },
  ],
  globe: [
    { kind: 'circle', cx: 12, cy: 12, r: 9 },
    { kind: 'path', d: 'M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18' },
  ],
  people: [
    { kind: 'circle', cx: 9, cy: 8, r: 3.5 },
    { kind: 'path', d: 'M2.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5M16 5a3 3 0 0 1 0 6M18 15c1.8.8 2.8 2.5 3 5' },
  ],
  camera: [
    { kind: 'path', d: 'M4 8h3l2-3h6l2 3h3v11H4z' },
    { kind: 'circle', cx: 12, cy: 13, r: 3.5 },
  ],
  edit: [
    { kind: 'path', d: 'M4 20h4L19 9l-4-4L4 16z' },
  ],
  ball: [
    { kind: 'circle', cx: 12, cy: 12, r: 9 },
    { kind: 'path', d: 'M4 8c5 2 5 6 0 8M20 8c-5 2-5 6 0 8' },
  ],
  // Added in this app (not in the original 26): the design asks for an alert icon beside errors.
  alert: [
    { kind: 'circle', cx: 12, cy: 12, r: 9 },
    { kind: 'path', d: 'M12 7.5v5.5M12 16.5v.01' },
  ],
  court: [
    { kind: 'rect', x: 4, y: 3, width: 16, height: 18, rx: 2 },
    { kind: 'path', d: 'M4 12h16M12 3v18' },
  ],
} as const satisfies Record<string, readonly IconShape[]>;

export type IconName = keyof typeof iconPaths;
