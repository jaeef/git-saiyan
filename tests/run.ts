import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  buildRecentDays,
  computeCurrentStreak,
  computeLongestStreak,
  computePowerLevel,
} from '../src/engine/activity.js';
import {
  calculateFormProgression,
  findForm,
  GOKU_FORMS,
} from '../src/engine/forms.js';
import {
  calculateDragonBalls,
  calculateUnlockedBalls,
  DRAGON_BALL_MILESTONES,
  nextDragonBallMilestone,
} from '../src/engine/dragonballs.js';
import { calculateAuraFromStreak } from '../src/engine/streak.js';
import { applyProgression, loadState, saveState } from '../src/state.js';
import { generateMockStats, sumLifetimeYears } from '../src/api/github.js';
import type { ContributionDay } from '../src/api/types.js';
import { renderSvg } from '../src/renderer/svg.js';
import { textToRects, textWidth } from '../src/renderer/font.js';
import { getDragonBallStarLayout } from '../src/assets/sprites.js';
import { CANVAS_HEIGHT, CANVAS_WIDTH, FRAME_COUNT, renderCharacterFrames, renderGokuFrame } from '../src/art/index.js';
import { encodePng } from '../src/art/png.js';
import { alphaMask } from '../src/art/raster.js';
import { renderGif } from '../src/renderer/gif.js';
import { auraDaysForWeeks, buildCardModel, estimateEta, parseStreakMode, powerStage } from '../src/engine/card.js';
import { computeWeeklyStreaks, weekStart } from '../src/engine/activity.js';
import { buildReadmeSnippet, buildWorkflow, initProfileRepo } from '../src/init.js';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`ok - ${name}`);
  } catch (error) {
    failed++;
    console.error(`not ok - ${name}`);
    console.error(error);
  }
}

function day(date: string, count: number): ContributionDay {
  return {
    date,
    count,
    color: count > 0 ? '#39d353' : '#161b22',
    weekday: new Date(`${date}T00:00:00Z`).getUTCDay(),
  };
}

const TODAY = '2026-11-10';

test('streak ignores future-padded calendar days', () => {
  const days = [
    day('2026-11-14', 0),
    day('2026-11-13', 0),
    day('2026-11-12', 0),
    day('2026-11-11', 0),
    day('2026-11-10', 3),
    day('2026-11-09', 2),
    day('2026-11-08', 1),
    day('2026-11-07', 0),
  ];
  assert.equal(computeCurrentStreak(days, TODAY), 3);
});

test('streak survives an empty today and counts from yesterday', () => {
  const days = [
    day('2026-11-14', 0),
    day('2026-11-10', 0),
    day('2026-11-09', 2),
    day('2026-11-08', 1),
    day('2026-11-07', 0),
  ];
  assert.equal(computeCurrentStreak(days, TODAY), 2);
});

test('streak is zero when the last activity is older than yesterday', () => {
  const days = [day('2026-11-08', 4), day('2026-11-07', 2)];
  assert.equal(computeCurrentStreak(days, TODAY), 0);
});

test('longest streak finds the best historical run', () => {
  const days = [
    day('2026-11-01', 1),
    day('2026-11-02', 1),
    day('2026-11-03', 0),
    day('2026-11-04', 1),
    day('2026-11-05', 1),
    day('2026-11-06', 1),
  ];
  assert.equal(computeLongestStreak(days), 3);
});

test('recent days are exactly 14, end today, and fill gaps', () => {
  const days = [day('2026-11-10', 4), day('2026-11-08', 2)];
  const recent = buildRecentDays(days, TODAY, 14);
  assert.equal(recent.length, 14);
  assert.equal(recent[13].date, TODAY);
  assert.equal(recent[13].count, 4);
  assert.equal(recent[12].date, '2026-11-09');
  assert.equal(recent[12].count, 0);
  assert.equal(recent[11].count, 2);
});

