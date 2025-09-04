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
    
    // Check if this is an early preview (depth OR front view, but no final textures)
    const isEarlyPreview = textures && (textures.depth_preview || textures.front_preview) && !textures.diffuse;
    
    if (isEarlyPreview) {
      console.log(`Webhook: Received early preview for generation ${generationId}`, {
        depthPreviewUrl: textures.depth_preview,
        frontPreviewUrl: textures.front_preview
      });
      
      // Store the depth preview in the database so the frontend can see it
      const supabase = createServer();
      
      try {
        const updateData: any = {};
        
        // Process depth preview if available
        if (textures.depth_preview) {
          const depthUrl = textures.depth_preview;
          const ipv4Url = depthUrl.replace('localhost', '127.0.0.1');
          console.log(`Webhook: Downloading depth preview from: ${ipv4Url}`);
          
          const depthResponse = await fetch(ipv4Url);
          if (depthResponse.ok) {
            const imageBuffer = await depthResponse.arrayBuffer();
            const uint8Array = new Uint8Array(imageBuffer);
            
            const fileName = `${generationId}_depth_preview.png`;
            const storagePath = `generations/${generationId}/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
              .from('generated_textures')
              .upload(storagePath, uint8Array, {
                contentType: 'image/png',
                upsert: true
              });
            
            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from('generated_textures')
                .getPublicUrl(storagePath);
              updateData.depth_preview_storage_path = publicUrl;
              console.log(`Webhook: Uploaded depth preview to Supabase: ${publicUrl}`);
            } else {
              updateData.depth_preview_storage_path = depthUrl;
              console.error(`Webhook: Upload error for depth preview:`, uploadError);
            }
          } else {
            updateData.depth_preview_storage_path = depthUrl;
          }
        }
        
        // Process front preview if available
        if (textures.front_preview) {
          const frontUrl = textures.front_preview;
          const ipv4Url = frontUrl.replace('localhost', '127.0.0.1');
          console.log(`Webhook: Downloading front preview from: ${ipv4Url}`);
          
          const frontResponse = await fetch(ipv4Url);
          if (frontResponse.ok) {
            const imageBuffer = await frontResponse.arrayBuffer();
            const uint8Array = new Uint8Array(imageBuffer);
            
            const fileName = `${generationId}_front_preview.png`;
            const storagePath = `generations/${generationId}/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
              .from('generated_textures')
              .upload(storagePath, uint8Array, {
                contentType: 'image/png',
                upsert: true
              });
            
            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from('generated_textures')
                .getPublicUrl(storagePath);
              updateData.front_preview_storage_path = publicUrl;
              console.log(`Webhook: Uploaded front preview to Supabase: ${publicUrl}`);
            } else {
              updateData.front_preview_storage_path = frontUrl;
              console.error(`Webhook: Upload error for front preview:`, uploadError);
            }
          } else {
            updateData.front_preview_storage_path = frontUrl;
          }
        }
        
        // Update the generation with the previews (partial updates are fine)
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('generations')
            .update(updateData)
            .eq('id', generationId);
          
          if (updateError) {
            console.error("Webhook: Error updating early previews", updateError);
          } else {
            const previewType = updateData.depth_preview_storage_path ? 'depth' : 'front';
            console.log(`Webhook: Successfully stored ${previewType} preview for generation ${generationId}`, updateData);
          }
        }
        
      } catch (error) {
        console.error(`Webhook: Error processing early previews:`, error);
        // Store the ComfyUI URLs as fallback
        const fallbackData: any = {};
        if (textures.depth_preview) fallbackData.depth_preview_storage_path = textures.depth_preview;
        if (textures.front_preview) fallbackData.front_preview_storage_path = textures.front_preview;
        
        if (Object.keys(fallbackData).length > 0) {
          await supabase
            .from('generations')
            .update(fallbackData)
            .eq('id', generationId);
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Early preview ready for generation ${generationId}`,
        isEarlyPreview: true,
        depthPreviewUrl: textures.depth_preview,
        frontPreviewUrl: textures.front_preview
      });
    }

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

    // Option to disable cloud upload for development (set to false to skip upload attempts)
    const enableCloudUpload = true; // Re-enabled after fixing RLS policies
    
    if (enableCloudUpload) {
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
    } else {
      // Use ComfyUI URLs directly (faster, no upload overhead)
      console.log('Webhook: Using ComfyUI URLs directly (cloud upload disabled)');
      for (const [textureType, comfyUrl] of Object.entries(textures)) {
        if (comfyUrl && typeof comfyUrl === 'string') {
          updateData[`${textureType}_storage_path`] = comfyUrl;
        }
      }
    }

    console.log(`Webhook: Update data for generation ${generationId}`, updateData);

    // Update the generation with the processed texture URLs
    const { data: updateResult, error: updateError } = await supabase
      .from('generations')
      .update(updateData)
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
