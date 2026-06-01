import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearPendingCameraStream,
  requestUserCamera,
  setPendingCameraStream,
  takePendingCameraStream,
} from '../tracking/camera-stream'

function mockStream(): MediaStream {
  return {
    getTracks: () => [{ stop: vi.fn() }],
  } as unknown as MediaStream
}

afterEach(() => {
  clearPendingCameraStream()
  vi.restoreAllMocks()
})

describe('pending camera stream handoff', () => {
  it('passes one stream from the user tap into the tracking hook', () => {
    const stream = mockStream()
    setPendingCameraStream(stream)

    expect(takePendingCameraStream()).toBe(stream)
    expect(takePendingCameraStream()).toBeNull()
  })
})

describe('requestUserCamera', () => {
  it('falls back when ideal constraints are rejected', async () => {
    const fallback = mockStream()
    const getUserMedia = vi.fn()
      .mockRejectedValueOnce(new DOMException('Rejected', 'OverconstrainedError'))
      .mockResolvedValueOnce(fallback)

    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia },
      userAgent: 'test',
    })

    await expect(requestUserCamera()).resolves.toBe(fallback)
    expect(getUserMedia).toHaveBeenCalledTimes(2)
    expect(getUserMedia).toHaveBeenLastCalledWith({ video: { facingMode: 'user' } })
  })
})
