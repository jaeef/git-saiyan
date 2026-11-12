export interface DragonBall {
  star: number;
  name: string;
  isUnlocked: boolean;
  x: number;
  y: number;
  z: number; // depth: positive = in front, negative = behind
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
export const DRAGON_BALL_MILESTONES = [10, 25, 50, 100, 200, 350, 500] as const;

export function calculateUnlockedBalls(yearContributions: number): number {
  const safeTotal = Number.isFinite(yearContributions) ? yearContributions : 0;
  let unlocked = 0;
  for (const milestone of DRAGON_BALL_MILESTONES) {
    if (safeTotal >= milestone) unlocked++;
  }
  return unlocked;
}

export function nextDragonBallMilestone(totalContributions: number): { star: number; at: number } | null {
  for (let i = 0; i < DRAGON_BALL_MILESTONES.length; i++) {
    if (totalContributions < DRAGON_BALL_MILESTONES[i]) {
      return { star: i + 1, at: DRAGON_BALL_MILESTONES[i] };
    }
  }
  return null;
}

export function calculateDragonBalls(
  unlockedCount: number,
  timeProgress: number, // 0.0 to 1.0 (animation loop cycle)
  orbitConfig: OrbitConfig = { centerX: 250, centerY: 130, radiusX: 185, radiusY: 55 }
): DragonBall[] {
  const balls: DragonBall[] = [];
  const totalBalls = 7;
  const safeUnlocked = Math.min(totalBalls, Math.max(0, Math.round(unlockedCount)));

  for (let i = 0; i < totalBalls; i++) {
    const star = i + 1;
    const isUnlocked = star <= safeUnlocked;

    // Angle evenly distributed in the circle + rotational advance
    const baseAngle = (i / totalBalls) * 2 * Math.PI;
    const currentAngle = baseAngle + timeProgress * 2 * Math.PI;

    const x = Math.round(orbitConfig.centerX + orbitConfig.radiusX * Math.cos(currentAngle));
    const sinVal = Math.sin(currentAngle);
    const y = Math.round(orbitConfig.centerY + orbitConfig.radiusY * sinVal);

    // Depth: -1 (back of orbit) to +1 (front of orbit)
    const z = sinVal;
    const depth = (z + 1) / 2; // 0..1

    // Scale: 0.85 when in background, 1.15 when in foreground
    const scale = Number((0.85 + 0.3 * depth).toFixed(2));

    // Locked balls stay visible as dim silhouettes; unlocked balls brighten
    // as they swing toward the viewer.
    const opacity = isUnlocked ? Number((0.75 + 0.25 * depth).toFixed(2)) : 0.12;

    balls.push({
      star,
      name: `${star}-Star Dragon Ball`,
      isUnlocked,
      x,
      y,
      z,
      scale,
      opacity,
    });
  }

  // Painter's algorithm: back of the orbit first.
  return balls.sort((a, b) => a.z - b.z);
}