test('power level uses disjoint inputs', () => {
  assert.equal(
    computePowerLevel({ commits: 100, prs: 2, reviews: 1, bestStreak: 5 }),
    1330
  );
});

test('form ladder boundaries are inclusive and monotonic', () => {
  assert.equal(calculateFormProgression(0).currentForm.id, 'kid');
  assert.equal(calculateFormProgression(49).currentForm.id, 'kid');
  assert.equal(calculateFormProgression(50).currentForm.id, 'base');
  assert.equal(calculateFormProgression(300).currentForm.id, 'ssj1');
  assert.equal(calculateFormProgression(6999).currentForm.id, 'ssjb');
  assert.equal(calculateFormProgression(7000).currentForm.id, 'mui');
  assert.equal(calculateFormProgression(7000).nextForm, null);
  assert.equal(calculateFormProgression(7000).progressPercent, 100);
  assert.equal(calculateFormProgression(150).contributionsToNext, 150);
  assert.equal(GOKU_FORMS.length, 10);
  assert.equal(findForm('ssj3')?.id, 'ssj3');
  assert.equal(findForm('blue')?.id, 'ssjb');
});

test('dragon ball milestones unlock in order', () => {
  // Yearly hunt over the trailing 365 days: 10 / 25 / 50 / 100 / 200 / 350 / 500.
  assert.equal(calculateUnlockedBalls(0), 0);
  assert.equal(calculateUnlockedBalls(9), 0);
  assert.equal(calculateUnlockedBalls(10), 1);
  assert.equal(calculateUnlockedBalls(49), 2);
  assert.equal(calculateUnlockedBalls(100), 4);
  assert.equal(calculateUnlockedBalls(349), 5);
  assert.equal(calculateUnlockedBalls(499), 6);
  assert.equal(calculateUnlockedBalls(500), 7);
  assert.equal(calculateUnlockedBalls(10_000), 7);
  assert.equal(nextDragonBallMilestone(0)?.star, 1);
  assert.equal(nextDragonBallMilestone(100)?.star, 5);
  assert.equal(nextDragonBallMilestone(500), null);
  assert.equal(DRAGON_BALL_MILESTONES.length, 7);
});

test('dragon balls are depth-sorted with locked silhouettes', () => {
  const balls = calculateDragonBalls(3, 0.2);
  assert.equal(balls.length, 7);
  assert.equal(balls.filter((ball) => ball.isUnlocked).length, 3);
  for (let i = 1; i < balls.length; i++) {
    assert.ok(balls[i - 1].z <= balls[i].z);
  }
  for (const ball of balls) {
    assert.ok(ball.scale >= 0.85 && ball.scale <= 1.15);
    assert.equal(ball.opacity, ball.isUnlocked ? ball.opacity : 0.12);
  }
});

test('aura tiers follow streak thresholds', () => {
  assert.equal(calculateAuraFromStreak(0, false).intensity, 'calm');
  assert.equal(calculateAuraFromStreak(3, false).intensity, 'flaring');
  assert.equal(calculateAuraFromStreak(7, false).intensity, 'super');
  assert.equal(calculateAuraFromStreak(14, false).intensity, 'hyper');
  assert.ok(calculateAuraFromStreak(14, true).sparkCount >= 2);
});

