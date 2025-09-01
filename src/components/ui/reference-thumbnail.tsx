"use client";

import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function ReferenceThumbnail() {
  const { referenceImageUrl, setReferenceImageUrl } = useAppStore();
  const [isHovered, setIsHovered] = useState(false);
  const [referenceStrength, setReferenceStrength] = useState(0.7); // Reference influence strength

  if (!referenceImageUrl) {
    return null;
  }

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-lg cursor-pointer"
        whileHover={{ scale: 1.05 }}
      >
        <img 
          src={referenceImageUrl} 
          alt="Reference" 
          className="w-full h-full object-cover"
        />
        
        {/* Remove button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
          onClick={(e) => {
            e.stopPropagation();
            setReferenceImageUrl(null);
          }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
        >
          <X className="h-3 w-3" />
        </motion.button>
      </motion.div>

      {/* Hover Slider - Extended hover area */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute -top-24 -left-4 bg-black/90 text-white px-4 py-3 rounded-xl backdrop-blur-sm border border-white/20 min-w-44 z-50"
            style={{ 
              // Extend the hover area
              paddingTop: '1rem',
              paddingBottom: '1rem',
              marginTop: '-0.5rem',
              marginBottom: '-0.5rem'
            }}
          >
            <div className="text-xs font-medium mb-2 text-center">Reference Strength</div>
            <div className="flex items-center gap-3">
              <span className="text-xs w-6">0</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={referenceStrength}
                onChange={(e) => setReferenceStrength(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${referenceStrength * 100}%, #6b7280 ${referenceStrength * 100}%, #6b7280 100%)`
                }}
              />
              <span className="text-xs w-6">1</span>
            </div>
            <div className="text-center mt-1">
              <span className="text-xs font-mono bg-blue-500 px-2 py-1 rounded">{referenceStrength.toFixed(1)}</span>
            </div>
            
            {/* Arrow pointing to thumbnail */}
            <div className="absolute top-full left-8 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
