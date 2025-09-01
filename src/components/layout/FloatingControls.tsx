"use client";

import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import FloatingToggle from "@/components/ui/floating-toggle";
import QueuePanel from "@/components/layout/QueuePanel";
import { Eye, Library, Layers, EyeOff } from "lucide-react";
import AssetPreview from "@/components/layout/AssetPreview";

export default function FloatingControls() {
  const { 
    isGalleryOpen, 
    toggleGallery, 
    queueCount,
    currentGeneration,
    referenceImageUrl,
    generatedTextures,
    generations
  } = useAppStore();
  
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Close other panels when opening one (only one panel at a time for clean look)
  const handleGalleryToggle = () => {
    if (!isGalleryOpen) {
      setIsQueueOpen(false);
      setIsPreviewOpen(false);
    }
    toggleGallery();
  };

  const handleQueueToggle = () => {
    if (!isQueueOpen) {
      toggleGallery(); // Close gallery if open
      setIsPreviewOpen(false);
    }
    setIsQueueOpen(!isQueueOpen);
  };

  const handlePreviewToggle = () => {
    if (!isPreviewOpen) {
      toggleGallery(); // Close gallery if open
      setIsQueueOpen(false);
    }
    setIsPreviewOpen(!isPreviewOpen);
  };

  const hasContent = referenceImageUrl || generatedTextures.diffuse;
  const hasGenerations = generations && generations.length > 0;

  return (
    <>
      {/* Minimal Toggle System - Show only when relevant */}
      
      {/* Left: Gallery Toggle - Only when there are generations */}
      {hasGenerations && (
        <FloatingToggle
          icon={<Library className="h-5 w-5" />}
          isActive={isGalleryOpen}
          onClick={handleGalleryToggle}
          position="top-left"
        />
      )}

      {/* Right: Queue Toggle - Only when queue has items or panel is open */}
      {(queueCount > 0 || isQueueOpen) && (
        <FloatingToggle
          icon={<Layers className="h-5 w-5" />}
          isActive={isQueueOpen}
          onClick={handleQueueToggle}
          position="top-right"
          badge={queueCount > 0 ? queueCount : undefined}
        />
      )}

      {/* Top-Right: Preview Toggle - Only when there's content */}
      {hasContent && (
        <FloatingToggle
          icon={isPreviewOpen ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          isActive={isPreviewOpen}
          onClick={handlePreviewToggle}
          position="top-right"
          className={queueCount > 0 ? "mr-16" : ""} // Offset if queue toggle is visible
        />
      )}

      {/* Panels - Only one at a time */}
      <AssetPreview isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} />
      <QueuePanel 
        isOpen={isQueueOpen} 
        onClose={() => setIsQueueOpen(false)} 
      />
    </>
  );
}