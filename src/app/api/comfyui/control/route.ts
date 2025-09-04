import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase-server";
import { interruptComfyUI, getComfyUISystemStats } from "@/lib/comfyui";

export async function POST(request: Request) {
  try {
    const supabase = createServer();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    // Only allow admin users to control ComfyUI
    if (session.user.email !== 'ddmaluf@gmail.com') {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { action } = await request.json();

    switch (action) {
      case 'interrupt':
        await interruptComfyUI();
        return NextResponse.json({ success: true, message: "ComfyUI interrupted successfully" });
      
      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Error controlling ComfyUI:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to control ComfyUI" 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createServer();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    // All authenticated users can view system stats
    // Admin controls are handled in the POST method

    const systemStats = await getComfyUISystemStats();
    return NextResponse.json({ success: true, stats: systemStats });

  } catch (error: any) {
    console.error("Error getting ComfyUI system stats:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to get system stats" 
    }, { status: 500 });
  }
}
