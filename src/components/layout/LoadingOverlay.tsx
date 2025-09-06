"use client";

import { useAppStore } from "@/store/appStore";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface LoadingOverlayProps {
  isQueueOpen?: boolean;
}

export default function LoadingOverlay({ isQueueOpen = false }: LoadingOverlayProps = {}) {
  const { isLoading, theme } = useAppStore();
  const [currentMessage, setCurrentMessage] = useState("Processing");
  const [showTemporaryMessage, setShowTemporaryMessage] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastGenerationId, setLastGenerationId] = useState<string | null>(null);

  // Listen for custom notification events
  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      const { message, duration = 3000, generationId, type } = event.detail;
      
      // If this is a new generation starting, reset progress
      if (generationId && generationId !== lastGenerationId && type !== 'success') {
        console.log(`LoadingOverlay: New generation detected ${generationId}, resetting progress`);
        setProgress(0);
        setLastGenerationId(generationId);
      }
      
      // If this is a completion notification, complete the progress
      if (type === 'success' && message.includes('Complete')) {
        console.log(`LoadingOverlay: Generation completion detected, setting progress to 100%`);
        setProgress(100);
        // Reset progress after showing completion
        setTimeout(() => {
          setProgress(0);
          setLastGenerationId(null);
        }, 1000);
      }
      
      // Show temporary message
      setCurrentMessage(message);
      setShowTemporaryMessage(true);
      
      // Reset to default after duration
      setTimeout(() => {
        setShowTemporaryMessage(false);
        setCurrentMessage("Processing");
      }, duration);
    };

    window.addEventListener('app-notification', handleNotification as EventListener);
    
    return () => {
      window.removeEventListener('app-notification', handleNotification as EventListener);
    };
  }, [lastGenerationId]);

  // Progress simulation when loading
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    
    if (isLoading) {
      // Don't reset progress if we already have some (for multi-generation continuity)
      if (progress === 0) {
        setProgress(5); // Start with some initial progress
      }
      
      progressInterval = setInterval(() => {
        setProgress(prev => {
          // Don't update if we're already at 100% (completion was triggered)
          if (prev >= 100) return prev;
          
          // Simulate realistic progress: fast start, slow middle, steady end
          if (prev < 30) {
            // Fast start: 0-30% in first 30 seconds
            return Math.min(prev + Math.random() * 3 + 1, 30);
          } else if (prev < 70) {
            // Slow middle: 30-70% over next 60 seconds
            return Math.min(prev + Math.random() * 1 + 0.3, 70);
          } else if (prev < 95) {
            // Steady progress: 70-95% over remaining time
            return Math.min(prev + Math.random() * 1 + 0.5, 95);
          } else {
            // Stay at 95% until actually complete
            return 95;
          }
        });
      }, 1000);
    } else {
      // When loading stops, complete progress if not already at 100%
      setProgress(prev => prev < 100 ? 100 : prev);
      setTimeout(() => setProgress(0), 1000);
    }
    
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isLoading]);

  // Reset temporary message when loading stops
  useEffect(() => {
    if (!isLoading && showTemporaryMessage && currentMessage === "Processing") {
      setShowTemporaryMessage(false);
      setCurrentMessage("Processing");
    }
  }, [isLoading, showTemporaryMessage, currentMessage]);

  // Show notification if loading OR if there's a temporary message
  if (!isLoading && !showTemporaryMessage) {
    return null;
  }

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMessage}
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`px-4 py-3 rounded-lg backdrop-blur-sm border shadow-lg ${
            theme === 'dark'
              ? 'bg-gray-900/95 text-white border-gray-700'
              : 'bg-white/95 text-gray-900 border-gray-200'
          }`}
        >
          {/* Main processing indicator */}
          <div className="flex items-center gap-2 mb-2">
            {isLoading && (
              <div className={`h-4 w-4 animate-spin rounded-full border-2 border-solid border-t-transparent ${
                theme === 'dark' ? 'border-white' : 'border-gray-900'
              }`}></div>
            )}
            <span className="text-sm font-medium">{currentMessage}</span>
          </div>
          
          {/* Progress bar - only show when actually loading */}
          {isLoading && (
            <div className="w-full">
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <motion.div
                  className={`h-full rounded-full ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-r from-blue-400 to-purple-400' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`}
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {Math.round(progress)}%
                </span>
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {progress < 30 ? 'Starting...' : 
                   progress < 70 ? 'Processing...' : 
                   progress < 95 ? 'Finalizing...' : 'Almost done...'}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
