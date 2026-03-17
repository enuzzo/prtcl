import { nebula } from './nebula'
import { starfield } from './starfield'
import { blackhole } from './blackhole'
import { hopf } from './hopf'
import { storm } from './storm'
import { frequency } from './frequency'
import { galaxy } from './galaxy'
import { cliffordTorus } from './clifford-torus'
import type { Effect } from '../../engine/types'

export const ALL_PRESETS: Effect[] = [frequency, hopf, nebula, starfield, blackhole, storm, galaxy, cliffordTorus]
