"use client";

import { useAppStore } from "@/store/appStore";

export default function LoadingOverlay() {
  const isLoading = useAppStore((state) => state.isLoading);

  if (!isLoading) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-white border-t-transparent"></div>
        <p className="mt-4 text-white">Processing...</p>
      </div>
    </div>
  );
}
