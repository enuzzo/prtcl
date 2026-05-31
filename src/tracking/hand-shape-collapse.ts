import type { HandGesture } from './types'

export const FIST_COLLAPSE_SCALE = 0.38
export const HAND_SHAPE_SCALE_ALPHA = 0.08

export function getHandShapeTargetScale(gesture: HandGesture): number {
  return gesture === 'fist' ? FIST_COLLAPSE_SCALE : 1
}
