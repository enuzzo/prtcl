import { getCameraSupportError } from './camera-errors'

let pendingCameraStream: MediaStream | null = null

export function getCurrentCameraSupportError(): string | null {
  return getCameraSupportError({
    isSecureContext: window.isSecureContext,
    hasMediaDevices: typeof navigator.mediaDevices?.getUserMedia === 'function',
    userAgent: navigator.userAgent,
  })
}

export async function requestUserCamera(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 320 },
        height: { ideal: 240 },
        facingMode: { ideal: 'user' },
      },
    })
  } catch (error) {
    const name = error instanceof DOMException ? error.name : ''
    if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
      return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
    }
    throw error
  }
}

export function setPendingCameraStream(stream: MediaStream): void {
  pendingCameraStream?.getTracks().forEach((track) => track.stop())
  pendingCameraStream = stream
}

export function takePendingCameraStream(): MediaStream | null {
  const stream = pendingCameraStream
  pendingCameraStream = null
  return stream
}

export function clearPendingCameraStream(): void {
  pendingCameraStream?.getTracks().forEach((track) => track.stop())
  pendingCameraStream = null
}
