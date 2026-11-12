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
/**
 * Yearly hunt: milestones over the trailing 365 days of contributions.
 * Balls can be lost after a quiet year; forms never go down.
 */
export declare const DRAGON_BALL_MILESTONES: readonly [10, 25, 50, 100, 200, 350, 500];
export declare function calculateUnlockedBalls(yearContributions: number): number;
export declare function nextDragonBallMilestone(totalContributions: number): {
    star: number;
    at: number;
} | null;
export declare function calculateDragonBalls(unlockedCount: number, timeProgress: number, // 0.0 to 1.0 (animation loop cycle)
orbitConfig?: OrbitConfig): DragonBall[];
