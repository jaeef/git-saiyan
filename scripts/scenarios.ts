/**
 * Dev helper: render streak scenarios with the real engine and write
 * preview/scenarios.html. Usage: tsx scripts/scenarios.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { generateMockStats } from '../src/api/github.js';
import { buildRecentDays, colorForCount, computeCurrentStreak, computeLongestStreak, computeWeeklyStreaks, dateKeyOffset, toDateKey } from '../src/engine/activity.js';
import { buildCardModel } from '../src/engine/card.js';
import type { ContributionDay } from '../src/api/types.js';
import { renderSvg } from '../src/renderer/svg.js';

const today = toDateKey(new Date());

/** Build a 60-day history from a pattern, oldest first: 1 = pushed, 0 = no push. */
function history(pattern: number[]): ContributionDay[] {
  return pattern.map((active, index) => {
    const date = dateKeyOffset(today, index - (pattern.length - 1));
    const count = active ? 3 : 0;
    return { date, count, color: colorForCount(count), weekday: new Date(`${date}T00:00:00Z`).getUTCDay() };
  });
}

const run = (active: number, off: number) => [...Array(60 - active - off).fill(0), ...Array(active).fill(1), ...Array(off).fill(0)];

const scenarios = [
  { title: 'Day 10 of a 10-day streak', days: history(run(10, 0)), mode: 'daily' as const },
  { title: '10-day streak, then 5 days without a push', days: history(run(10, 5)), mode: 'daily' as const },
  { title: '40-day streak', days: history(run(40, 0)), mode: 'daily' as const },
  { title: 'On/off coder (push, 2 off, push, 6 off) · daily mode', days: history([...Array(46).fill(0), 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1]), mode: 'daily' as const },
  { title: 'Same on/off coder · weekly mode', days: history([...Array(46).fill(0), 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1]), mode: 'weekly' as const },
];

const outDir = path.resolve('preview');
fs.mkdirSync(outDir, { recursive: true });
const figures = scenarios.map(({ title, days, mode }) => {
  const base = generateMockStats('jaeef', { commits: 230 });
  const currentStreak = computeCurrentStreak(days, today);
  const bestStreak = Math.max(computeLongestStreak(days), currentStreak);
  const weekly = computeWeeklyStreaks(days, today);
  const stats = {
    ...base,
    currentStreak,
    longestStreak: bestStreak,
    bestStreak,
    currentWeekStreak: weekly.current,
    longestWeekStreak: weekly.longest,
    streakMode: mode,
    recentDays: buildRecentDays(days, today, 14),
  };
  const card = buildCardModel(stats);
  const aura = card.aura;
  const svg = renderSvg(stats);
  console.log(`${title}: streak ${card.streak.current}${card.streak.unit}, aura ${aura.intensity}`);
  const uri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return `<figure><img src="${uri}" width="500" height="300" alt="${title}" /><figcaption>${title}<br><b>streak ${card.streak.current}${card.streak.unit} · best ${card.streak.best}${card.streak.unit} · aura: ${aura.label}</b></figcaption></figure>`;
});

fs.writeFileSync(
  path.join(outDir, 'scenarios.html'),
  `<!doctype html><meta charset="utf-8"><title>git-saiyan streak scenarios</title>
<style>
  body { background:#0d1117; color:#c9d1d9; font:14px system-ui, sans-serif; margin:24px; }
  .grid { display:flex; flex-wrap:wrap; gap:20px; }
  figure { margin:0; } figcaption { text-align:center; color:#8b949e; margin-top:6px; line-height:1.5; }
  b { color:#c9d1d9; }
</style>
<h1>Streak scenarios (Kaio-ken, 230 lifetime contributions)</h1>
<div class="grid">${figures.join('')}</div>`
);
console.log(`Written to ${path.join(outDir, 'scenarios.html')}`);
