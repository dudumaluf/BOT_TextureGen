"use client";

import { useAppStore } from "@/store/appStore";
import { motion, AnimatePresence } from "framer-motion";
import GalleryPanel from "./GalleryPanel";
import QueuePanel from "./QueuePanel";
import AssetPreview from "./AssetPreview";
import BottomControlBar from "./BottomControlBar";
import Viewer from "@/components/3d/Viewer";
import LoadingOverlay from "./LoadingOverlay";
import { Library, Layers, Eye, EyeOff, Settings } from "lucide-react";
import { useState } from "react";

export default function BentoLayout() {
  const { 
    isGalleryOpen, 
    queueCount,
    generations,
    generatedTextures,
    referenceImageUrl,
    isBottomBarOpen,
    toggleGallery,
    toggleBottomBar
  } = useAppStore();
  
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);

  const hasGenerations = generations && generations.length > 0;
  const hasQueue = queueCount > 0;
  const hasContent = generatedTextures.diffuse || referenceImageUrl;

  // Show queue panel when user opens it OR when there are items
  const showQueuePanel = isQueueOpen || hasQueue;

  // Calculate grid layout for bento box
  const getGridCols = () => {
    if (isGalleryOpen && showQueuePanel) return "grid-cols-5"; // Gallery:Viewer:Queue = 1:3:1
    if (isGalleryOpen || showQueuePanel) return "grid-cols-4"; // Panel:Viewer = 1:3
    return "grid-cols-1"; // Full width viewer
  };

  return (
    <div className="h-screen w-screen relative bg-gray-900">
      {/* Full-Screen 3D Viewer - Never Resizes */}
      <div className="absolute inset-0">
        <Viewer />
        <LoadingOverlay />
      </div>

      {/* Left Panel - Gallery (Overlay) */}
      <AnimatePresence>
        {isGalleryOpen && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 left-0 bottom-0 w-72 bg-white border-r border-gray-200 z-20 pointer-events-auto"
            style={{ pointerEvents: 'auto' }}
          >
            <GalleryPanel />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Panel - Queue (Overlay) */}
      <AnimatePresence>
        {showQueuePanel && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 bottom-0 w-72 bg-white border-l border-gray-200 z-20 pointer-events-auto"
            style={{ pointerEvents: 'auto' }}
          >
            <QueuePanel isOpen={true} onClose={() => setIsQueueOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Viewer Overlay Content - Only interactive elements */}
      <div className="absolute inset-0 z-10 pointer-events-none">
                  {/* Asset Preview - Top Center */}
          {hasContent && isPreviewOpen && (
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 pointer-events-auto">
              <AssetPreview isOpen={true} onClose={() => setIsPreviewOpen(false)} />
            </div>
          )}

        {/* Always-Visible Toggle Buttons */}
        
        {/* Gallery Toggle - Always visible when gallery is closed */}
        {!isGalleryOpen && (
          <motion.button
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleGallery}
            className="absolute top-1/2 left-4 transform -translate-y-1/2 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-white/20 text-gray-600 hover:text-blue-600 transition-all pointer-events-auto"
            title="Open Gallery"
          >
            <Library className="h-5 w-5" />
          </motion.button>
        )}

        {/* Queue Toggle - Always visible when queue is closed */}
        {!showQueuePanel && (
          <motion.button
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsQueueOpen(true)}
            className="absolute top-1/2 right-4 transform -translate-y-1/2 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-white/20 text-gray-600 hover:text-purple-600 transition-all pointer-events-auto"
            title="Open Queue"
          >
            <Layers className="h-5 w-5" />
            {queueCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {queueCount}
              </div>
            )}
          </motion.button>
        )}

        {/* Asset Preview Toggle - Top Right */}
        {hasContent && (
          <motion.button
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-white/20 text-gray-600 hover:text-blue-600 transition-all pointer-events-auto"
            title={isPreviewOpen ? "Hide Texture Preview" : "Show Texture Preview"}
          >
            {isPreviewOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </motion.button>
        )}
      </div>

      {/* Bottom Control Bar - Toggleable like other panels */}
      <AnimatePresence>
        {isBottomBarOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-0 z-30 transition-all duration-500"
            style={{
              left: isGalleryOpen ? '288px' : '24px',
              right: showQueuePanel ? '288px' : '24px'
            }}
          >
            <BottomControlBar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Bar Toggle - When closed */}
      {!isBottomBarOpen && (
        <motion.button
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleBottomBar}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-white/20 text-gray-600 hover:text-blue-600 transition-all pointer-events-auto z-30"
          title="Open Controls"
        >
          <Settings className="h-5 w-5" />
        </motion.button>
      )}
    </div>
  );
}