test('forms never demote, while Dragon Balls follow the trailing year', () => {
  const stats = generateMockStats('octocat', { commits: 120 });
  const previous = {
    version: 1 as const,
    peakContributions: 5000,
    unlockedBalls: 5,
    bestStreak: 40,
    powerLevel: 999_999,
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const { stats: progressed, state } = applyProgression(stats, previous);
  assert.equal(progressed.peakContributions, 5000);
  // 120 lifetime -> 30 in the trailing year -> balls at 10 and 25 only.
  assert.equal(progressed.unlockedBalls, 2);
  assert.equal(state.unlockedBalls, 2);
  assert.equal(progressed.bestStreak, 40);
  assert.equal(progressed.powerLevel, 999_999);
  assert.equal(state.peakContributions, 5000);
});

test('progression bootstraps without a state file', () => {
  const stats = generateMockStats('octocat', { commits: 120 });
  const { stats: progressed } = applyProgression(stats, null);
  assert.equal(progressed.peakContributions, 120);
  assert.equal(progressed.unlockedBalls, 2);
  assert.ok(progressed.bestStreak >= progressed.currentStreak);
});

test('state file round-trips and ignores corrupt input', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-saiyan-'));
  try {
    const file = path.join(dir, '.saiyan-state.json');
    assert.equal(loadState(file), null);
    const state = {
      version: 1 as const,
      peakContributions: 1234,
      unlockedBalls: 3,
      bestStreak: 21,
      bestWeekStreak: 6,
      powerLevel: 12_345,
      updatedAt: new Date().toISOString(),
    };
    saveState(file, state);
    assert.deepEqual(loadState(file), state);
    assert.equal(fs.existsSync(`${file}.tmp`), false);

    // An unchanged state must not churn updatedAt, or the generated workflow
    // would commit every single day.
    saveState(file, { ...state, updatedAt: new Date(Date.now() + 60_000).toISOString() });
    assert.equal(loadState(file)?.updatedAt, state.updatedAt);

    for (const broken of [
      '{"peakContributions":1e999}',
      '{"peakContributions":"7"}',
      '{"peakContributions":12.5}',
      '{"peakContributions":-1}',
      '{"peakContributions":10,"unlockedBalls":99}',
      '{"version":2,"peakContributions":10}',
      '{"peakContributions":10,"bestWeekStreak":-3}',
    ]) {
      fs.writeFileSync(file, broken, 'utf-8');
      assert.equal(loadState(file), null, broken);
    }

    fs.writeFileSync(file, '{not json', 'utf-8');
    assert.equal(loadState(file), null);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('SVG renderer produces a complete, animated card', () => {
  const stats = generateMockStats('octocat', { form: 'mui' });
  const svg = renderSvg(stats);
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('ULTRA INSTINCT'));
  assert.ok(svg.includes('BALLS 7/7'));
  assert.ok(svg.includes('animateTransform'));
  assert.ok(svg.includes('prefers-reduced-motion'));
  assert.ok(!svg.includes('NaN'));
  assert.ok(!svg.includes('undefined'));
  assert.ok(svg.includes('@octocat'));
});

test('SVG activity bars stay inside the card', () => {
  const stats = generateMockStats('octocat', { commits: 624 });
  const svg = renderSvg(stats);
  const matches = [...svg.matchAll(/class="ki-bar" x="(\d+)" y="(\d+)" width="8" height="(\d+)"/g)];
  assert.equal(matches.length, 14);
  for (const match of matches) {
    assert.ok(Number(match[1]) + 8 <= 500);
  }
});

test('bitmap font measures and rasterizes text', () => {
  assert.ok(textWidth('STREAK 12D', 2) > 0);
  const rects = textToRects('PL 9001', 0, 0, 2, '#ffffff');
  assert.ok(rects.length > 0);
  for (const rect of rects) {
    assert.ok(rect.w > 0 && rect.h > 0);
  }
});

test('dragon ball star layouts match their star count', () => {
  for (let stars = 1; stars <= 7; stars++) {
    assert.equal(getDragonBallStarLayout(stars).length, stars);
  }
});

test('lifetime totals count private contributions once', () => {
  // The calendar total already includes restricted contributions; a stray
  // restrictedContributionsCount on the payload must not be added again.
  const year = {
    totalCommitContributions: 100,
    totalPullRequestContributions: 10,
    totalPullRequestReviewContributions: 5,
    restrictedContributionsCount: 400,
    contributionCalendar: { totalContributions: 520 },
  };
  const totals = sumLifetimeYears([year, null, { ...year, contributionCalendar: { totalContributions: 80 } }]);
  assert.equal(totals.totalContributions, 600);
  assert.equal(totals.totalCommits, 200);
  assert.equal(totals.totalPRs, 20);
  assert.equal(totals.totalReviews, 10);
});

test('unknown preview form is rejected instead of rendering a default card', () => {
  assert.throws(() => generateMockStats('octocat', { form: 'zenith' }), /Unknown form "zenith"/);
  assert.throws(() => generateMockStats('octocat', { form: 'nope' }), /Available forms: kid,/);
  assert.equal(generateMockStats('octocat', { form: 'mui' }).totalContributions, 7015);
});

test('card shows Dragon Balls with red star marks', () => {
  const svg = renderSvg(generateMockStats('octocat', { commits: 7200 }));
  assert.ok(svg.includes('BALLS 7/7'));
  assert.ok(svg.includes('fill="#dc2626"'));
});

test('GIF renderer produces a looping 8-frame card', () => {
  for (const streak of [0, 21]) {
    const bytes = renderGif(generateMockStats('octocat', { commits: 7200, streak }));
    assert.equal(Buffer.from(bytes.slice(0, 6)).toString('ascii'), 'GIF89a');
    assert.equal(bytes[6] | (bytes[7] << 8), 500);
    assert.equal(bytes[8] | (bytes[9] << 8), 300);
    assert.ok(Buffer.from(bytes).includes('NETSCAPE2.0'), 'loop extension present');
    // Graphic control extension marks each frame.
    let frames = 0;
    for (let i = 0; i < bytes.length - 2; i++) {
      if (bytes[i] === 0x21 && bytes[i + 1] === 0xf9 && bytes[i + 2] === 0x04) frames++;
    }
    assert.ok(frames >= 8, `expected 8 frames, found ${frames}`);
    assert.ok(bytes.byteLength < 200_000, 'GIF stays small enough for a README');
  }
});

test('bitmap font keeps M, N and W distinguishable', () => {
  const shape = (text: string) => JSON.stringify(textToRects(text, 0, 0, 1, '#fff'));
  assert.notEqual(shape('N'), shape('M'));
  assert.notEqual(shape('N'), shape('W'));
  assert.notEqual(shape('M'), shape('W'));
});

test('empty state file is treated as a first run', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'git-saiyan-'));
  const file = path.join(directory, '.saiyan-state.json');
  fs.writeFileSync(file, '');
  assert.equal(loadState(file), null);
  fs.rmSync(directory, { recursive: true, force: true });
});

