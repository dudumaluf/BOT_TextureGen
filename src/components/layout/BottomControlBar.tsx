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
  X
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
    stylePrompt,
    subjectPrompt,
    seed,
    isLoading,
    highQuality,
    currentGeneration,
    queueCount,
    setModelUrl, 
    setIsLoading,
    setStylePrompt,
    setSubjectPrompt,
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
  } = useAppStore();
  
  const supabase = createClient();
  const router = useRouter();
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide logic - hide bar when user isn't actively using it
  useEffect(() => {
    let hideTimer: NodeJS.Timeout;
    
    const resetHideTimer = () => {
      clearTimeout(hideTimer);
      setIsVisible(true);
      hideTimer = setTimeout(() => {
        if (!isLoading && !isExpanded) {
          setIsVisible(false);
        }
      }, 3000); // Hide after 3 seconds of inactivity
    };

    // Show on mouse movement near bottom
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY > window.innerHeight - 200) {
        resetHideTimer();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    resetHideTimer();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(hideTimer);
    };
  }, [isLoading, isExpanded]);

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
            
            // Create generation pair for progressive enhancement
            const generationPair = {
              id: generation.id,
              fastGeneration: generation,
              canUpgrade: !highQuality,
              isUpgrading: false,
              currentTextures: textureData
            };
            
            setCurrentGeneration(generationPair);
            
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
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Failed to upload model.");
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
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Failed to upload image.");
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
      const startResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelFileName,
          modelId,
          referenceImageUrl,
          referenceImageName,
          stylePrompt,
          subjectPrompt,
          seed,
          highQuality: actualQuality,
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

    } catch (error: any) {
      console.error("Error starting generation:", error);
      toast.error(error.message || "Failed to generate textures.");
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ 
        y: isVisible ? 0 : 80, 
        opacity: isVisible ? 1 : 0.3 
      }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="p-6"
      onMouseEnter={() => setIsVisible(true)}
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
        {/* Header with close button */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-700">Generation Controls</span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleBottomBar}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </motion.button>
        </div>
        
        {/* Main Control Bar */}
        <div className="flex items-center gap-4 px-6 py-3">
          {/* Left: Upload Squares */}
          <div className="flex items-center gap-3">
            {/* Model Upload Square */}
            <div className="relative">
              <input
                id="model-upload"
                type="file"
                accept=".glb"
                onChange={handleFileChange}
                disabled={isLoading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-12 h-12 rounded-xl border-2 border-dashed transition-all flex items-center justify-center ${
                  modelUrl 
                    ? 'border-green-400 bg-green-50 text-green-600' 
                    : 'border-gray-300 bg-gray-50 text-gray-500 hover:border-blue-300 hover:bg-blue-50'
                }`}
                title="Upload 3D Model (.glb)"
              >
                {modelUrl ? (
                  <div className="text-xs font-bold">3D</div>
                ) : (
                  <Upload className="h-5 w-5" />
                )}
              </motion.div>
            </div>

            {/* Reference Upload Square */}
            <div className="relative">
              <input
                id="reference-upload"
                type="file"
                accept="image/*"
                onChange={handleReferenceImageChange}
                disabled={isLoading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-12 h-12 rounded-xl border-2 border-dashed transition-all flex items-center justify-center overflow-hidden ${
                  referenceImageUrl 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 bg-gray-50 text-gray-500 hover:border-blue-300 hover:bg-blue-50'
                }`}
                title="Upload Reference Image"
              >
                {referenceImageUrl ? (
                  <img src={referenceImageUrl} alt="Reference" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-5 w-5" />
                )}
              </motion.div>
            </div>
          </div>

          {/* Center: Prompt Input */}
          <div className="flex-1">
            <Input
              placeholder="Describe your desired texture style and subject..."
              value={`${stylePrompt}, ${subjectPrompt}`}
              onChange={(e) => {
                const fullPrompt = e.target.value;
                const parts = fullPrompt.split(',');
                setStylePrompt(parts[0]?.trim() || '');
                setSubjectPrompt(parts.slice(1).join(',').trim() || '');
              }}
              disabled={isLoading}
              className="text-sm bg-white/80 border-white/40 focus:bg-white/95 transition-all"
            />
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            {/* Seed */}
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                value={seed} 
                onChange={(e) => setSeed(parseInt(e.target.value, 10))}
                disabled={isLoading}
                className="w-20 text-sm"
                title="Seed"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSeed(Math.floor(Math.random() * 1000000))}
                disabled={isLoading}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                title="Random Seed"
              >
                <Dices className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Smart Generate/Queue Button */}
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleGenerate} 
                disabled={isLoading || !modelUrl || !referenceImageUrl}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : queueCount > 0 ? 'Add to Queue' : 'Generate'}
              </Button>
              
              {/* Queue to Process Later Button */}
              {modelUrl && referenceImageUrl && !isLoading && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Add current settings to queue for later processing
                    const queueItem = {
                      id: Date.now().toString(),
                      type: 'generation',
                      modelFileName,
                      modelId,
                      referenceImageUrl,
                      referenceImageName,
                      stylePrompt,
                      subjectPrompt,
                      seed,
                      highQuality: false, // Always start with fast
                      status: 'queued'
                    };
                    addToQueue(queueItem);
                    toast.success("Added to generation queue");
                  }}
                  className="p-2 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-all"
                  title="Queue for Later"
                >
                  <Plus className="h-4 w-4" />
                </motion.button>
              )}
            </div>

            {/* Sign Out */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              className="p-2 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 transition-all"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        {/* Upgrade Button (appears after fast generation) */}
        <div className="px-6 pb-4">
          <UpgradeButton />
        </div>
      </div>
    </motion.div>
  );
}
