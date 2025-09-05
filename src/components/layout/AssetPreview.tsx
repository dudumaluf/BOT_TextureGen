"use client";

import { useAppStore } from "@/store/appStore";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import { toast } from "sonner";
import PreviewThumbnail from "@/components/ui/preview-thumbnail";
import ImagePreviewModal from "./ImagePreviewModal";
import { useResponsive } from "@/hooks/useResponsive";

interface AssetPreviewProps {
  isOpen?: boolean;
  onClose?: (() => void) | undefined;
}

export default function AssetPreview({ isOpen = true, onClose }: AssetPreviewProps) {
  const { referenceImageUrl, generatedTextures, theme } = useAppStore();
  const { isMobile } = useResponsive();
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

  const hasContent = generatedTextures.diffuse || generatedTextures.thumbnail || generatedTextures.depth_preview || generatedTextures.front_preview;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Close button removed - now using consistent bottom center close button on mobile */}

      <div className={`backdrop-blur-md rounded-lg sm:rounded-xl border shadow-lg max-w-full overflow-hidden relative ${
        theme === 'dark' 
          ? 'bg-gray-900/95 border-gray-700' 
          : 'bg-white/95 border-white/20'
      }`}>
        {/* Close button overlay for desktop */}
        {onClose && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={`hidden sm:flex absolute -top-1 -right-1 w-6 h-6 rounded-full transition-colors z-10 shadow-sm border items-center justify-center ${
              theme === 'dark'
                ? 'bg-gray-900 hover:bg-gray-800 border-gray-700 text-gray-400'
                : 'bg-white/90 hover:bg-gray-100 border-gray-200 text-gray-400'
            }`}
          >
            <X className="h-3 w-3" />
          </motion.button>
        )}

        <div className="p-1 sm:p-4">
          <div className="flex items-center gap-1 sm:gap-4">
            {generatedTextures.depth_preview && (
              <motion.div
                key="depth-preview"
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <PreviewThumbnail
                  src={generatedTextures.depth_preview}
                  alt="Depth Preview"
                  title="Depth"
                  size={isMobile ? 40 : 60} // Larger on desktop
                  onPreview={() => openPreview(generatedTextures.depth_preview!, "Depth Map", "Depth Preview")}
                />
              </motion.div>
            )}
            {generatedTextures.front_preview && (
              <motion.div
                key="front-preview"
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <PreviewThumbnail
                  src={generatedTextures.front_preview}
                  alt="Front Preview"
                  title="Preview"
                  size={isMobile ? 40 : 60} // Larger on desktop
                  onPreview={() => openPreview(generatedTextures.front_preview!, "View Preview", "Front Preview")}
                />
              </motion.div>
            )}
            {generatedTextures.thumbnail && (
              <motion.div
                key="thumbnail"
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <PreviewThumbnail
                  src={generatedTextures.thumbnail}
                  alt="Multiview Preview"
                  title="Multiview"
                  size={isMobile ? 40 : 60} // Larger on desktop
                  onPreview={() => openPreview(generatedTextures.thumbnail!, "Multiview Preview", "Multiview Preview")}
                />
              </motion.div>
            )}
            {generatedTextures.diffuse && (
              <motion.div
                key="diffuse"
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <PreviewThumbnail
                  src={generatedTextures.diffuse}
                  alt="Diffuse Texture"
                  title="Diffuse"
                  size={isMobile ? 40 : 60} // Larger on desktop
                  onPreview={() => openPreview(generatedTextures.diffuse!, "Diffuse Texture", "Diffuse Texture")}
                />
              </motion.div>
            )}
            {generatedTextures.normal && (
              <motion.div
                key="normal"
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <PreviewThumbnail
                  src={generatedTextures.normal}
                  alt="Normal Texture"
                  title="Normal"
                  size={isMobile ? 40 : 60} // Larger on desktop
                  onPreview={() => openPreview(generatedTextures.normal!, "Normal Map", "Normal Texture")}
                />
              </motion.div>
            )}
            {generatedTextures.height && (
              <motion.div
                key="height"
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <PreviewThumbnail
                  src={generatedTextures.height}
                  alt="Height Texture"
                  title="Height"
                  size={isMobile ? 40 : 60} // Larger on desktop
                  onPreview={() => openPreview(generatedTextures.height!, "Height Map", "Height Texture")}
                />
              </motion.div>
            )}
          </div>
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
