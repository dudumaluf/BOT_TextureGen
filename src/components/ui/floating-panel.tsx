"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { X } from "lucide-react";

interface FloatingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  position?: "top-right" | "bottom-right" | "bottom-left" | "top-left" | "bottom-center" | "left" | "right";
  size?: "sm" | "md" | "lg" | "xl" | "sidebar";
  className?: string;
}

const positionClasses = {
  "top-right": "top-4 right-4",
  "bottom-right": "bottom-4 right-4", 
  "bottom-left": "bottom-4 left-4",
  "top-left": "top-4 left-4",
  "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
  "left": "top-6 left-6 bottom-24", // Full height minus bottom bar
  "right": "top-6 right-6 bottom-24" // Full height minus bottom bar
};

const sizeClasses = {
  "sm": "w-80 max-h-96",
  "md": "w-96 max-h-[500px]", 
  "lg": "w-[500px] max-h-[600px]",
  "xl": "w-[600px] max-h-[700px]",
  "sidebar": "w-80 h-auto" // For left/right panels
};

export default function FloatingPanel({
  isOpen,
  onClose,
  title,
  children,
  position = "bottom-right",
  size = "md",
  className = ""
}: FloatingPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={`fixed ${positionClasses[position]} ${sizeClasses[size]} z-30 ${className}`}
        >
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <motion.h3 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-semibold text-gray-800"
              >
                {title}
              </motion.h3>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </motion.button>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto panel-scroll max-h-full">
              {children}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