test('published workflow skips the push only when the output branch is unchanged', () => {
  const workflow = buildWorkflow();
  assert.ok(workflow.includes('git diff --staged --quiet origin/output --'));
  assert.ok(!/git diff --staged --quiet; then/.test(workflow));
  const example = fs.readFileSync(path.join(__dirname, '..', 'examples', 'saiyan-profile-workflow.yml'), 'utf-8');
  assert.ok(example.includes('git diff --staged --quiet origin/output --'));
});

test('every goku form renders a distinct, shaded sprite', () => {
  const signatures = new Set<string>();
  for (const form of GOKU_FORMS) {
    const image = renderGokuFrame(form.id, 0);
    assert.equal(image.width, CANVAS_WIDTH);
    assert.equal(image.height, CANVAS_HEIGHT);
    const mask = alphaMask(image);
    const filled = mask.reduce((sum, value) => sum + value, 0);
    assert.ok(filled > 1200, `${form.id} sprite is too small (${filled}px)`);
    const colors = new Set<string>();
    for (let i = 0; i < mask.length; i++) {
      if (mask[i]) colors.add(image.data.slice(i * 4, i * 4 + 3).join(','));
    }
    // Shaded ramps, not flat fills, but still a sprite-sized palette.
    assert.ok(colors.size >= 20 && colors.size <= 64, `${form.id} uses ${colors.size} colors`);
    signatures.add(Buffer.from(image.data).toString('base64'));
  }
  assert.equal(signatures.size, GOKU_FORMS.length, 'each form looks different');
});

