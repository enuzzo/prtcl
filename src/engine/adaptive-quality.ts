const DOWNSCALE_THRESHOLD = 0.034   // ~30fps before reducing
const RECOVERY_THRESHOLD = 0.020    // ~50fps to start recovering
const FLOOR = 5000                  // Minimum 5k particles
const SCALE_FACTOR = 0.85           // Step down aggressively on lag
const RAMP_PER_FRAME = 150          // Add 150 particles per good frame (smooth linear ramp)

export class AdaptiveQuality {
  private baseCount: number
  private currentCount: number

  constructor(baseCount: number) {
    this.baseCount = baseCount
    // Start at floor and ramp up smoothly — avoids stuttering on cold start
    this.currentCount = FLOOR
  }

  update(delta: number): void {
    if (delta > DOWNSCALE_THRESHOLD) {
      // Drop fast on lag
      this.currentCount = Math.max(FLOOR, Math.floor(this.currentCount * SCALE_FACTOR))
    } else if (delta < RECOVERY_THRESHOLD && this.currentCount < this.baseCount) {
      // Smooth linear ramp — add a small fixed amount each good frame
      // No stutter because the jump is tiny (~150 particles, not 15%)
      this.currentCount = Math.min(this.baseCount, this.currentCount + RAMP_PER_FRAME)
    }
  }

  getParticleCount(): number {
    return this.currentCount
  }

  setBaseCount(count: number): void {
    this.baseCount = count
    this.currentCount = Math.min(this.currentCount, count)
  }
}
