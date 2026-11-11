export interface ContributionDay {
  date: string;
  count: number;
  color: string;
  weekday: number;
}

export interface ContributionStats {
  username: string;
  /** Lifetime contributions across all years. */
  totalContributions: number;
  /** Contributions in the trailing 365 days. */
  rollingYearContributions: number;
  /** Lifetime commit contributions. */
  totalCommits: number;
  /** Lifetime pull request contributions. */
  totalPRs: number;
  /** Lifetime pull request review contributions. */
  totalReviews: number;
  currentStreak: number;
  longestStreak: number;
  /** Best streak ever recorded (state-aware). */
  bestStreak: number;
  powerLevel: number;
  recentDays: ContributionDay[];
  joinedYear?: number;
  /** Highest lifetime contribution count ever recorded. */
  peakContributions: number;
  /** Dragon Balls unlocked (0-7). */
  unlockedBalls: number;
  /** True when lifetime totals could not be fetched and the rolling year was used. */
  lifetimeEstimated?: boolean;
  /** True when the numbers are generated demo data. */
  isMock?: boolean;
}

export interface SaiyanConfig {
  username: string;
  token?: string;
  outputs?: string[];
  /** Path to the persisted progression state. Omit to disable persistence. */
  statePath?: string;
  mock?: boolean;
  commits?: number;
  streak?: number;
  form?: string;
}

export interface SaiyanState {
  version: 1;
  peakContributions: number;
  unlockedBalls: number;
  bestStreak: number;
  /** Peak lifetime power level. */
  powerLevel: number;
  updatedAt: string;
}