test('character animation loops through distinct frames with an aura', () => {
  const form = GOKU_FORMS[3];
  const frames = renderCharacterFrames(form, calculateAuraFromStreak(21, form.hasSparks));
  assert.equal(frames.length, FRAME_COUNT);
  assert.equal(new Set(frames.map((frame) => Buffer.from(frame.data).toString('base64'))).size, FRAME_COUNT);
  const calm = renderCharacterFrames(form, calculateAuraFromStreak(0, form.hasSparks))[0];
  const count = (frame: { data: Uint8ClampedArray }) => frame.data.filter((_, i) => i % 4 === 3 && frame.data[i] > 0).length;
  assert.ok(count(frames[0]) > count(calm) * 1.2, 'a long streak grows the aura');
});

test('PNG encoder writes a valid, upscaled image', () => {
  const png = encodePng(renderGokuFrame('ssj1', 0), 2);
  assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(png.readUInt32BE(16), CANVAS_WIDTH * 2);
  assert.equal(png.readUInt32BE(20), CANVAS_HEIGHT * 2);
});

test('SVG card embeds pixel frames with a reduced-motion still', () => {
  const svg = renderSvg(generateMockStats('octocat', { form: 'ssj3', streak: 21 }));
  assert.equal((svg.match(/class="ki-frame"/g) ?? []).length, FRAME_COUNT);
  assert.equal((svg.match(/class="ki-still"/g) ?? []).length, 1);
  assert.ok(svg.includes('calcMode="discrete"'));
  assert.ok(svg.includes('image-rendering:pixelated'));
  assert.ok(svg.length < 150_000, `SVG is ${svg.length} bytes`);
});

test('power-up stages split each form into thirds', () => {
  const [kid, base, kaioken] = GOKU_FORMS;
  assert.equal(powerStage(150, kaioken, GOKU_FORMS[3]), 0);
  assert.equal(powerStage(199, kaioken, GOKU_FORMS[3]), 0);
  assert.equal(powerStage(200, kaioken, GOKU_FORMS[3]), 1);
  assert.equal(powerStage(249, kaioken, GOKU_FORMS[3]), 1);
  assert.equal(powerStage(250, kaioken, GOKU_FORMS[3]), 2);
  assert.equal(powerStage(9999, GOKU_FORMS[9], null), 2);
  assert.equal(powerStage(0, kid, base), 0);
});

test('power-up stage changes the rendered character', () => {
  const form = GOKU_FORMS[3];
  const aura = calculateAuraFromStreak(5, form.hasSparks);
  const key = (stage: number) => Buffer.from(renderCharacterFrames(form, aura, stage)[0].data).toString('base64');
  assert.equal(new Set([key(0), key(1), key(2)]).size, 3);
});

test('countdown uses the trailing-year pace', () => {
  assert.equal(estimateEta(50, 365)?.long, 'in ~7 weeks');
  assert.equal(estimateEta(70, 365)?.long, 'in ~2 months');
  assert.equal(estimateEta(50, 365)?.short, '~7 WK');
  assert.equal(estimateEta(5, 365)?.long, 'in ~5 days');
  assert.equal(estimateEta(150, 365)?.long, 'in ~5 months');
  assert.equal(estimateEta(2000, 365)?.long, 'in ~5 years');
  assert.equal(estimateEta(100_000, 10)?.long, 'in 20+ years');
  assert.equal(estimateEta(50, 0)?.long, 'no recent pace');
  assert.equal(estimateEta(0, 100)?.long, 'any day now');
});

