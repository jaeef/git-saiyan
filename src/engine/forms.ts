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
export const GOKU_FORMS: SaiyanForm[] = [
  {
    id: 'kid',
    name: 'KID GOKU',
    saga: 'Dragon Ball (Early)',
    minContributions: 0,
    maxContributions: 49,
    auraColors: { primary: '#ffffff', secondary: '#e2e8f0', core: '#f8fafc' },
    hairColor: '#1e293b',
    hasSparks: false,
    title: 'The Boy from Mount Paozu',
  },
  {
    id: 'base',
    name: 'BASE GOKU',
    saga: 'Saiyan Saga',
    minContributions: 50,
    maxContributions: 149,
    auraColors: { primary: '#cbd5e1', secondary: '#94a3b8', core: '#f1f5f9' },
    hairColor: '#0f172a',
    hasSparks: false,
    title: 'Earth’s Greatest Defender',
  },
  {
    id: 'kaioken',
    name: 'KAIO-KEN',
    saga: 'Namek Saga',
    minContributions: 150,
    maxContributions: 299,
    auraColors: { primary: '#ef4444', secondary: '#b91c1c', core: '#fca5a5' },
    hairColor: '#450a0a',
    hasSparks: false,
    title: 'Kaio-ken Multiplier x20',
  },
  {
    id: 'ssj1',
    name: 'SUPER SAIYAN',
    saga: 'Frieza Saga',
    minContributions: 300,
    maxContributions: 599,
    auraColors: { primary: '#facc15', secondary: '#eab308', core: '#fef08a' },
    hairColor: '#fef08a',
    hasSparks: false,
    title: 'The Legendary Super Saiyan',
  },
  {
    id: 'ssj2',
    name: 'SUPER SAIYAN 2',
    saga: 'Cell Games',
    minContributions: 600,
    maxContributions: 999,
    auraColors: { primary: '#fde047', secondary: '#ca8a04', core: '#ffffff' },
    hairColor: '#fef9c3',
    hasSparks: true,
    sparkColor: '#67e8f9',
    title: 'Ascended Super Saiyan',
  },
  {
    id: 'ssj3',
    name: 'SUPER SAIYAN 3',
    saga: 'Majin Buu Saga',
    minContributions: 1000,
    maxContributions: 1749,
    auraColors: { primary: '#eab308', secondary: '#a16207', core: '#ffffff' },
    hairColor: '#fde047',
    hasSparks: true,
    sparkColor: '#38bdf8',
    title: 'Beyond the Limit',
  },
  {
    id: 'ssj4',
    name: 'SUPER SAIYAN 4',
    saga: 'Dragon Ball GT',
    minContributions: 1750,
    maxContributions: 2999,
    auraColors: { primary: '#dc2626', secondary: '#7f1d1d', core: '#fbbf24' },
    hairColor: '#0f172a',
    hasSparks: true,
    sparkColor: '#f59e0b',
    title: 'Primal Golden Great Ape',
  },
  {
    id: 'ssjg',
    name: 'SUPER SAIYAN GOD',
    saga: 'Battle of Gods',
    minContributions: 3000,
    maxContributions: 4499,
    auraColors: { primary: '#f43f5e', secondary: '#be123c', core: '#fda4af' },
    hairColor: '#fb7185',
    hasSparks: false,
    title: 'Divine Ki Awoken',
  },
  {
    id: 'ssjb',
    name: 'SUPER SAIYAN BLUE',
    saga: 'Resurrection F / Future Trunks',
    minContributions: 4500,
    maxContributions: 6999,
    auraColors: { primary: '#06b6d4', secondary: '#0284c7', core: '#a5f3fc' },
    hairColor: '#38bdf8',
    hasSparks: true,
    sparkColor: '#e0f2fe',
    title: 'Super Saiyan God Super Saiyan',
  },
  {
    id: 'mui',
    name: 'ULTRA INSTINCT',
    saga: 'Tournament of Power',
    minContributions: 7000,
    maxContributions: Infinity,
    auraColors: { primary: '#e2e8f0', secondary: '#818cf8', core: '#ffffff' },
    hairColor: '#f8fafc',
    hasSparks: true,
    sparkColor: '#c084fc',
    title: 'Autonomous Ultra Instinct',
  },
];

export interface FormProgression {
  currentForm: SaiyanForm;
  nextForm: SaiyanForm | null;
  progressPercent: number;
  contributionsToNext: number;
}

export function calculateFormProgression(contributions: number): FormProgression {
  const safeContributions = Number.isFinite(contributions) ? Math.max(0, contributions) : 0;
  let currentForm = GOKU_FORMS[0];
  let nextForm: SaiyanForm | null = GOKU_FORMS[1] ?? null;

  for (let i = 0; i < GOKU_FORMS.length; i++) {
    const form = GOKU_FORMS[i];
    if (safeContributions >= form.minContributions) {
      currentForm = form;
      nextForm = i + 1 < GOKU_FORMS.length ? GOKU_FORMS[i + 1] : null;
    } else {
      break;
    }
  }

  let progressPercent = 100;
  let contributionsToNext = 0;

  if (nextForm) {
    const range = nextForm.minContributions - currentForm.minContributions;
    const currentProgress = safeContributions - currentForm.minContributions;
    progressPercent = range > 0 ? Math.min(100, Math.max(0, Math.round((currentProgress / range) * 100))) : 100;
    contributionsToNext = Math.max(0, nextForm.minContributions - safeContributions);
  }

  return { currentForm, nextForm, progressPercent, contributionsToNext };
}

export function findForm(query: string): SaiyanForm | undefined {
  const needle = query.trim().toLowerCase();
  return (
    GOKU_FORMS.find((form) => form.id.toLowerCase() === needle) ??
    GOKU_FORMS.find((form) => form.name.toLowerCase().includes(needle))
  );
}
