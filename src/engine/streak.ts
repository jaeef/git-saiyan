export interface AuraTier {
  intensity: 'calm' | 'flaring' | 'super' | 'hyper';
  particleCount: number;
  sparkCount: number;
  pulseSpeed: number;
  label: string;
}

export function calculateAuraFromStreak(streak: number, formHasSparks: boolean): AuraTier {
  if (streak >= 14) {
    return {
      intensity: 'hyper',
      particleCount: 18,
      sparkCount: formHasSparks ? 4 : 2,
      pulseSpeed: 1.8,
      label: 'Hyper Saiyan Ki Storm',
    };
  }

  if (streak >= 7) {
    return {
      intensity: 'super',
      particleCount: 12,
      sparkCount: formHasSparks ? 2 : 1,
      pulseSpeed: 1.4,
      label: 'Blazing Ki Flare',
    };
  }

  if (streak >= 3) {
    return {
      intensity: 'flaring',
      particleCount: 8,
      sparkCount: formHasSparks ? 1 : 0,
      pulseSpeed: 1.1,
      label: 'Active Ki Aura',
    };
  }

  return {
    intensity: 'calm',
    particleCount: 4,
    sparkCount: 0,
    pulseSpeed: 0.8,
    label: 'Calm Idle Ki',
  };
}

