const DOWNSCALE_THRESHOLD = 0.034   // ~30fps before reducing (was 50fps)
const RECOVERY_THRESHOLD = 0.020    // ~50fps to start recovering (was 71fps)
const RECOVERY_FRAMES = 30          // Recover faster (was 60)
const FLOOR = 5000                  // Minimum 5k (was 1k — too few for dense effects)
const SCALE_FACTOR = 0.85           // Step down a bit more aggressively
const RECOVERY_FACTOR = 1.15        // Recover faster (was 1.05)

export class AdaptiveQuality {
  private baseCount: number
  private currentCount: number
  private goodFrames = 0

  constructor(baseCount: number) {
    this.baseCount = baseCount
    this.currentCount = baseCount
  }

  update(delta: number): void {
    if (delta > DOWNSCALE_THRESHOLD) {
      this.currentCount = Math.max(FLOOR, Math.floor(this.currentCount * SCALE_FACTOR))
      this.goodFrames = 0
    } else if (delta < RECOVERY_THRESHOLD) {
      this.goodFrames++
      if (this.goodFrames >= RECOVERY_FRAMES && this.currentCount < this.baseCount) {
        this.currentCount = Math.min(this.baseCount, Math.floor(this.currentCount * RECOVERY_FACTOR))
        this.goodFrames = 0
      }
    } else {
      this.goodFrames = 0
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
