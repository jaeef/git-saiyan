import type { ContributionStats, SaiyanConfig } from './types.js';
export interface YearCollection {
    totalCommitContributions: number;
    totalPullRequestContributions: number;
    totalPullRequestReviewContributions: number;
    contributionCalendar: {
        totalContributions: number;
    };
}
/**
 * Sum per-year collections into lifetime totals.
 *
 * `contributionCalendar.totalContributions` already includes private
 * (restricted) contributions when the user shows them on their profile, so
 * `restrictedContributionsCount` must NOT be added on top: doing so counts
 * every private contribution twice.
 */
export declare function sumLifetimeYears(years: (YearCollection | null | undefined)[]): {
    totalContributions: number;
    totalCommits: number;
    totalPRs: number;
    totalReviews: number;
};
export declare function fetchUserContributions(username: string, token?: string, mock?: boolean, options?: Pick<SaiyanConfig, 'commits' | 'streak' | 'form'>): Promise<ContributionStats>;
export declare function generateMockStats(username: string, options?: Pick<SaiyanConfig, 'commits' | 'streak' | 'form'>): ContributionStats;
