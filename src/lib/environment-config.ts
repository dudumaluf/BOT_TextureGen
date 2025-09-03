// Environment-aware configuration for ComfyUI connections
// Supports local development, tunneled local, and cloud deployments

export interface ComfyUIConfig {
  apiUrl: string;
  wsUrl: string;
  webhookUrl: string;
  isLocal: boolean;
  isTunneled: boolean;
}

export function getComfyUIConfig(): ComfyUIConfig {
  const apiUrl = process.env.COMFYUI_API_URL || process.env.NEXT_PUBLIC_COMFYUI_API_URL || 'http://localhost:8188';
  const wsUrl = process.env.COMFYUI_WS_URL || process.env.NEXT_PUBLIC_COMFYUI_WS_URL || 'ws://localhost:8188/ws';
  const webhookUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  const isLocal = apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
  const isTunneled = apiUrl.includes('trycloudflare.com') || apiUrl.includes('ngrok.io');
  
  return {
    apiUrl,
    wsUrl,
    webhookUrl: `${webhookUrl}/api/webhook/comfyui`,
    isLocal,
    isTunneled
  };
}

export function getEnvironmentInfo() {
  const config = getComfyUIConfig();
  
  if (config.isLocal) {
    return {
      type: 'Local Development',
      description: 'ComfyUI running on localhost',
      icon: '🏠'
    };
  } else if (config.isTunneled) {
    return {
      type: 'Hybrid Deployment',
      description: 'Local ComfyUI via secure tunnel',
      icon: '🌉'
    };
  } else {
    return {
      type: 'Cloud Deployment',
      description: 'ComfyUI running on cloud infrastructure',
      icon: '☁️'
    };
  }
}

// Helper function to check if ComfyUI is reachable
export async function checkComfyUIHealth(): Promise<boolean> {
  try {
    const config = getComfyUIConfig();
    const response = await fetch(`${config.apiUrl}/system_stats`, {
      method: 'GET',
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    console.warn('ComfyUI health check failed:', error);
    return false;
  }
}
