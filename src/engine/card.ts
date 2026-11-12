/**
 * Everything the card shows, derived once from the stats so the SVG and GIF
 * renderers can never disagree: form, power-up stage, yearly Dragon Balls,
 * next-form countdown, and the streak in the chosen mode.
 */
import type { ContributionStats } from '../api/types.js';
import { calculateDragonBalls, calculateUnlockedBalls, nextDragonBallMilestone } from './dragonballs.js';
import { calculateFormProgression, type SaiyanForm } from './forms.js';
import { calculateAuraFromStreak, type AuraTier } from './streak.js';

export type StreakMode = 'daily' | 'weekly';
/** 0, 1 or 2: the power-up stage inside the current form. */
export type PowerStage = 0 | 1 | 2;

export interface CardModel {
  currentForm: SaiyanForm;
  nextForm: SaiyanForm | null;
  progressPercent: number;
  contributionsToNext: number;
  stage: PowerStage;
  aura: AuraTier;
  unlockedBalls: number;
  nextBall: { star: number; at: number } | null;
  /** Countdown to the next form, or null at the max form. */
  eta: { days: number | null; long: string; short: string } | null;
  streak: { mode: StreakMode; current: number; best: number; unit: 'D' | 'W'; noun: string };
  dragonBalls: ReturnType<typeof calculateDragonBalls>;
}

/** Validate the streak mode option. `daily` is the default. */
export function parseStreakMode(value: string | undefined): StreakMode {
  const mode = (value ?? 'daily').trim().toLowerCase() || 'daily';
  if (mode !== 'daily' && mode !== 'weekly') {
    throw new Error(`Unknown streak mode "${value}". Use daily or weekly.`);
  }
  return mode;
}

/** Power-up stage: thirds of the way from the current form to the next. */
export function powerStage(contributions: number, currentForm: SaiyanForm, nextForm: SaiyanForm | null): PowerStage {
  if (!nextForm) return 2;
  const span = nextForm.minContributions - currentForm.minContributions;
  const fraction = span > 0 ? (contributions - currentForm.minContributions) / span : 1;
  return fraction >= 2 / 3 ? 2 : fraction >= 1 / 3 ? 1 : 0;
}

/**
 * Countdown to the next form from the trailing-year pace.
 * Returns long ("in ~5 months") and short ("~5 MO") labels.
 */
export function estimateEta(contributionsToNext: number, rollingYearContributions: number): CardModel['eta'] {
  if (contributionsToNext <= 0) return { days: 0, long: 'any day now', short: 'NOW' };
  const perDay = rollingYearContributions / 365;
  if (!(perDay > 0)) return { days: null, long: 'no recent pace', short: 'NO PACE' };
  const days = Math.ceil(contributionsToNext / perDay);
  const unit = (count: number, word: string, short: string) => ({
    days,
    long: `in ~${count} ${word}${count === 1 ? '' : 's'}`,
    short: `~${count} ${short}`,
  });
  if (days < 14) return unit(days, 'day', 'D');
  if (days < 60) return unit(Math.round(days / 7), 'week', 'WK');
  if (days < 730) return unit(Math.round(days / 30.4), 'month', 'MO');
  const years = Math.round(days / 365);
  if (years > 20) return { days, long: 'in 20+ years', short: '20+ YR' };
  return unit(years, 'year', 'YR');
}

/** Map a weekly streak onto the daily aura tiers (0-1 calm, 2-3, 4-7, 8+ weeks). */
export function auraDaysForWeeks(weeks: number): number {
  if (weeks >= 8) return 14;
  if (weeks >= 4) return 7;
  if (weeks >= 2) return 3;
  return 0;
}

export function buildCardModel(stats: ContributionStats, timeProgress = 0, orbit?: Parameters<typeof calculateDragonBalls>[2]): CardModel {
  const contributions = stats.peakContributions ?? stats.totalContributions;
  const { currentForm, nextForm, progressPercent, contributionsToNext } = calculateFormProgression(contributions);
  const mode: StreakMode = stats.streakMode === 'weekly' ? 'weekly' : 'daily';
  const streak =
    mode === 'weekly'
      ? {
          mode,
          current: stats.currentWeekStreak ?? 0,
          best: Math.max(stats.bestWeekStreak ?? 0, stats.longestWeekStreak ?? 0, stats.currentWeekStreak ?? 0),
          unit: 'W' as const,
          noun: 'week',
        }
      : {
          mode,
          current: stats.currentStreak,
          best: stats.bestStreak ?? stats.longestStreak,
          unit: 'D' as const,
          noun: 'day',
        };
  const auraDays = mode === 'weekly' ? auraDaysForWeeks(streak.current) : streak.current;
  const yearContributions = stats.rollingYearContributions ?? 0;
  const unlockedBalls = stats.unlockedBalls ?? calculateUnlockedBalls(yearContributions);

  return {
    currentForm,
    nextForm,
    progressPercent,
    contributionsToNext,
    stage: powerStage(contributions, currentForm, nextForm),
    aura: calculateAuraFromStreak(auraDays, currentForm.hasSparks),
    unlockedBalls,
    nextBall: nextDragonBallMilestone(yearContributions),
    eta: nextForm ? estimateEta(contributionsToNext, yearContributions) : null,
    streak,
    dragonBalls: calculateDragonBalls(unlockedBalls, timeProgress, orbit),
  };
}
