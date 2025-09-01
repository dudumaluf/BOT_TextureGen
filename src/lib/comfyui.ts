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
