import fs from 'node:fs';
import path from 'node:path';
import type { ContributionStats, SaiyanState } from './api/types.js';
import { calculateUnlockedBalls } from './engine/dragonballs.js';

export const STATE_VERSION = 1 as const;

function isCounter(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value >= 0;
}

export function createState(stats: ContributionStats, previous?: SaiyanState | null): SaiyanState {
  const peakContributions = Math.max(
    previous?.peakContributions ?? 0,
    stats.totalContributions,
    stats.peakContributions ?? 0
  );
  // Dragon Balls are a yearly hunt: they follow the trailing 365 days and are
  // not kept at their peak. Forms (peakContributions) still never go down.
  const unlockedBalls = Math.min(7, calculateUnlockedBalls(stats.rollingYearContributions ?? 0));
  const bestStreak = Math.max(
    previous?.bestStreak ?? 0,
    stats.bestStreak ?? 0,
    stats.longestStreak,
    stats.currentStreak
  );
  // Power level is lifetime-derived, so persist its peak for the same reason as
  // XP: private-contribution visibility can change between runs.
  const powerLevel = Math.max(previous?.powerLevel ?? 0, stats.powerLevel ?? 0);
  const bestWeekStreak = Math.max(
    previous?.bestWeekStreak ?? 0,
    stats.bestWeekStreak ?? 0,
    stats.longestWeekStreak ?? 0,
    stats.currentWeekStreak ?? 0
  );

  return {
    version: STATE_VERSION,
    peakContributions,
    unlockedBalls,
    bestStreak,
    bestWeekStreak,
    powerLevel,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Merge live stats with persisted state. Progression is monotonic: a rolling
 * contribution window can never demote a user or remove a Dragon Ball.
 */
export function applyProgression(
  stats: ContributionStats,
  previous?: SaiyanState | null
): { stats: ContributionStats; state: SaiyanState } {
  const state = createState(stats, previous);
  return {
    stats: {
      ...stats,
      peakContributions: state.peakContributions,
      unlockedBalls: state.unlockedBalls,
      bestStreak: state.bestStreak,
      bestWeekStreak: state.bestWeekStreak,
      powerLevel: state.powerLevel,
    },
    state,
  };
}

export function loadState(filePath: string): SaiyanState | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const text = fs.readFileSync(filePath, 'utf-8');
    // The workflow's restore step leaves an empty file on the very first run.
    if (text.trim() === '') return null;
    const raw = JSON.parse(text) as Partial<SaiyanState>;

    // Reject the whole file if any persisted counter is not a sane integer.
    // A partially trusted file could otherwise inject NaN/Infinity into the SVG.
    if (raw.version !== undefined && raw.version !== STATE_VERSION) return null;
    if (!isCounter(raw.peakContributions)) return null;
    if (raw.unlockedBalls !== undefined && (!isCounter(raw.unlockedBalls) || raw.unlockedBalls > 7)) {
      return null;
    }
    if (raw.bestStreak !== undefined && !isCounter(raw.bestStreak)) return null;
    if (raw.powerLevel !== undefined && !isCounter(raw.powerLevel)) return null;
    if (raw.bestWeekStreak !== undefined && !isCounter(raw.bestWeekStreak)) return null;

    return {
      version: STATE_VERSION,
      peakContributions: raw.peakContributions,
      unlockedBalls: raw.unlockedBalls ?? 0,
      bestStreak: raw.bestStreak ?? 0,
      bestWeekStreak: raw.bestWeekStreak ?? 0,
      powerLevel: raw.powerLevel ?? 0,
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date(0).toISOString(),
    };
  } catch (error) {
    console.warn(`[git-saiyan] Ignoring unreadable state file ${filePath}: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Persist state atomically. Keeping `updatedAt` stable when the counters do not
 * change means the generated workflow's staged diff can be empty, so it does
 * not create a commit every single day.
 */
export function saveState(filePath: string, state: SaiyanState): void {
  const directory = path.dirname(path.resolve(filePath));
  fs.mkdirSync(directory, { recursive: true });

  const existing = loadState(filePath);
  const unchanged =
    existing !== null &&
    existing.peakContributions === state.peakContributions &&
    existing.unlockedBalls === state.unlockedBalls &&
    existing.bestStreak === state.bestStreak &&
    (existing.bestWeekStreak ?? 0) === (state.bestWeekStreak ?? 0) &&
    existing.powerLevel === state.powerLevel;

  const payload: SaiyanState = {
    ...state,
    updatedAt: unchanged ? existing.updatedAt : state.updatedAt,
  };

  const temporaryPath = `${filePath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
  fs.renameSync(temporaryPath, filePath);
}
