"use client";

import React, { useState, useRef, useCallback } from "react";
import { useAppStore } from "@/store/appStore";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function ReferenceThumbnail() {
  const { referenceImageUrl, setReferenceImageUrl, referenceStrength, setReferenceStrength } = useAppStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(referenceStrength.toString());
  const dragStartY = useRef(0);
  const dragStartValue = useRef(0);
  const thumbnailRef = useRef<HTMLDivElement>(null);

  if (!referenceImageUrl) {
    return null;
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start dragging if clicking on X button or editing
    if (isEditing || (e.target as HTMLElement).closest('button')) {
      return;
    }
    
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartValue.current = referenceStrength;
    e.preventDefault();
    e.stopPropagation();
  }, [referenceStrength, isEditing]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Don't start dragging if touching X button or editing
    if (isEditing || (e.target as HTMLElement).closest('button')) {
      return;
    }
    
    setIsDragging(true);
    dragStartY.current = e.touches[0].clientY;
    dragStartValue.current = referenceStrength;
    e.preventDefault();
    e.stopPropagation();
  }, [referenceStrength, isEditing]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaY = dragStartY.current - e.clientY; // Inverted: up = increase
    const sensitivity = 0.003; // Increased sensitivity
    const newValue = Math.max(0, Math.min(1, dragStartValue.current + (deltaY * sensitivity)));
    
    setReferenceStrength(Math.round(newValue * 100) / 100); // Round to 2 decimals
  }, [isDragging, setReferenceStrength]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    
    const deltaY = dragStartY.current - e.touches[0].clientY; // Inverted: up = increase
    const sensitivity = 0.003; // Same sensitivity as mouse
    const newValue = Math.max(0, Math.min(1, dragStartValue.current + (deltaY * sensitivity)));
    
    setReferenceStrength(Math.round(newValue * 100) / 100); // Round to 2 decimals
    e.preventDefault(); // Prevent scrolling
  }, [isDragging, setReferenceStrength]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!isHovered) return;
    
    e.preventDefault();
    const delta = -e.deltaY * 0.001; // Scroll up = increase
    const newValue = Math.max(0, Math.min(1, referenceStrength + delta));
    setReferenceStrength(Math.round(newValue * 100) / 100);
  }, [referenceStrength, isHovered, setReferenceStrength]);

  const handleNumberClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(referenceStrength.toFixed(2));
  }, [referenceStrength]);

  const handleEditSubmit = useCallback(() => {
    const newValue = parseFloat(editValue);
    if (!isNaN(newValue)) {
      const clampedValue = Math.max(0, Math.min(1, newValue));
      setReferenceStrength(Math.round(clampedValue * 100) / 100);
    }
    setIsEditing(false);
  }, [editValue, setReferenceStrength]);

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(referenceStrength.toFixed(2));
    }
  }, [handleEditSubmit, referenceStrength]);

  // Add global mouse and touch event listeners when dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div 
      ref={thumbnailRef}
      className="relative w-full h-full aspect-square"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onWheel={handleWheel}
    >
      <motion.div
        className={`relative w-full h-full rounded-lg overflow-hidden border-2 border-white shadow-lg transition-all ${
          isDragging ? 'cursor-ns-resize' : 'cursor-pointer'
        }`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <img 
          src={referenceImageUrl} 
          alt="Reference" 
          className="w-full h-full object-cover pointer-events-none select-none"
          draggable={false}
        />
        
        {/* Strength Value Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: (isHovered || isDragging || isEditing) ? 1 : 0 }}
          className="absolute inset-0 bg-black/70 flex items-center justify-center"
        >
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={handleEditKeyDown}
              className="w-12 h-6 text-center text-white text-xs font-bold font-mono bg-transparent border border-white/50 rounded px-1"
              autoFocus
              onFocus={(e) => e.target.select()}
            />
          ) : (
            <span 
              className="text-white text-sm font-bold font-mono cursor-pointer hover:bg-white/20 px-2 py-1 rounded transition-colors"
              onClick={handleNumberClick}
            >
              {referenceStrength.toFixed(2)}
            </span>
          )}
        </motion.div>
        
        {/* Visual drag indicator */}
        {(isHovered || isDragging) && !isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute left-1/2 top-2 bottom-2 w-0.5 bg-white/30 transform -translate-x-1/2"
          />
        )}
        
      </motion.div>

      {/* Remove button - Simple, tiny, top-right corner */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setReferenceImageUrl(null);
        }}
        className="absolute top-0 right-0 w-6 h-6 sm:w-6 sm:h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors z-30 transform translate-x-1/2 -translate-y-1/2"
        style={{ 
          fontSize: window.innerWidth < 640 ? '16px' : '20px', 
          lineHeight: '1' 
        }}
      >
        ×
      </button>

      {/* Instruction tooltip - Show on hover (desktop) or when dragging (mobile) */}
      <AnimatePresence>
        {((isHovered && !isDragging && !isEditing) || (isDragging && window.innerWidth < 640)) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-50"
          >
            {window.innerWidth < 640 ? 'Drag ↕ to adjust' : 'Drag ↕ • Scroll • Click number'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
