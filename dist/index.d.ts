import type { SaiyanConfig, ContributionStats } from './api/types.js';
export declare function runSaiyan(config: SaiyanConfig): Promise<ContributionStats>;
export declare function runAction(): Promise<void>;
