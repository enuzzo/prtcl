import { nebula } from './nebula'
import { starfield } from './starfield'
import { blackhole } from './blackhole'
import { hopf } from './hopf'
import { storm } from './storm'
import { frequency } from './frequency'
import type { Effect } from '../../engine/types'

export const ALL_PRESETS: Effect[] = [frequency, hopf, nebula, starfield, blackhole, storm]
