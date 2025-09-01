import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase-server";
import { v4 as uuidv4 } from 'uuid';
import { uploadImage } from "@/lib/comfyui"; // Re-using this for GLB files as ComfyUI's endpoint is the same

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
    }

    const supabase = createServer();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }

    const userId = session.user.id;
    const uniqueFilename = `${uuidv4()}-${file.name}`;
    const supabasePath = `${userId}/${uniqueFilename}`;

    // 1. Upload to ComfyUI
    const comfyResponse = await uploadImage(file, uniqueFilename);
    if (!comfyResponse.name) {
      throw new Error("Failed to upload model to ComfyUI");
    }

    // 2. Upload to Supabase
    const { error: storageError } = await supabase.storage
      .from('models')
      .upload(supabasePath, file);

    if (storageError) {
      console.error("Supabase upload error:", storageError);
      // Non-critical, proceed
    }

    const { data: { publicUrl } } = supabase.storage.from('models').getPublicUrl(supabasePath);

    const { data: dbData, error: dbError } = await supabase
      .from('models')
      .insert({
        name: file.name,
        storage_path: supabasePath,
        user_id: userId,
      })
      .select('id')
      .single();

    if (dbError) {
      console.error("Supabase db error:", dbError);
      await supabase.storage.from('models').remove([supabasePath]);
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      publicUrl, 
      modelId: dbData.id,
      comfyFileName: comfyResponse.name,
    });
  } catch (error: any) {
    console.error("Error in upload-model API:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
