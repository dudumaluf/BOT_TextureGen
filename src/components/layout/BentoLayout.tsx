"use client";

import { useAppStore } from "@/store/appStore";
import { motion, AnimatePresence } from "framer-motion";
import GalleryPanel from "./GalleryPanel";
import QueuePanel from "./QueuePanel";
import AssetPreview from "./AssetPreview";
import BottomControlBar from "./BottomControlBar";
import Viewer from "@/components/3d/Viewer";
import LoadingOverlay from "./LoadingOverlay";
import { Library, Layers, Eye, EyeOff, Settings, Sliders, MessageSquare, Edit3, Play, X, ListOrdered } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import SettingsModal from "./SettingsPanel";
import ScenePanel from "./ScenePanel";
import AnimationTimeline from "./AnimationTimeline";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import { useResponsive } from "@/hooks/useResponsive";

export default function BentoLayout() {
  const { 
    isGalleryOpen, 
    queueCount,
    comfyUIQueue,
    generations,
    generatedTextures,
    referenceImageUrl,
    isBottomBarOpen,
    isSettingsOpen,
    isAssetPreviewOpen,
    theme,
    hasAnimations,
    showAnimationTimeline,
    toggleGallery,
    toggleBottomBar,
    toggleSettings,
    toggleAssetPreview,
    setAssetPreviewOpen,
    setShowAnimationTimeline
  } = useAppStore();
  
  // Initialize viewport height fix for mobile browsers
  useViewportHeight();
  const { isMobile } = useResponsive();
  
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isSceneOpen, setIsSceneOpen] = useState(false);
  const [wasPromptPanelOpen, setWasPromptPanelOpen] = useState(false);

  const hasGenerations = generations && generations.length > 0;
  const hasQueue = queueCount > 0;
  const hasContent = generatedTextures.diffuse || generatedTextures.normal || generatedTextures.height || generatedTextures.thumbnail || generatedTextures.depth_preview || generatedTextures.front_preview;
  
  // Calculate total active jobs (internal queue + ComfyUI queue)
  const comfyUIActiveJobs = (comfyUIQueue?.queue_running?.length || 0) + (comfyUIQueue?.queue_pending?.length || 0);
  const totalActiveJobs = queueCount + comfyUIActiveJobs;

  // Helper functions for panel management
  const handleOpenPanel = () => {
    // On mobile, close prompt panel to avoid clutter, on desktop allow coexistence
    if (isMobile && isBottomBarOpen) {
      setWasPromptPanelOpen(true);
      toggleBottomBar(); // Close prompt panel on mobile only
    } else {
      setWasPromptPanelOpen(false);
    }
  };

  const handleClosePanel = () => {
    // Restore prompt panel if it was open before (mobile only)
    if (wasPromptPanelOpen && !isBottomBarOpen && isMobile) {
      toggleBottomBar(); // Reopen prompt panel on mobile
      setWasPromptPanelOpen(false);
    }
  };

  // Common button styling based on theme
  const getButtonStyle = (hoverColor: string) => 
    `p-3 backdrop-blur-md rounded-full shadow-lg border transition-all duration-200 ease-out pointer-events-auto ${
      theme === 'dark'
        ? `bg-gray-900/90 border-gray-700 text-gray-300 hover:${hoverColor}`
        : `bg-white/90 border-white/20 text-gray-600 hover:${hoverColor}`
    }`;

  // Show queue panel only when user explicitly opens it
  const showQueuePanel = isQueueOpen;
  
  // STANDARD RULE: When ANY panel is open, only close button should be interactive
  const anyPanelOpen = isGalleryOpen || showQueuePanel || isSceneOpen || isBottomBarOpen || isAssetPreviewOpen || isSettingsOpen;

  // Calculate grid layout for bento box
  const getGridCols = () => {
    if (isGalleryOpen && showQueuePanel) return "grid-cols-5"; // Gallery:Viewer:Queue = 1:3:1
    if (isGalleryOpen || showQueuePanel) return "grid-cols-4"; // Panel:Viewer = 1:3
    return "grid-cols-1"; // Full width viewer
  };

  return (
    <div className={`relative overflow-hidden mobile-container js-vh-fix h-screen w-screen ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
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
            className={`absolute top-0 left-0 bottom-0 w-full sm:w-72 z-20 pointer-events-auto ${
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
      <ScenePanel isOpen={isSceneOpen} onClose={() => {
        setIsSceneOpen(false);
        handleClosePanel(); // Restore prompt panel if needed
      }} />

      {/* Right Panel - Queue (Overlay) */}
      <AnimatePresence>
        {showQueuePanel && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`absolute top-0 right-0 bottom-0 w-full sm:w-72 z-20 pointer-events-auto ${
              theme === 'dark' 
                ? 'bg-gray-900/95 border-l border-gray-700' 
                : 'bg-white border-l border-gray-200'
            }`}
            style={{ pointerEvents: 'auto' }}
          >
            <QueuePanel isOpen={true} onClose={() => {
              setIsQueueOpen(false);
              handleClosePanel(); // Restore prompt panel if needed
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI Controls Layer - Rendered ABOVE Canvas with highest z-index */}
      <div className="absolute inset-0 z-[100] pointer-events-none">
        {/* TextureGen Logo - Top Left */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: (
              // Desktop: fade out only for Gallery and Scene panels
              (!isMobile && (isGalleryOpen || isSceneOpen)) ||
              // Mobile: fade out for all panels except Asset Preview and Bottom Bar
              (isMobile && (isGalleryOpen || isSceneOpen || showQueuePanel || isSettingsOpen))
            ) ? 0 : 1 
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`absolute top-2 left-2 sm:top-1 sm:left-1 z-[110] ${(
            (!isMobile && (isGalleryOpen || isSceneOpen)) ||
            (isMobile && (isGalleryOpen || isSceneOpen || showQueuePanel || isSettingsOpen))
          ) ? 'pointer-events-none' : 'pointer-events-auto'}`}
          onClick={() => {
            // Quick test: Load sample animated GLB
            const { setModelUrl, setModelId, setModelFileName } = useAppStore.getState();
            setModelUrl('/Elo_Animations.glb');
            setModelId('sample-animated-model');
            setModelFileName('Elo_Animations.glb');
          }}
          style={{ cursor: anyPanelOpen ? 'default' : 'pointer' }}
          title="Click to load sample animated model"
        >
          <Image
            src={theme === 'light' ? '/logo_texturegen_black_on_transparent.png' : '/logo_texturegen_white_on_transparent_.png'}
            alt="TextureGen"
            width={115}
            height={115}
            className="object-contain w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28"
            priority
            unoptimized
          />
        </motion.div>

        {/* Gallery Toggle - Center Left */}
        {!isGalleryOpen && (
          <motion.button
            initial={{ opacity: 0, x: 0 }}
            animate={{ 
              opacity: 1,
              x: isMobile 
                ? (anyPanelOpen ? -100 : 0)  // Mobile: slide left off-screen on any panel
                : (isSceneOpen ? -60 : 0)    // Desktop: slide left when scene panel is open
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onTouchStart={(e) => {
              console.log('Gallery toggle touched!');
              e.stopPropagation();
              e.preventDefault();
              handleOpenPanel();
              toggleGallery();
              if (isSceneOpen) setIsSceneOpen(false);
            }}
            onPointerDown={(e) => {
              console.log('Gallery toggle pointer down!');
              e.stopPropagation();
              e.preventDefault();
              handleOpenPanel();
              toggleGallery();
              if (isSceneOpen) setIsSceneOpen(false);
            }}
            onClick={(e) => {
              console.log('Gallery toggle clicked!');
              e.stopPropagation();
              handleOpenPanel();
              toggleGallery();
              if (isSceneOpen) setIsSceneOpen(false);
            }}
            className={`absolute top-1/2 left-2 sm:left-4 z-[120] w-12 h-12 flex items-center justify-center pointer-events-auto ${getButtonStyle('text-blue-600')}`}
            style={{ transform: 'translateY(-50%)', touchAction: 'manipulation' }}
            title="Gallery"
          >
            <Library className="h-4 w-4 sm:h-5 sm:w-5" />
          </motion.button>
        )}

        {/* Scene Settings Toggle - Underneath Gallery on Mobile, Bottom Left on Desktop */}
        {!isSceneOpen && (
          <motion.button
            initial={{ opacity: 0, x: 0 }}
            animate={{ 
              opacity: 1,
              x: isMobile 
                ? (anyPanelOpen ? -100 : 0)  // Mobile: slide left off-screen on any panel
                : (isGalleryOpen ? -60 : 0)  // Desktop: slide left when gallery panel is open
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onTouchStart={(e) => {
              console.log('Scene toggle touched!');
              e.stopPropagation();
              e.preventDefault();
              handleOpenPanel();
              setIsSceneOpen(true);
              if (isGalleryOpen) toggleGallery();
            }}
            onPointerDown={(e) => {
              console.log('Scene toggle pointer down!');
              e.stopPropagation();
              e.preventDefault();
              handleOpenPanel();
              setIsSceneOpen(true);
              if (isGalleryOpen) toggleGallery();
            }}
            onClick={(e) => {
              console.log('Scene toggle clicked!');
              e.stopPropagation();
              handleOpenPanel();
              setIsSceneOpen(true);
              if (isGalleryOpen) toggleGallery();
            }}
            className={`absolute bottom-4 left-2 sm:left-4 z-[120] w-12 h-12 flex items-center justify-center pointer-events-auto ${getButtonStyle('text-green-600')}`}
            title="Scene Settings"
            style={{ touchAction: 'manipulation' }}
          >
            <Sliders className="h-4 w-4 sm:h-5 sm:w-5" />
          </motion.button>
        )}

        {/* Queue Toggle - Moves to asset preview position when no assets available */}
        {!showQueuePanel && (
          <motion.button
            initial={{ opacity: 0, x: 0 }}
            animate={{ 
              opacity: 1,
              x: isMobile ? (anyPanelOpen ? 100 : 0) : 0  // Mobile: slide right off-screen, Desktop: stay in place
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              handleOpenPanel();
              setIsQueueOpen(true);
            }}
            className={`absolute bottom-4 right-2 sm:right-4 z-[110] w-12 h-12 flex items-center justify-center pointer-events-auto ${getButtonStyle(totalActiveJobs > 0 ? 'bg-orange-600' : 'text-purple-600')}`}
            title={totalActiveJobs > 0 ? `Queue (${totalActiveJobs})` : "Queue"}
          >
            <ListOrdered className="h-4 w-4 sm:h-5 sm:w-5" />
            {totalActiveJobs > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold"
              >
                {totalActiveJobs}
              </motion.div>
            )}
          </motion.button>
        )}

        {/* Settings Toggle - Center Right */}
        <motion.button
          initial={{ opacity: 0, x: 0 }}
                      animate={{ 
              opacity: showQueuePanel ? 0 : 1,  // Fade only when queue panel is open
              x: isMobile 
                ? (anyPanelOpen ? 100 : 0)  // Mobile: slide right on any panel
                : (showQueuePanel ? 100 : 0)  // Desktop: slide right only on queue panel
            }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleSettings}
          className={`absolute top-4 right-2 sm:top-4 sm:right-4 z-[110] w-12 h-12 flex items-center justify-center ${showQueuePanel ? 'pointer-events-none' : 'pointer-events-auto'} ${getButtonStyle('text-purple-600')}`}
          title="Settings"
        >
          <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
        </motion.button>

        {/* Asset Preview Toggle - Bottom Right */}
        {hasContent && (
          <motion.button
            initial={{ opacity: 0, x: 0 }}
            animate={{ 
              opacity: 1,
              x: isMobile ? (anyPanelOpen ? 100 : 0) : (showQueuePanel ? 100 : 0)  // Mobile: slide on any panel, Desktop: slide only on queue panel
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (!isAssetPreviewOpen && isBottomBarOpen) {
                toggleBottomBar();
              }
              toggleAssetPreview();
            }}
            className={`absolute top-1/2 right-2 sm:right-4 z-[110] w-12 h-12 flex items-center justify-center pointer-events-auto ${getButtonStyle(isAssetPreviewOpen ? 'text-red-600' : 'text-blue-600')}`}
            style={{ transform: 'translateY(-50%)' }}
            title={isAssetPreviewOpen ? "Hide Texture Preview" : "Show Texture Preview"}
          >
            {isAssetPreviewOpen ? (
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
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
              // Mobile: Account for wider panels, Desktop: Stay in fixed position
              left: '8px',
              right: '8px',
              bottom: '20px' // Account for mobile browser UI
            }}
          >
            <BottomControlBar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Asset Preview Panel - Bottom positioned like prompt panel */}
      <AnimatePresence>
        {hasContent && isAssetPreviewOpen && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute z-20 w-full flex justify-center"
            style={{
              bottom: '80px', // Static bottom position
              left: 0,
              right: 0
            }}
          >
            <AssetPreview isOpen={true} onClose={undefined} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls Toggle - When closed */}
      {!isBottomBarOpen && (
        <div 
          className="absolute bottom-4 z-40 transition-all duration-300 ease-out pointer-events-none"
          style={{
            // Mobile: Account for wider panels, Desktop: Stay in fixed position
            left: '8px',
            right: '8px',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <motion.button
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ 
              opacity: 1,
              x: 0,  // No horizontal movement
              y: isMobile ? ((anyPanelOpen && !isBottomBarOpen) ? 100 : 0) : 0  // Mobile: slide down when other panels open, Desktop: stay in place
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (!isBottomBarOpen && isAssetPreviewOpen) {
                setAssetPreviewOpen(false); // Close asset preview if open
              }
              toggleBottomBar();
            }}
            className={`w-12 h-12 flex items-center justify-center pointer-events-auto ${getButtonStyle('text-blue-600')}`}
            title="Open Controls"
          >
            <Edit3 className="h-5 w-5" />
          </motion.button>
        </div>
      )}

      {/* Mobile Panel Close Buttons - Same position as prompt toggle - MOBILE ONLY */}
      {(isGalleryOpen || showQueuePanel || isSceneOpen || isAssetPreviewOpen || isSettingsOpen) && (
        <div 
          className="sm:hidden absolute bottom-4 left-2 right-2 z-[130] transition-all duration-300 ease-out pointer-events-none flex justify-center"
        >
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onTouchStart={(e) => {
              console.log('Mobile close button touched!');
              e.stopPropagation();
            }}
            onClick={(e) => {
              console.log('Mobile close button clicked!');
              e.stopPropagation();
              if (isGalleryOpen) {
                toggleGallery();
                handleClosePanel();
              } else if (showQueuePanel) {
                setIsQueueOpen(false);
                handleClosePanel();
              } else if (isSceneOpen) {
                setIsSceneOpen(false);
                handleClosePanel();
              } else if (isAssetPreviewOpen) {
                setAssetPreviewOpen(false);
              } else if (isSettingsOpen) {
                toggleSettings();
              }
            }}
            className={`pointer-events-auto w-12 h-12 flex items-center justify-center ${getButtonStyle('text-red-600')}`}
            title="Close Panel"
            style={{ touchAction: 'manipulation' }}
          >
            <X className="h-5 w-5" />
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
