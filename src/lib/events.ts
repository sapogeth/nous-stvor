import { StvorEvent } from '../types'
export type { StvorEvent }

type Listener = (event: StvorEvent) => void

class EventBus {
  private listeners = new Set<Listener>()

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  emit(event: StvorEvent) {
    for (const listener of this.listeners) {
      try { listener(event) } catch {}
    }
  }
}

const globalKey = '__stvor_event_bus__'
declare global { var __stvor_event_bus__: EventBus | undefined }

export const eventBus: EventBus = global[globalKey] ?? (global[globalKey] = new EventBus())

export function emit(event: StvorEvent) {
  eventBus.emit(event)
}
