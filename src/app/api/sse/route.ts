import { NextRequest } from 'next/server';
import { createServer } from '@/lib/supabase-server';

// Store active SSE connections by user ID
const connections = new Map<string, WritableStreamDefaultWriter>();

export async function GET(request: NextRequest) {
  const supabase = createServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`;
      controller.enqueue(encoder.encode(data));

      // Store the connection for this user
      const writer = new WritableStream({
        write(chunk) {
          controller.enqueue(chunk);
        },
        close() {
          connections.delete(userId);
          controller.close();
        }
      }).getWriter();

      connections.set(userId, writer);

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          const heartbeatData = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`;
          writer.write(encoder.encode(heartbeatData));
        } catch (error) {
          console.error('SSE heartbeat error:', error);
          clearInterval(heartbeat);
          connections.delete(userId);
        }
      }, 30000); // Every 30 seconds

      // Clean up on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        connections.delete(userId);
        try {
          controller.close();
        } catch (error) {
          // Connection already closed
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Helper functions moved to separate module to avoid Next.js route export conflicts
