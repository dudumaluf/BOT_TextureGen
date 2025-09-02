"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/appStore";
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
    currentGeneration,
    queueCount,
    theme,
    promptPanelHeight,
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
    setCurrentGeneration,
    setCanUpgrade,
    addToQueue,
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
            .single();
          
          if (!error && generation && generation.status === 'completed') {
            console.log(`Polling: Current generation ${currentGenerationId} completed!`);
            
            const textureData = {
              diffuse: generation.diffuse_storage_path,
              normal: generation.normal_storage_path,
              height: generation.height_storage_path,
              thumbnail: generation.thumbnail_storage_path
            };
            
            setGeneratedTextures(textureData);
            setIsLoading(false);
            setCurrentGenerationId(null);
            
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

    setIsLoading(true);
    
    if (useProgressiveMode) {
      toast.info("🚀 Starting fast preview... (2-3 minutes)");
    } else {
      toast.info("Starting high quality generation... (12-15 minutes)");
    }
    
    try {
      console.log(`Generation: Sending reference strength: ${referenceStrength}`);
      
      const startResponse = await fetch('/api/generate', {
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
        }),
      });

      const startResult = await startResponse.json();
      if (!startResult.success) {
        throw new Error(startResult.error || 'Failed to start generation.');
      }
      const { generationId } = startResult;

      setCurrentGenerationId(generationId);
      
      if (useProgressiveMode) {
        console.log(`Generation: Started progressive generation ${generationId} - fast preview first`);
      } else {
        console.log(`Generation: Started generation ${generationId} - ${actualQuality ? 'quality' : 'fast'} mode`);
      }

    } catch (error: unknown) {
      console.error("Error starting generation:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate textures.");
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
    <div className="flex items-center gap-4 w-full min-w-[600px] max-w-4xl mx-auto px-6">
      {/* Left: Stacked Asset Upload Panels */}
      <div className="flex flex-col gap-3">
        {/* Model Upload Panel */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`relative rounded-2xl border shadow-lg ${
            theme === 'dark' 
              ? 'bg-gray-800/95 border-gray-700' 
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
            className="w-16 h-16 flex items-center justify-center"
          >
            {modelUrl ? (
              <div className="text-emerald-600 font-bold text-sm">3D</div>
            ) : (
              <Box className={`h-6 w-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            )}
          </motion.div>
        </motion.div>

        {/* Reference Upload Panel */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
          className={`relative rounded-2xl border shadow-lg ${
            theme === 'dark' 
              ? 'bg-gray-800/95 border-gray-700' 
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
                className="w-16 h-16 flex items-center justify-center"
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
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-300 border-gray-700' 
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
          style={{ height: `${promptPanelHeight}px` }}
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
          <div className="p-6 flex-1 flex flex-col" style={{ height: `${promptPanelHeight - 80}px` }}>
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
          <div className={`flex items-center justify-between px-6 py-4 border-t ${
            theme === 'dark' ? 'border-gray-800' : 'border-gray-100'
          }`}>
            {/* Left: Style and Seed */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const styles = ['photorealistic', 'stylized', 'vintage', 'industrial', 'artistic'];
                  const currentIndex = styles.indexOf(selectedStyle);
                  const nextIndex = (currentIndex + 1) % styles.length;
                  setSelectedStyle(styles[nextIndex]);
                }}
                disabled={false}
                className={`w-32 text-left text-sm font-medium cursor-pointer transition-all duration-200 ease-out capitalize ${
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
                className={`w-20 text-sm text-center border-0 bg-transparent focus:outline-none ${
                  theme === 'dark'
                    ? 'text-gray-300'
                    : 'text-gray-700'
                }`}
                placeholder="Seed"
              />
            </div>

            {/* Right: Minimalist Actions */}
            <div className="flex items-center gap-4">
              {/* Quality Toggle */}
              <button
                onClick={() => setHighQuality(!highQuality)}
                disabled={false}
                className={`text-sm font-medium cursor-pointer transition-all duration-200 ease-out ${
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
                      type: 'generation',
                      modelFileName,
                      modelId,
                      referenceImageUrl,
                      referenceImageName,
                      mainPrompt,
                      selectedStyle,
                      seed,
                      referenceStrength,
                      highQuality: false,
                      status: 'queued'
                    };
                    addToQueue(queueItem);
                    toast.success("Added to generation queue");
                  }}
                  className={`p-2 rounded-lg transition-all duration-200 ease-out ${
                    theme === 'dark'
                      ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'
                  }`}
                  title="Queue for Later"
                >
                  <Timer className="h-4 w-4" />
                </motion.button>
              )}

              {/* Generate/Stop Button */}
              {isLoading ? (
                <div className="flex items-center gap-2">
                  {/* Processing Indicator */}
                  <motion.div
                    className={`p-3 rounded-xl ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                    }`}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                    />
                  </motion.div>
                  
                  {/* Stop Processing Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsLoading(false);
                      setCurrentGenerationId(null);
                      toast.info("Processing stopped - you can start a new generation");
                    }}
                    className={`px-4 py-2 rounded-lg border transition-all duration-200 ease-out ${
                      theme === 'dark'
                        ? 'bg-red-600 hover:bg-red-700 text-white border-red-500'
                        : 'bg-red-500 hover:bg-red-600 text-white border-red-400'
                    }`}
                    title="Stop current processing and reset"
                  >
                    Stop
                  </motion.button>
                </div>
              ) : (
                /* Generate Button - Icon Only */
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
              )}
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
