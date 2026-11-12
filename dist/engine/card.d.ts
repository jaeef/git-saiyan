/**
 * Everything the card shows, derived once from the stats so the SVG and GIF
 * renderers can never disagree: form, power-up stage, yearly Dragon Balls,
 * next-form countdown, and the streak in the chosen mode.
 */
import type { ContributionStats } from '../api/types.js';
import { calculateDragonBalls } from './dragonballs.js';
import { type SaiyanForm } from './forms.js';
import { type AuraTier } from './streak.js';
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
    nextBall: {
        star: number;
        at: number;
    } | null;
    /** Countdown to the next form, or null at the max form. */
    eta: {
        days: number | null;
        long: string;
        short: string;
    } | null;
    streak: {
        mode: StreakMode;
        current: number;
        best: number;
        unit: 'D' | 'W';
        noun: string;
    };
    dragonBalls: ReturnType<typeof calculateDragonBalls>;
}
/** Validate the streak mode option. `daily` is the default. */
export declare function parseStreakMode(value: string | undefined): StreakMode;
/** Power-up stage: thirds of the way from the current form to the next. */
export declare function powerStage(contributions: number, currentForm: SaiyanForm, nextForm: SaiyanForm | null): PowerStage;
/**
 * Countdown to the next form from the trailing-year pace.
 * Returns long ("in ~5 months") and short ("~5 MO") labels.
 */
export declare function estimateEta(contributionsToNext: number, rollingYearContributions: number): CardModel['eta'];
/** Map a weekly streak onto the daily aura tiers (0-1 calm, 2-3, 4-7, 8+ weeks). */
export declare function auraDaysForWeeks(weeks: number): number;
export declare function buildCardModel(stats: ContributionStats, timeProgress?: number, orbit?: Parameters<typeof calculateDragonBalls>[2]): CardModel;
