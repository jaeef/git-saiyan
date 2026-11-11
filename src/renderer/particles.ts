export interface KiParticle {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  color: string;
}

export interface LightningArc {
  points: [number, number][];
  color: string;
  width: number;
}

export interface ParticleTrack {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  r0: number;
  r1: number;
  color: string;
  delay: number;
  duration: number;
}

/**
 * Deterministic particle paths for the SVG renderer. Each particle rises from
 * the base of the character to the chest/head while drifting sideways.
 */
export function generateParticleTracks(
  particleCount: number,
  centerX: number,
  centerY: number,
  primaryColor: string,
  coreColor: string,
  duration = 2.6
): ParticleTrack[] {
  const tracks: ParticleTrack[] = [];

  for (let i = 0; i < particleCount; i++) {
    const phase = i / Math.max(1, particleCount);
    const angle = i * 2.39996; // golden angle
    const spread = 42;
    const x0 = centerX + Math.sin(angle) * spread;
    const x1 = centerX + Math.sin(angle + 2.2) * spread * 0.55;
    const y0 = centerY + 52;
    const y1 = centerY - 44 - (i % 3) * 6;

    tracks.push({
      x0: Math.round(x0),
      y0: Math.round(y0),
      x1: Math.round(x1),
      y1: Math.round(y1),
      r0: 1.1 + (i % 3) * 0.5,
      r1: 2.2 + (i % 4) * 0.45,
      color: i % 3 === 0 ? coreColor : primaryColor,
      delay: Number((phase * duration).toFixed(2)),
      duration,
    });
  }

  return tracks;
}

export function generateKiAuraParticles(
  timeProgress: number, // 0.0 to 1.0
  centerX: number,
  centerY: number,
  particleCount: number,
  primaryColor: string,
  coreColor: string
): KiParticle[] {
  const particles: KiParticle[] = [];

  for (let i = 0; i < particleCount; i++) {
    // Phase offset per particle
    const phase = (i / particleCount + timeProgress) % 1.0;
    
    // Float upward from base of Goku (y ~ centerY + 50) to chest/head (y ~ centerY - 40)
    const y = centerY + 50 - phase * 90;

    // Spread outward in a flame shape (wider at bottom, narrower at top)
    const spreadX = (1.0 - phase * 0.4) * 45;
    const angle = i * 2.39996; // Golden angle for even distribution
    const x = centerX + Math.sin(angle + timeProgress * 6) * spreadX;

    // Radius expands then dissipates
    const radius = Math.max(1, Math.round(2 + Math.sin(phase * Math.PI) * 4));
    const opacity = Number((Math.sin(phase * Math.PI) * 0.85).toFixed(2));

    particles.push({
      x: Math.round(x),
      y: Math.round(y),
      radius,
      opacity,
      color: i % 3 === 0 ? coreColor : primaryColor,
    });
  }

  return particles;
}

export function generateLightningArcs(
  timeProgress: number,
  centerX: number,
  centerY: number,
  sparkCount: number,
  sparkColor: string = '#38bdf8'
): LightningArc[] {
  const arcs: LightningArc[] = [];
  if (sparkCount <= 0) return arcs;

  for (let s = 0; s < sparkCount; s++) {
    // Only flash on certain fractional intervals to create crackling effect
    const cycle = (timeProgress * 4 + s * 0.25) % 1.0;
    if (cycle > 0.45) continue; // Spark disappears half the time!

    const angle = s * (Math.PI / 2) + timeProgress * 2;
    const startX = centerX + Math.cos(angle) * 35;
    const startY = centerY + Math.sin(angle) * 35;

    // Generate 3-segment jagged lightning
    const midX = startX + (Math.sin(s * 13) > 0 ? 12 : -12);
    const midY = startY - 14;
    const endX = midX + (Math.cos(s * 7) > 0 ? 10 : -10);
    const endY = midY - 12;

    arcs.push({
      points: [
        [Math.round(startX), Math.round(startY)],
        [Math.round(midX), Math.round(midY)],
        [Math.round(endX), Math.round(endY)],
      ],
      color: sparkColor,
      width: 1.5,
    });
  }

  return arcs;
}

