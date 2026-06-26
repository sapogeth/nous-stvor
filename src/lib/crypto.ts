import crypto from 'crypto'

export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex')
}

export function hmacSign(payload: string): string {
  const secret = process.env.STVOR_SECRET
  if (!secret) throw new Error('[Stvor] STVOR_SECRET env var is not set — cannot sign')
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex')
}

export function hmacVerify(payload: string, signature: string): boolean {
  const expected = hmacSign(payload)
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))
}

// ─── ECDSA P-256 — portable, verifiable without Stvor server ──────────────────

function loadEcKeys() {
  const privB64 = process.env.STVOR_EC_PRIVATE_KEY_B64
  if (!privB64) return null
  try {
    const privateKey = crypto.createPrivateKey({ key: Buffer.from(privB64, 'base64'), format: 'der', type: 'pkcs8' })
    // Derive public key from private key — STVOR_EC_PUBLIC_KEY_B64 is optional
    const publicKey = process.env.STVOR_EC_PUBLIC_KEY_B64
      ? crypto.createPublicKey({ key: Buffer.from(process.env.STVOR_EC_PUBLIC_KEY_B64, 'base64'), format: 'der', type: 'spki' })
      : crypto.createPublicKey(privateKey)
    const pubDer  = publicKey.export({ format: 'der', type: 'spki' }) as Buffer
    const pubB64  = pubDer.toString('base64')
    return {
      privateKey,
      publicKey,
      publicKeyPem: `-----BEGIN PUBLIC KEY-----\n${pubB64.match(/.{1,64}/g)!.join('\n')}\n-----END PUBLIC KEY-----`,
      publicKeyB64: pubB64,
    }
  } catch { return null }
}

export function ecdsaSign(payload: string): string {
  const keys = loadEcKeys()
  if (!keys) {
    try { return hmacSign(payload) } catch { return 'unsigned' }
  }
  const sig = crypto.sign('sha256', Buffer.from(payload, 'utf8'), keys.privateKey)
  return 'ecdsa:' + sig.toString('base64')
}

export function ecdsaVerify(payload: string, signature: string): boolean {
  if (!signature.startsWith('ecdsa:')) {
    // legacy HMAC receipt — verify with HMAC
    try { return hmacVerify(payload, signature) } catch { return false }
  }
  const keys = loadEcKeys()
  if (!keys) return false
  try {
    const sigBuf = Buffer.from(signature.slice(6), 'base64')
    return crypto.verify('sha256', Buffer.from(payload, 'utf8'), keys.publicKey, sigBuf)
  } catch { return false }
}

export function getPublicKeyInfo(): { pem: string; b64: string; algorithm: string } | null {
  const keys = loadEcKeys()
  if (!keys) return null
  return {
    pem: keys.publicKeyPem,
    b64: keys.publicKeyB64,
    algorithm: 'ECDSA P-256 (prime256v1)',
  }
}

export function shortHash(hash: string): string {
  return hash.slice(0, 8) + '...' + hash.slice(-4)
}
