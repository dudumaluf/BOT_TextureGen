"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FloatingToggleProps {
  icon: ReactNode;
  isActive: boolean;
  onClick: () => void;
  position?: "top-right" | "bottom-right" | "bottom-left" | "top-left";
  className?: string;
  badge?: number | string;
}

const positionClasses = {
  "top-right": "top-4 right-4",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4", 
  "top-left": "top-4 left-4"
};

export default function FloatingToggle({
  icon,
  isActive,
  onClick,
  position = "top-right",
  className = "",
  badge
}: FloatingToggleProps) {
  return (
    <motion.div
      className={`fixed ${positionClasses[position]} z-20 ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.button
        onClick={onClick}
        className={`
          relative p-3 rounded-full shadow-lg border transition-all duration-200
          ${isActive 
            ? 'bg-blue-500 text-white border-blue-400 shadow-blue-200' 
            : 'bg-white/90 text-gray-600 border-white/20 hover:bg-white hover:text-gray-800'
          }
          backdrop-blur-md
        `}
        animate={{
          rotate: isActive ? 0 : 0,
          backgroundColor: isActive ? "#3b82f6" : "rgba(255, 255, 255, 0.9)"
        }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          animate={{ rotate: isActive ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {icon}
        </motion.div>
        
        {/* Badge */}
        {badge && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold"
          >
            {badge}
          </motion.div>
        )}
      </motion.button>
    </motion.div>
  );
}
