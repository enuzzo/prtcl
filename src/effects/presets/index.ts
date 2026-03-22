import { nebula } from './nebula'
import { starfield } from './starfield'
import { blackhole } from './blackhole'
import { hopf } from './hopf'
import { storm } from './storm'
import { frequency } from './frequency'
import { cliffordTorus } from './clifford-torus'

import { perlinNoise } from './perlin-noise'
import { paperFleet } from './paper-fleet'
import { fireflies } from './fireflies'
import { electromagnetic } from './electromagnetic'
import { murmuration } from './murmuration'
import { hyperflower } from './hyperflower'
import { axiom } from './axiom'

import { textWave } from './text-wave'
import { textScatter } from './text-scatter'
import { textDissolve } from './text-dissolve'
import { textTerrain } from './text-terrain'
import type { Effect } from '../../engine/types'

export const ALL_PRESETS: Effect[] = [frequency, hopf, nebula, starfield, blackhole, storm, cliffordTorus, electromagnetic, perlinNoise, hyperflower, fireflies, murmuration, axiom, paperFleet, textWave, textScatter, textDissolve, textTerrain]
