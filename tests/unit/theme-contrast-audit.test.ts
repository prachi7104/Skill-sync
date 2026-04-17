import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

type Hsl = { h: number; s: number; l: number };

type ThemeTokens = Record<string, Hsl>;

function parseThemeBlock(css: string, selector: ':root' | '.dark'): ThemeTokens {
  const blockRegex = selector === ':root'
    ? /:root\s*\{([\s\S]*?)\n\s*\}/
    : /\.dark\s*\{([\s\S]*?)\n\s*\}/;

  const block = css.match(blockRegex)?.[1] ?? '';
  const tokens: ThemeTokens = {};

  const varRegex = /--([a-zA-Z0-9-]+):\s*([0-9.]+)\s+([0-9.]+)%\s+([0-9.]+)%/g;
  let match: RegExpExecArray | null;

  while ((match = varRegex.exec(block)) !== null) {
    const [, name, h, s, l] = match;
    tokens[name] = { h: Number(h), s: Number(s), l: Number(l) };
  }

  return tokens;
}

function hslToRgb({ h, s, l }: Hsl): [number, number, number] {
  const sat = s / 100;
  const lig = l / 100;
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));

  let r = 0;
  let g = 0;
  let b = 0;

  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
  else if (hp >= 1 && hp < 2) [r, g, b] = [x, c, 0];
  else if (hp >= 2 && hp < 3) [r, g, b] = [0, c, x];
  else if (hp >= 3 && hp < 4) [r, g, b] = [0, x, c];
  else if (hp >= 4 && hp < 5) [r, g, b] = [x, 0, c];
  else if (hp >= 5 && hp < 6) [r, g, b] = [c, 0, x];

  const m = lig - c / 2;
  return [r + m, g + m, b + m];
}

function relativeLuminance(rgb: [number, number, number]): number {
  const toLinear = (channel: number) => {
    if (channel <= 0.03928) return channel / 12.92;
    return ((channel + 0.055) / 1.055) ** 2.4;
  };

  const [r, g, b] = rgb.map(toLinear) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground: Hsl, background: Hsl): number {
  const fgLum = relativeLuminance(hslToRgb(foreground));
  const bgLum = relativeLuminance(hslToRgb(background));
  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);
  return (lighter + 0.05) / (darker + 0.05);
}

function assertPair(theme: ThemeTokens, fg: string, bg: string, minRatio: number) {
  const fgToken = theme[fg];
  const bgToken = theme[bg];
  expect(fgToken, `Missing token: ${fg}`).toBeTruthy();
  expect(bgToken, `Missing token: ${bg}`).toBeTruthy();
  const ratio = contrastRatio(fgToken, bgToken);
  expect(ratio).toBeGreaterThanOrEqual(minRatio);
}

describe('WCAG contrast audit for design tokens', () => {
  const cssPath = path.resolve('app/globals.css');
  const css = readFileSync(cssPath, 'utf8');
  const light = parseThemeBlock(css, ':root');
  const dark = parseThemeBlock(css, '.dark');

  it('passes required contrast pairs in light mode', () => {
    assertPair(light, 'foreground', 'background', 7);
    assertPair(light, 'card-foreground', 'card', 7);
    assertPair(light, 'primary-foreground', 'primary', 4.5);
    assertPair(light, 'muted-foreground', 'background', 4.5);
    assertPair(light, 'sidebar-fg', 'sidebar', 7);
    assertPair(light, 'sidebar-fg-muted', 'sidebar', 4.5);
    assertPair(light, 'warning-foreground', 'warning', 4.5);
  });

  it('passes required contrast pairs in dark mode', () => {
    assertPair(dark, 'foreground', 'background', 7);
    assertPair(dark, 'card-foreground', 'card', 7);
    assertPair(dark, 'primary-foreground', 'primary', 3);
    assertPair(dark, 'muted-foreground', 'background', 4.5);
    assertPair(dark, 'sidebar-fg', 'sidebar', 7);
    assertPair(dark, 'sidebar-fg-muted', 'sidebar', 4.5);
    assertPair(dark, 'warning-foreground', 'warning', 4.5);
  });
});
