declare const __BUILD_HASH__: string

export const VERSION = '0.8.0'
export const CODENAME = 'Waveform'
export const BUILD_HASH: string = typeof __BUILD_HASH__ !== 'undefined' ? __BUILD_HASH__ : 'dev'
export const VERSION_TAG = `v${VERSION}+${BUILD_HASH}`
