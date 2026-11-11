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
export const NOVA_FORMS: SaiyanForm[] = [
  {
    id: 'ember',
    name: 'EMBER',
    saga: 'Kindling',
    minContributions: 0,
    maxContributions: 49,
    auraColors: { primary: '#f97316', secondary: '#c2410c', core: '#fed7aa' },
    hairColor: '#1e293b',
    hasSparks: false,
    title: 'First Light',
  },
  {
    id: 'spark',
    name: 'SPARK',
    saga: 'Kindling',
    minContributions: 50,
    maxContributions: 149,
    auraColors: { primary: '#fbbf24', secondary: '#d97706', core: '#fef3c7' },
    hairColor: '#1e293b',
    hasSparks: false,
    title: 'The Circuit Opens',
  },
  {
    id: 'flare',
    name: 'FLARE',
    saga: 'Ignition',
    minContributions: 150,
    maxContributions: 299,
    auraColors: { primary: '#fb923c', secondary: '#ea580c', core: '#ffedd5' },
    hairColor: '#292524',
    hasSparks: false,
    title: 'Signal Over Noise',
  },
  {
    id: 'surge',
    name: 'SURGE',
    saga: 'Ignition',
    minContributions: 300,
    maxContributions: 599,
    auraColors: { primary: '#facc15', secondary: '#a16207', core: '#fef08a' },
    hairColor: '#292524',
    hasSparks: true,
    sparkColor: '#fef08a',
    title: 'Momentum Compounds',
  },
  {
    id: 'storm',
    name: 'STORM',
    saga: 'Overclock',
    minContributions: 600,
    maxContributions: 999,
    auraColors: { primary: '#38bdf8', secondary: '#0369a1', core: '#e0f2fe' },
    hairColor: '#0c4a6e',
    hasSparks: true,
    sparkColor: '#bae6fd',
    title: 'Shipping Weather',
  },
  {
    id: 'radiant',
    name: 'RADIANT',
    saga: 'Overclock',
    minContributions: 1000,
    maxContributions: 1749,
    auraColors: { primary: '#fde047', secondary: '#ca8a04', core: '#ffffff' },
    hairColor: '#a16207',
    hasSparks: true,
    sparkColor: '#fef9c3',
    title: 'Review Beacon',
  },
  {
    id: 'corona',
    name: 'CORONA',
    saga: 'Halo Drive',
    minContributions: 1750,
    maxContributions: 2999,
    auraColors: { primary: '#fb7185', secondary: '#be123c', core: '#ffe4e6' },
    hairColor: '#9f1239',
    hasSparks: true,
    sparkColor: '#fecdd3',
    title: 'Crown of Branches',
  },
  {
    id: 'nebula',
    name: 'NEBULA',
    saga: 'Halo Drive',
    minContributions: 3000,
    maxContributions: 4499,
    auraColors: { primary: '#a78bfa', secondary: '#6d28d9', core: '#ede9fe' },
    hairColor: '#5b21b6',
    hasSparks: true,
    sparkColor: '#ddd6fe',
    title: 'Constellation Builder',
  },
  {
    id: 'quasar',
    name: 'QUASAR',
    saga: 'Event Horizon',
    minContributions: 4500,
    maxContributions: 6999,
    auraColors: { primary: '#22d3ee', secondary: '#0e7490', core: '#cffafe' },
    hairColor: '#155e75',
    hasSparks: true,
    sparkColor: '#a5f3fc',
    title: 'Lighthouse of Merges',
  },
  {
    id: 'zenith',
    name: 'ZENITH',
    saga: 'Event Horizon',
    minContributions: 7000,
    maxContributions: Infinity,
    auraColors: { primary: '#e2e8f0', secondary: '#818cf8', core: '#ffffff' },
    hairColor: '#f8fafc',
    hasSparks: true,
    sparkColor: '#c084fc',
    title: 'Full Autonomy',
  },
];

/**
 * Skin registry. Every skin shares the same lifetime thresholds and the same
 * 7-relic milestone track (1/100/500/1500/3000/5000/7000) so switching skins
 * never changes a user's progression.
 */
export const SKINS: Record<string, SkinDefinition> = {
  goku: {
    id: 'goku',
    name: 'GOKU',
    forms: GOKU_FORMS,
    relic: { singular: 'Dragon Ball', plural: 'Dragon Balls', short: 'BALLS' },
    original: false,
  },
  nova: {
    id: 'nova',
    name: 'NOVA',
    forms: NOVA_FORMS,
    relic: { singular: 'Nova Shard', plural: 'Nova Shards', short: 'SHARDS' },
    original: true,
  },
};

export function getSkin(skinId: string = 'goku'): SkinDefinition {
  const skin = SKINS[skinId];
  if (!skin) {
    throw new Error(`Unknown skin "${skinId}". Available skins: ${Object.keys(SKINS).join(', ')}.`);
  }
  return skin;
}

export interface FormProgression {
  currentForm: SaiyanForm;
  nextForm: SaiyanForm | null;
  progressPercent: number;
  contributionsToNext: number;
}

export function calculateFormProgression(
  contributions: number,
  skinId: string = 'goku'
): FormProgression {
  const forms = getSkin(skinId).forms;
  const safeContributions = Number.isFinite(contributions) ? Math.max(0, contributions) : 0;
  let currentForm = forms[0];
  let nextForm: SaiyanForm | null = forms[1] ?? null;

  for (let i = 0; i < forms.length; i++) {
    const form = forms[i];
    if (safeContributions >= form.minContributions) {
      currentForm = form;
      nextForm = i + 1 < forms.length ? forms[i + 1] : null;
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

export function findForm(query: string, skinId: string = 'goku'): SaiyanForm | undefined {
  const needle = query.trim().toLowerCase();
  const forms = getSkin(skinId).forms;
  return (
    forms.find((form) => form.id.toLowerCase() === needle) ??
    forms.find((form) => form.name.toLowerCase().includes(needle))
  );
}
