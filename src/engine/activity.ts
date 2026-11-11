import type { ContributionDay } from '../api/types.js';

const DAY_MS = 86_400_000;

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function dateKeyOffset(today: string, offsetDays: number): string {
  return toDateKey(new Date(new Date(`${today}T00:00:00Z`).getTime() + offsetDays * DAY_MS));
}

/**
 * GitHub pads the contribution calendar with the remaining days of the current
 * week. Those future days have count 0 and would otherwise break streak and
 * activity calculations, so drop anything after today.
 */
export function filterUpcoming(days: ContributionDay[], today: string): ContributionDay[] {
  return days.filter((day) => day.date <= today);
}

export function sortDaysDesc(days: ContributionDay[]): ContributionDay[] {
  return [...days].sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Current streak, counting today if active, otherwise allowing the streak to
 * continue from yesterday. A gap of two or more days breaks it.
 */
export function computeCurrentStreak(days: ContributionDay[], today: string): number {
  const sorted = sortDaysDesc(filterUpcoming(days, today));
  if (sorted.length === 0) return 0;

  let index = 0;
  // Today may legitimately be empty while the streak is still alive.
  if (sorted[0].date === today && sorted[0].count === 0) index = 1;

  const start = sorted[index];
  const yesterday = dateKeyOffset(today, -1);
  if (!start || (start.date !== today && start.date !== yesterday)) return 0;

  let streak = 0;
  for (; index < sorted.length; index++) {
    if (sorted[index].count > 0) streak++;
    else break;
  }
  return streak;
}

export function computeLongestStreak(days: ContributionDay[]): number {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  let best = 0;
  let current = 0;
  for (const day of sorted) {
    if (day.count > 0) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

export function colorForCount(count: number): string {
  if (count <= 0) return '#161b22';
  if (count < 3) return '#0e4429';
  if (count < 6) return '#006d32';
  if (count < 10) return '#26a641';
  return '#39d353';
}

/**
 * Build exactly `count` recent days ending today, filling gaps with zeroes.
 * GitHub may omit today depending on timezone, so never rely on slicing.
 */
export function buildRecentDays(
  days: ContributionDay[],
  today: string,
  count = 14
): ContributionDay[] {
  const byDate = new Map(days.map((day) => [day.date, day]));
  const recent: ContributionDay[] = [];

  for (let offset = count - 1; offset >= 0; offset--) {
    const date = dateKeyOffset(today, -offset);
    const existing = byDate.get(date);
    const dayCount = existing?.count ?? 0;
    recent.push({
      date,
      count: dayCount,
      color: existing?.color || colorForCount(dayCount),
      weekday: new Date(`${date}T00:00:00Z`).getUTCDay(),
    });
  }

  return recent;
}

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
export function computePowerLevel({ commits, prs, reviews, bestStreak }: PowerLevelInput): number {
  return Math.max(0, Math.round(commits * 10 + prs * 30 + reviews * 20 + bestStreak * 50));
}
