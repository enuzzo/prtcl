export interface CameraSupportState {
  isSecureContext: boolean
  hasMediaDevices: boolean
  userAgent: string
}

export function isIOSChrome(userAgent: string): boolean {
  return /\bCriOS\//.test(userAgent) && /iP(hone|ad|od)/.test(userAgent)
}

export function getCameraSupportError(state: CameraSupportState): string | null {
  if (!state.isSecureContext) {
    return 'Camera needs a secure HTTPS page. Open https://prtcl.es/create and try again.'
  }

  if (!state.hasMediaDevices) {
    return isIOSChrome(state.userAgent)
      ? 'Chrome on this iPhone cannot start the camera here. Update iOS/Chrome or use Safari.'
      : 'This browser cannot start the camera for hand tracking.'
  }

  return null
}

export function getCameraStartErrorMessage(error: unknown, userAgent: string): string {
  const name = error instanceof DOMException ? error.name : ''
  const message = error instanceof Error ? error.message : ''
  const chromeIOS = isIOSChrome(userAgent)

  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return chromeIOS
      ? 'Camera blocked in Chrome. Open iOS Settings > Chrome > Camera, enable it, then reload PRTCL.'
      : 'Camera permission is blocked. Allow camera access, then try hand tracking again.'
  }

  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No camera was found for hand tracking.'
  }

  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') {
    return 'Camera is busy or unavailable. Close other camera apps/tabs, then try again.'
  }

  if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
    return 'Camera constraints were rejected. Try again or use Safari on iPhone.'
  }

  return message ? `Hand tracking unavailable: ${message}` : 'Hand tracking unavailable in this browser.'
}
