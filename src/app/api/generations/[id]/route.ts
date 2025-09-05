import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase-server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const generationId = params.id;
    const supabase = createServer();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', session.user.id)
      .single() as { data: any | null, error: any };

    if (error) {
      if (error.code === 'PGRST116') { // PostgREST error for "Not a single row was found"
        return NextResponse.json({ success: false, error: "Generation not found." }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, generation: data });
  } catch (error: any) {
    console.error("Error fetching generation:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
