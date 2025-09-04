import { v4 as uuidv4 } from 'uuid';

const API_URL = process.env.COMFYUI_API_URL || process.env.NEXT_PUBLIC_COMFYUI_API_URL;
const WS_URL = process.env.COMFYUI_WS_URL || process.env.NEXT_PUBLIC_COMFYUI_WS_URL;

export interface TextureOutput {
  diffuse: string | null;
  normal: string | null;
  height: string | null;
  thumbnail: string | null;
}

export async function uploadImage(file: File, fileName: string): Promise<{ name: string }> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_COMFYUI_API_URL is not set");
  }
  const formData = new FormData();
  formData.append("image", file, fileName);
  formData.append("overwrite", "true");

  const response = await fetch(`${API_URL}/upload/image`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.statusText}`);
  }
  return response.json();
}

export async function queueTextureGeneration(workflow: any): Promise<{ success: boolean; promptId: string }> {
  if (!API_URL) {
    throw new Error("COMFYUI_API_URL environment variable is not set");
  }

  try {
    const clientId = uuidv4();
    
    console.log('ComfyUI: Queuing generation with workflow', {
      clientId,
      workflowNodes: Object.keys(workflow).length
    });

    const response = await fetch(`${API_URL}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow, client_id: clientId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to queue prompt: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    const promptId = result.prompt_id;

    if (!promptId) {
      throw new Error('No prompt_id returned from ComfyUI');
    }

    console.log('ComfyUI: Successfully queued generation', { promptId, clientId });

    return {
      success: true,
      promptId
    };

  } catch (error: any) {
    console.error('ComfyUI: Error queuing generation', error);
    throw error;
  }
}

// Keep the old function name for backward compatibility, but mark as deprecated
export async function startTextureGeneration(workflow: any): Promise<{ success: boolean; promptId: string }> {
  console.warn('startTextureGeneration is deprecated, use queueTextureGeneration instead');
  return queueTextureGeneration(workflow);
}

// ComfyUI Queue Management Functions
export interface ComfyUIQueueItem {
  prompt_id: string;
  number: number;
  prompt: any;
  extra_data: any;
  outputs_to_execute: string[];
}

export interface ComfyUIQueueStatus {
  exec_info: {
    queue_remaining: number;
  };
  queue_running: ComfyUIQueueItem[];
  queue_pending: ComfyUIQueueItem[];
}

export async function getComfyUIQueue(): Promise<ComfyUIQueueStatus> {
  if (!API_URL) {
    throw new Error("COMFYUI_API_URL environment variable is not set");
  }

  try {
    const response = await fetch(`${API_URL}/queue`);
    if (!response.ok) {
      throw new Error(`Failed to get queue: ${response.statusText}`);
    }
    return response.json();
  } catch (error: any) {
    console.error('ComfyUI: Error getting queue', error);
    throw error;
  }
}

export async function clearComfyUIQueue(): Promise<{ success: boolean }> {
  if (!API_URL) {
    throw new Error("COMFYUI_API_URL environment variable is not set");
  }

  try {
    const response = await fetch(`${API_URL}/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clear: true }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to clear queue: ${response.statusText}`);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('ComfyUI: Error clearing queue', error);
    throw error;
  }
}

export async function deleteQueueItem(promptId: string): Promise<{ success: boolean }> {
  if (!API_URL) {
    throw new Error("COMFYUI_API_URL environment variable is not set");
  }

  try {
    const response = await fetch(`${API_URL}/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delete: [promptId] }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete queue item: ${response.statusText}`);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('ComfyUI: Error deleting queue item', error);
    throw error;
  }
}

export async function interruptComfyUI(): Promise<{ success: boolean }> {
  if (!API_URL) {
    throw new Error("COMFYUI_API_URL environment variable is not set");
  }

  try {
    const response = await fetch(`${API_URL}/interrupt`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to interrupt ComfyUI: ${response.statusText}`);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('ComfyUI: Error interrupting', error);
    throw error;
  }
}

export async function getComfyUISystemStats(): Promise<any> {
  if (!API_URL) {
    throw new Error("COMFYUI_API_URL environment variable is not set");
  }

  try {
    const response = await fetch(`${API_URL}/system_stats`);
    if (!response.ok) {
      throw new Error(`Failed to get system stats: ${response.statusText}`);
    }
    return response.json();
  } catch (error: any) {
    console.error('ComfyUI: Error getting system stats', error);
    throw error;
  }
}

export async function getComfyUIHistory(maxItems: number = 50): Promise<any> {
  if (!API_URL) {
    throw new Error("COMFYUI_API_URL environment variable is not set");
  }

  try {
    const response = await fetch(`${API_URL}/history/${maxItems}`);
    if (!response.ok) {
      throw new Error(`Failed to get history: ${response.statusText}`);
    }
    return response.json();
  } catch (error: any) {
    console.error('ComfyUI: Error getting history', error);
    throw error;
  }
}