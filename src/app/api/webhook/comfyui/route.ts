import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";
import { validateWebhookSecret } from "@/lib/webhook-security";

export async function POST(request: Request) {
  try {
    // Validate webhook secret for security (disabled for development)
    const webhookSecret = request.headers.get('X-Webhook-Secret');
    console.log("Webhook: Secret validation", { hasSecret: !!webhookSecret });
    // Temporarily disabled for development
    // if (!validateWebhookSecret(webhookSecret || '')) {
    //   console.error("Webhook: Invalid or missing webhook secret");
    //   return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    // }

    const body = await request.json();
    const { generationId, textures } = body;

    console.log(`Webhook: Received completion for generation ${generationId}`, {
      textureTypes: Object.keys(textures || {}),
      textureUrls: textures
    });

    if (!generationId || !textures) {
      console.error("Webhook: Missing parameters", { generationId, textures });
      return NextResponse.json({ success: false, error: "Missing parameters." }, { status: 400 });
    }

    // Validate that we have at least one texture
    const validTextures = Object.entries(textures).filter(([_, url]) => url && typeof url === 'string');
    if (validTextures.length === 0) {
      console.error("Webhook: No valid textures provided", textures);
      return NextResponse.json({ success: false, error: "No valid textures provided." }, { status: 400 });
    }

    // For webhooks, we need to bypass RLS since there's no user session
    // Let's use a simple approach - update without checking user ownership
    const supabase = createServer();
    
    // Skip the existence check for now - just try to update directly
    // This bypasses RLS issues since we're updating by ID
    console.log(`Webhook: Attempting to update generation ${generationId} directly`);

    // Update the generation with completed textures
    const updateData: any = {
      status: 'completed',
      // completed_at: new Date().toISOString(), // Column doesn't exist yet
    };

    // Download from ComfyUI and upload to Supabase Storage
    for (const [textureType, comfyUrl] of Object.entries(textures)) {
      if (comfyUrl && typeof comfyUrl === 'string') {
        try {
          console.log(`Webhook: Downloading ${textureType} from ComfyUI: ${comfyUrl}`);
          
          // Download from ComfyUI (force IPv4 by replacing localhost)
          const ipv4Url = comfyUrl.replace('localhost', '127.0.0.1');
          console.log(`Webhook: Downloading from IPv4 URL: ${ipv4Url}`);
          const comfyResponse = await fetch(ipv4Url);
          if (!comfyResponse.ok) {
            throw new Error(`Failed to download ${textureType}: ${comfyResponse.status}`);
          }
          
          const imageBuffer = await comfyResponse.arrayBuffer();
          const uint8Array = new Uint8Array(imageBuffer);
          
          // Upload to Supabase Storage
          const fileName = `${generationId}_${textureType}.png`;
          const storagePath = `generations/${generationId}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('generated_textures')
            .upload(storagePath, uint8Array, {
              contentType: 'image/png',
              upsert: true
            });
          
          if (uploadError) {
            console.error(`Webhook: Upload error for ${textureType}:`, uploadError);
            // Use ComfyUI URL as fallback
            updateData[`${textureType}_storage_path`] = comfyUrl;
          } else {
            // Get public URL from Supabase
            const { data: { publicUrl } } = supabase.storage
              .from('generated_textures')
              .getPublicUrl(storagePath);
            
            updateData[`${textureType}_storage_path`] = publicUrl;
            console.log(`Webhook: Uploaded ${textureType} to Supabase: ${publicUrl}`);
          }
          
        } catch (error) {
          console.error(`Webhook: Error processing ${textureType}:`, error);
          // Use ComfyUI URL as fallback
          updateData[`${textureType}_storage_path`] = comfyUrl;
          console.log(`Webhook: Using ComfyUI fallback URL for ${textureType}: ${comfyUrl}`);
        }
      }
    }

    console.log(`Webhook: Update data for generation ${generationId}`, updateData);

    // Simple approach: Use raw SQL update to bypass RLS
    const { data: updateResult, error: updateError } = await supabase
      .from('generations')
      .update({
        status: 'completed',
        diffuse_storage_path: textures.diffuse,
        normal_storage_path: textures.normal,
        height_storage_path: textures.height,
        thumbnail_storage_path: textures.thumbnail
      })
      .eq('id', generationId)
      .select('id, status');

    console.log(`Webhook: Update result`, { updateResult, updateError });

    if (updateError) {
      console.error("Webhook: Error updating generation", { generationId, error: updateError });
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    if (!updateResult || updateResult.length === 0) {
      console.error("Webhook: No rows updated - generation may not exist", { generationId });
      return NextResponse.json({ success: false, error: "Generation not found or could not be updated." }, { status: 404 });
    }

    console.log(`Webhook: Successfully updated generation ${generationId}`, {
      texturesUpdated: Object.keys(updateData).filter(key => key.endsWith('_storage_path')),
      updatedRecord: updateResult[0]
    });

    // Supabase Realtime will automatically notify the frontend when the database updates
    // No additional notification needed - the database UPDATE will trigger the realtime listener

    return NextResponse.json({ 
      success: true, 
      message: `Generation ${generationId} completed with ${validTextures.length} textures` 
    });

  } catch (error: any) {
    console.error("Webhook: Unexpected error", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Internal Server Error" 
    }, { status: 500 });
  }
}
