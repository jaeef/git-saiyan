export interface DragonBall {
    star: number;
    name: string;
    isUnlocked: boolean;
    x: number;
    y: number;
    z: number;
    scale: number;
    opacity: number;
}
export interface OrbitConfig {
    centerX: number;
    centerY: number;
    radiusX: number;
    radiusY: number;
}
/** Lifetime contribution milestones for the seven Dragon Balls. */
export declare const DRAGON_BALL_MILESTONES: readonly [1, 100, 500, 1500, 3000, 5000, 7000];
export declare function calculateUnlockedBalls(totalContributions: number): number;
export declare function nextDragonBallMilestone(totalContributions: number): {
    star: number;
    at: number;
} | null;
export declare function calculateDragonBalls(unlockedCount: number, timeProgress: number, // 0.0 to 1.0 (animation loop cycle)
orbitConfig?: OrbitConfig): DragonBall[];
