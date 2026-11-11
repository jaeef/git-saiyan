export interface AuraTier {
    intensity: 'calm' | 'flaring' | 'super' | 'hyper';
    particleCount: number;
    sparkCount: number;
    pulseSpeed: number;
    label: string;
}
export declare function calculateAuraFromStreak(streak: number, formHasSparks: boolean): AuraTier;
