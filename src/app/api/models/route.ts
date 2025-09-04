import { NextResponse } from "next/server";

interface ModelInfo {
  path: string;
  name: string;
  displayName: string;
  category: 'lightning' | 'turbo' | 'standard' | 'artistic';
}

// API route to fetch available models from ComfyUI
export async function GET() {
  try {
    const comfyApiUrl = process.env.COMFYUI_API_URL || process.env.NEXT_PUBLIC_COMFYUI_API_URL;
    
    if (!comfyApiUrl) {
      return NextResponse.json({ 
        success: false, 
        error: "ComfyUI API URL not configured" 
      }, { status: 500 });
    }

    // Fetch available checkpoints from ComfyUI
    const response = await fetch(`${comfyApiUrl}/object_info/CheckpointLoaderSimple`);
    
    if (!response.ok) {
      throw new Error(`ComfyUI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const checkpoints = data?.input?.required?.ckpt_name?.[0] || [];
    
    // Filter and categorize models
    const models: ModelInfo[] = checkpoints.map((modelPath: string): ModelInfo => {
      const fileName = modelPath.split(/[\\\/]/).pop() || modelPath;
      const name = fileName.replace('.safetensors', '').replace('.ckpt', '');
      
      // Detect model category based on name patterns
      let category: 'lightning' | 'turbo' | 'standard' | 'artistic' = 'standard';
      if (name.toLowerCase().includes('lightning')) category = 'lightning';
      else if (name.toLowerCase().includes('turbo')) category = 'turbo';
      else if (name.toLowerCase().includes('artistic') || name.toLowerCase().includes('anime')) category = 'artistic';
      
      return {
        path: modelPath,
        name: fileName,
        displayName: name,
        category
      };
    });

    return NextResponse.json({ 
      success: true, 
      models: models.sort((a: ModelInfo, b: ModelInfo) => a.displayName.localeCompare(b.displayName))
    });

  } catch (error: unknown) {
    console.error("Error fetching models:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch models" 
    }, { status: 500 });
  }
}
