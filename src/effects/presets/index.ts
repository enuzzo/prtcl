import { nebula } from './nebula'
import { lorenz } from './lorenz'
import { galaxy } from './galaxy'
import { starfield } from './starfield'
import { blackhole } from './blackhole'
import { hopf } from './hopf'
import type { Effect } from '../../engine/types'

export const ALL_PRESETS: Effect[] = [nebula, lorenz, galaxy, starfield, blackhole, hopf]
