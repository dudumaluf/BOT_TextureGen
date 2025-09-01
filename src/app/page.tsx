import ControlPanel from "@/components/layout/ControlPanel";
import Viewer from "@/components/3d/Viewer";
import { createServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import LoadingOverlay from "@/components/layout/LoadingOverlay";
import AssetPreview from "@/components/layout/AssetPreview";
import GalleryPanel from "@/components/layout/GalleryPanel";

export default async function Home() {
  const supabase = createServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <main className="flex h-screen w-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg border-r flex flex-col">
        <ControlPanel />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 relative">
        <Viewer />
        <AssetPreview />
        <LoadingOverlay />
      </div>
      
      {/* Gallery as Modal/Overlay when needed */}
      <GalleryPanel />
    </main>
  );
}
