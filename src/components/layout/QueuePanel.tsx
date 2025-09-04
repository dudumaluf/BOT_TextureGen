"use client";

import { useAppStore, type GenerationRecord } from "@/store/appStore";
import { motion } from "framer-motion";
import { Clock, X, ArrowUp, Zap, StopCircle, Server, Activity, Users, RotateCcw, Trash2, AlertTriangle, Timer, Sparkles } from "lucide-react";
import { toast } from "sonner";
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
    setIsLoading
  } = useAppStore();

  const supabase = createClient();
  
  // ComfyUI Queue State
  const [comfyUIQueue, setComfyUIQueue] = useState<ComfyUIQueueStatus | null>(null);
  const [userPromptIds, setUserPromptIds] = useState<Set<string>>(new Set());
  const [systemStats, setSystemStats] = useState<any>(null);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showSystemStats, setShowSystemStats] = useState(false);

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
            .filter(id => id) // Remove null/undefined
        );
        setUserPromptIds(promptIds);
        console.log('User prompt IDs:', Array.from(promptIds));
      }
    } catch (error) {
      console.error('Error fetching user prompt IDs:', error);
    }
  };

  // Fetch ComfyUI queue status (all users can see, only admins can control)
  const fetchComfyUIQueue = async () => {
    
    setIsLoadingQueue(true);
    try {
      const response = await fetch('/api/comfyui/queue');
      const data = await response.json();
      
      if (data.success) {
        setComfyUIQueue(data.queue);
        setLastUpdated(new Date());
        // Also fetch user's prompt IDs to determine which jobs they can control
        await fetchUserPromptIds();
      } else {
        console.error('Failed to fetch ComfyUI queue:', data.error);
      }
    } catch (error) {
      console.error('Error fetching ComfyUI queue:', error);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  // Fetch system stats (all users can see, only admins can control)
  const fetchSystemStats = async () => {
    
    try {
      const response = await fetch('/api/comfyui/control');
      const data = await response.json();
      
      if (data.success) {
        setSystemStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  // Clear ComfyUI queue (admin only)
  const handleClearComfyUIQueue = async () => {
    if (!isAdminMode) return;
    
    const pendingCount = comfyUIQueue?.queue_pending?.length || 0;
    const runningCount = comfyUIQueue?.queue_running?.length || 0;
    const totalCount = pendingCount + runningCount;
    
    if (totalCount === 0) {
      toast.info('Queue is already empty');
      return;
    }
    
    if (!confirm(`Clear entire ComfyUI queue? This will cancel ${pendingCount} pending job${pendingCount !== 1 ? 's' : ''} and interrupt ${runningCount} running job${runningCount !== 1 ? 's' : ''}.`)) {
      return;
    }
    
    try {
      toast.info('Clearing ComfyUI queue...');
      const response = await fetch('/api/comfyui/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(`✅ ComfyUI queue cleared (${totalCount} job${totalCount !== 1 ? 's' : ''} removed)`);
        fetchComfyUIQueue(); // Refresh
      } else {
        toast.error('❌ Failed to clear queue: ' + data.error);
      }
    } catch (error) {
      toast.error('❌ Error clearing queue');
      console.error('Error clearing ComfyUI queue:', error);
    }
  };

  // Delete specific ComfyUI queue item (admins can stop any job, users can stop their own jobs)
  const handleDeleteComfyUIItem = async (promptId: string, isUserJob: boolean = false) => {
    if (!isAdminMode && !isUserJob) {
      toast.error('You can only stop your own jobs');
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
          toast.success(isUserJob ? 'Your running job has been stopped' : 'Running job interrupted');
          fetchComfyUIQueue(); // Refresh
        } else {
          toast.error('Failed to stop running job: ' + data.error);
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
          toast.success(isUserJob ? 'Your queued job has been removed' : 'Queued job removed');
          fetchComfyUIQueue(); // Refresh
        } else {
          toast.error('Failed to remove queued job: ' + data.error);
        }
      } else {
        toast.error('Job not found in queue');
      }
    } catch (error) {
      toast.error('Error stopping job');
      console.error('Error stopping ComfyUI job:', error);
    }
  };

  // Interrupt current ComfyUI generation (admin only)
  const handleInterruptComfyUI = async () => {
    console.log('Stop Current clicked - Admin mode:', isAdminMode);
    if (!isAdminMode) {
      toast.error('Admin access required');
      return;
    }
    
    const runningCount = comfyUIQueue?.queue_running?.length || 0;
    console.log('Current state:', { runningCount, isLoading });
    
    if (runningCount === 0 && !isLoading) {
      toast.info('No generation currently running to interrupt');
      return;
    }
    
    if (!confirm(`Stop current processing? This will interrupt ComfyUI and stop TextureGen processing.`)) {
      return;
    }
    
    try {
      toast.info('Stopping processing...');
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
        
        toast.success('✅ Processing stopped successfully');
        fetchComfyUIQueue(); // Refresh
      } else {
        console.error('Failed to interrupt ComfyUI:', data.error);
        toast.error('❌ Failed to stop: ' + data.error);
      }
    } catch (error) {
      console.error('Error stopping processing:', error);
      toast.error('❌ Error stopping processing');
    }
  };

  // Clear all queues (admin only)
  const handleClearAllQueues = async () => {
    console.log('Clear All clicked - Admin mode:', isAdminMode);
    if (!isAdminMode) {
      toast.error('Admin access required');
      return;
    }
    
    const comfyPending = comfyUIQueue?.queue_pending?.length || 0;
    const comfyRunning = comfyUIQueue?.queue_running?.length || 0;
    const textureGenQueue = queueCount;
    const totalItems = comfyPending + comfyRunning + textureGenQueue;
    
    console.log('Queue counts:', { comfyPending, comfyRunning, textureGenQueue, totalItems });
    
    if (totalItems === 0) {
      toast.info('All queues are already empty');
      return;
    }
    
    if (!confirm(`Clear ALL queues? This will remove ${totalItems} total items (${comfyPending + comfyRunning} ComfyUI + ${textureGenQueue} TextureGen).`)) {
      return;
    }
    
    try {
      toast.info('Clearing all queues...');
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
        generationQueue.forEach(item => {
          console.log('Removing item:', item.id);
          removeFromQueue(item.id);
        });
      }
      
      // Stop processing
      console.log('Stopping processing...');
      setIsLoading(false);
      
      toast.success(`✅ All queues cleared (${totalItems} items removed)`);
      fetchComfyUIQueue(); // Refresh
    } catch (error) {
      console.error('Error clearing all queues:', error);
      toast.error('❌ Error clearing queues');
    }
  };

  // Auto-refresh ComfyUI queue for all users
  useEffect(() => {
    if (!isOpen) return;
    
    // Initial fetch with a small delay to avoid render-time state updates
    const initialFetch = setTimeout(() => {
      fetchComfyUIQueue();
      fetchSystemStats();
    }, 100);
    
    // Set up polling interval
    const interval = setInterval(() => {
      fetchComfyUIQueue();
      fetchSystemStats();
    }, 5000); // Refresh every 5 seconds
    
    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, [isOpen]);

  const handleRemoveFromQueue = (generationId: string, itemUserId?: string) => {
    console.log('handleRemoveFromQueue called with ID:', generationId);
    console.log('Current queue before removal:', generationQueue);
    
    // Check if user can remove this item (admin or owner)
    if (!isAdminMode && itemUserId && itemUserId !== userEmail) {
      toast.error("You can only remove your own generations");
      return;
    }
    
    removeFromQueue(generationId);
    toast.info("Removed from queue");
    console.log('removeFromQueue called');
  };

  const handleStartQueue = async () => {
    if (generationQueue.length === 0) return;
    
    const totalItems = generationQueue.length;
    toast.info(`Starting queue processing... (${totalItems} items)`);
    
    // Process queue items one by one - wait for each to complete before starting next
    let processedCount = 0;
    
    const processNextItem = async () => {
      const currentQueue = useAppStore.getState().generationQueue;
      if (currentQueue.length === 0) {
        toast.success(`Queue completed! Processed ${processedCount} generations.`);
        return;
      }
      
      const item = currentQueue[0]; // Always process first item
      
      try {
        console.log(`Queue: Processing item ${processedCount + 1}/${totalItems}`, item);
        const displayName = item.mainPrompt ? 
          (item.mainPrompt.split(' ')?.slice(0, 2)?.join(' ') || 'Generation')
          : item.subject_prompt || 'Generation';
          
        toast.info(`Processing ${processedCount + 1}/${totalItems}: ${displayName}`);
        
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
            referenceStrength: item.referenceStrength || 0.7
          }),
        });

        const result = await response.json();
        if (result.success) {
          toast.success(`Started: ${displayName} (${processedCount + 1}/${totalItems})`);
          
          // Remove the processed item from queue
          removeFromQueue(item.id);
          processedCount++;
          
          // Wait for this generation to complete before starting next
          // Poll for completion of this specific generation
          const generationId = result.generationId;
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
                          fastGeneration: fullGeneration.high_quality ? null : fullGeneration,
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
                  console.error('Queue polling error:', error);
                }
              }, 10000); // Check every 10 seconds
              
              // Timeout after 20 minutes
              setTimeout(() => {
                clearInterval(pollInterval);
                console.log(`Queue: Generation ${generationId} timeout`);
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
          
          // Process next item
          setTimeout(processNextItem, 2000); // 2 second delay between items
          
        } else {
          toast.error(`Failed: ${item.mainPrompt || 'Generation'}`);
          removeFromQueue(item.id);
          processedCount++;
          setTimeout(processNextItem, 1000);
        }
        
      } catch (error: any) {
        console.error('Queue processing error:', error);
        toast.error(`Error processing: ${item.mainPrompt || 'Generation'}`);
        removeFromQueue(item.id);
        processedCount++;
        setTimeout(processNextItem, 1000);
      }
    };
    
    // Start processing the first item
    processNextItem();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <h3 className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
            {isAdminMode ? 'Admin Queue' : 'Processing Queue'} ({queueCount})
          </h3>
          {isAdminMode && (
            <div className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
              ADMIN
            </div>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className={`p-1 rounded-full transition-colors ${
            theme === 'dark' 
              ? 'hover:bg-gray-700 text-gray-400' 
              : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <X className="h-4 w-4" />
        </motion.button>
      </div>

      {/* ComfyUI Status Section - Visible to all users */}
      {(
        <div className={`border-b p-4 ${theme === 'dark' ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
          {/* Loading State */}
          {isLoadingQueue && !comfyUIQueue && (
            <div className="flex items-center justify-center py-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className={`w-6 h-6 border-2 border-t-transparent rounded-full ${
                  theme === 'dark' ? 'border-gray-400' : 'border-gray-600'
                }`}
              />
              <span className={`ml-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Loading ComfyUI status...
              </span>
            </div>
          )}
          {/* System Status */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  ComfyUI Server Status
                </h4>
                {!isAdminMode && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    theme === 'dark' ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
                  }`}>
                    Read-only
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchComfyUIQueue}
                  disabled={isLoadingQueue}
                  className={`p-1 rounded transition-colors ${
                    theme === 'dark' 
                      ? 'hover:bg-gray-700 text-gray-400' 
                      : 'hover:bg-gray-200 text-gray-500'
                  }`}
                  title="Refresh"
                >
                  <motion.div
                    animate={isLoadingQueue ? { rotate: 360 } : {}}
                    transition={{ duration: 1, repeat: isLoadingQueue ? Infinity : 0, ease: "linear" }}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </motion.div>
                </motion.button>
              </div>
            </div>
            
            {/* Queue Stats */}
            {comfyUIQueue && comfyUIQueue.queue_running && comfyUIQueue.queue_pending && comfyUIQueue.exec_info && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className={`p-2 rounded text-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className={`text-lg font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                    {comfyUIQueue.queue_running?.length || 0}
                  </div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Running</div>
                </div>
                <div className={`p-2 rounded text-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className={`text-lg font-bold ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    {comfyUIQueue.queue_pending?.length || 0}
                  </div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Pending</div>
                </div>
                <div className={`p-2 rounded text-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className={`text-lg font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                    {comfyUIQueue.exec_info?.queue_remaining || 0}
                  </div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Remaining</div>
                </div>
              </div>
            )}
            
            {/* Last Updated */}
            {lastUpdated && (
              <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Admin Controls - Compact Row (Admin Only) */}
          {isAdminMode && (
            <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleInterruptComfyUI}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                theme === 'dark'
                  ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300'
                  : 'text-red-600 hover:bg-red-100 hover:text-red-700'
              }`}
              title="Stop current processing"
            >
              <StopCircle className="h-3 w-3" />
              Stop
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClearAllQueues}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                theme === 'dark'
                  ? 'text-orange-400 hover:bg-orange-500/20 hover:text-orange-300'
                  : 'text-orange-600 hover:bg-orange-100 hover:text-orange-700'
              }`}
              title="Clear all queues"
            >
              <Trash2 className="h-3 w-3" />
              Clear All
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                fetchSystemStats();
                setShowSystemStats(!showSystemStats);
              }}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                showSystemStats 
                  ? theme === 'dark'
                    ? 'text-blue-300 bg-blue-500/20'
                    : 'text-blue-700 bg-blue-100'
                  : theme === 'dark'
                    ? 'text-blue-400 hover:bg-blue-500/20 hover:text-blue-300'
                    : 'text-blue-600 hover:bg-blue-100 hover:text-blue-700'
              }`}
              title="Toggle system statistics"
            >
              <Activity className="h-3 w-3" />
              Stats
            </motion.button>
            </div>
          )}

          {/* System Stats Display */}
          {showSystemStats && systemStats && (
            <div className={`mt-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
              <h5 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                System Statistics
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {systemStats.system && (
                  <>
                    <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      OS: {systemStats.system.os || 'Unknown'}
                    </div>
                    <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Python: {systemStats.system.python_version || 'Unknown'}
                    </div>
                  </>
                )}
                {systemStats.devices && systemStats.devices.length > 0 && (
                  <>
                    <div className={`col-span-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      GPU: {systemStats.devices?.[0]?.name || 'Unknown'}
                    </div>
                    <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      VRAM: {systemStats.devices?.[0]?.vram_total ? `${Math.round(systemStats.devices[0].vram_total / 1024 / 1024 / 1024)}GB` : 'Unknown'}
                    </div>
                    <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Free: {systemStats.devices?.[0]?.vram_free ? `${Math.round(systemStats.devices[0].vram_free / 1024 / 1024 / 1024)}GB` : 'Unknown'}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ComfyUI Queue Items */}
          {comfyUIQueue && ((comfyUIQueue.queue_running?.length || 0) > 0 || (comfyUIQueue.queue_pending?.length || 0) > 0) && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  ComfyUI Queue Items
                </h5>
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  All users
                </span>
              </div>
              
              {/* Running Items */}
              {(comfyUIQueue.queue_running || []).map((item: ComfyUIQueueItem, index: number) => {
                // ComfyUI queue items are arrays: [number, prompt_id, prompt_data, extra_data, outputs]
                const itemNumber = Array.isArray(item) ? item[0] : item.number;
                const promptId = Array.isArray(item) ? item[1] : item.prompt_id;
                const promptData = Array.isArray(item) ? item[2] : item.prompt;
                
                return (
                <div key={promptId || `running-${index}`} className={`flex items-center gap-3 p-2 mb-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-green-900/20 border-green-700/50'
                    : 'bg-green-50 border-green-200'
                }`}>
                  {/* Status Icon */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="flex-shrink-0"
                  >
                    <Activity className="h-3 w-3 text-green-500" />
                  </motion.div>
                  
                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                        Processing #{itemNumber || index + 1}
                      </span>
                      <span className={`text-xs font-mono px-1 py-0.5 rounded ${
                        theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {promptId?.slice(0, 8) || 'pending'}
                      </span>
                    </div>
                    <div className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Started {lastUpdated ? lastUpdated.toLocaleTimeString() : 'recently'}
                    </div>
                    
                    {/* Progress Bar Placeholder - Will be enhanced with WebSocket data */}
                    <div className="mt-1">
                      <div className={`w-full h-1 rounded-full overflow-hidden ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <motion.div
                          className="h-full bg-green-500 rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
                        />
                      </div>
                      <div className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        Processing nodes...
                      </div>
                    </div>
                  </div>
                  
                  {/* Individual Controls - Admin or User's Own Job */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      // ComfyUI queue items are arrays: [number, prompt_id, prompt_data, extra_data, outputs]
                      const promptId = Array.isArray(item) ? item[1] : (item.prompt_id || item.id || item.promptId);
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
              
              {/* Pending Items */}
              {(comfyUIQueue.queue_pending || []).slice(0, 5).map((item: ComfyUIQueueItem, index: number) => {
                // ComfyUI queue items are arrays: [number, prompt_id, prompt_data, extra_data, outputs]
                const itemNumber = Array.isArray(item) ? item[0] : item.number;
                const promptId = Array.isArray(item) ? item[1] : item.prompt_id;
                const promptData = Array.isArray(item) ? item[2] : item.prompt;
                
                return (
                <div key={promptId || `pending-${index}`} className={`flex items-center gap-3 p-2 mb-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-yellow-900/20 border-yellow-700/50'
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    <Clock className="h-3 w-3 text-yellow-500" />
                  </div>
                  
                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                        Queued #{itemNumber || index + 1}
                      </span>
                      <span className={`text-xs font-mono px-1 py-0.5 rounded ${
                        theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {promptId?.slice(0, 8) || 'waiting'}
                      </span>
                    </div>
                    <div className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Position #{index + 1} in queue
                    </div>
                  </div>
                  
                  {/* Individual Controls - Admin or User's Own Job */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      // ComfyUI queue items are arrays: [number, prompt_id, prompt_data, extra_data, outputs]
                      const promptId = Array.isArray(item) ? item[1] : (item.prompt_id || item.id || item.promptId);
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
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Current Processing */}
        {currentGeneration?.isUpgrading && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <ArrowUp className="h-4 w-4 text-blue-600" />
              </motion.div>
              <span className="font-medium text-blue-800">Currently Upgrading</span>
            </div>
            <p className="text-sm text-blue-700">
              {currentGeneration.fastGeneration?.subject_prompt || "Generation"} → High Quality
            </p>
          </div>
        )}


        {/* Queue Items */}
        {queueCount === 0 ? (
          <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            <Clock className={`w-6 h-6 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className="text-sm">Queue empty</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Queue Header */}
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                {queueCount} waiting
              </span>
              <div className="flex items-center gap-1">
                {isAdminMode && queueCount > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (confirm('Clear entire queue?')) {
                        // Clear all items
                        generationQueue.forEach(item => removeFromQueue(item.id));
                        toast.success('Queue cleared');
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                    title="Clear All (Admin)"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear
                  </motion.button>
                )}
              {queueCount > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartQueue}
                    className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                >
                    <Activity className="h-3 w-3" />
                    Start
                </motion.button>
              )}
              </div>
            </div>

            {/* Continuous Queue Items (Auto-processing) */}
            {generationQueue.filter(item => item.queueType === 'continuous').length > 0 && (
              <div className="mb-4">
                <h4 className={`text-xs font-medium mb-2 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Sparkles className="h-3 w-3" />
                  Continuous Processing ({generationQueue.filter(item => item.queueType === 'continuous').length})
                </h4>
                <div className="space-y-2">
                  {generationQueue.filter(item => item.queueType === 'continuous').map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-green-900/20 border-green-700/50'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {item.type === 'upgrade' ? (
                          <ArrowUp className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      
                      {/* Job Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                            {item.mainPrompt ? 
                              (item.mainPrompt.split(' ')?.slice(0, 3)?.join(' ') || 'untitled')
                              : item.subject_prompt || 'untitled'
                            }
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            item.highQuality || item.type === 'upgrade'
                              ? theme === 'dark' ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
                              : theme === 'dark' ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                          }`}>
                            {item.highQuality || item.type === 'upgrade' ? 'HQ' : 'LQ'}
                          </span>
                        </div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          #{index + 1} • Auto-processing
                          {item.userId && item.userId !== userEmail && (
                            <span className="ml-2 text-blue-500">• Other user</span>
                          )}
                          {item.userId === userEmail && !isAdminMode && (
                            <span className="ml-2 text-green-500">• Your item</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Individual Controls - Owner or Admin */}
                      <div className="flex items-center gap-1">
                        {(isAdminMode || item.userId === userEmail) && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRemoveFromQueue(item.originalId || item.id, item.userId)}
                            className="p-1.5 text-red-500 hover:bg-red-500/20 rounded transition-colors"
                            title={isAdminMode ? "Remove from queue (Admin)" : "Remove your item"}
                          >
                            <X className="h-3 w-3" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Batch Queue Items (Manual start) */}
            {generationQueue.filter(item => item.queueType === 'batch').length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`text-xs font-medium flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Timer className="h-3 w-3" />
                    Batch Queue ({generationQueue.filter(item => item.queueType === 'batch').length})
                  </h4>
                  {isAdminMode && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleStartQueue}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                      title="Start batch processing"
                    >
                      <Sparkles className="h-3 w-3" />
                      Start Batch
                    </motion.button>
                  )}
                </div>
                <div className="space-y-2">
                  {generationQueue.filter(item => item.queueType === 'batch').map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-blue-900/20 border-blue-700/50'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {item.type === 'upgrade' ? (
                          <ArrowUp className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Timer className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                
                      {/* Job Info */}
                <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                            {item.mainPrompt ? 
                              (item.mainPrompt.split(' ')?.slice(0, 3)?.join(' ') || 'untitled')
                              : item.subject_prompt || 'untitled'
                            }
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            item.highQuality || item.type === 'upgrade'
                              ? theme === 'dark' ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
                              : theme === 'dark' ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {item.highQuality || item.type === 'upgrade' ? 'HQ' : 'LQ'}
                          </span>
                        </div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          #{index + 1} • Waiting for batch start
                          {item.userId && item.userId !== userEmail && (
                            <span className="ml-2 text-blue-500">• Other user</span>
                          )}
                          {item.userId === userEmail && !isAdminMode && (
                            <span className="ml-2 text-green-500">• Your item</span>
                    )}
                  </div>
                </div>
                
                      {/* Individual Controls - Owner or Admin */}
                      <div className="flex items-center gap-1">
                        {(isAdminMode || item.userId === userEmail) && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                            onClick={() => handleRemoveFromQueue(item.originalId || item.id, item.userId)}
                            className="p-1.5 text-red-500 hover:bg-red-500/20 rounded transition-colors"
                            title={isAdminMode ? "Remove from queue (Admin)" : "Remove your item"}
                >
                            <X className="h-3 w-3" />
                </motion.button>
                        )}
                      </div>
              </motion.div>
            ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
