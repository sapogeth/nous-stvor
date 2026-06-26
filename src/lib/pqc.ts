/**
 * Stvor PQC Transport Layer
 *
 * Hybrid post-quantum key exchange for secure agent task delivery.
 *
 * Protocol:
 *   1. ML-KEM-768 (NIST FIPS 203, @noble/post-quantum) — quantum-resistant KEM
 *   2. ECDH P-256 (classical) — breaks with large quantum computer
 *   3. Hybrid KDF: HKDF-SHA256(ECDH_SS || ML-KEM_SS, 'stvor:task:v1')
 *   4. AES-256-GCM — authenticated task encryption
 *
 * Security guarantee: secure if EITHER classical ECDH OR ML-KEM-768 is secure.
 * A quantum adversary who breaks P-256 still cannot decrypt the task payload.
 *
 * Key sizes (ML-KEM-768):
 *   Encapsulation key (public):  1184 bytes
 *   Decapsulation key (private): 2400 bytes
 *   KEM ciphertext:              1088 bytes
 *   Shared secret:                 32 bytes
 */

import crypto from 'crypto'
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js'

// ── Constants ─────────────────────────────────────────────────────────────────

export const EK_BYTES = 1184  // ML-KEM-768 encapsulation key size
export const DK_BYTES = 2400  // ML-KEM-768 decapsulation key size
export const CT_BYTES = 1088  // ML-KEM-768 KEM ciphertext size
export const SS_BYTES = 32    // Shared secret size

// ── Key Bundle ────────────────────────────────────────────────────────────────

export interface PQCKeyBundle {
  ekB64:        string  // ML-KEM-768 encapsulation key — share with counterparty
  dkB64:        string  // ML-KEM-768 decapsulation key — keep private
  ecdhPubB64:   string  // ECDH P-256 public key DER — share with counterparty
  ecdhPrivB64:  string  // ECDH P-256 private key DER — keep private
}

export function generatePQCKeyBundle(): PQCKeyBundle {
  const { publicKey: ek, secretKey: dk } = ml_kem768.keygen()
  const { publicKey: ecdhPub, privateKey: ecdhPriv } =
    crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  return {
    ekB64:       Buffer.from(ek).toString('base64'),
    dkB64:       Buffer.from(dk).toString('base64'),
    ecdhPubB64:  ecdhPub.export({ format: 'der', type: 'spki' }).toString('base64'),
    ecdhPrivB64: ecdhPriv.export({ format: 'der', type: 'pkcs8' }).toString('base64'),
  }
}

// ── PQC Channel ───────────────────────────────────────────────────────────────

export interface PQCChannel {
  kemCtB64:        string  // ML-KEM-768 KEM ciphertext, 1088 bytes — send to agent
  stvorEphPubB64:  string  // Stvor's ephemeral ECDH public key — send to agent
  ekPreview:       string  // Display: first 40 chars of agent's ek (base64)
  ctPreview:       string  // Display: first 40 chars of KEM ciphertext (base64)
  sessionKeyB64:   string  // 32-byte AES-256-GCM key — NOT sent over wire
}

/** Stvor side: encapsulate a fresh session key for the agent */
export function stvorEncapsulate(
  agentEkB64:      string,
  agentEcdhPubB64: string,
): PQCChannel {
  // 1. ML-KEM-768 encapsulate using agent's public encapsulation key
  const agentEk = new Uint8Array(Buffer.from(agentEkB64, 'base64'))
  const { cipherText: kemCt, sharedSecret: pqcSS } = ml_kem768.encapsulate(agentEk)

  // 2. Stvor generates fresh ephemeral ECDH keypair
  const { publicKey: stvorEphPub, privateKey: stvorEphPriv } =
    crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' })

  // 3. ECDH: Stvor ephemeral private × agent's ECDH public
  const agentEcdhPub = crypto.createPublicKey({
    key: Buffer.from(agentEcdhPubB64, 'base64'),
    format: 'der', type: 'spki',
  })
  const classicalSS = crypto.diffieHellman({
    publicKey: agentEcdhPub,
    privateKey: stvorEphPriv,
  })

  // 4. Hybrid KDF: HKDF-SHA256(ECDH_SS || ML-KEM_SS, info='stvor:task:v1')
  const ikm = Buffer.concat([classicalSS, Buffer.from(pqcSS)])
  const sessionKey = crypto.hkdfSync('sha256', ikm, Buffer.alloc(32), 'stvor:task:v1', 32)

  const kemCtB64      = Buffer.from(kemCt).toString('base64')
  const stvorEphPubB64 = stvorEphPub.export({ format: 'der', type: 'spki' }).toString('base64')

  return {
    kemCtB64,
    stvorEphPubB64,
    ekPreview:     agentEkB64.slice(0, 40) + '...',
    ctPreview:     kemCtB64.slice(0, 40) + '...',
    sessionKeyB64: Buffer.from(sessionKey).toString('base64'),
  }
}

