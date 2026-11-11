import { graphql } from '@octokit/graphql';
import type { ContributionDay, ContributionStats, SaiyanConfig } from './types.js';
import { findForm } from '../engine/forms.js';
import {
  buildRecentDays,
  colorForCount,
  computeCurrentStreak,
  computeLongestStreak,
  computePowerLevel,
  dateKeyOffset,
  toDateKey,
} from '../engine/activity.js';
import { calculateUnlockedBalls } from '../engine/dragonballs.js';

interface ContributionCalendar {
  totalContributions: number;
  weeks: {
    contributionDays: {
      date: string;
      contributionCount: number;
      color: string;
      weekday: number;
    }[];
  }[];
}

interface ContributionsCollection {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
  restrictedContributionsCount: number;
  contributionYears: number[];
  contributionCalendar: ContributionCalendar;
}

interface GraphQLResponse {
  user: {
    createdAt: string;
    contributionsCollection: ContributionsCollection;
  } | null;
}

interface YearCollection {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
  restrictedContributionsCount: number;
  contributionCalendar: { totalContributions: number };
}

interface LifetimeResponse {
  user: Record<string, YearCollection | null> | null;
}

const CONTRIBUTIONS_QUERY = `
  query getUserContributions($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      createdAt
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        restrictedContributionsCount
        contributionYears
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              color
              weekday
            }
          }
        }
      }
    }
  }
`;

export async function fetchUserContributions(
  username: string,
  token?: string,
  mock: boolean = false,
  options?: Pick<SaiyanConfig, 'commits' | 'streak' | 'form' | 'skin'>
): Promise<ContributionStats> {
  if (
    mock ||
    options?.commits !== undefined ||
    options?.streak !== undefined ||
    options?.form !== undefined
  ) {
    return generateMockStats(username, options);
  }

  if (!token) {
    throw new Error(
      'A GitHub token is required for live stats. Set GITHUB_TOKEN, pass --token, or use --mock for demo data.'
    );
  }

  const now = new Date();
  const from = new Date(now.getTime() - 365 * 86_400_000);
  const today = toDateKey(now);

  let response: GraphQLResponse;
  try {
    response = await graphql<GraphQLResponse>(CONTRIBUTIONS_QUERY, {
      username,
      from: from.toISOString(),
      to: now.toISOString(),
      headers: { authorization: `bearer ${token}` },
    });
  } catch (error) {
    throw new Error(`Failed to fetch contributions for @${username}: ${(error as Error).message}`);
  }

  if (!response.user) {
    throw new Error(
      `GitHub user @${username} was not found. If this repository is owned by an organization, set github_user_name to a personal account.`
    );
  }

  const collection = response.user.contributionsCollection;
  const calendar = collection.contributionCalendar;

  const allDays: ContributionDay[] = [];
  for (const week of calendar.weeks) {
    for (const day of week.contributionDays) {
      allDays.push({
        date: day.date,
        count: day.contributionCount,
        color: day.color,
        weekday: day.weekday,
      });
    }
  }

  const currentStreak = computeCurrentStreak(allDays, today);
  const longestStreak = computeLongestStreak(allDays);
  const recentDays = buildRecentDays(allDays, today, 14);
  const rollingYearContributions = calendar.totalContributions;

  let totalContributions = rollingYearContributions;
  let totalCommits = collection.totalCommitContributions;
  let totalPRs = collection.totalPullRequestContributions;
  let totalReviews = collection.totalPullRequestReviewContributions;
  let lifetimeEstimated = false;

  try {
    const years = [...new Set(collection.contributionYears)]
      .filter((year) => Number.isInteger(year) && year > 2007)
      .sort((a, b) => a - b);

    if (years.length > 0) {
      const currentYear = now.getUTCFullYear();
      const aliases = years
        .map((year, index) => {
          const start = `${year}-01-01T00:00:00Z`;
          const end = year >= currentYear ? now.toISOString() : `${year}-12-31T23:59:59Z`;
          return `y${index}: contributionsCollection(from: "${start}", to: "${end}") {
            totalCommitContributions
            totalPullRequestContributions
            totalPullRequestReviewContributions
            restrictedContributionsCount
            contributionCalendar { totalContributions }
          }`;
        })
        .join('\n');

      const lifetimeQuery = `
        query getUserLifetime($username: String!) {
          user(login: $username) {
            ${aliases}
          }
        }
      `;

      const lifetime = await graphql<LifetimeResponse>(lifetimeQuery, {
        username,
        headers: { authorization: `bearer ${token}` },
      });

      if (lifetime.user) {
        totalContributions = 0;
        totalCommits = 0;
        totalPRs = 0;
        totalReviews = 0;

        for (const year of Object.values(lifetime.user)) {
          if (!year) continue;
          totalContributions +=
            (year.contributionCalendar?.totalContributions ?? 0) +
            (year.restrictedContributionsCount ?? 0);
          totalCommits += year.totalCommitContributions ?? 0;
          totalPRs += year.totalPullRequestContributions ?? 0;
          totalReviews += year.totalPullRequestReviewContributions ?? 0;
        }

        if (totalContributions <= 0) {
          totalContributions = rollingYearContributions;
          lifetimeEstimated = true;
        }
      } else {
        lifetimeEstimated = true;
      }
    }
  } catch (error) {
    lifetimeEstimated = true;
    console.warn(
      `[git-saiyan] Lifetime totals unavailable, using trailing year: ${(error as Error).message}`
    );
  }

  const bestStreak = Math.max(longestStreak, currentStreak);
  const powerLevel = computePowerLevel({
    commits: totalCommits,
    prs: totalPRs,
    reviews: totalReviews,
    bestStreak,
  });

  return {
    username,
    totalContributions,
    rollingYearContributions,
    totalCommits,
    totalPRs,
    totalReviews,
    currentStreak,
    longestStreak,
    bestStreak,
    powerLevel,
    recentDays,
    joinedYear: new Date(response.user.createdAt).getUTCFullYear(),
    peakContributions: totalContributions,
    unlockedBalls: calculateUnlockedBalls(totalContributions),
    lifetimeEstimated,
    isMock: false,
    skinId: 'goku',
  };
}

