"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore, type GenerationRecord } from "@/store/appStore";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
    addToContinuousQueue,
    addToBatchQueue,
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
  
  // Minimum height should match the stacked upload panels (2 * 64px + gap)
  const minHeight = 140;
  const maxHeight = 400;

  // Copy the polling logic from the old ControlPanel
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    if (isLoading && currentGenerationId) {
      console.log(`Polling: Starting check for generation ${currentGenerationId}`);
      
      let pollCount = 0;
      pollInterval = setInterval(async () => {
        pollCount++;
        
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
          
          // Check for early previews (depth_preview or front_preview) even while processing
          if (!error && generation) {
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
              toast.success("🎉 Fast textures ready! Click 'Upgrade' for maximum quality.");
            } else {
              toast.success("🎉 High Quality textures generated successfully!");
            }
            clearInterval(pollInterval);
          }
          
          if (pollCount % 4 === 0) {
            const minutes = Math.floor(pollCount / 4);
            console.log(`Polling: Generation ${currentGenerationId} in progress... ${minutes} minute(s) elapsed`);
            if (minutes > 0 && minutes % 5 === 0) {
              toast.info(`Generation in progress... ${minutes} minutes elapsed`);
            }
          }
          
          if (pollCount >= 180) {
            console.log(`Polling: Generation ${currentGenerationId} timeout after 45 minutes`);
            toast.error("Generation timeout after 45 minutes. Check ComfyUI status or try 'Check Latest Generation'");
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
        toast.success("Model uploaded successfully!");
      } else {
        throw new Error(result.error || 'File upload failed');
      }
    } catch (error: unknown) {
      console.error("Error uploading file:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload model.");
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
        toast.success("Reference image uploaded!");
      } else {
        throw new Error(result.error || 'Image upload failed');
      }
    } catch (error: unknown) {
      console.error("Error uploading image:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload image.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!modelUrl || !modelId || !modelFileName) {
      toast.error("Please upload a model first.");
      return;
    }
    if (!referenceImageName) {
      toast.error("Please upload a reference image first.");
      return;
    }

    const useProgressiveMode = !highQuality;
    const actualQuality = useProgressiveMode ? false : highQuality;

    // If this is the first generation, set loading state
    if (!isLoading) {
      setIsLoading(true);
    }
    
    // Create queue item for continuous processing
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
            highQuality: actualQuality,
            status: 'queued',
            viewAngle,
            userId: userEmail || undefined
    };
    
    // Add to continuous queue (auto-starts processing)
    addToContinuousQueue(queueItem);
    
    if (useProgressiveMode) {
      toast.success(`🚀 Added "${mainPrompt.split(' ').slice(0, 3).join(' ')}" to processing queue`);
    } else {
      toast.success(`✨ Added HQ "${mainPrompt.split(' ').slice(0, 3).join(' ')}" to processing queue`);
    }
    
    // Auto-start processing if this is the first continuous item in queue
    // Check continuous queue count after adding this item
    const currentQueue = useAppStore.getState().generationQueue;
    const continuousItems = currentQueue.filter(item => item.queueType === 'continuous');
    if (continuousItems.length === 1 && !isLoading) {
      console.log('Auto-starting continuous queue processing...');
      setTimeout(() => {
        handleStartContinuousQueue();
      }, 500); // Small delay to ensure UI updates
    }
  };

  // Continuous queue processing (different from batch processing)
  const handleStartContinuousQueue = async () => {
    const processNextItem = async () => {
      const currentQueue = useAppStore.getState().generationQueue;
      const continuousItems = currentQueue.filter(item => item.queueType === 'continuous');
      
      if (continuousItems.length === 0) {
        setIsLoading(false);
        setCurrentGenerationId(null);
        console.log('Continuous queue completed - no more continuous items');
        return;
      }
      
      const item = continuousItems[0]; // Always process first continuous item
      
      try {
        console.log(`Continuous Queue: Processing item`, item);
        const displayName = item.mainPrompt ? 
          (item.mainPrompt.split(' ')?.slice(0, 2)?.join(' ') || 'Generation')
          : item.subject_prompt || 'Generation';
          
        console.log(`Generation: Sending reference strength: ${item.referenceStrength}`);
        console.log(`Generation: Using model preset: ${activeModelPresetId}`);
        
        // Get the actual active preset data
        const activePreset = modelPresets.find(p => p.isActive);
        console.log(`Generation: Active preset data:`, activePreset);
        
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelFileName: item.modelFileName,
            modelId: item.modelId,
            referenceImageUrl: item.referenceImageUrl,
            referenceImageName: item.referenceImageName,
            mainPrompt: item.mainPrompt,
            selectedStyle: item.selectedStyle,
            seed: item.seed,
            highQuality: item.highQuality,
            referenceStrength: item.referenceStrength,
            modelPresetId: activeModelPresetId,
            modelPresetData: activePreset,
            viewAngle: item.viewAngle || viewAngle,
          }),
        });

        const result = await response.json();
        if (result.success) {
          const generationId = result.generationId;
          setCurrentGenerationId(generationId);
          
          console.log(`Continuous Queue: Started generation ${generationId} for "${displayName}"`);
          
          // Remove the processed item from queue
          removeFromQueue(item.id);
          
          // Wait for this generation to complete before starting next
          const waitForCompletion = async () => {
            return new Promise<void>((resolve) => {
              const pollInterval = setInterval(async () => {
                try {
                  const { data: generation, error: queryError } = await supabase
                    .from('generations')
                    .select('status')
                    .eq('id', generationId)
                    .single() as { data: { status: string } | null, error: any };
                  
                  // If generation was deleted (404/406 error), stop polling
                  if (queryError && (queryError.code === 'PGRST116' || queryError.message?.includes('406'))) {
                    clearInterval(pollInterval);
                    console.log(`Continuous Queue: Generation ${generationId} was deleted, stopping polling`);
                    resolve();
                    return;
                  }
                  
                  if (generation && (generation.status === 'completed' || generation.status === 'failed')) {
                    clearInterval(pollInterval);
                    console.log(`Continuous Queue: Generation ${generationId} ${generation.status}`);
                    
                    // If completed, update the 3D viewer with new textures
                    if (generation.status === 'completed') {
                      const { data: fullGeneration } = await supabase
                        .from('generations')
                        .select('*')
                        .eq('id', generationId)
                        .single() as { data: GenerationRecord | null };
                      
                      if (fullGeneration) {
                        const textureData = {
                          diffuse: fullGeneration.diffuse_storage_path || null,
                          normal: fullGeneration.normal_storage_path || null,
                          height: fullGeneration.height_storage_path || null,
                          thumbnail: fullGeneration.thumbnail_storage_path || null,
                          depth_preview: fullGeneration.depth_preview_storage_path || null,
                          front_preview: fullGeneration.front_preview_storage_path || null
                        };
                        
                        console.log(`Continuous Queue: Applying textures for ${generationId}`, textureData);
                        setGeneratedTextures(textureData);
                        
                        // Create generation pair for upgrade functionality
                        const generationPair = {
                          id: fullGeneration.id,
                          fastGeneration: fullGeneration.high_quality ? currentGeneration?.fastGeneration : fullGeneration,
                          hqGeneration: fullGeneration.high_quality ? fullGeneration : undefined,
                          canUpgrade: !fullGeneration.high_quality,
                          isUpgrading: false,
                          currentTextures: textureData
                        };
                        
                        setCurrentGeneration(generationPair);
                        
                        if (!fullGeneration.high_quality) {
                          toast.success("🎉 Fast textures ready! Click 'Upgrade' for maximum quality.");
                        } else {
                          toast.success("🎉 High Quality textures generated successfully!");
                        }
                      }
                    }
                    
                    resolve();
                  }
                } catch (error) {
                  console.error('Continuous queue polling error:', error);
                }
              }, 10000); // Check every 10 seconds
              
              // Timeout after 20 minutes
              setTimeout(() => {
                clearInterval(pollInterval);
                console.log(`Continuous Queue: Generation ${generationId} timeout`);
                resolve();
              }, 20 * 60 * 1000);
            });
          };
          
          await waitForCompletion();
          
          // Refresh gallery to show completed generation
          const { data: updatedGenerations } = await supabase
            .from('generations')
            .select('*, model:models(*)')
            .order('created_at', { ascending: false }) as { data: GenerationRecord[] | null };
          
          if (updatedGenerations) {
            setGenerations(updatedGenerations);
          }
          
          // Check if there are more continuous items before continuing
          const updatedQueue = useAppStore.getState().generationQueue;
          const remainingContinuousItems = updatedQueue.filter(item => item.queueType === 'continuous');
          if (remainingContinuousItems.length > 0) {
            setTimeout(processNextItem, 1000); // 1 second delay between items
          } else {
            console.log('Continuous queue completed - setting isLoading to false');
            setIsLoading(false);
            setCurrentGenerationId(null);
            console.log('Continuous queue completed - all continuous items processed');
          }
          
        } else {
          console.error(`Continuous Queue: Failed to start generation for "${displayName}"`);
          removeFromQueue(item.id);
          // Check if there are more continuous items before continuing
          const updatedQueue = useAppStore.getState().generationQueue;
          const remainingContinuousItems = updatedQueue.filter(item => item.queueType === 'continuous');
          if (remainingContinuousItems.length > 0) {
            setTimeout(processNextItem, 1000);
          } else {
            console.log('Continuous queue completed after error - setting isLoading to false');
            setIsLoading(false);
            setCurrentGenerationId(null);
            console.log('Continuous queue completed after error');
          }
        }
        
      } catch (error: any) {
        console.error('Continuous queue processing error:', error);
        removeFromQueue(item.id);
        // Check if there are more continuous items before continuing
        const updatedQueue = useAppStore.getState().generationQueue;
        const remainingContinuousItems = updatedQueue.filter(item => item.queueType === 'continuous');
        if (remainingContinuousItems.length > 0) {
          setTimeout(processNextItem, 1000);
        } else {
          console.log('Continuous queue completed after exception - setting isLoading to false');
          setIsLoading(false);
          setCurrentGenerationId(null);
          console.log('Continuous queue completed after exception');
        }
      }
    };
    
    // Start processing the first item
    processNextItem();
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
    <div className="flex items-center gap-2 sm:gap-4 w-full min-w-0 max-w-4xl mx-auto px-3 sm:px-6">
      {/* Left: Stacked Asset Upload Panels */}
      <div className="flex flex-col gap-3">
        {/* Model Upload Panel */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`relative rounded-2xl border shadow-lg overflow-hidden transition-all duration-300 ${
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
            className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center relative"
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
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
          className={`relative rounded-2xl border shadow-lg ${
            theme === 'dark' 
              ? 'bg-gray-900/95 border-gray-700' 
              : 'bg-white/95 border-gray-200'
          }`}
        >
          {referenceImageUrl ? (
            <div className="p-2">
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
                className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center"
              >
                <ImageIcon className={`h-6 w-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
              </motion.div>
            </>
          )}
        </motion.div>
      </div>

      {/* Main Prompt Panel */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.2 }}
        className="flex-1 relative"
      >
        {/* Close button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleBottomBar}
          className={`absolute -top-2 -right-2 z-10 p-1.5 rounded-full transition-all duration-150 ease-out shadow-lg border ${
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
          style={{ height: `${Math.max(promptPanelHeight, 140)}px` }} // Ensure minimum height on mobile
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
          <div className="p-3 sm:p-6 flex-1 flex flex-col" style={{ height: `${Math.max(promptPanelHeight, 140) - 80}px` }}>
            <textarea
              placeholder="Describe any object to generate from scratch..."
              value={mainPrompt}
              onChange={(e) => setMainPrompt(e.target.value)}
              disabled={false}
              className={`w-full text-base leading-relaxed border-0 bg-transparent resize-none flex-1 overflow-y-auto focus:outline-none placeholder:text-opacity-60 ${
                theme === 'dark'
                  ? 'text-white placeholder:text-gray-500'
                  : 'text-gray-900 placeholder:text-gray-500'
              }`}
            />
          </div>

          {/* Bottom Controls */}
          <div className={`flex items-center justify-between px-3 sm:px-6 py-2 sm:py-4 border-t ${
            theme === 'dark' ? 'border-gray-800' : 'border-gray-100'
          }`}>
            {/* Left: Style and Seed */}
            <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
              <button
                onClick={() => {
                  const styles = ['photorealistic', 'stylized', 'vintage', 'industrial', 'artistic'];
                  const currentIndex = styles.indexOf(selectedStyle);
                  const nextIndex = (currentIndex + 1) % styles.length;
                  setSelectedStyle(styles[nextIndex]);
                }}
                disabled={false}
                className={`w-20 sm:w-32 text-left text-xs sm:text-sm font-medium cursor-pointer transition-all duration-200 ease-out capitalize truncate ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
                title="Click to cycle through styles"
              >
                {selectedStyle.toUpperCase()}
              </button>

              <Input 
                type="number" 
                value={seed} 
                onChange={(e) => setSeed(parseInt(e.target.value, 10))}
                disabled={false}
                className={`w-16 sm:w-20 text-xs sm:text-sm text-center border-0 bg-transparent focus:outline-none ${
                  theme === 'dark'
                    ? 'text-gray-300'
                    : 'text-gray-700'
                }`}
                placeholder="Seed"
              />

              {/* View Angle Selection */}
              <select
                value={viewAngle}
                onChange={(e) => setViewAngle(parseInt(e.target.value, 10))}
                disabled={false}
                className={`w-16 sm:w-20 text-xs text-center border-0 bg-transparent focus:outline-none cursor-pointer ${
                  theme === 'dark'
                    ? 'text-gray-300'
                    : 'text-gray-700'
                }`}
                title="Select view angle for depth map generation. For T-pose models: V1=Front, V3=Back, V2/V4=Sides"
              >
                <option value={1}>V1 Front</option>
                <option value={2}>V2 Side</option>
                <option value={3}>V3 Back</option>
                <option value={4}>V4 Side</option>
                <option value={5}>V5 Top</option>
                <option value={6}>V6 Bottom</option>
              </select>
            </div>

            {/* Right: Minimalist Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Quality Toggle */}
              <button
                onClick={() => setHighQuality(!highQuality)}
                disabled={false}
                className={`text-xs sm:text-sm font-medium cursor-pointer transition-all duration-200 ease-out ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
                title={highQuality ? 'High Quality (12-15 min)' : 'Low Quality/Fast (2-3 min)'}
              >
                {highQuality ? 'HIGH QUALITY' : 'LOW QUALITY'}
              </button>

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
                    addToBatchQueue(queueItem);
                    toast.success("Added to batch queue - use admin panel to start");
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
