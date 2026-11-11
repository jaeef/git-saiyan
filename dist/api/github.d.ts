import type { ContributionStats, SaiyanConfig } from './types.js';
export declare function fetchUserContributions(username: string, token?: string, mock?: boolean, options?: Pick<SaiyanConfig, 'commits' | 'streak' | 'form' | 'skin'>): Promise<ContributionStats>;
export declare function generateMockStats(username: string, options?: Pick<SaiyanConfig, 'commits' | 'streak' | 'form' | 'skin'>): ContributionStats;
