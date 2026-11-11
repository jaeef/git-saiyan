import type { ContributionDay } from '../api/types.js';
export declare function toDateKey(date: Date): string;
export declare function dateKeyOffset(today: string, offsetDays: number): string;
/**
 * GitHub pads the contribution calendar with the remaining days of the current
 * week. Those future days have count 0 and would otherwise break streak and
 * activity calculations, so drop anything after today.
 */
export declare function filterUpcoming(days: ContributionDay[], today: string): ContributionDay[];
export declare function sortDaysDesc(days: ContributionDay[]): ContributionDay[];
/**
 * Current streak, counting today if active, otherwise allowing the streak to
 * continue from yesterday. A gap of two or more days breaks it.
 */
export declare function computeCurrentStreak(days: ContributionDay[], today: string): number;
export declare function computeLongestStreak(days: ContributionDay[]): number;
export declare function colorForCount(count: number): string;
/**
 * Build exactly `count` recent days ending today, filling gaps with zeroes.
 * GitHub may omit today depending on timezone, so never rely on slicing.
 */
export declare function buildRecentDays(days: ContributionDay[], today: string, count?: number): ContributionDay[];
export interface PowerLevelInput {
    commits: number;
    prs: number;
    reviews: number;
    bestStreak: number;
}
/**
 * Power level uses disjoint inputs. `totalContributions` already contains PRs
 * and reviews, so it must not be used here or those events count twice.
 */
export declare function computePowerLevel({ commits, prs, reviews, bestStreak }: PowerLevelInput): number;
