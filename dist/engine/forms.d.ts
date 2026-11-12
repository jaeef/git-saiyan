export interface SaiyanForm {
    id: string;
    name: string;
    saga: string;
    minContributions: number;
    maxContributions: number;
    auraColors: {
        primary: string;
        secondary: string;
        core: string;
    };
    hairColor: string;
    hasSparks: boolean;
    sparkColor?: string;
    title: string;
}
/**
 * Lifetime contribution ladder. Thresholds are career totals, not a rolling
 * 12-month window, so a user never loses a form when old commits age out.
 */
export declare const GOKU_FORMS: SaiyanForm[];
export interface FormProgression {
    currentForm: SaiyanForm;
    nextForm: SaiyanForm | null;
    progressPercent: number;
    contributionsToNext: number;
}
export declare function calculateFormProgression(contributions: number): FormProgression;
export declare function findForm(query: string): SaiyanForm | undefined;
