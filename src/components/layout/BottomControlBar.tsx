"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore, type GenerationRecord } from "@/store/appStore";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notifications";
import { 
  Upload, 
  Image as ImageIcon, 
  Dices, 
  Zap, 
  Clock, 
  Plus,
  LogOut,
  Sparkles,
  X,
  Timer,
  Box
} from "lucide-react";
import { useEffect, useState } from "react";
import UpgradeButton from "@/components/ui/upgrade-button";
import ReferenceThumbnail from "@/components/ui/reference-thumbnail";
import { motion } from "framer-motion";

export default function BottomControlBar() {
  const { 
    modelUrl,
    modelId,
    modelFileName,
    referenceImageUrl,
    referenceImageName,
    mainPrompt,
    selectedStyle,
    referenceStrength,
    seed,
    isLoading,
    highQuality,
    viewAngle,
    showDepthPreview,
    currentGeneration,
    queueCount,
    theme,
    promptPanelHeight,
    activeModelPresetId,
    modelPresets,
    userEmail,
    setModelUrl, 
    setIsLoading,
    setMainPrompt,
    setSelectedStyle,
    setReferenceStrength,
    setGeneratedTextures,
    setModelId,
    setReferenceImageUrl,
    setReferenceImageName,
    setModelFileName,
    setSeed,
    setHighQuality,
    setViewAngle,
    setShowDepthPreview,
    setCurrentGeneration,
    setCanUpgrade,
    addToQueue,
    removeFromQueue,
    toggleBottomBar,
    setGenerations,
    setPromptPanelHeight,
  } = useAppStore();
  
  const supabase = createClient();
  const router = useRouter();
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeStartHeight, setResizeStartHeight] = useState(0);
  
  // Responsive minimum height - smaller on mobile, proper size on desktop
  const minHeight = 140; // Keep desktop minimum at 140px
  const maxHeight = 400;

  // Copy the polling logic from the old ControlPanel
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    if (isLoading && currentGenerationId) {
      console.log(`Polling: Starting check for generation ${currentGenerationId}`);
      
      let pollCount = 0;
      pollInterval = setInterval(async () => {
        pollCount++;
        console.log(`Polling: Check #${pollCount} for generation ${currentGenerationId}`);
        
        try {
          const { data: generation, error } = await supabase
            .from('generations')
            .select('*')
            .eq('id', currentGenerationId)
            .single() as { data: GenerationRecord | null, error: any };
          
          // If generation was deleted, stop polling
          if (error && (error.code === 'PGRST116' || error.message?.includes('406'))) {
            console.log(`Polling: Generation ${currentGenerationId} was deleted, stopping polling`);
            setIsLoading(false);
            setCurrentGenerationId(null);
            clearInterval(pollInterval);
            return;
          }
          
          // Debug: Log generation status during polling
          if (!error && generation) {
            console.log(`Polling: Generation ${currentGenerationId} status: ${generation.status}`);
            const currentTextures = useAppStore.getState().generatedTextures;
            const hasNewDepthPreview = generation.depth_preview_storage_path && 
              generation.depth_preview_storage_path !== currentTextures.depth_preview;
            const hasNewFrontPreview = generation.front_preview_storage_path && 
              generation.front_preview_storage_path !== currentTextures.front_preview;
            
            // Update previews immediately when available
            if (hasNewDepthPreview || hasNewFrontPreview) {
              console.log(`Polling: Found early previews for ${currentGenerationId}`, {
                depth: !!generation.depth_preview_storage_path,
                front: !!generation.front_preview_storage_path
              });
              
              const updatedTextures = {
                ...currentTextures,
                ...(generation.depth_preview_storage_path && { depth_preview: generation.depth_preview_storage_path }),
                ...(generation.front_preview_storage_path && { front_preview: generation.front_preview_storage_path })
              };
              
              setGeneratedTextures(updatedTextures);
            }
          }
          
          if (!error && generation && generation.status === 'completed') {
            console.log(`Polling: Current generation ${currentGenerationId} completed!`);
            console.log('Generation data:', generation);
            console.log('Setting isLoading to false...');
            
            const textureData = {
              diffuse: generation.diffuse_storage_path || null,
              normal: generation.normal_storage_path || null,
              height: generation.height_storage_path || null,
              thumbnail: generation.thumbnail_storage_path || null,
              depth_preview: generation.depth_preview_storage_path || null,
              front_preview: generation.front_preview_storage_path || null
            };
            
            setGeneratedTextures(textureData);
            setIsLoading(false);
            setCurrentGenerationId(null);
            console.log('isLoading set to false, currentGenerationId cleared');
            
            // Check if this was an upgrade generation
            const wasUpgrade = generation.high_quality;
            
            // Create or update generation pair
            const generationPair = {
              id: generation.id,
              fastGeneration: wasUpgrade ? currentGeneration?.fastGeneration : generation,
              hqGeneration: wasUpgrade ? generation : undefined,
              canUpgrade: !wasUpgrade, // Can only upgrade if this was a fast generation
              isUpgrading: false, // Always clear upgrading state
              currentTextures: textureData
            };
            
            setCurrentGeneration(generationPair);
            
            // Refresh gallery when generation completes
            const { data: updatedGenerations } = await supabase
              .from('generations')
              .select('*, model:models(*)')
              .order('created_at', { ascending: false });
            
            if (updatedGenerations) {
              setGenerations(updatedGenerations);
            }
            
            if (!highQuality) {
              notify.success("Fast textures ready! Click 'Upgrade' for maximum quality.");
            } else {
              notify.success("High Quality textures generated successfully!");
            }
            clearInterval(pollInterval);
          }
          
          if (pollCount % 4 === 0) {
            const minutes = Math.floor(pollCount / 4);
            console.log(`Polling: Generation ${currentGenerationId} in progress... ${minutes} minute(s) elapsed`);
            if (minutes > 0 && minutes % 5 === 0) {
              notify.info(`Generation in progress... ${minutes} minutes elapsed`);
            }
          }
          
          if (pollCount >= 180) {
            console.log(`Polling: Generation ${currentGenerationId} timeout after 45 minutes`);
            notify.error("Generation timeout after 45 minutes. Check ComfyUI status or try 'Check Latest Generation'");
            setIsLoading(false);
            setCurrentGenerationId(null);
            clearInterval(pollInterval);
          }
          
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 15000);
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isLoading, currentGenerationId, supabase, setGeneratedTextures, setIsLoading, highQuality, setCurrentGeneration]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch('/api/upload-model', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const result = await response.json();
      if (result.success && result.publicUrl) {
        setModelUrl(result.publicUrl);
        setModelId(result.modelId);
        setModelFileName(result.comfyFileName);
        notify.success("Model uploaded successfully!");
      } else {
        throw new Error(result.error || 'File upload failed');
      }
    } catch (error: unknown) {
      console.error("Error uploading file:", error);
      notify.error(error instanceof Error ? error.message : "Failed to upload model.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReferenceImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Image upload failed');
      }

      const result = await response.json();
      if (result.success && result.publicUrl) {
        setReferenceImageUrl(result.publicUrl);
        setReferenceImageName(result.comfyFileName);
        notify.success("Reference image uploaded!");
      } else {
        throw new Error(result.error || 'Image upload failed');
      }
    } catch (error: unknown) {
      console.error("Error uploading image:", error);
      notify.error(error instanceof Error ? error.message : "Failed to upload image.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!modelUrl || !modelId || !modelFileName) {
      notify.error("Please upload a model first.");
      return;
    }
    if (!referenceImageName) {
      notify.error("Please upload a reference image first.");
      return;
    }
    if (!mainPrompt || mainPrompt.trim() === '') {
      notify.error("Please enter a description of what you want to generate.");
      return;
    }

    const useProgressiveMode = !highQuality;
    const actualQuality = useProgressiveMode ? false : highQuality;

    // Set loading state for immediate processing
    setIsLoading(true);
    
    if (useProgressiveMode) {
      notify.info("Starting fast preview... (2-3 minutes)");
    } else {
      notify.info("Starting high quality generation... (12-15 minutes)");
    }
    
    try {
      // Get the actual active preset data
      const activePreset = modelPresets.find(p => p.isActive);
      
      console.log('Generation request data:', {
        modelFileName,
        modelId,
        referenceImageUrl,
        referenceImageName,
        mainPrompt,
        selectedStyle,
        seed,
        highQuality: actualQuality,
        referenceStrength,
        modelPresetId: activeModelPresetId,
        modelPresetData: activePreset,
        viewAngle: viewAngle,
      });

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelFileName,
          modelId,
          referenceImageUrl,
          referenceImageName,
          mainPrompt,
          selectedStyle,
          seed,
          highQuality: actualQuality,
          referenceStrength,
          modelPresetId: activeModelPresetId,
          modelPresetData: activePreset,
          viewAngle: viewAngle,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setCurrentGenerationId(result.generationId);
        console.log(`Generation: Started immediate generation ${result.generationId}`);
      } else {
        throw new Error(result.error || 'Failed to start generation.');
      }
    } catch (error: unknown) {
      console.error("Error starting generation:", error);
      notify.error(error instanceof Error ? error.message : "Failed to generate textures.");
      setIsLoading(false);
    }
  };


  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    setResizeStartY(e.clientY);
    setResizeStartHeight(promptPanelHeight);
    e.preventDefault();
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaY = resizeStartY - e.clientY; // Inverted: drag up = increase height
    const newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStartHeight + deltaY));
    setPromptPanelHeight(newHeight);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  // Global mouse events for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, resizeStartY, resizeStartHeight]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full min-w-0 max-w-4xl mx-auto px-3 sm:px-6">
      {/* Mobile: Upload panels on top, Desktop: Left side stacked */}
      <div className="flex flex-row justify-center gap-3 sm:flex-col sm:justify-start">
        {/* Model Upload Panel */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`relative rounded-2xl border shadow-lg overflow-hidden transition-all duration-300 w-12 h-12 sm:w-16 sm:h-16 aspect-square ${
            modelUrl
              ? theme === 'dark' 
                ? 'bg-green-900/20 border-green-700/50' 
                : 'bg-green-50/80 border-green-200'
              : theme === 'dark' 
                ? 'bg-gray-900/95 border-gray-700' 
                : 'bg-white/95 border-gray-200'
          }`}
        >
          <input
            id="model-upload"
            type="file"
            accept=".glb"
            onChange={handleFileChange}
            disabled={false}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full h-full flex items-center justify-center"
          >
            <Box className={`h-6 w-6 transition-colors duration-300 ${
              modelUrl 
                ? 'text-green-500' 
                : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`} />
          </motion.div>
        </motion.div>

        {/* Reference Upload Panel */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`relative rounded-2xl border shadow-lg w-12 h-12 sm:w-16 sm:h-16 aspect-square ${
            theme === 'dark' 
              ? 'bg-gray-900/95 border-gray-700' 
              : 'bg-white/95 border-gray-200'
          }`}
        >
          {referenceImageUrl ? (
            <div className="absolute inset-1">
              <ReferenceThumbnail />
            </div>
          ) : (
            <>
              <input
                id="reference-upload"
                type="file"
                accept="image/*"
                onChange={handleReferenceImageChange}
                disabled={false}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-full flex items-center justify-center"
              >
                <ImageIcon className={`h-6 w-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
              </motion.div>
            </>
          )}
        </motion.div>
      </div>

      {/* Main Prompt Panel - Full width on mobile, flex-1 on desktop */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full sm:flex-1 relative"
      >
        {/* Close button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleBottomBar}
          className={`absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full transition-all duration-150 ease-out shadow-lg border flex items-center justify-center ${
            theme === 'dark' 
              ? 'bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-gray-300 border-gray-700' 
              : 'bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 border-gray-200'
          }`}
        >
          <X className="h-4 w-4" />
        </motion.button>

        <div 
          className={`rounded-2xl border shadow-lg overflow-hidden group ${
            theme === 'dark' 
              ? 'bg-gray-900/95 border-gray-700' 
              : 'bg-white/95 border-gray-200'
          }`}
          style={{ height: `${Math.max(promptPanelHeight, minHeight)}px` }} // Responsive minimum height
        >
          {/* Resize Handle - Only visible on hover */}
          <div
            className="w-full h-2 cursor-ns-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={handleResizeStart}
          >
            <div className={`w-8 h-1 rounded-full ${
              theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'
            }`} />
          </div>

          {/* Prompt Input */}
          <div className="p-2 sm:p-6 flex-1 flex flex-col" style={{ height: `${Math.max(promptPanelHeight, minHeight) - 80}px` }}>
            <textarea
              placeholder="Describe any object to generate from scratch..."
              value={mainPrompt}
              onChange={(e) => setMainPrompt(e.target.value)}
              disabled={false}
              className={`w-full text-sm sm:text-base leading-relaxed border-0 bg-transparent resize-none flex-1 overflow-y-auto focus:outline-none placeholder:text-opacity-60 ${
                theme === 'dark'
                  ? 'text-white placeholder:text-gray-500'
                  : 'text-gray-900 placeholder:text-gray-500'
              }`}
            />
          </div>

          {/* Bottom Controls */}
          <div className={`flex items-center justify-between px-2 sm:px-6 py-2 sm:py-4 border-t ${
            theme === 'dark' ? 'border-gray-800' : 'border-gray-100'
          }`}>
            {/* Left: Style and Seed */}
            <div className="flex items-center gap-1 sm:gap-4 overflow-hidden">
              <button
                onClick={() => {
                  const styles = ['photorealistic', 'stylized', 'vintage', 'industrial', 'artistic'];
                  const currentIndex = styles.indexOf(selectedStyle);
                  const nextIndex = (currentIndex + 1) % styles.length;
                  setSelectedStyle(styles[nextIndex]);
                }}
                disabled={false}
                className={`w-16 sm:w-32 text-left text-xs font-bold cursor-pointer transition-all duration-200 ease-out capitalize truncate ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
                title="Click to cycle through styles"
              >
                {selectedStyle.toUpperCase()}
              </button>

              {/* View Angle Selection */}
              <button
                onClick={() => {
                  const views = [
                    { value: 1, label: 'Front' },
                    { value: 2, label: 'Side' },
                    { value: 3, label: 'Back' },
                    { value: 4, label: 'Side' },
                    { value: 5, label: 'Top' },
                    { value: 6, label: 'Bottom' }
                  ];
                  const currentIndex = views.findIndex(v => v.value === viewAngle);
                  const nextIndex = (currentIndex + 1) % views.length;
                  setViewAngle(views[nextIndex].value);
                }}
                disabled={false}
                className={`w-12 sm:w-20 text-xs font-bold text-center cursor-pointer transition-all duration-200 ease-out ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
                title="Click to cycle through view angles for depth map generation"
              >
                {(() => {
                  const viewLabels = {
                    1: 'FRONT',
                    2: 'SIDE',
                    3: 'BACK',
                    4: 'SIDE',
                    5: 'TOP',
                    6: 'BOTTOM'
                  };
                  return viewLabels[viewAngle as keyof typeof viewLabels] || 'FRONT';
                })()}
              </button>

              {/* Quality Toggle */}
              <button
                onClick={() => setHighQuality(!highQuality)}
                disabled={false}
                className={`text-xs font-bold cursor-pointer transition-all duration-200 ease-out ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
                title={highQuality ? 'High Quality (12-15 min)' : 'Low Quality/Fast (2-3 min)'}
              >
                <span className="hidden sm:inline">{highQuality ? 'HIGH QUALITY' : 'LOW QUALITY'}</span>
                <span className="sm:hidden">{highQuality ? 'HQ' : 'LQ'}</span>
              </button>
            </div>

            {/* Right: Minimalist Actions */}
            <div className="flex items-center gap-1 sm:gap-4">
              {/* Seed Input */}
              <Input 
                type="number" 
                value={seed} 
                onChange={(e) => {
                  const value = e.target.value;
                  // Limit to 3 digits on mobile, 6 on desktop
                  const maxLength = window.innerWidth < 640 ? 3 : 6;
                  if (value.length <= maxLength) {
                    setSeed(parseInt(value, 10) || 0);
                  }
                }}
                disabled={false}
                maxLength={window.innerWidth < 640 ? 3 : 6}
                className={`w-12 sm:w-20 text-xs font-bold text-center border-0 bg-transparent focus:outline-none ${
                  theme === 'dark'
                    ? 'text-gray-300'
                    : 'text-gray-700'
                }`}
                placeholder="Seed"
              />

              {/* Queue Button - Always available when assets are loaded */}
              {modelUrl && referenceImageUrl && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const queueItem = {
                      id: Date.now().toString(),
                      type: 'generation' as const,
                      modelFileName,
                      modelId,
                      referenceImageUrl,
                      referenceImageName,
                      mainPrompt,
                      selectedStyle,
                      seed,
                      referenceStrength,
                      highQuality: false,
                      status: 'queued',
                      viewAngle,
                      userId: userEmail || undefined
                    };
                    addToQueue(queueItem);
                    notify.success("Added to queue - use queue panel to start batch processing");
                  }}
                  className={`p-2 rounded-lg transition-all duration-200 ease-out ${
                    theme === 'dark'
                      ? 'hover:bg-gray-900 text-gray-400 hover:text-gray-300'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'
                  }`}
                  title="Queue for Later"
                >
                  <Timer className="h-4 w-4" />
                </motion.button>
              )}

              {/* Generate Button - Always Available */}
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerate}
                disabled={!modelUrl || !referenceImageUrl}
                className={`
                  relative p-3 rounded-xl transition-all duration-200
                  ${!modelUrl || !referenceImageUrl
                    ? theme === 'dark' 
                      ? 'bg-gray-700 cursor-not-allowed text-gray-500' 
                      : 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl'
                  }
                `}
                title="Generate Textures"
              >
                <Sparkles className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
