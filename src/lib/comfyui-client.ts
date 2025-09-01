import { v4 as uuidv4 } from 'uuid';

const API_URL = process.env.NEXT_PUBLIC_COMFYUI_API_URL;
const WS_URL = process.env.NEXT_PUBLIC_COMFYUI_WS_URL;

export type GenerationEvent = 
  | { type: 'progress', data: { value: number, max: number, node: string } }
  | { type: 'status', data: { exec_info: { queue_remaining: number } } }
  | { type: 'execution_start', data: { prompt_id: string } }
  | { type: 'execution_error', data: { prompt_id: string, error: any } }
  | { type: 'execution_cached', data: { prompt_id: string, nodes: string[] } }
  | { type: 'executed', data: { prompt_id: string, output: any, node: string } };

export function listenToServer(
  promptId: string,
  clientId: string,
  onEvent: (event: GenerationEvent) => void
) {
  const socket = new WebSocket(`${WS_URL}?clientId=${clientId}`);

  socket.onmessage = (event) => {
    if (typeof event.data === 'string') {
      const message = JSON.parse(event.data);
      if (message.data.prompt_id === promptId) {
        onEvent(message);
      }
      if (message.type === 'status' && message.data.status.exec_info.queue_remaining === 0) {
        socket.close();
      }
    }
  };

  socket.onerror = (err) => {
    console.error("WebSocket connection error:", err);
    socket.close();
  };
  
  return () => socket.close();
}

export function getImageUrl(nodeOutput: any): string | null {
  if (!nodeOutput?.images?.[0]) return null;
  const img = nodeOutput.images[0];
  return `${API_URL}/view?filename=${img.filename}&subfolder=${img.subfolder}&type=${img.type}`;
}
