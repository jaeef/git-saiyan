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
    /** Dragon Balls held this year (0-7), from the trailing 365 days. */
    unlockedBalls: number;
    /** Consecutive Monday-Sunday weeks with activity (current week counts once active). */
    currentWeekStreak?: number;
    /** Longest weekly streak in the trailing year. */
    longestWeekStreak?: number;
    /** Best weekly streak ever recorded (state-aware). */
    bestWeekStreak?: number;
    /** Which streak drives the aura and HUD. Defaults to 'daily'. */
    streakMode?: 'daily' | 'weekly';
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
    /** 'daily' (default) or 'weekly' streaks for the aura and HUD. */
    streakMode?: string;
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
    /** Best weekly streak ever recorded. */
    bestWeekStreak?: number;
    /** Peak lifetime power level. */
    powerLevel: number;
    updatedAt: string;
}
