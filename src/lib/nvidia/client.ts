import OpenAI from 'openai'

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'

// Nemotron-3 Super 120B — NVIDIA's flagship reasoning model, used by Hermes agents
export const WORKER_MODEL = 'nvidia/nemotron-3-super-120b-a12b'
// Same model for judge — Nemotron-3 Super has strong instruction-following + reasoning
export const JUDGE_MODEL = 'nvidia/nemotron-3-super-120b-a12b'

const globalKey = '__stvor_nvidia__'
declare global {
  // eslint-disable-next-line no-var
  var __stvor_nvidia__: OpenAI | undefined
}

export const nvidia: OpenAI = global[globalKey] ?? (global[globalKey] = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY ?? 'placeholder',
  baseURL: NVIDIA_BASE_URL,
}))
