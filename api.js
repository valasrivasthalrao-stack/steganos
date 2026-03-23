// All /api/* requests are proxied to http://localhost:8080 by Vite
const BASE = ''

async function post(path, formData) {
  const res  = await fetch(`${BASE}${path}`, { method: 'POST', body: formData })
  const data = await res.json()
  if (!res.ok) throw new Error(data.details || data.error || `HTTP ${res.status}`)
  return data
}

export async function healthCheck() {
  const res = await fetch(`${BASE}/api/steg/health`)
  if (!res.ok) throw new Error('Backend unreachable')
  return res.json()
}

export async function checkCapacity(imageFile) {
  const fd = new FormData()
  fd.append('image', imageFile)
  return post('/api/steg/capacity', fd)
}

export async function encodeMessage(imageFile, message, passkey = '') {
  const fd = new FormData()
  fd.append('image',   imageFile)
  fd.append('message', message)
  fd.append('passkey', passkey)
  return post('/api/steg/encode', fd)
}

export async function decodeMessage(imageFile, passkey = '') {
  const fd = new FormData()
  fd.append('image',   imageFile)
  fd.append('passkey', passkey)
  return post('/api/steg/decode', fd)
}

export function downloadBase64Png(base64, filename) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  const blob  = new Blob([bytes], { type: 'image/png' })
  const url   = URL.createObjectURL(blob)
  const a     = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}
