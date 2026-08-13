import {
  bobForPose,
  walkPoseForDistance,
  type WalkPose,
} from "./walk-cycle.js";

const BLINK_FRAMES = new Set([34, 35, 82, 83]);

export interface TimelineOptions {
  frameCount: number;
  canvasWidth: number;
  characterWidth: number;
  stridePixels: number;
  gridLeft: number;
  gridCellStep: number;
  gridColumns: number;
}

export interface TimelineSample {
  x: number;
  bob: 0 | -1;
  pose: WalkPose;
  blink: boolean;
  wakeColumn: number;
}

export function sampleTimeline(
  frameIndex: number,
  options: TimelineOptions,
): TimelineSample {
  validateOptions(frameIndex, options);
  const startX = -options.characterWidth;
  const endX = options.canvasWidth + options.characterWidth;
  const progress = frameIndex / (options.frameCount - 1);
  const x = Math.round(startX + (endX - startX) * progress);
  const distance = x - startX;
  const pose = walkPoseForDistance(distance, options.stridePixels);
  const wakeColumn = calculateWakeColumn(x, options);

  return {
    x,
    bob: bobForPose(pose),
    pose,
    blink: BLINK_FRAMES.has(frameIndex),
    wakeColumn,
  };
}

function calculateWakeColumn(
  x: number,
  options: TimelineOptions,
): number {
  const centerX = x + options.characterWidth / 2;
  const gridRight =
    options.gridLeft + options.gridCellStep * options.gridColumns;
  if (centerX < options.gridLeft || centerX >= gridRight) return -1;
  const relativeColumn = Math.floor(
    (centerX - options.gridLeft) / options.gridCellStep,
  );
  return relativeColumn;
}

function validateOptions(frameIndex: number, options: TimelineOptions): void {
  if (!Number.isInteger(options.frameCount) || options.frameCount < 2) {
    throw new RangeError("frameCount must be an integer greater than one");
  }
  if (!Number.isInteger(frameIndex) || frameIndex < 0 || frameIndex >= options.frameCount) {
    throw new RangeError("frameIndex is outside the animation timeline");
  }
  for (const [name, value] of Object.entries({
    canvasWidth: options.canvasWidth,
    characterWidth: options.characterWidth,
    stridePixels: options.stridePixels,
    gridCellStep: options.gridCellStep,
    gridColumns: options.gridColumns,
  })) {
    if (!Number.isInteger(value) || value < 1) {
      throw new RangeError(`${name} must be a positive integer`);
    }
  }
  if (!Number.isInteger(options.gridLeft)) {
    throw new RangeError("gridLeft must be an integer");
  }
}
