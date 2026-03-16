const DOWNSCALE_THRESHOLD = 0.020
const RECOVERY_THRESHOLD = 0.014
const RECOVERY_FRAMES = 60
const FLOOR = 1000
const SCALE_FACTOR = 0.9
const RECOVERY_FACTOR = 1.05

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
