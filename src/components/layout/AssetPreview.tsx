"use client";

import { useAppStore } from "@/store/appStore";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import { toast } from "sonner";
import PreviewThumbnail from "@/components/ui/preview-thumbnail";
import ImagePreviewModal from "./ImagePreviewModal";

interface AssetPreviewProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AssetPreview({ isOpen = true, onClose }: AssetPreviewProps) {
  const { referenceImageUrl, generatedTextures, theme } = useAppStore();
  const [previewModal, setPreviewModal] = useState<{ isOpen: boolean; imageUrl: string; title: string; alt: string }>({
    isOpen: false,
    imageUrl: '',
    title: '',
    alt: ''
  });

  const openPreview = (imageUrl: string, title: string, alt: string) => {
    setPreviewModal({ isOpen: true, imageUrl, title, alt });
  };

  const closePreview = () => {
    setPreviewModal({ isOpen: false, imageUrl: '', title: '', alt: '' });
  };

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

  const hasContent = referenceImageUrl || generatedTextures.diffuse || generatedTextures.thumbnail || generatedTextures.depth_preview || generatedTextures.front_preview;

  if (!hasContent) {
    return null;
  }

  return (
    <div className={`backdrop-blur-md rounded-xl border shadow-lg max-w-full overflow-x-auto ${
      theme === 'dark' 
        ? 'bg-gray-900/95 border-gray-700' 
        : 'bg-white/95 border-white/20'
    }`}>
      <div className="p-2 sm:p-3">
        {/* Close button */}
        {onClose && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={`absolute -top-1 -right-1 p-1 rounded-full transition-colors z-10 shadow-sm border ${
              theme === 'dark'
                ? 'bg-gray-900 hover:bg-gray-800 border-gray-700 text-gray-400'
                : 'bg-white/90 hover:bg-gray-100 border-gray-200 text-gray-400'
            }`}
          >
            <X className="h-3 w-3" />
          </motion.button>
        )}
        <div className="flex items-center gap-2 sm:gap-3">
            {referenceImageUrl && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <div className="text-center">
                  <p className="text-xs font-medium mb-1 text-gray-600">Ref</p>
                  <div className="relative w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] overflow-hidden rounded">
                    <Image 
                      src={referenceImageUrl} 
                      alt="Reference" 
                      width={60} 
                      height={60} 
                      className="rounded transition-transform duration-300 hover:scale-110 object-cover w-full h-full" 
                    />
                  </div>
                </div>
              </motion.div>
            )}
            {generatedTextures.depth_preview && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <PreviewThumbnail
                  src={generatedTextures.depth_preview}
                  alt="Depth Preview"
                  title="Depth"
                  onPreview={() => openPreview(generatedTextures.depth_preview!, "Depth Map", "Depth Preview")}
                />
              </motion.div>
            )}
            {generatedTextures.front_preview && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.17 }}
              >
                <PreviewThumbnail
                  src={generatedTextures.front_preview}
                  alt="Front Preview"
                  title="Preview"
                  onPreview={() => openPreview(generatedTextures.front_preview!, "View Preview", "Front Preview")}
                />
              </motion.div>
            )}
            {generatedTextures.thumbnail && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <PreviewThumbnail
                  src={generatedTextures.thumbnail}
                  alt="Multiview Preview"
                  title="Multiview"
                  onPreview={() => openPreview(generatedTextures.thumbnail!, "Multiview Preview", "Multiview Preview")}
                />
              </motion.div>
            )}
            {generatedTextures.diffuse && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <PreviewThumbnail
                  src={generatedTextures.diffuse}
                  alt="Diffuse Texture"
                  title="Diffuse"
                  onPreview={() => openPreview(generatedTextures.diffuse!, "Diffuse Texture", "Diffuse Texture")}
                />
              </motion.div>
            )}
            {generatedTextures.normal && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <PreviewThumbnail
                  src={generatedTextures.normal}
                  alt="Normal Texture"
                  title="Normal"
                  onPreview={() => openPreview(generatedTextures.normal!, "Normal Map", "Normal Texture")}
                />
              </motion.div>
            )}
            {generatedTextures.height && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <PreviewThumbnail
                  src={generatedTextures.height}
                  alt="Height Texture"
                  title="Height"
                  onPreview={() => openPreview(generatedTextures.height!, "Height Map", "Height Texture")}
                />
              </motion.div>
            )}
        </div>
      </div>

      {/* Preview Modal - Rendered via Portal at document root */}
      <ImagePreviewModal
        isOpen={previewModal.isOpen}
        onClose={closePreview}
        imageUrl={previewModal.imageUrl}
        title={previewModal.title}
        alt={previewModal.alt}
      />
    </div>
  );
}
