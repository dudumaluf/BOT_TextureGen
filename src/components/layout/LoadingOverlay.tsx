"use client";

import { useAppStore } from "@/store/appStore";

export default function LoadingOverlay() {
  const isLoading = useAppStore((state) => state.isLoading);

  if (!isLoading) {
    return null;
  }

  return (
    <div className="absolute top-4 left-4 z-20 pointer-events-none">
      <div className="bg-black/80 text-white px-3 py-2 rounded-lg backdrop-blur-sm border border-white/20 flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
        <span className="text-sm">Processing...</span>
      </div>
    </div>
  );
}
