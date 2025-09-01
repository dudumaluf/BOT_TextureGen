import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('DB Webhook: Received database change', body);
    
    // Extract the updated record
    const { record, old_record } = body;
    
    // Check if this is a generation completion (status changed to completed)
    if (record && record.status === 'completed' && old_record?.status === 'processing') {
      console.log(`DB Webhook: Generation ${record.id} completed!`, {
        userId: record.user_id,
        textures: {
          diffuse: record.diffuse_storage_path,
          normal: record.normal_storage_path,
          height: record.height_storage_path,
          thumbnail: record.thumbnail_storage_path
        }
      });
      
      // Here we could trigger additional actions:
      // - Send email notifications
      // - Update analytics
      // - Trigger other workflows
      // - Send push notifications
      
      // For now, just log the success
      console.log('DB Webhook: Successfully processed completion notification');
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('DB Webhook: Error processing database change:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
