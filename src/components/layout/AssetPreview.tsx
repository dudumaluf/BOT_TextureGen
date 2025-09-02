"use client";

import { useAppStore } from "@/store/appStore";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import { toast } from "sonner";

interface AssetPreviewProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AssetPreview({ isOpen = true, onClose }: AssetPreviewProps) {
  const { referenceImageUrl, generatedTextures, theme } = useAppStore();

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      toast.error(`Failed to download ${filename}`);
    }
  };

  const hasContent = referenceImageUrl || generatedTextures.diffuse || generatedTextures.thumbnail;

  if (!hasContent) {
    return null;
  }

  return (
    <div className={`backdrop-blur-md rounded-xl border shadow-lg ${
      theme === 'dark' 
        ? 'bg-gray-900/95 border-gray-700' 
        : 'bg-white/95 border-white/20'
    }`}>
      <div className="p-3">
        {/* Close button */}
        {onClose && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={`absolute -top-1 -right-1 p-1 rounded-full transition-colors z-10 shadow-sm border ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-400'
                : 'bg-white/90 hover:bg-gray-100 border-gray-200 text-gray-400'
            }`}
          >
            <X className="h-3 w-3" />
          </motion.button>
        )}
        <div className="flex items-center gap-3">
            {referenceImageUrl && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <div className="text-center">
                  <p className="text-xs font-medium mb-1 text-gray-600">Ref</p>
                  <div className="relative overflow-hidden rounded">
                    <Image 
                      src={referenceImageUrl} 
                      alt="Reference" 
                      width={60} 
                      height={60} 
                      className="rounded transition-transform duration-300 hover:scale-110" 
                    />
                  </div>
                </div>
              </motion.div>
            )}
            {generatedTextures.thumbnail && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="text-center">
                  <p className="text-xs font-medium mb-1 text-gray-600">View</p>
                  <div className="relative overflow-hidden rounded">
                    <img 
                      src={generatedTextures.thumbnail} 
                      alt="Front View" 
                      width={60} 
                      height={60} 
                      className="rounded transition-transform duration-300 hover:scale-110" 
                    />
                  </div>
                </div>
              </motion.div>
            )}
            {generatedTextures.diffuse && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="text-center relative group">
                  <p className="text-xs font-medium mb-1 text-gray-600">Diffuse</p>
                  <div className="relative overflow-hidden rounded">
                    <img 
                      src={generatedTextures.diffuse} 
                      alt="Diffuse" 
                      width={60} 
                      height={60} 
                      className="rounded transition-transform duration-300 hover:scale-110" 
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDownload(generatedTextures.diffuse!, 'diffuse_texture.png')}
                      className="absolute inset-0 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                    >
                      <Download className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
            {generatedTextures.normal && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="text-center relative group">
                  <p className="text-xs font-medium mb-1 text-gray-600">Normal</p>
                  <div className="relative overflow-hidden rounded">
                    <img 
                      src={generatedTextures.normal} 
                      alt="Normal" 
                      width={60} 
                      height={60} 
                      className="rounded transition-transform duration-300 hover:scale-110" 
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDownload(generatedTextures.normal!, 'normal_texture.png')}
                      className="absolute inset-0 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                    >
                      <Download className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
            {generatedTextures.height && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <div className="text-center relative group">
                  <p className="text-xs font-medium mb-1 text-gray-600">Height</p>
                  <div className="relative overflow-hidden rounded">
                    <img 
                      src={generatedTextures.height} 
                      alt="Height" 
                      width={60} 
                      height={60} 
                      className="rounded transition-transform duration-300 hover:scale-110" 
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDownload(generatedTextures.height!, 'height_texture.png')}
                      className="absolute inset-0 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                    >
                      <Download className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
        </div>
      </div>
    </div>
  );
}
