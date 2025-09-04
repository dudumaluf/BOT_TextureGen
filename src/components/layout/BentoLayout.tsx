"use client";

import { useAppStore } from "@/store/appStore";
import { motion, AnimatePresence } from "framer-motion";
import GalleryPanel from "./GalleryPanel";
import QueuePanel from "./QueuePanel";
import AssetPreview from "./AssetPreview";
import BottomControlBar from "./BottomControlBar";
import Viewer from "@/components/3d/Viewer";
import LoadingOverlay from "./LoadingOverlay";
import { Library, Layers, Eye, EyeOff, Settings, Sliders, MessageSquare, Edit3, Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import SettingsModal from "./SettingsPanel";
import ScenePanel from "./ScenePanel";
import AnimationTimeline from "./AnimationTimeline";

export default function BentoLayout() {
  const { 
    isGalleryOpen, 
    queueCount,
    generations,
    generatedTextures,
    referenceImageUrl,
    isBottomBarOpen,
    theme,
    hasAnimations,
    showAnimationTimeline,
    toggleGallery,
    toggleBottomBar,
    toggleSettings,
    setShowAnimationTimeline
  } = useAppStore();
  
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [isSceneOpen, setIsSceneOpen] = useState(false);

  const hasGenerations = generations && generations.length > 0;
  const hasQueue = queueCount > 0;
  const hasContent = generatedTextures.diffuse || generatedTextures.depth_preview || generatedTextures.front_preview || referenceImageUrl;

  // Common button styling based on theme
  const getButtonStyle = (hoverColor: string) => 
    `p-3 backdrop-blur-md rounded-full shadow-lg border transition-all duration-200 ease-out pointer-events-auto ${
      theme === 'dark'
        ? `bg-gray-900/90 border-gray-700 text-gray-300 hover:${hoverColor}`
        : `bg-white/90 border-white/20 text-gray-600 hover:${hoverColor}`
    }`;

  // Show queue panel only when user explicitly opens it
  const showQueuePanel = isQueueOpen;

  // Calculate grid layout for bento box
  const getGridCols = () => {
    if (isGalleryOpen && showQueuePanel) return "grid-cols-5"; // Gallery:Viewer:Queue = 1:3:1
    if (isGalleryOpen || showQueuePanel) return "grid-cols-4"; // Panel:Viewer = 1:3
    return "grid-cols-1"; // Full width viewer
  };

  return (
    <div className={`h-screen w-screen relative ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      {/* Full-Screen 3D Viewer - Never Resizes */}
      <div className="absolute inset-0">
        <Viewer />
        <LoadingOverlay isQueueOpen={showQueuePanel} />
      </div>

      {/* Left Panel - Gallery or Scene (Overlay) */}
      <AnimatePresence>
        {isGalleryOpen && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`absolute top-0 left-0 bottom-0 w-72 z-20 pointer-events-auto ${
              theme === 'dark' 
                ? 'bg-gray-900/95 border-r border-gray-700' 
                : 'bg-white border-r border-gray-200'
            }`}
            style={{ pointerEvents: 'auto' }}
          >
            <GalleryPanel />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scene Panel (Overlay) */}
      <ScenePanel isOpen={isSceneOpen} onClose={() => setIsSceneOpen(false)} />

      {/* Right Panel - Queue (Overlay) */}
      <AnimatePresence>
        {showQueuePanel && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`absolute top-0 right-0 bottom-0 w-72 z-20 pointer-events-auto ${
              theme === 'dark' 
                ? 'bg-gray-900/95 border-l border-gray-700' 
                : 'bg-white border-l border-gray-200'
            }`}
            style={{ pointerEvents: 'auto' }}
          >
            <QueuePanel isOpen={true} onClose={() => setIsQueueOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Viewer Overlay Content - Only interactive elements */}
      <div className="absolute inset-0 z-10 pointer-events-none">
                  {/* Asset Preview - Dynamically Centered */}
          {hasContent && isPreviewOpen && (
            <div 
              className="absolute top-6 pointer-events-auto transition-all duration-300 ease-out"
              style={{
                left: (isGalleryOpen || isSceneOpen) ? '288px' : '0px', // Account for left panel
                right: showQueuePanel ? '320px' : '0px', // Account for right panel
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <AssetPreview isOpen={true} onClose={() => setIsPreviewOpen(false)} />
            </div>
          )}


        {/* Always-Visible Toggle Buttons */}
        
        {/* TextureGen Logo - Top Left */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute top-1 left-1 pointer-events-auto z-40"
          onClick={() => {
            // Quick test: Load sample animated GLB
            const { setModelUrl, setModelId, setModelFileName } = useAppStore.getState();
            setModelUrl('/Elo_Animations.glb');
            setModelId('sample-animated-model');
            setModelFileName('Elo_Animations.glb');
          }}
          style={{ cursor: 'pointer' }}
          title="Click to load sample animated model"
        >
          <Image
            src={theme === 'light' ? '/logo_texturegen_black_on_transparent.png' : '/logo_texturegen_white_on_transparent_.png'}
            alt="TextureGen"
            width={115}
            height={115}
            className="object-contain"
            priority
            unoptimized
          />
        </motion.div>

        {/* Scene Settings Toggle - Bottom Left */}
        {!isSceneOpen && !isGalleryOpen && (
          <motion.button
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setIsSceneOpen(true);
              // Close gallery if open
              if (isGalleryOpen) toggleGallery();
            }}
            className={`absolute bottom-4 left-4 z-50 ${getButtonStyle('text-green-600')}`}
            title="Scene Settings"
          >
            <Sliders className="h-5 w-5" />
          </motion.button>
        )}

        {/* Gallery Toggle - Always visible when gallery is closed */}
        {!isGalleryOpen && !isSceneOpen && (
          <motion.button
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              toggleGallery();
              // Close scene panel if open
              if (isSceneOpen) setIsSceneOpen(false);
            }}
            className={`absolute top-1/2 left-4 transform -translate-y-1/2 z-50 ${getButtonStyle('text-blue-600')}`}
            title="Open Gallery"
          >
            <Library className="h-5 w-5" />
          </motion.button>
        )}

        {/* Queue Toggle - Top Right */}
        {!showQueuePanel && (
          <motion.button
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsQueueOpen(true)}
            className={`absolute top-4 right-4 z-40 ${getButtonStyle(queueCount > 0 ? 'bg-orange-600' : 'text-purple-600')}`}
            title={queueCount > 0 ? `Open Queue (${queueCount} items)` : "Open Queue"}
          >
            <Layers className="h-5 w-5" />
            {queueCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold"
              >
                {queueCount}
              </motion.div>
            )}
          </motion.button>
        )}

        {/* Settings Toggle - Bottom Right */}
        <motion.button
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleSettings}
          className={`absolute bottom-4 right-4 z-40 ${getButtonStyle('text-purple-600')}`}
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </motion.button>


        {/* Texture Preview Toggle - Top Center (only when closed) */}
        {hasContent && !isPreviewOpen && !hasAnimations && (
          <motion.button
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsPreviewOpen(true)}
            className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-40 ${getButtonStyle('text-blue-600')}`}
            title="Show Texture Preview"
          >
            <Eye className="h-5 w-5" />
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
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute bottom-0 z-20 transition-all duration-500"
            style={{
              left: (isGalleryOpen || isSceneOpen) ? '288px' : '80px', // More clearance from left edge
              right: showQueuePanel ? '320px' : '80px', // More clearance from right edge  
              bottom: '32px'
            }}
          >
            <BottomControlBar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls Toggle - When closed */}
      {!isBottomBarOpen && (
        <div 
          className="absolute bottom-4 z-40 transition-all duration-300 ease-out pointer-events-none"
          style={{
            left: (isGalleryOpen || isSceneOpen) ? '288px' : '0px', // Account for left panel
            right: showQueuePanel ? '320px' : '0px', // Account for right panel
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <motion.button
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleBottomBar}
            className={`pointer-events-auto ${getButtonStyle('text-blue-600')}`}
            title="Open Controls"
          >
            <Edit3 className="h-5 w-5" />
          </motion.button>
        </div>
      )}

      {/* Animation Timeline - Global overlay */}
      <AnimationTimeline isQueueOpen={isQueueOpen} isSceneOpen={isSceneOpen} />

      {/* Settings Modal - Global overlay */}
      <SettingsModal />
    </div>
  );
}
