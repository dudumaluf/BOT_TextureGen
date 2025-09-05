import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase-server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const modelFileName = searchParams.get('model_filename');

    if (!modelFileName) {
      return NextResponse.json({ success: false, error: "model_filename parameter required" }, { status: 400 });
    }

    const supabase = createServer();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const { data: settings, error } = await supabase
      .from('model_settings')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('model_filename', modelFileName)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error("Error fetching model settings:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      settings: settings || null 
    });

  } catch (error: any) {
    console.error("Error in model-settings GET:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Internal Server Error" 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { 
      modelFileName, 
      cameraDistance, 
      objectScale, 
      objectPosition, 
      objectRotation,
      materialSettings 
    } = await request.json();

    if (!modelFileName) {
      return NextResponse.json({ success: false, error: "modelFileName is required" }, { status: 400 });
    }

    const supabase = createServer();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    // Upsert (insert or update) the model settings
    const { data, error } = await supabase
      .from('model_settings')
      .upsert({
        user_id: session.user.id,
        model_filename: modelFileName,
        camera_distance: cameraDistance,
        object_scale: objectScale,
        object_position_x: objectPosition.x,
        object_position_y: objectPosition.y,
        object_position_z: objectPosition.z,
        object_rotation_x: objectRotation.x,
        object_rotation_y: objectRotation.y,
        object_rotation_z: objectRotation.z,
        material_metalness: materialSettings.metalness,
        material_roughness: materialSettings.roughness,
        material_normal_scale: materialSettings.normalScale,
        material_displacement_scale: materialSettings.displacementScale,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,model_filename'
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving model settings:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log(`💾 Saved settings for model: ${modelFileName}`, data);

    return NextResponse.json({ 
      success: true, 
      message: `Settings saved for ${modelFileName}`,
      settings: data
    });

  } catch (error: any) {
    console.error("Error in model-settings POST:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Internal Server Error" 
    }, { status: 500 });
  }
}
