import { describe, expect, it } from 'vitest'
import { getCameraStartErrorMessage, getCameraSupportError, isIOSChrome } from '../tracking/camera-errors'

const CHROME_IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.0.0 Mobile/15E148 Safari/604.1'

describe('isIOSChrome', () => {
  it('detects Chrome on iPhone', () => {
    expect(isIOSChrome(CHROME_IOS_UA)).toBe(true)
  })
})

describe('getCameraSupportError', () => {
  it('requires a secure context before camera startup', () => {
    expect(getCameraSupportError({
      isSecureContext: false,
      hasMediaDevices: true,
      userAgent: CHROME_IOS_UA,
    })).toContain('HTTPS')
  })

  it('gives a Chrome iOS hint when getUserMedia is missing', () => {
    expect(getCameraSupportError({
      isSecureContext: true,
      hasMediaDevices: false,
      userAgent: CHROME_IOS_UA,
    })).toContain('Chrome')
  })
})

describe('getCameraStartErrorMessage', () => {
  it('turns Chrome iOS permission denial into Settings instructions', () => {
    expect(getCameraStartErrorMessage(
      new DOMException('Permission denied', 'NotAllowedError'),
      CHROME_IOS_UA,
    )).toContain('iOS Settings > Chrome > Camera')
  })

  it('explains camera-busy failures', () => {
    expect(getCameraStartErrorMessage(
      new DOMException('Could not start video source', 'NotReadableError'),
      CHROME_IOS_UA,
    )).toContain('busy')
  })
})
