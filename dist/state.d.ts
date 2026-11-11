import type { ContributionStats, SaiyanState } from './api/types.js';
export declare const STATE_VERSION: 1;
export declare function createState(stats: ContributionStats, previous?: SaiyanState | null): SaiyanState;
/**
 * Merge live stats with persisted state. Progression is monotonic: a rolling
 * contribution window can never demote a user or remove a Dragon Ball.
 */
export declare function applyProgression(stats: ContributionStats, previous?: SaiyanState | null): {
    stats: ContributionStats;
    state: SaiyanState;
};
export declare function loadState(filePath: string): SaiyanState | null;
/**
 * Persist state atomically. Keeping `updatedAt` stable when the counters do not
 * change means the generated workflow's staged diff can be empty, so it does
 * not create a commit every single day.
 */
export declare function saveState(filePath: string, state: SaiyanState): void;
