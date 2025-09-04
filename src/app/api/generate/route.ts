import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase-server";
import { queueTextureGeneration } from "@/lib/comfyui";
import { getWebhookUrl, getWebhookSecret } from "@/lib/webhook-security";
import { applyPresetToWorkflow, defaultModelPresets, getActiveModelPreset } from "@/lib/model-presets";
import workflow from "@/lib/workflow.json";

// Deep clone the workflow to avoid mutations
const getWorkflowCopy = () => JSON.parse(JSON.stringify(workflow));

export async function POST(request: Request) {
  try {
    const { modelFileName, modelId, referenceImageUrl, referenceImageName, mainPrompt, selectedStyle, seed, highQuality, referenceStrength, modelPresetId, modelPresetData, viewAngle } = await request.json();

    if (!modelFileName || !modelId || !mainPrompt || !referenceImageName || !referenceImageUrl || seed === undefined) {
      return NextResponse.json({ success: false, error: "Missing required parameters." }, { status: 400 });
    }

    const supabase = createServer();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }
    
    // 1. Create a new generation record in the database with "processing" status
    const { data: generationRecord, error: dbError } = await supabase
      .from('generations')
      .insert({
        user_id: session.user.id,
        model_id: modelId,
        style_prompt: selectedStyle,
        subject_prompt: mainPrompt,
        reference_image_path: referenceImageUrl,
        seed: seed,
        status: 'processing',
        high_quality: highQuality || false,
        // created_at will be set automatically by the database
      })
      .select('id')
      .single();

    if (dbError) {
      console.error("Database error creating generation:", dbError);
      throw dbError;
    }
    const generationId = generationRecord.id;

    console.log(`Generation: Created new generation ${generationId}`, {
      userId: session.user.id,
      modelId,
      modelFileName,
      referenceImageName,
      mainPrompt,
      selectedStyle,
      highQuality: highQuality || false
    });

    // 2. Prepare the workflow with our data and model preset optimizations
    let apiWorkflow = getWorkflowCopy();
    
    // Apply model preset if provided
    if (modelPresetData) {
      console.log(`Generation: Applying model preset data for "${modelPresetData.displayName}"`);
      console.log(`Generation: Model path: ${modelPresetData.modelPath}`);
      console.log(`Generation: KSampler - Steps: ${modelPresetData.ksampler.steps}, CFG: ${modelPresetData.ksampler.cfg}, Sampler: ${modelPresetData.ksampler.sampler_name}`);
      
      apiWorkflow = applyPresetToWorkflow(apiWorkflow, modelPresetData);
      console.log(`Generation: Successfully applied preset "${modelPresetData.displayName}"`);
    } else if (modelPresetId) {
      console.log(`Generation: Applying model preset by ID ${modelPresetId}`);
      const preset = defaultModelPresets.find(p => p.id === modelPresetId);
      if (preset) {
        console.log(`Generation: Found default preset "${preset.displayName}"`);
        apiWorkflow = applyPresetToWorkflow(apiWorkflow, preset);
      } else {
        console.warn(`Generation: Model preset ${modelPresetId} not found, using standard workflow`);
      }
    } else {
      console.log(`Generation: No model preset specified, using standard workflow`);
    }
    
    // Set the input parameters with smart prompt enhancement
    const styleTemplates = {
      photorealistic: "ultra-realistic photography, high-resolution detail, accurate color rendering, sharp fabric texture, visible stitching, natural lighting, smooth gradients, balanced exposure, crisp edges, noise-free, true-to-life realism",
      stylized: "artistic rendering, stylized textures, enhanced colors, creative interpretation, smooth surfaces",
      vintage: "aged appearance, weathered textures, vintage color palette, worn surfaces, nostalgic feel",
      industrial: "metallic surfaces, industrial materials, mechanical textures, hard edges, utilitarian design",
      artistic: "painterly textures, artistic interpretation, creative colors, expressive surfaces"
    };
    
    const enhancedStylePrompt = styleTemplates[selectedStyle as keyof typeof styleTemplates] || styleTemplates.photorealistic;
    
    apiWorkflow["527"].inputs.mesh = modelFileName;
    apiWorkflow["381"].inputs.image = referenceImageName;
    apiWorkflow["180"].inputs.seed = seed;
    apiWorkflow["605"].inputs.text = enhancedStylePrompt;
    apiWorkflow["606"].inputs.text = mainPrompt;
    
    // Set view angle for depth map selection (Node 313)
    if (viewAngle !== undefined && viewAngle >= 1 && viewAngle <= 6) {
      apiWorkflow["313"].inputs.value = viewAngle;
      console.log(`Generation: Set view angle to ${viewAngle} for node 313`);
    } else {
      console.log(`Generation: Invalid or missing viewAngle: ${viewAngle}, using default value 1`);
      apiWorkflow["313"].inputs.value = 1; // Ensure we always have a valid value
    }
    
    // Set reference strength (IPAdapter weight) - default to 0.7 if not provided
    const finalReferenceStrength = referenceStrength !== undefined ? referenceStrength : 0.7;
    apiWorkflow["549"].inputs.weight = finalReferenceStrength;
    
    console.log(`Generation: Set reference strength to ${finalReferenceStrength} for generation ${generationId}`);

    // 3. Apply speed optimizations if fast mode is selected
    if (!highQuality) {
      console.log(`Generation: Applying fast mode optimizations for ${generationId}`);
      
      // Completely bypass the second Ultimate SD Upscale (Node 227)
      // Connect Node 222 (first upscaler) directly to Face Detailer and other dependent nodes
      apiWorkflow["350"].inputs.image = ["222", 0]; // Face Detailer uses first upscaler output
      apiWorkflow["383"].inputs.images = ["222", 0]; // Preview also uses first upscaler output
      
      // Also reduce steps for faster processing
      apiWorkflow["222"].inputs.steps = 20; // Reduce from 30 to 20
      apiWorkflow["180"].inputs.steps = 30; // Reduce main sampler from 45 to 30
      
      // Completely remove/disable Node 227 by setting it to a dummy operation
      delete apiWorkflow["227"]; // Remove the second upscaler entirely
      
      console.log(`Generation: Fast mode - completely removed second upscaler, reduced steps`);
    } else {
      console.log(`Generation: High quality mode - full upscaling pipeline`);
      // Keep original connections for high quality mode
      apiWorkflow["350"].inputs.image = ["227", 0]; // Face Detailer uses second upscaler
      apiWorkflow["383"].inputs.images = ["227", 0]; // Preview uses second upscaler
    }

    // 4. Add webhook nodes - separate early previews for faster response
    
    // Depth preview webhook (executes as soon as depth map is ready)
    apiWorkflow["997"] = {
      "inputs": {
        "webhook_url": getWebhookUrl(),
        "generationId": generationId.toString(),
        "webhook_secret": getWebhookSecret(),
        "depth_preview": ["314", 0] // Only depth map - executes immediately when node 314 completes
      },
      "class_type": "WebhookNode",
      "_meta": {
        "title": "Depth Preview"
      }
    };
    
    // Front preview webhook (executes as soon as front view is ready)
    apiWorkflow["998"] = {
      "inputs": {
        "webhook_url": getWebhookUrl(),
        "generationId": generationId.toString(),
        "webhook_secret": getWebhookSecret(),
        "front_preview": ["181", 0]  // Only front view - executes immediately when node 181 completes
      },
      "class_type": "WebhookNode",
      "_meta": {
        "title": "Front Preview"
      }
    };
    
    // Final completion webhook (executes when all textures are ready)
    apiWorkflow["999"] = {
      "inputs": {
        "webhook_url": getWebhookUrl(),
        "generationId": generationId.toString(),
        "webhook_secret": getWebhookSecret(),
        "diffuse": ["104", 0],
        "normal": ["373", 0],
        "height": ["454", 0],
        "thumbnail": ["226", 0],
        "depth_preview": ["314", 0], // Include depth again for completeness
        "front_preview": ["181", 0]  // Include front preview for completeness
      },
      "class_type": "WebhookNode",
      "_meta": {
        "title": "Final Completion"
      }
    };

    console.log(`Generation: Configured webhook for generation ${generationId}`, {
      webhookUrl: getWebhookUrl(),
      hasSecret: !!getWebhookSecret(),
      mode: highQuality ? 'high-quality' : 'fast'
    });

    // 5. Queue the prompt to ComfyUI
    try {
      const result = await queueTextureGeneration(apiWorkflow);
      
      console.log(`Generation: Successfully queued generation ${generationId}`, {
        promptId: result.promptId,
        mode: highQuality ? 'high-quality' : 'fast'
      });

      // 6. Update the generation record with the ComfyUI prompt ID for tracking
      await supabase
        .from('generations')
        .update({ comfyui_prompt_id: result.promptId })
        .eq('id', generationId);

    } catch (comfyError: any) {
      console.error(`Generation: Failed to queue generation ${generationId}`, comfyError);
      
      // Mark the generation as failed
      await supabase
        .from('generations')
        .update({ 
          status: 'failed', 
          error_message: comfyError.message
        })
        .eq('id', generationId);

      return NextResponse.json({ 
        success: false, 
        error: `Failed to start generation: ${comfyError.message}` 
      }, { status: 500 });
    }

    // 7. Return the generation ID for client polling
    return NextResponse.json({ 
      success: true, 
      generationId,
      message: `Generation started successfully (${highQuality ? 'High Quality' : 'Fast'} mode)`
    });

  } catch (error: any) {
    console.error("Generation: Unexpected error in generate API:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Internal Server Error" 
    }, { status: 500 });
  }
}