/** Agent side: decapsulate to recover the session key */
export function agentDecapsulate(
  kemCtB64:        string,
  stvorEphPubB64:  string,
  agentDkB64:      string,
  agentEcdhPrivB64: string,
): Buffer {
  // 1. ML-KEM-768 decapsulate
  const kemCt = new Uint8Array(Buffer.from(kemCtB64, 'base64'))
  const dk    = new Uint8Array(Buffer.from(agentDkB64, 'base64'))
  const pqcSS = ml_kem768.decapsulate(kemCt, dk)

  // 2. ECDH: agent private × Stvor ephemeral public
  const stvorEphPub = crypto.createPublicKey({
    key: Buffer.from(stvorEphPubB64, 'base64'),
    format: 'der', type: 'spki',
  })
  const agentEcdhPriv = crypto.createPrivateKey({
    key: Buffer.from(agentEcdhPrivB64, 'base64'),
    format: 'der', type: 'pkcs8',
  })
  const classicalSS = crypto.diffieHellman({
    publicKey: stvorEphPub,
    privateKey: agentEcdhPriv,
  })

  // 3. Same hybrid KDF — must produce identical key as Stvor side
  const ikm = Buffer.concat([classicalSS, Buffer.from(pqcSS)])
  return Buffer.from(crypto.hkdfSync('sha256', ikm, Buffer.alloc(32), 'stvor:task:v1', 32))
}

// ── AES-256-GCM symmetric encryption ─────────────────────────────────────────

export interface EncryptedPayload {
  ivB64:  string  // 12-byte AES-GCM nonce (base64)
  ctB64:  string  // ciphertext (base64)
  tagB64: string  // 16-byte GCM auth tag (base64)
}

export function encryptTask(sessionKey: Buffer, plaintext: string): EncryptedPayload {
  const iv     = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', sessionKey, iv)
  const ct     = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return {
    ivB64:  iv.toString('base64'),
    ctB64:  ct.toString('base64'),
    tagB64: cipher.getAuthTag().toString('base64'),
  }
}

export function decryptTask(sessionKey: Buffer, p: EncryptedPayload): string {
  const iv      = Buffer.from(p.ivB64, 'base64')
  const ct      = Buffer.from(p.ctB64, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-gcm', sessionKey, iv)
  decipher.setAuthTag(Buffer.from(p.tagB64, 'base64'))
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
}

// ── Full envelope: seal on Stvor side, open on agent side ────────────────────

export interface PQCEnvelope {
  channel:   PQCChannel
  encrypted: EncryptedPayload
}

/** Seal: Stvor encrypts task for PQC agent */
export function sealTask(
  agentEkB64:      string,
  agentEcdhPubB64: string,
  plaintext:       string,
): PQCEnvelope {
  const channel    = stvorEncapsulate(agentEkB64, agentEcdhPubB64)
  const sessionKey = Buffer.from(channel.sessionKeyB64, 'base64')
  return { channel, encrypted: encryptTask(sessionKey, plaintext) }
}

/** Open: agent decapsulates and decrypts task */
export function openTask(
  envelope:         PQCEnvelope,
  agentDkB64:       string,
  agentEcdhPrivB64: string,
): string {
  const sessionKey = agentDecapsulate(
    envelope.channel.kemCtB64,
    envelope.channel.stvorEphPubB64,
    agentDkB64,
    agentEcdhPrivB64,
  )
  return decryptTask(sessionKey, envelope.encrypted)
}
