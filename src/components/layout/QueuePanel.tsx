"use client";

import { useAppStore } from "@/store/appStore";
import { motion } from "framer-motion";
import { Clock, X, ArrowUp, Zap } from "lucide-react";
import { toast } from "sonner";

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QueuePanel({ isOpen, onClose }: QueuePanelProps) {
  const { 
    generationQueue, 
    queueCount, 
    currentGeneration,
    removeFromQueue 
  } = useAppStore();

  const handleRemoveFromQueue = (generationId: string) => {
    removeFromQueue(generationId);
    toast.info("Removed from upgrade queue");
  };

  const handleStartQueue = async () => {
    // Process the queue by starting the first item
    if (generationQueue.length > 0) {
      toast.info(`Starting upgrade queue processing... (${generationQueue.length} items)`);
      // Here you would implement the queue processing logic
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Processing Queue ({queueCount})</h3>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
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
          <div className="text-center py-8 text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Clock className="w-8 h-8" />
            </div>
            <p className="font-medium mb-2">No items in processing queue</p>
            <p className="text-sm">Add generations from gallery or queue new generations for batch processing</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Queue Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
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
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                  {item.thumbnail_storage_path && (
                    <img 
                      src={item.thumbnail_storage_path} 
                      alt="Queue item"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.subject_prompt || 'Untitled Generation'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {item.type === 'upgrade' ? (
                      <>
                        <ArrowUp className="h-3 w-3 text-blue-500" />
                        <span className="text-xs text-gray-500">Fast → High Quality</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-gray-500">New Generation</span>
                      </>
                    )}
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleRemoveFromQueue(item.originalId || item.id)}
                  className="p-1 rounded-full hover:bg-red-100 text-red-500 transition-colors"
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
