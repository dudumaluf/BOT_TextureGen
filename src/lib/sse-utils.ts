// SSE utility functions for sending messages to connected users

// Store active SSE connections by user ID
const connections = new Map<string, WritableStreamDefaultWriter>();

// Function to send SSE message to a specific user
export function sendSSEToUser(userId: string, data: any) {
  const connection = connections.get(userId);
  if (connection) {
    try {
      const encoder = new TextEncoder();
      const message = `data: ${JSON.stringify(data)}\n\n`;
      connection.write(encoder.encode(message));
      console.log(`SSE: Sent message to user ${userId}:`, data);
    } catch (error) {
      console.error(`SSE: Error sending to user ${userId}:`, error);
      connections.delete(userId);
    }
  } else {
    console.log(`SSE: No active connection for user ${userId}`);
  }
}

// Function to broadcast to all connected users (optional)
export function broadcastSSE(data: any) {
  const encoder = new TextEncoder();
  const message = `data: ${JSON.stringify(data)}\n\n`;
  
  for (const [userId, connection] of connections.entries()) {
    try {
      connection.write(encoder.encode(message));
    } catch (error) {
      console.error(`SSE: Error broadcasting to user ${userId}:`, error);
      connections.delete(userId);
    }
  }
}

// Function to add connection (called from route)
export function addSSEConnection(userId: string, writer: WritableStreamDefaultWriter) {
  connections.set(userId, writer);
}

// Function to remove connection (called from route)
export function removeSSEConnection(userId: string) {
  connections.delete(userId);
}
