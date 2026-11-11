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
export declare function generateParticleTracks(particleCount: number, centerX: number, centerY: number, primaryColor: string, coreColor: string, duration?: number): ParticleTrack[];
export declare function generateKiAuraParticles(timeProgress: number, // 0.0 to 1.0
centerX: number, centerY: number, particleCount: number, primaryColor: string, coreColor: string): KiParticle[];
export declare function generateLightningArcs(timeProgress: number, centerX: number, centerY: number, sparkCount: number, sparkColor?: string): LightningArc[];
