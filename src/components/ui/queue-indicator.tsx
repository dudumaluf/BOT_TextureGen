"use client";

import { useAppStore } from "@/store/appStore";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Layers } from "lucide-react";

export default function QueueIndicator() {
  const { queueCount, generationQueue, currentGeneration } = useAppStore();

  if (queueCount === 0 && !currentGeneration?.isUpgrading) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20"
      >
        <div className="bg-white/90 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border flex items-center gap-2">
          {currentGeneration?.isUpgrading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="flex items-center gap-2"
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Upgrading to HQ...</span>
            </motion.div>
          )}
          
          {queueCount > 0 && (
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">
                {queueCount} in queue
              </span>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
