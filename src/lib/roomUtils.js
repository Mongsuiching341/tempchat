// Small helpers for room codes and expiry math. Kept framework-agnostic
// so they're easy to unit test if you add tests later.

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I for readability

export function generateRoomCode(length = 6) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return code
}

export function minutesFromNowISO(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString()
}

export function isExpired(expiresAtISO) {
  return new Date(expiresAtISO).getTime() <= Date.now()
}

export function formatCountdown(expiresAtISO) {
  const msLeft = new Date(expiresAtISO).getTime() - Date.now()
  if (msLeft <= 0) return '00:00:00'
  const totalSeconds = Math.floor(msLeft / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export const EXPIRY_OPTIONS = [
  { label: '15 minutes', minutes: 15 },
  { label: '1 hour', minutes: 60 },
  { label: '6 hours', minutes: 60 * 6 },
  { label: '24 hours', minutes: 60 * 24 },
  { label: '3 days', minutes: 60 * 24 * 3 },
]

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain',
]