"use client";

import { useAppStore, type GenerationRecord } from "@/store/appStore";
import { motion } from "framer-motion";
import { Clock, X, ArrowUp, Zap, StopCircle, Server, Activity, Users, RotateCcw, Trash2, AlertTriangle, Timer, Sparkles, Play } from "lucide-react";
import { notify } from "@/lib/notifications";
import { createClient } from "@/lib/supabase";
import type { ComfyUIQueueStatus, ComfyUIQueueItem } from "@/lib/comfyui";
import { useState, useEffect } from "react";

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QueuePanel({ isOpen, onClose }: QueuePanelProps) {
  const { 
    generationQueue, 
    queueCount, 
    currentGeneration,
    removeFromQueue,
    setGenerations,
    theme,
    isAdminMode,
    userEmail,
    isLoading,
    setIsLoading,
    setComfyUIQueue
  } = useAppStore();

  const supabase = createClient();
  
  // ComfyUI Queue State - now using global store
  const comfyUIQueue = useAppStore((state: any) => state.comfyUIQueue);
  const [userPromptIds, setUserPromptIds] = useState<Set<string>>(new Set());
  const [systemStats, setSystemStats] = useState<any>(null);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Helper function to extract prompt information from ComfyUI queue items
  const extractPromptInfo = (promptData: Record<string, any>) => {
    try {
      const subjectPrompt = promptData?.["606"]?.inputs?.text || '';
      const stylePrompt = promptData?.["605"]?.inputs?.text || '';
      
      const displayPrompt = subjectPrompt ? 
        subjectPrompt.split(' ').slice(0, 3).join(' ') || 'texture generation' :
        'texture generation';
        
      let displayStyle = 'photorealistic';
      if (stylePrompt.toLowerCase().includes('artistic')) displayStyle = 'artistic';
      else if (stylePrompt.toLowerCase().includes('stylized')) displayStyle = 'stylized';
      else if (stylePrompt.toLowerCase().includes('vintage')) displayStyle = 'vintage';
      else if (stylePrompt.toLowerCase().includes('industrial')) displayStyle = 'industrial';
      
      return { displayPrompt, displayStyle };
    } catch (error) {
      return { displayPrompt: 'texture generation', displayStyle: 'photorealistic' };
    }
  };

  // Mark generation as cancelled in database when ComfyUI job is stopped/deleted
  const markGenerationAsCancelled = async (promptId: string) => {
    try {
      const supabase = createClient();
      
      // Find the generation with this ComfyUI prompt ID
      const { data: generation, error: findError } = await supabase
        .from('generations')
        .select('id')
        .eq('comfyui_prompt_id', promptId)
        .eq('status', 'processing')
        .single();
      
      if (findError || !generation) {
        console.log(`No processing generation found for ComfyUI prompt ${promptId}`);
        return;
      }
      
      // Update the generation status to cancelled
      const { error: updateError } = await supabase
        .from('generations')
        .update({ 
          status: 'failed',
          error_message: 'Generation cancelled by user'
        })
        .eq('id', generation.id);
      
      if (updateError) {
        console.error('Error marking generation as cancelled:', updateError);
      } else {
        console.log(`Marked generation ${generation.id} as cancelled`);
        
        // Refresh gallery to remove the cancelled generation from processing view
        const { data: updatedGenerations } = await supabase
          .from('generations')
          .select('*, model:models(*)')
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (updatedGenerations) {
          setGenerations(updatedGenerations);
        }
      }
    } catch (error) {
      console.error('Error in markGenerationAsCancelled:', error);
    }
  };

  // Fetch user's prompt IDs to determine which ComfyUI jobs they can control
  const fetchUserPromptIds = async () => {
    try {
      const { data: generations, error } = await supabase
        .from('generations')
        .select('comfyui_prompt_id')
        .eq('status', 'processing');
      
      if (error) {
        console.error('Database error fetching user prompt IDs:', error);
      } else if (generations) {
        const promptIds = new Set(
          generations
            .map(gen => gen.comfyui_prompt_id)
            .filter(id => id)
        );
        setUserPromptIds(promptIds);
      }
    } catch (error) {
      console.error('Error fetching user prompt IDs:', error);
    }
  };

  // Fetch ComfyUI queue status
  const fetchComfyUIQueue = async () => {
    setIsLoadingQueue(true);
    try {
      const response = await fetch('/api/comfyui/queue');
      const data = await response.json();
      
      if (data.success) {
        setComfyUIQueue(data.queue);
        setLastUpdated(new Date());
        setServerOnline(true);
        
        const runningCount = data.queue?.queue_running?.length || 0;
        if (runningCount === 0 && isProcessingQueue) {
          console.log('No ComfyUI processes running - resetting processing state');
          setIsProcessingQueue(false);
          setIsLoading(false);
        }
        
        await fetchUserPromptIds();
      } else {
        console.error('Failed to fetch ComfyUI queue:', data.error);
        setServerOnline(false);
      }
    } catch (error) {
      console.error('Error fetching ComfyUI queue:', error);
      setServerOnline(false);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  // Auto-refresh ComfyUI queue
  useEffect(() => {
    if (!isOpen) return;
    
    const initialFetch = setTimeout(() => {
      fetchComfyUIQueue();
    }, 100);
    
    const interval = setInterval(() => {
      fetchComfyUIQueue();
    }, 5000);
    
    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, [isOpen]);

  // Delete specific ComfyUI queue item (admins can stop any job, users can stop their own jobs)
  const handleDeleteComfyUIItem = async (promptId: string, isUserJob: boolean = false) => {
    if (!isAdminMode && !isUserJob) {
      notify.error('You can only stop your own jobs');
      return;
    }
    
    try {
      // Check if this job is currently running or pending
      const isRunning = comfyUIQueue?.queue_running?.some(item => {
        const itemPromptId = Array.isArray(item) ? item[1] : item.prompt_id;
        return itemPromptId === promptId;
      });
      
      const isPending = comfyUIQueue?.queue_pending?.some(item => {
        const itemPromptId = Array.isArray(item) ? item[1] : item.prompt_id;
        return itemPromptId === promptId;
      });
      
      if (isRunning) {
        // For running jobs, we need to interrupt
        const response = await fetch('/api/comfyui/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'interrupt' })
        });
        
        const data = await response.json();
        if (data.success) {
          notify.success(isUserJob ? 'Your running job has been stopped' : 'Running job interrupted');
          
          // Mark corresponding database generation as cancelled
          await markGenerationAsCancelled(promptId);
          
          // Reset app processing state when stopping individual jobs
          setIsLoading(false);
          setIsProcessingQueue(false);
          
          fetchComfyUIQueue(); // Refresh
        } else {
          notify.error('Failed to stop running job: ' + data.error);
        }
      } else if (isPending) {
        // For pending jobs, we can delete from queue
        const response = await fetch('/api/comfyui/queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', promptId })
        });
        
        const data = await response.json();
        if (data.success) {
          notify.success(isUserJob ? 'Your queued job has been removed' : 'Queued job removed');
          
          // Mark corresponding database generation as cancelled
          await markGenerationAsCancelled(promptId);
          
          // Check if this was the last job and reset processing state if needed
          const remainingRunning = comfyUIQueue?.queue_running?.length || 0;
          const remainingPending = (comfyUIQueue?.queue_pending?.length || 0) - 1; // -1 for the one we just deleted
          
          if (remainingRunning === 0 && remainingPending === 0) {
            setIsLoading(false);
            setIsProcessingQueue(false);
          }
          
          fetchComfyUIQueue(); // Refresh
        } else {
          notify.error('Failed to remove queued job: ' + data.error);
        }
      } else {
        notify.error('Job not found in queue');
      }
    } catch (error) {
      notify.error('Error stopping job');
      console.error('Error stopping ComfyUI job:', error);
    }
  };

  // Interrupt current ComfyUI generation (admin only)
  const handleInterruptComfyUI = async () => {
    console.log('Stop Current clicked - Admin mode:', isAdminMode);
    if (!isAdminMode) {
      notify.error('Admin access required');
      return;
    }
    
    const runningCount = comfyUIQueue?.queue_running?.length || 0;
    console.log('Current state:', { runningCount, isLoading });
    
    if (runningCount === 0 && !isLoading) {
      notify.info('No generation currently running to interrupt');
      return;
    }
    
    if (!confirm(`Stop current processing? This will interrupt ComfyUI and stop TextureGen processing.`)) {
      return;
    }
    
    try {
      notify.info('Stopping processing...');
      console.log('Starting interrupt process...');
      
      // Stop ComfyUI processing
      const response = await fetch('/api/comfyui/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'interrupt' })
      });
      
      const data = await response.json();
      console.log('ComfyUI interrupt result:', data);
      
      if (data.success) {
        // Also stop TextureGen continuous processing
        console.log('Stopping local processing...');
        setIsLoading(false);
        setIsProcessingQueue(false);
        
        // Update any processing generations to failed status
        try {
          const { data: processingGens } = await supabase
            .from('generations')
            .select('id')
            .eq('status', 'processing');
          
          if (processingGens && processingGens.length > 0) {
            console.log('Updating processing generations to failed status...');
            await supabase
              .from('generations')
              .update({ status: 'failed', error_message: 'Manually interrupted' })
              .eq('status', 'processing');
          }
        } catch (error) {
          console.error('Error updating processing generations:', error);
        }
        
                  notify.success('Processing stopped successfully');
        fetchComfyUIQueue(); // Refresh
      } else {
        console.error('Failed to interrupt ComfyUI:', data.error);
        notify.error('Failed to stop: ' + data.error);
      }
    } catch (error) {
      console.error('Error stopping processing:', error);
      notify.error('Error stopping processing');
    }
  };

  // Clear all queues (admin only)
  const handleClearAllQueues = async () => {
    console.log('Clear All clicked - Admin mode:', isAdminMode);
    if (!isAdminMode) {
      notify.error('Admin access required');
      return;
    }
    
    const comfyPending = comfyUIQueue?.queue_pending?.length || 0;
    const comfyRunning = comfyUIQueue?.queue_running?.length || 0;
    const textureGenQueue = queueCount;
    const totalItems = comfyPending + comfyRunning + textureGenQueue;
    
    console.log('Queue counts:', { comfyPending, comfyRunning, textureGenQueue, totalItems });
    
    if (totalItems === 0) {
      notify.info('All queues are already empty');
      return;
    }
    
    if (!confirm(`Clear ALL queues? This will remove ${totalItems} total items (${comfyPending + comfyRunning} ComfyUI + ${textureGenQueue} TextureGen).`)) {
      return;
    }
    
    try {
      notify.info('Clearing all queues...');
      console.log('Starting queue clearing process...');
      
      // Clear ComfyUI queue
      if (comfyPending + comfyRunning > 0) {
        console.log('Clearing ComfyUI queue...');
        const response = await fetch('/api/comfyui/queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear' })
        });
        const result = await response.json();
        console.log('ComfyUI clear result:', result);
      }
      
      // Clear TextureGen queue
      if (textureGenQueue > 0) {
        console.log('Clearing TextureGen queue...');
        generationQueue.forEach((item: any) => {
          console.log('Removing item:', item.id);
          removeFromQueue(item.id);
        });
      }
      
      // Stop processing and clear any ongoing generation tracking
      console.log('Stopping processing...');
      setIsLoading(false);
      setIsProcessingQueue(false);
      
      // Also clear any processing generations in the database
      try {
        const { data: processingGens } = await supabase
          .from('generations')
          .select('id')
          .eq('status', 'processing');
        
        if (processingGens && processingGens.length > 0) {
          console.log('Updating processing generations to failed status...');
          await supabase
            .from('generations')
            .update({ status: 'failed', error_message: 'Manually stopped' })
            .eq('status', 'processing');
        }
      } catch (error) {
        console.error('Error updating processing generations:', error);
      }
      
      notify.success(`All queues cleared (${totalItems} items removed)`);
      fetchComfyUIQueue(); // Refresh
    } catch (error) {
      console.error('Error clearing all queues:', error);
      notify.error('Error clearing queues');
    }
  };

  const handleStartQueue = async () => {
    if (generationQueue.length === 0) {
      notify.info("Queue is empty");
      return;
    }
    
    if (isProcessingQueue) {
      notify.info("Queue is already being processed");
      return;
    }
    
    // Check authentication first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      notify.error("Not authenticated. Please log in again.");
      return;
    }
    
    console.log("🚀 Starting queue processing...", {
      totalItems: generationQueue.length,
      userEmail,
      isAdminMode,
      sessionUserId: session.user.id
    });
    
    const totalItems = generationQueue.length;
    notify.info(`Starting queue processing... (${totalItems} items)`);
    
    // Set loading state to show processing
    setIsLoading(true);
    setIsProcessingQueue(true);
    
    // Process queue items one by one - wait for each to complete before starting next
    let processedCount = 0;
    
    const processNextItem = async () => {
      const currentQueue = useAppStore.getState().generationQueue;
      if (currentQueue.length === 0) {
        console.log("Queue processing completed", { processedCount });
        setIsLoading(false); // Clear loading state
        setIsProcessingQueue(false); // Clear processing flag
        notify.success(`Queue completed! Processed ${processedCount} generations.`);
        return;
      }
      
      const item = currentQueue[0]; // Always process first item
      
      try {
        console.log(`Queue: Processing item ${processedCount + 1}/${totalItems}`, item);
        const displayName = item.mainPrompt ? 
          (item.mainPrompt.split(' ')?.slice(0, 2)?.join(' ') || 'Generation')
          : item.subject_prompt || 'Generation';
          
        notify.info(`Processing ${processedCount + 1}/${totalItems}: ${displayName}`);
        
        // Get current model preset data for the generation
        const { activeModelPresetId, modelPresets } = useAppStore.getState();
        const activePreset = modelPresets.find((p: any) => p.isActive);
        
        console.log(`Queue: Sending generation request for ${displayName}`, {
          modelFileName: item.modelFileName,
          modelId: item.modelId,
          referenceImageName: item.referenceImageName,
          mainPrompt: item.mainPrompt,
          selectedStyle: item.selectedStyle,
          seed: item.seed,
          highQuality: item.type === 'upgrade' ? true : item.highQuality,
          referenceStrength: item.referenceStrength || 0.7,
          viewAngle: item.viewAngle || 1, // Default to front view if not specified
          activeModelPresetId,
          hasActivePreset: !!activePreset
        });

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
            highQuality: item.type === 'upgrade' ? true : item.highQuality,
            referenceStrength: item.referenceStrength || 0.7,
            viewAngle: item.viewAngle || 1, // Default to front view if not specified
            modelPresetId: activeModelPresetId,
            modelPresetData: activePreset
          }),
        });

        const result = await response.json();
        console.log(`Queue: Generate API response for ${displayName}:`, result);
        
        if (result.success) {
          notify.success(`Started: ${displayName} (${processedCount + 1}/${totalItems})`);
          
          // Remove the processed item from queue
          removeFromQueue(item.id);
          processedCount++;
          
          // Wait for this generation to complete before starting next
          // Poll for completion of this specific generation
          const generationId = result.generationId;
          console.log(`Queue: Waiting for completion of generation: ${generationId}`);
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
                    console.log(`Queue: Generation ${generationId} was deleted, stopping polling`);
                    resolve();
                    return;
                  }
                  
                  if (generation && (generation.status === 'completed' || generation.status === 'failed')) {
                    clearInterval(pollInterval);
                    console.log(`Queue: Generation ${generationId} ${generation.status}`);
                    
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
                        
                        console.log(`Queue: Applying textures for ${generationId}`, textureData);
                        const { setGeneratedTextures, setCurrentGeneration } = useAppStore.getState();
                        setGeneratedTextures(textureData);
                        
                        // Create generation pair for upgrade functionality
                        const generationPair = {
                          id: fullGeneration.id,
                          fastGeneration: fullGeneration.high_quality ? undefined : fullGeneration,
                          hqGeneration: fullGeneration.high_quality ? fullGeneration : undefined,
                          canUpgrade: !fullGeneration.high_quality,
                          isUpgrading: false,
                          currentTextures: textureData
                        };
                        
                        setCurrentGeneration(generationPair);
                        console.log(`Queue: Updated viewer with textures for ${displayName}`);
                      }
                    }
                    
                    resolve();
                  }
                } catch (error) {
                  console.error('Queue: Error polling generation status:', error);
                  // Continue polling even on errors
                }
              }, 10000); // Poll every 10 seconds
              
              // Safety timeout after 30 minutes
              setTimeout(() => {
                clearInterval(pollInterval);
                console.log(`Queue: Generation ${generationId} timeout after 30 minutes`);
                resolve();
              }, 30 * 60 * 1000);
            });
          };
          
          // Wait for completion before processing next item
          await waitForCompletion();
          
          // Process next item
          setTimeout(processNextItem, 2000); // 2 second delay between items
        } else {
          throw new Error(result.error || 'Failed to start generation');
        }
      } catch (error) {
        console.error(`Queue: Error processing item ${processedCount + 1}:`, error);
        notify.error(`Failed to process item ${processedCount + 1}: ${error}`);
        
        // Remove failed item and continue with next
        removeFromQueue(item.id);
        processedCount++;
        
        // Continue with next item after a short delay
        setTimeout(processNextItem, 1000);
      }
    };
    
    // Start processing the first item
    processNextItem();
  };

  const handleRemoveFromQueue = (generationId: string, itemUserId?: string) => {
    if (!isAdminMode && itemUserId && itemUserId !== userEmail) {
      notify.error("You can only remove your own generations");
      return;
    }
    
    removeFromQueue(generationId);
    notify.info("Removed from queue");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <h3 className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
            Queue ({(() => {
              const comfyUIActiveJobs = (comfyUIQueue?.queue_running?.length || 0) + (comfyUIQueue?.queue_pending?.length || 0);
              const totalActiveJobs = queueCount + comfyUIActiveJobs;
              return totalActiveJobs;
            })()})
          </h3>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Admin Controls - Next to Title */}
          {isAdminMode && (
            <>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleStartQueue}
                disabled={generationQueue.length === 0 || isProcessingQueue}
                className={`p-1.5 rounded-full transition-colors ${
                  generationQueue.length === 0 || isProcessingQueue
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-green-500 hover:bg-green-500/10'
                }`}
                title="Start Queue Processing"
              >
                <Play className="h-4 w-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleInterruptComfyUI}
                className="p-1.5 rounded-full text-red-500 hover:bg-red-500/10 transition-colors"
                title="Stop Current Generation"
              >
                <StopCircle className="h-4 w-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClearAllQueues}
                className="p-1.5 rounded-full text-orange-500 hover:bg-orange-500/10 transition-colors"
                title="Clear All Queues"
              >
                <Trash2 className="h-4 w-4" />
              </motion.button>
            </>
          )}
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={`hidden sm:block p-1 rounded-full transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>
      </div>


      {/* Content */}
      <div className="flex-1 overflow-y-auto panel-scroll p-4">
        {/* ComfyUI Queue Status */}
        {comfyUIQueue && (
          <div className="mb-4">
            {/* Processing Section */}
            {comfyUIQueue && (comfyUIQueue.queue_running?.length || 0) > 0 && (
              <div className="mt-2">
                <div className="mb-2">
                  <h5 className={`text-sm font-medium flex items-center gap-2 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    Processing
                  </h5>
                </div>
                
                {(comfyUIQueue.queue_running || []).map((item: ComfyUIQueueItem, index: number) => {
                  const promptId = Array.isArray(item) ? item[1] : item.prompt_id;
                  const promptData = Array.isArray(item) ? item[2] : item.prompt;
                  const { displayPrompt, displayStyle } = extractPromptInfo(promptData);
                  
                  return (
                    <div key={promptId || `running-${index}`} className={`flex items-center gap-3 p-3 mb-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'border-orange-700/50'
                        : 'border-orange-200'
                    }`}>
                      <div className="flex-shrink-0 mt-0.5">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full border-2 bg-transparent ${
                          theme === 'dark' 
                            ? 'border-yellow-500 text-yellow-400' 
                            : 'border-yellow-500 text-yellow-600'
                        }`}>
                          2K
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                          {displayPrompt}
                        </div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {displayStyle} • System user
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {(() => {
                          const canStop = isAdminMode || userPromptIds.has(promptId || '');
                          return canStop && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                const isUserJob = userPromptIds.has(promptId || '');
                                promptId && handleDeleteComfyUIItem(promptId, isUserJob);
                              }}
                              className="p-1 text-red-500 hover:bg-red-500/20 rounded transition-colors"
                              title={isAdminMode ? "Stop this job (Admin)" : "Stop your job"}
                            >
                              <X className="h-3 w-3" />
                            </motion.button>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Flow Divider: Processing → Next */}
            {comfyUIQueue && (comfyUIQueue.queue_running?.length || 0) > 0 && comfyUIQueue && (comfyUIQueue.queue_pending?.length || 0) > 0 && (
              <div className="flex items-center justify-center py-2">
                <div className={`w-full h-px border-t-2 border-dashed ${
                  theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                }`} />
              </div>
            )}

            {/* Next Section */}
            {comfyUIQueue && (comfyUIQueue.queue_pending?.length || 0) > 0 && (
              <div className="mt-2">
                <div className="mb-2">
                  <h5 className={`text-sm font-medium flex items-center gap-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Next
                  </h5>
                </div>
                
                {(comfyUIQueue.queue_pending || []).slice(0, 5).map((item: ComfyUIQueueItem, index: number) => {
                  const promptId = Array.isArray(item) ? item[1] : item.prompt_id;
                  const promptData = Array.isArray(item) ? item[2] : item.prompt;
                  const { displayPrompt, displayStyle } = extractPromptInfo(promptData);
                  
                  return (
                    <div key={promptId || `pending-${index}`} className={`flex items-center gap-3 p-3 mb-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'border-green-700/50'
                        : 'border-green-200'
                    }`}>
                      <div className="flex-shrink-0 mt-0.5">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full border-2 bg-transparent ${
                          theme === 'dark' 
                            ? 'border-yellow-500 text-yellow-400' 
                            : 'border-yellow-500 text-yellow-600'
                        }`}>
                          2K
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                          {displayPrompt}
                        </div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {displayStyle} • System user
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {(() => {
                          const canStop = isAdminMode || userPromptIds.has(promptId || '');
                          return canStop && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                const isUserJob = userPromptIds.has(promptId || '');
                                promptId && handleDeleteComfyUIItem(promptId, isUserJob);
                              }}
                              className="p-1 text-red-500 hover:bg-red-500/20 rounded transition-colors"
                              title={isAdminMode ? "Remove from queue (Admin)" : "Remove your job"}
                            >
                              <X className="h-3 w-3" />
                            </motion.button>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
                
                {(comfyUIQueue.queue_pending?.length || 0) > 5 && (
                  <div className={`text-xs text-center py-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    ... and {(comfyUIQueue.queue_pending?.length || 0) - 5} more pending items
                  </div>
                )}
              </div>
            )}

            {/* Flow Divider: Next → Waiting */}
            {comfyUIQueue && (comfyUIQueue.queue_pending?.length || 0) > 0 && generationQueue.length > 0 && (
              <div className="flex items-center justify-center py-2">
                <div className={`w-full h-px border-t-2 border-dashed ${
                  theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                }`} />
              </div>
            )}
          </div>
        )}

        {/* Waiting Queue Items */}
        {queueCount === 0 ? (
          <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            <Clock className={`w-6 h-6 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className="text-sm">Queue empty</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className={`text-sm font-medium flex items-center gap-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                Waiting ({generationQueue.length})
              </h4>
            </div>

            {generationQueue.map((item: any, index: number) => (
              <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                theme === 'dark'
                  ? 'border-blue-700/50'
                  : 'border-blue-200'
              }`}>
                <div className="flex-shrink-0 mt-0.5">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border-2 bg-transparent ${
                    item.highQuality || item.type === 'upgrade'
                      ? theme === 'dark' 
                        ? 'border-green-500 text-green-400' 
                        : 'border-green-500 text-green-600'
                      : theme === 'dark' 
                        ? 'border-yellow-500 text-yellow-400' 
                        : 'border-yellow-500 text-yellow-600'
                  }`}>
                    {item.highQuality || item.type === 'upgrade' ? '4K' : '2K'}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                    {item.mainPrompt ? 
                      (item.mainPrompt.split(' ')?.slice(0, 3)?.join(' ') || 'untitled')
                      : item.subject_prompt?.split(' ')?.slice(0, 3)?.join(' ') || 'untitled'
                    }
                  </div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {item.selectedStyle} • {item.userId && item.userId !== userEmail ? 'Other user' : 
                     item.userId === userEmail ? 'Your item' : 'System user'}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {(isAdminMode || item.userId === userEmail) && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemoveFromQueue(item.id, item.userId)}
                      className="p-1 text-red-500 hover:bg-red-500/20 rounded transition-colors"
                      title={isAdminMode ? "Remove from queue (Admin)" : "Remove your item"}
                    >
                      <X className="h-3 w-3" />
                    </motion.button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}