test('weekly streaks count Monday-Sunday weeks with activity', () => {
  assert.equal(weekStart('2026-11-12'), '2026-11-09'); // Thursday -> Monday
  assert.equal(weekStart('2026-11-09'), '2026-11-09');
  assert.equal(weekStart('2026-11-15'), '2026-11-09'); // Sunday -> Monday
  const today = '2026-11-12';
  // One push per week for the last 4 weeks (this week included).
  const days = [
    day('2026-10-20', 1),
    day('2026-10-28', 2),
    day('2026-11-03', 1),
    day('2026-11-10', 4),
    day('2026-11-12', 0),
  ];
  assert.deepEqual(computeWeeklyStreaks(days, today), { current: 4, longest: 4 });
  // Nothing yet this week: the streak still counts through last week.
  assert.equal(computeWeeklyStreaks(days.slice(0, 3), today).current, 3);
  // A fully empty week breaks it.
  assert.equal(computeWeeklyStreaks([day('2026-10-20', 1), day('2026-11-10', 1)], today).current, 1);
  assert.equal(auraDaysForWeeks(1), 0);
  assert.equal(auraDaysForWeeks(2), 3);
  assert.equal(auraDaysForWeeks(4), 7);
  assert.equal(auraDaysForWeeks(8), 14);
});

test('streak mode option is validated', () => {
  assert.equal(parseStreakMode(undefined), 'daily');
  assert.equal(parseStreakMode(' Weekly '), 'weekly');
  assert.throws(() => parseStreakMode('hourly'), /Use daily or weekly/);
});

test('weekly mode drives the HUD and aura; daily stays the default', () => {
  const stats = generateMockStats('octocat', { commits: 640, streak: 21 });
  const daily = buildCardModel(stats);
  assert.equal(daily.streak.unit, 'D');
  assert.equal(daily.streak.current, 21);
  const weekly = buildCardModel({ ...stats, streakMode: 'weekly', currentWeekStreak: 9, longestWeekStreak: 9 });
  assert.equal(weekly.streak.unit, 'W');
  assert.equal(weekly.aura.intensity, 'hyper');
  const svg = renderSvg({ ...stats, streakMode: 'weekly', currentWeekStreak: 9, longestWeekStreak: 9 });
  assert.ok(svg.includes('>9</text>') && svg.includes('WEEK STREAK') && svg.includes('BEST 9W'));
  const dailySvg = renderSvg(stats);
  assert.ok(dailySvg.includes('>21</text>') && dailySvg.includes('DAY STREAK'));
});

test('card shows stage pips, the countdown and the yearly ball hunt', () => {
  const svg = renderSvg(generateMockStats('octocat', { commits: 640, streak: 5 }));
  // 640 lifetime -> SSJ2 (600-999), stage 1 of 3; 160 in the trailing year.
  assert.ok(svg.includes('power-up stage 1 of 3'));
  assert.ok(/SUPER SAIYAN 3 · \+\d+ · in ~\d+ (months|years)/.test(svg));
  assert.ok(svg.includes('STAGE 1/3'));
  assert.ok(svg.includes('THIS YEAR'));
  const all = renderSvg(generateMockStats('octocat', { commits: 7200 }));
  assert.ok(all.includes('SHENRON SUMMONED THIS YEAR'));
  assert.ok(all.includes('FINAL FORM REACHED'));
});

test('generated workflow restores state and publishes to output branch', () => {
  const workflow = buildWorkflow('example/git-saiyan@v1');
  assert.ok(workflow.includes('example/git-saiyan@v1'));
  assert.ok(workflow.includes('${{ secrets.GITHUB_TOKEN }}'));
  assert.ok(workflow.includes('git show origin/output:.saiyan-state.json'));
  assert.ok(workflow.includes('git push origin HEAD:output --force'));
  assert.ok(workflow.includes('state_file: .saiyan-state.json'));
});

test('init writes a workflow and prints a README snippet', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-saiyan-init-'));
  try {
    const result = initProfileRepo({ cwd: dir, actionRef: 'example/git-saiyan@v1' });
    assert.ok(fs.existsSync(result.workflowPath));
    assert.ok(result.readmeSnippet.includes('/output/dist/saiyan.svg'));
    assert.throws(() => initProfileRepo({ cwd: dir }), /already exists/);
    initProfileRepo({ cwd: dir, force: true });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('readme snippet points at the output branch', () => {
  assert.ok(buildReadmeSnippet('octocat').includes('octocat/octocat/output/dist/saiyan.svg'));
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