export function generateMockStats(
  username: string,
  options?: Pick<SaiyanConfig, 'commits' | 'streak' | 'form' | 'skin'>
): ContributionStats {
  const form = options?.form ? findForm(options.form, options.skin) : undefined;
  const targetLifetime = options?.commits ?? (form ? form.minContributions + 15 : 624);
  const targetStreak = options?.streak ?? 12;
  const rollingYearContributions = Math.max(1, Math.round(targetLifetime / 4));
  const today = toDateKey(new Date());

  const days: ContributionDay[] = [];
  for (let offset = 29; offset >= 0; offset--) {
    const date = dateKeyOffset(today, -offset);
    const active = targetStreak > 0 && offset < targetStreak;
    const count = active ? Math.max(1, Math.round(Math.abs(Math.sin((offset + 1) * 0.7)) * 6)) : 0;
    days.push({
      date,
      count,
      color: colorForCount(count),
      weekday: new Date(`${date}T00:00:00Z`).getUTCDay(),
    });
  }

  const currentStreak = computeCurrentStreak(days, today);
  const longestStreak = Math.max(computeLongestStreak(days), targetStreak, 28);
  const bestStreak = Math.max(longestStreak, currentStreak);
  const totalCommits = targetLifetime;
  const totalPRs = Math.round(targetLifetime / 20);
  const totalReviews = Math.round(targetLifetime / 40);

  return {
    username,
    totalContributions: targetLifetime,
    rollingYearContributions,
    totalCommits,
    totalPRs,
    totalReviews,
    currentStreak,
    longestStreak,
    bestStreak,
    powerLevel: computePowerLevel({
      commits: totalCommits,
      prs: totalPRs,
      reviews: totalReviews,
      bestStreak,
    }),
    recentDays: buildRecentDays(days, today, 14),
    joinedYear: 2019,
    peakContributions: targetLifetime,
    unlockedBalls: calculateUnlockedBalls(targetLifetime),
    isMock: true,
    skinId: options?.skin ?? 'goku',
  };
}
