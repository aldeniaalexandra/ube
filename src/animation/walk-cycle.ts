export type WalkPose = 0 | 1 | 2 | 3;

const WALK_POSE_COUNT = 4;

export function walkPoseForDistance(
  distance: number,
  stridePixels: number,
): WalkPose {
  if (!Number.isFinite(distance)) {
    throw new RangeError("walk distance must be finite");
  }
  if (!Number.isInteger(stridePixels) || stridePixels < 1) {
    throw new RangeError("stridePixels must be a positive integer");
  }

  const normalizedDistance = Math.max(0, distance);
  return (Math.floor(normalizedDistance / stridePixels) % WALK_POSE_COUNT) as WalkPose;
}

export function bobForPose(pose: WalkPose): 0 | -1 {
  return pose === 1 || pose === 3 ? -1 : 0;
}
