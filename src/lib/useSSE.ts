import { useEffect, useRef } from 'react';

interface SSEMessage {
  type: 'connected' | 'heartbeat' | 'generation_completed' | 'error';
  generationId?: string;
  textures?: {
    diffuse?: string;
    normal?: string;
    height?: string;
    thumbnail?: string;
  };
  message?: string;
  timestamp?: number;
}

interface UseSSEOptions {
  onGenerationCompleted?: (data: { generationId: string; textures: any }) => void;
  onConnected?: () => void;
  onError?: (error: Event) => void;
}

export function useSSE(options: UseSSEOptions = {}) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const { onGenerationCompleted, onConnected, onError } = options;

  useEffect(() => {
    // Check if EventSource is available (client-side only)
    if (typeof window === 'undefined' || !window.EventSource) {
      console.warn('SSE: EventSource not available');
      return;
    }

    // Create SSE connection
    const eventSource = new EventSource('/api/sse');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE: Connection opened');
      onConnected?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const data: SSEMessage = JSON.parse(event.data);
        console.log('SSE: Received message:', data);

        switch (data.type) {
          case 'connected':
            console.log('SSE: Connected to server');
            break;
            
          case 'heartbeat':
            // Silent heartbeat
            break;
            
          case 'generation_completed':
            if (data.generationId && data.textures) {
              console.log('SSE: Generation completed:', data.generationId);
              onGenerationCompleted?.({
                generationId: data.generationId,
                textures: data.textures
              });
            }
            break;
            
          default:
            console.log('SSE: Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('SSE: Error parsing message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE: Connection error:', error);
      onError?.(error);
    };

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [onGenerationCompleted, onConnected, onError]);

  // Function to close connection manually
  const closeConnection = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  return {
    closeConnection,
    isConnected: eventSourceRef.current?.readyState === 1 // EventSource.OPEN = 1
  };
}
