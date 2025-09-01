import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase-server";
import { v4 as uuidv4 } from 'uuid';
import { uploadImage } from "@/lib/comfyui";

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
    
    const comfyResponse = await uploadImage(file, uniqueFilename);
    
    const { error: storageError } = await supabase.storage
      .from('reference-images')
      .upload(supabasePath, file);

    if (storageError) {
      console.error("Supabase upload error:", storageError);
      // Non-critical error, proceed
    }

    const { data: { publicUrl } } = supabase.storage.from('reference-images').getPublicUrl(supabasePath);

    return NextResponse.json({ 
      success: true, 
      publicUrl, 
      comfyFileName: comfyResponse.name 
    });
  } catch (error: any) {
    console.error("Error in upload-image API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
