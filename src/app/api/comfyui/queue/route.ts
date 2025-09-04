import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase-server";
import { getComfyUIQueue, clearComfyUIQueue, deleteQueueItem } from "@/lib/comfyui";

export async function GET() {
  try {
    const supabase = createServer();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    // All authenticated users can view queue information
    // Admin controls are handled in the POST method

    const queueStatus = await getComfyUIQueue();
    return NextResponse.json({ success: true, queue: queueStatus });

  } catch (error: any) {
    console.error("Error getting ComfyUI queue:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to get queue" 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServer();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    // Only allow admin users to modify queue
    if (session.user.email !== 'ddmaluf@gmail.com') {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { action, promptId } = await request.json();

    switch (action) {
      case 'clear':
        await clearComfyUIQueue();
        return NextResponse.json({ success: true, message: "Queue cleared successfully" });
      
      case 'delete':
        if (!promptId) {
          return NextResponse.json({ success: false, error: "promptId required for delete action" }, { status: 400 });
        }
        await deleteQueueItem(promptId);
        return NextResponse.json({ success: true, message: "Queue item deleted successfully" });
      
      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Error modifying ComfyUI queue:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to modify queue" 
    }, { status: 500 });
  }
}
