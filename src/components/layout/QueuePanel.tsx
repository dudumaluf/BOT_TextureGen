"use client";

import { useAppStore } from "@/store/appStore";
import { motion } from "framer-motion";
import { Clock, X, ArrowUp, Zap } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";

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
    theme 
  } = useAppStore();
  
  const supabase = createClient();

  const handleRemoveFromQueue = (generationId: string) => {
    removeFromQueue(generationId);
    toast.info("Removed from upgrade queue");
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
          item.mainPrompt.split(' ').slice(0, 2).join(' ') || 'Generation'
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
                  const { data: generation } = await supabase
                    .from('generations')
                    .select('status')
                    .eq('id', generationId)
                    .single();
                  
                  if (generation && (generation.status === 'completed' || generation.status === 'failed')) {
                    clearInterval(pollInterval);
                    console.log(`Queue: Generation ${generationId} ${generation.status}`);
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
            .order('created_at', { ascending: false });
          
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
        <h3 className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
          Processing Queue ({queueCount})
        </h3>
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
          <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <Clock className={`w-8 h-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <p className="font-medium mb-2">No items in processing queue</p>
            <p className="text-sm">Add generations from gallery or queue new generations for batch processing</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Queue Header */}
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                {queueCount} generation{queueCount !== 1 ? 's' : ''} waiting
              </span>
              {queueCount > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartQueue}
                  className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                >
                  Start Queue
                </motion.button>
              )}
            </div>

            {/* Queue Items */}
            {generationQueue.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg overflow-hidden ${
                  theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                }`}>
                  {item.thumbnail_storage_path && (
                    <img 
                      src={item.thumbnail_storage_path} 
                      alt="Queue item"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                    {item.mainPrompt ? 
                      item.mainPrompt.split(' ').slice(0, 2).join(' ') || 'Untitled Generation'
                      : item.subject_prompt || 'Untitled Generation'
                    }
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {item.type === 'upgrade' ? (
                      <>
                        <ArrowUp className="h-3 w-3 text-blue-500" />
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Fast → High Quality</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-3 w-3 text-green-500" />
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>New Generation</span>
                      </>
                    )}
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleRemoveFromQueue(item.originalId || item.id)}
                  className={`p-1 rounded-full text-red-500 transition-colors ${
                    theme === 'dark' 
                      ? 'hover:bg-red-900/30' 
                      : 'hover:bg-red-100'
                  }`}
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
