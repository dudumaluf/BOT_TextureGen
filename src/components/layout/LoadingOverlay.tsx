"use client";

import { useAppStore } from "@/store/appStore";

interface LoadingOverlayProps {
  isQueueOpen?: boolean;
}

export default function LoadingOverlay({ isQueueOpen = false }: LoadingOverlayProps = {}) {
  const { isLoading, theme } = useAppStore();


  if (!isLoading) {
    return null;
  }

  return (
    <div 
      className="absolute top-4 z-30 pointer-events-none transition-all duration-300"
      style={{
        right: isQueueOpen ? '320px' : '80px' // Leave space for queue toggle when closed
      }}
    >
      <div className={`px-3 py-2 rounded-lg backdrop-blur-sm border flex items-center gap-2 ${
        theme === 'dark'
          ? 'bg-gray-900/90 text-white border-gray-700'
          : 'bg-white/90 text-gray-900 border-gray-200'
      }`}>
        <div className={`h-4 w-4 animate-spin rounded-full border-2 border-solid border-t-transparent ${
          theme === 'dark' ? 'border-white' : 'border-gray-900'
        }`}></div>
        <span className="text-sm">Processing</span>
      </div>
    </div>
  );
}
