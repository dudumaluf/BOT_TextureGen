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

  // Listen for custom notification events
  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      const { message, duration = 3000 } = event.detail;
      
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
  }, []);

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
          className={`px-4 py-2 rounded-lg backdrop-blur-sm border flex items-center gap-2 shadow-lg ${
            theme === 'dark'
              ? 'bg-gray-900/95 text-white border-gray-700'
              : 'bg-white/95 text-gray-900 border-gray-200'
          }`}
        >
          {isLoading && (
            <div className={`h-4 w-4 animate-spin rounded-full border-2 border-solid border-t-transparent ${
              theme === 'dark' ? 'border-white' : 'border-gray-900'
            }`}></div>
          )}
          <span className="text-sm font-medium">{currentMessage}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
