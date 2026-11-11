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
export interface SkinDefinition {
    id: string;
    name: string;
    /** Ladder thresholds are shared; each skin provides its own names and art. */
    forms: SaiyanForm[];
    relic: {
        singular: string;
        plural: string;
        /** Short HUD label, e.g. BALLS or SHARDS. */
        short: string;
    };
    /**
     * True when the skin is our original art and safe for any distribution.
     * False for fan skins with third-party characters.
     */
    original: boolean;
}
/**
 * NOVA — our original, distribution-safe skin. A hooded energy courier whose
 * visor and core glow with each tier. Same thresholds, different identity.
 */
export declare const NOVA_FORMS: SaiyanForm[];
/**
 * Skin registry. Every skin shares the same lifetime thresholds and the same
 * 7-relic milestone track (1/100/500/1500/3000/5000/7000) so switching skins
 * never changes a user's progression.
 */
export declare const SKINS: Record<string, SkinDefinition>;
export declare function getSkin(skinId?: string): SkinDefinition;
export interface FormProgression {
    currentForm: SaiyanForm;
    nextForm: SaiyanForm | null;
    progressPercent: number;
    contributionsToNext: number;
}
export declare function calculateFormProgression(contributions: number, skinId?: string): FormProgression;
export declare function findForm(query: string, skinId?: string): SaiyanForm | undefined;
