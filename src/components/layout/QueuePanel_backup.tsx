"use client";

import { useAppStore, type GenerationRecord } from "@/store/appStore";
import { motion } from "framer-motion";
import { Clock, X, ArrowUp, Zap, StopCircle, Server, Activity, Users, RotateCcw, Trash2, AlertTriangle, Timer, Sparkles, Play } from "lucide-react";
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
  const [serverOnline, setServerOnline] = useState<boolean | null>(null); // null = unknown, true = online, false = offline
  const [isProcessingQueue, setIsProcessingQueue] = useState(false); // Prevent multiple queue processing instances

  // Helper function to extract prompt information from ComfyUI queue items
  const extractPromptInfo = (promptData: any) => {
    try {
      // Look for the subject prompt in node 606 (our main prompt node)
      const subjectPrompt = promptData?.["606"]?.inputs?.text || '';
      // Look for style prompt in node 605 (our style prompt node)  
      const stylePrompt = promptData?.["605"]?.inputs?.text || '';
      
      // Extract first few words of the subject prompt for display
      const displayPrompt = subjectPrompt ? 
        subjectPrompt.split(' ').slice(0, 3).join(' ') || 'texture generation' :
        'texture generation';
        
      // Determine style from style prompt or default
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
        setServerOnline(true); // Server is responding
        
        // Auto-reset processing state if no ComfyUI processes are running
        const runningCount = data.queue?.queue_running?.length || 0;
        if (runningCount === 0 && isProcessingQueue) {
          console.log('No ComfyUI processes running - resetting processing state');
          setIsProcessingQueue(false);
          setIsLoading(false);
        }
        
        // Also fetch user's prompt IDs to determine which jobs they can control
        await fetchUserPromptIds();
      } else {
        console.error('Failed to fetch ComfyUI queue:', data.error);
        setServerOnline(false); // Server responded but with error
      }
    } catch (error) {
      console.error('Error fetching ComfyUI queue:', error);
      setServerOnline(false); // Server is not reachable
    } finally {
      setIsLoadingQueue(false);
    }
  };

  // Helper function to get server status color and animation state
  const getServerStatusInfo = () => {
    const isProcessing = (comfyUIQueue?.queue_running?.length || 0) > 0 || isLoading;
    
    if (serverOnline === null) {
      // Unknown status - gray
      return {
        color: theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
        hoverColor: theme === 'dark' ? 'hover:bg-gray-700 hover:text-gray-300' : 'hover:bg-gray-100 hover:text-gray-600',
        shouldAnimate: isLoadingQueue,
        statusText: 'Unknown'
      };
    } else if (serverOnline) {
      // Online - green
      return {
        color: theme === 'dark' ? 'text-green-400' : 'text-green-600',
        hoverColor: theme === 'dark' ? 'hover:bg-green-900/30 hover:text-green-300' : 'hover:bg-green-50 hover:text-green-700',
        shouldAnimate: isLoadingQueue || isProcessing,
        statusText: 'Online'
      };
    } else {
      // Offline - red
      return {
        color: theme === 'dark' ? 'text-red-400' : 'text-red-600',
        hoverColor: theme === 'dark' ? 'hover:bg-red-900/30 hover:text-red-300' : 'hover:bg-red-50 hover:text-red-700',
        shouldAnimate: isLoadingQueue,
        statusText: 'Offline'
      };
    }
  };

  // Create system stats tooltip content
  const getSystemStatsTooltip = () => {
    if (!systemStats) return 'ComfyUI Server - Click to refresh status';
    
    const stats = [];
    if (systemStats.system?.ram) {
      const ramUsed = ((systemStats.system.ram.used / systemStats.system.ram.total) * 100).toFixed(1);
      stats.push(`RAM: ${ramUsed}%`);
    }
    if (systemStats.system?.vram) {
      const vramUsed = ((systemStats.system.vram.used / systemStats.system.vram.total) * 100).toFixed(1);
      stats.push(`VRAM: ${vramUsed}%`);
    }
    if (systemStats.devices) {
      stats.push(`Devices: ${systemStats.devices.length}`);
    }
    
    const statusInfo = getServerStatusInfo();
    const baseInfo = `ComfyUI Server (${statusInfo.statusText})`;
    
    return stats.length > 0 ? `${baseInfo}\n${stats.join(' • ')}` : baseInfo;
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
    if (generationQueue.length === 0) {
      toast.info("Queue is empty");
      return;
    }
    
    if (isProcessingQueue) {
      toast.info("Queue is already being processed");
      return;
    }
    
    // Check authentication first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Not authenticated. Please log in again.");
      return;
    }
    
    console.log("🚀 Starting queue processing...", {
      totalItems: generationQueue.length,
      userEmail,
      isAdminMode,
      sessionUserId: session.user.id
    });
    
    const totalItems = generationQueue.length;
    toast.info(`Starting queue processing... (${totalItems} items)`);
    
    // Set loading state to show processing
    setIsLoading(true);
    setIsProcessingQueue(true);
    
    // Process queue items one by one - wait for each to complete before starting next
    let processedCount = 0;
    
    const processNextItem = async () => {
      const currentQueue = useAppStore.getState().generationQueue;
      if (currentQueue.length === 0) {
        console.log("✅ Queue processing completed", { processedCount });
        setIsLoading(false); // Clear loading state
        setIsProcessingQueue(false); // Clear processing flag
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
        
        // Get current model preset data for the generation
        const { activeModelPresetId, modelPresets } = useAppStore.getState();
        const activePreset = modelPresets.find(p => p.isActive);
        
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
                          fastGeneration: fullGeneration.high_quality ? undefined : fullGeneration,
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
          console.error(`Queue: Generation failed for ${displayName}:`, result);
          toast.error(`Failed: ${displayName} - ${result.error || 'Unknown error'}`);
          removeFromQueue(item.id);
          processedCount++;
          
          // Check if there are more items to process
          const remainingQueue = useAppStore.getState().generationQueue;
          if (remainingQueue.length > 0) {
            setTimeout(processNextItem, 1000);
          } else {
            console.log("❌ Queue processing completed with errors");
            setIsLoading(false); // Clear loading state
            setIsProcessingQueue(false); // Clear processing flag
          }
        }
        
      } catch (error: any) {
        console.error('Queue processing error:', error);
        const errorMessage = error.message || error.toString() || 'Network error';
        toast.error(`Error processing: ${displayName} - ${errorMessage}`);
        removeFromQueue(item.id);
        processedCount++;
        
        // Check if there are more items to process
        const remainingQueue = useAppStore.getState().generationQueue;
        if (remainingQueue.length > 0) {
          setTimeout(processNextItem, 1000);
        } else {
          console.log("❌ Queue processing completed with errors");
          setIsLoading(false); // Clear loading state
          setIsProcessingQueue(false); // Clear processing flag
        }
      }
    };
    
    // Start processing the first item
    processNextItem();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - Simplified with Essential Controls */}
      <div className={`flex items-center justify-between p-4 border-b ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <h3 className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
            Queue ({queueCount})
          </h3>
          {/* Admin Badge */}
          {isAdminMode && (
            <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              A
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Close Button */}
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

      {/* Admin Controls Section - Compact */}
      {isAdminMode && (
        <div className={`px-4 py-3 ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-center gap-3">
            {/* Start Queue Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleStartQueue}
              disabled={generationQueue.length === 0 || isProcessingQueue}
              className={`p-2 rounded-full transition-colors ${
                generationQueue.length === 0 || isProcessingQueue
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-green-500 hover:bg-green-500/10'
              }`}
              title="Start Queue Processing"
            >
              <Play className="h-4 w-4" />
            </motion.button>

            {/* Stop Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleInterruptComfyUI}
              className="p-2 rounded-full text-red-500 hover:bg-red-500/10 transition-colors"
              title="Stop Current Generation"
            >
              <StopCircle className="h-4 w-4" />
            </motion.button>

            {/* Clear Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClearAllQueues}
              className="p-2 rounded-full text-orange-500 hover:bg-orange-500/10 transition-colors"
              title="Clear All Queues"
            >
              <Trash2 className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      )}



          {/* Processing Section - Currently Running */}
          {comfyUIQueue && (comfyUIQueue.queue_running?.length || 0) > 0 && (
            <div className="mt-2">
              <div className="mb-2">
                <h5 className={`text-sm font-medium ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
                  Processing
                </h5>
              </div>
              
              {/* Currently Processing Items */}
              {(comfyUIQueue.queue_running || []).map((item: ComfyUIQueueItem, index: number) => {
                // ComfyUI queue items are arrays: [number, prompt_id, prompt_data, extra_data, outputs]
                const itemNumber = Array.isArray(item) ? item[0] : item.number;
                const promptId = Array.isArray(item) ? item[1] : item.prompt_id;
                const promptData = Array.isArray(item) ? item[2] : item.prompt;
                const { displayPrompt, displayStyle } = extractPromptInfo(promptData);
                
                return (
                <div key={promptId || `running-${index}`} className={`flex items-center gap-3 p-3 mb-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'border-orange-700/50'
                    : 'border-orange-200'
                }`}>
                  {/* Quality Badge */}
                  <div className="flex-shrink-0 mt-0.5">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border-2 bg-transparent ${
                      theme === 'dark' 
                        ? 'border-yellow-500 text-yellow-400' 
                        : 'border-yellow-500 text-yellow-600'
                    }`}>
                      2K
                    </span>
                  </div>
                  
                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                      {displayPrompt}
                    </div>
                    <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {displayStyle} • System user
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

          {/* Next Section - Pending Items */}
          {comfyUIQueue && (comfyUIQueue.queue_pending?.length || 0) > 0 && (
            <div className="mt-2">
              <div className="mb-2">
                <h5 className={`text-sm font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                  Next
                </h5>
              </div>
              
              {/* Pending Items */}
              {(comfyUIQueue.queue_pending || []).slice(0, 5).map((item: ComfyUIQueueItem, index: number) => {
                // ComfyUI queue items are arrays: [number, prompt_id, prompt_data, extra_data, outputs]
                const itemNumber = Array.isArray(item) ? item[0] : item.number;
                const promptId = Array.isArray(item) ? item[1] : item.prompt_id;
                const promptData = Array.isArray(item) ? item[2] : item.prompt;
                const { displayPrompt, displayStyle } = extractPromptInfo(promptData);
                
                return (
                <div key={promptId || `pending-${index}`} className={`flex items-center gap-3 p-3 mb-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'border-green-700/50'
                    : 'border-green-200'
                }`}>
                  {/* Quality Badge */}
                  <div className="flex-shrink-0 mt-0.5">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border-2 bg-transparent ${
                      theme === 'dark' 
                        ? 'border-yellow-500 text-yellow-400' 
                        : 'border-yellow-500 text-yellow-600'
                    }`}>
                      2K
                    </span>
                  </div>
                  
                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                      {displayPrompt}
                    </div>
                    <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {displayStyle} • System user
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
    </div>
  );
}
