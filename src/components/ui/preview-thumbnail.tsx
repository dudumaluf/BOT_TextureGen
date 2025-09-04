"use client";

import { motion } from "framer-motion";
import { Eye, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PreviewThumbnailProps {
  src: string;
  alt: string;
  title: string;
  size?: number;
  onPreview: () => void;
  className?: string;
}

export default function PreviewThumbnail({ 
  src, 
  alt, 
  title, 
  size = 50, // Smaller default for mobile
  onPreview,
  className = "" 
}: PreviewThumbnailProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering preview
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${title.toLowerCase().replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(`Downloaded ${title}`);
    } catch (error) {
      toast.error(`Failed to download ${title}`);
    }
  };

  return (
    <div className="text-center">
      <p className="text-xs font-medium mb-1 text-gray-600">{title}</p>
      <div 
        className={`relative overflow-hidden rounded cursor-pointer group ${className}`}
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          minWidth: `${size}px`, // Prevent shrinking on mobile
          minHeight: `${size}px`
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onPreview}
      >
        <img 
          src={src} 
          alt={alt} 
          width={size} 
          height={size} 
          className="rounded transition-transform duration-300 group-hover:scale-110 object-cover w-full h-full" 
        />
        
                      {/* Hover overlay with split halves */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/40 flex rounded overflow-hidden"
              >
                {/* Left half - Preview */}
                <motion.button
                  whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onPreview}
                  className="flex-1 flex items-center justify-center transition-all duration-200 relative group"
                  title="Preview"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Eye className="h-4 w-4 text-white group-hover:text-white transition-all duration-200" />
                  </motion.div>
                </motion.button>

                {/* Vertical divider */}
                <div className="w-px bg-white/30"></div>

                {/* Right half - Download */}
                <motion.button
                  whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center transition-all duration-200 relative group"
                  title="Download"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Download className="h-4 w-4 text-white group-hover:text-white transition-all duration-200" />
                  </motion.div>
                </motion.button>
              </motion.div>
      </div>
    </div>
  );
}
