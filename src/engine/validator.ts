export interface ValidationResult {
  valid: boolean
  errors: string[]
}

const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /\bdocument\b/, name: 'document' },
  { pattern: /\bwindow\b/, name: 'window' },
  { pattern: /\bfetch\b/, name: 'fetch' },
  { pattern: /\beval\b/, name: 'eval' },
  { pattern: /\bimport\b/, name: 'import' },
  { pattern: /\brequire\b/, name: 'require' },
  { pattern: /\bXMLHttpRequest\b/, name: 'XMLHttpRequest' },
  { pattern: /\bWebSocket\b/, name: 'WebSocket' },
  { pattern: /\bglobalThis\b/, name: 'globalThis' },
  { pattern: /\bself\b/, name: 'self' },
  { pattern: /\btop\b/, name: 'top' },
  { pattern: /\bparent\b/, name: 'parent' },
  { pattern: /\bopener\b/, name: 'opener' },
  { pattern: /\blocation\b/, name: 'location' },
  { pattern: /\bcookie\b/, name: 'cookie' },
  { pattern: /\blocalStorage\b/, name: 'localStorage' },
  { pattern: /\bsessionStorage\b/, name: 'sessionStorage' },
  { pattern: /\bsetTimeout\b/, name: 'setTimeout' },
  { pattern: /\bsetInterval\b/, name: 'setInterval' },
  { pattern: /\bFunction\b/, name: 'Function' },
]

export function validateEffectCode(code: string): ValidationResult {
  const errors: string[] = []
  for (const { pattern, name } of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      errors.push(`Forbidden pattern detected: ${name}`)
    }
  }
  return { valid: errors.length === 0, errors }
}
