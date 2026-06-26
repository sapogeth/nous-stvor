import { eventBus, StvorEvent } from '@/lib/events'

export const dynamic = 'force-dynamic'

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send connected ping
      controller.enqueue(encoder.encode('data: {"type":"CONNECTED"}\n\n'))

      const unsubscribe = eventBus.subscribe((event: StvorEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch {
          // client disconnected
        }
      })

      // Heartbeat every 15s
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          clearInterval(heartbeat)
          unsubscribe()
        }
      }, 15000)

      return () => {
        clearInterval(heartbeat)
        unsubscribe()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
