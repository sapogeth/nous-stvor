import { StvorEvent } from '../types'
export type { StvorEvent }

type Listener = (event: StvorEvent) => void

class EventBus {
  private sessions = new Map<string, Set<Listener>>()

  subscribe(listener: Listener, sessionId: string): () => void {
    if (!this.sessions.has(sessionId)) this.sessions.set(sessionId, new Set())
    this.sessions.get(sessionId)!.add(listener)
    return () => {
      const set = this.sessions.get(sessionId)
      if (set) {
        set.delete(listener)
        if (set.size === 0) this.sessions.delete(sessionId)
      }
    }
  }

  emit(event: StvorEvent, sessionId: string) {
    for (const listener of this.sessions.get(sessionId) ?? []) {
      try { listener(event) } catch {}
    }
  }
}

const globalKey = '__stvor_event_bus__'
declare global { var __stvor_event_bus__: EventBus | undefined }

export const eventBus: EventBus = global[globalKey] ?? (global[globalKey] = new EventBus())

export function emit(event: StvorEvent, sessionId: string) {
  eventBus.emit(event, sessionId)
}
