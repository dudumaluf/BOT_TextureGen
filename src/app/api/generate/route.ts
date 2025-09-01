import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase-server";
import { queueTextureGeneration } from "@/lib/comfyui";
import { getWebhookUrl, getWebhookSecret } from "@/lib/webhook-security";
import workflow from "@/lib/workflow.json";

// Deep clone the workflow to avoid mutations
const getWorkflowCopy = () => JSON.parse(JSON.stringify(workflow));

export async function POST(request: Request) {
  try {
    const { modelFileName, modelId, referenceImageUrl, referenceImageName, stylePrompt, subjectPrompt, seed } = await request.json();

    if (!modelFileName || !modelId || !stylePrompt || !subjectPrompt || !referenceImageName || !referenceImageUrl || seed === undefined) {
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
        style_prompt: stylePrompt,
        subject_prompt: subjectPrompt,
        reference_image_path: referenceImageUrl,
        seed: seed,
        status: 'processing',
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
      referenceImageName
    });

    // 2. Prepare the workflow with our data and webhook configuration
    const apiWorkflow = getWorkflowCopy();
    
    // Set the input parameters
    apiWorkflow["527"].inputs.mesh = modelFileName;
    apiWorkflow["381"].inputs.image = referenceImageName;
    apiWorkflow["180"].inputs.seed = seed;
    apiWorkflow["605"].inputs.text = stylePrompt;
    apiWorkflow["606"].inputs.text = subjectPrompt;

    // 3. Add the webhook node to capture the outputs
    const webhookNodeId = "999"; // Use a high number to avoid conflicts
    apiWorkflow[webhookNodeId] = {
      "inputs": {
        "webhook_url": getWebhookUrl(),
        "generationId": generationId.toString(),
        "webhook_secret": getWebhookSecret(),
        "diffuse": ["104", 0],    // Connect to diffuse texture source (CV2 Inpaint Texture)
        "normal": ["373", 0],     // Connect to normal map source (Normal Map Simple)
        "height": ["454", 0],     // Connect to height map source (Deep Bump)
        "thumbnail": ["450", 0]   // Connect to thumbnail source (ImageFromBatch)
      },
      "class_type": "WebhookNode",
      "_meta": {
        "title": "AUTOMATA Webhook"
      }
    };

    console.log(`Generation: Configured webhook for generation ${generationId}`, {
      webhookUrl: getWebhookUrl(),
      hasSecret: !!getWebhookSecret()
    });

    // 4. Queue the prompt to ComfyUI
    try {
      const result = await queueTextureGeneration(apiWorkflow);
      
      console.log(`Generation: Successfully queued generation ${generationId}`, {
        promptId: result.promptId
      });

      // 5. Update the generation record with the ComfyUI prompt ID for tracking
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

    // 6. Return the generation ID for client polling
    return NextResponse.json({ 
      success: true, 
      generationId,
      message: "Generation started successfully"
    });

  } catch (error: any) {
    console.error("Generation: Unexpected error in generate API:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Internal Server Error" 
    }, { status: 500 });
  }
}
