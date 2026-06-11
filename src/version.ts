declare const __BUILD_HASH__: string

export const VERSION = '0.10.0'
export const CODENAME = 'Fable'
export const BUILD_HASH: string = typeof __BUILD_HASH__ !== 'undefined' ? __BUILD_HASH__ : 'dev'
export const VERSION_TAG = `v${VERSION}+${BUILD_HASH}`
