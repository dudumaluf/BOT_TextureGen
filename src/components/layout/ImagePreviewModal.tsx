"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ZoomIn, ZoomOut, Move } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  alt: string;
}

export default function ImagePreviewModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  title, 
  alt 
}: ImagePreviewModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0, originX: 50, originY: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom and position when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0, originX: 50, originY: 50 });
      setIsZoomed(false);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle mouse events for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !isZoomed) return;
      
      e.preventDefault();
      
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      // Update position immediately for responsiveness
      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      // Update drag start for next frame
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStart, isZoomed]);

  // Handle image load to get dimensions
  const handleImageLoad = () => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const container = containerRef.current;
      
      setImageSize({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    }
  };

  // Single click - just prevent propagation (no zoom action)
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    e.stopPropagation();
    // Single click does nothing - just prevents closing modal
  };

  // Double click to zoom in/out at specific point
  const handleDoubleClick = (e: React.MouseEvent<HTMLImageElement>) => {
    e.stopPropagation();
    
    if (!imageRef.current || !containerRef.current) return;
    
    const img = imageRef.current;
    const container = containerRef.current;
    
    if (!isZoomed) {
      // Get absolute positions
      const imageRect = img.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Click position relative to the image
      const clickX = e.clientX - imageRect.left;
      const clickY = e.clientY - imageRect.top;
      
      // Ensure click is within image bounds
      if (clickX < 0 || clickX > imageRect.width || clickY < 0 || clickY > imageRect.height) {
        return;
      }
      
      const targetScale = 2;
      
      // Current image position relative to container
      const imageOffsetX = imageRect.left - containerRect.left;
      const imageOffsetY = imageRect.top - containerRect.top;
      
      // Where the clicked point currently is in container coordinates
      const clickInContainerX = imageOffsetX + clickX;
      const clickInContainerY = imageOffsetY + clickY;
      
      // Where we want the clicked point to be (center of container)
      const targetX = containerRect.width / 2;
      const targetY = containerRect.height / 2;
      
      // Calculate how much we need to move the clicked point
      const moveX = targetX - clickInContainerX;
      const moveY = targetY - clickInContainerY;
      
      // When we scale, the image will grow from its center
      // We need to account for this growth and add our desired movement
      const scaledImageWidth = imageRect.width * targetScale;
      const scaledImageHeight = imageRect.height * targetScale;
      
      // The image center will move due to scaling
      const imageCenterX = imageRect.width / 2;
      const imageCenterY = imageRect.height / 2;
      
      // After scaling, the clicked point will be at a different position
      // We need to translate to bring it to the target position
      // More precise calculation: account for the exact scaling behavior
      const translateX = moveX - (clickX - imageCenterX) * (targetScale - 1);
      const translateY = moveY - (clickY - imageCenterY) * (targetScale - 1);
      
      // Set zoom state
      setIsZoomed(true);
      setScale(targetScale);
      
      setPosition({ 
        x: translateX, 
        y: translateY, 
        originX: 50,
        originY: 50 
      });
      
      // Debug logging
      console.log('Zoom Debug V3:', {
        click: { x: clickX, y: clickY },
        imageRect: { x: imageRect.left, y: imageRect.top, w: imageRect.width, h: imageRect.height },
        containerRect: { x: containerRect.left, y: containerRect.top, w: containerRect.width, h: containerRect.height },
        clickInContainer: { x: clickInContainerX, y: clickInContainerY },
        target: { x: targetX, y: targetY },
        move: { x: moveX, y: moveY },
        translate: { x: translateX, y: translateY }
      });
    } else {
      // Zoom out to fit - smooth transition
      setIsZoomed(false);
      setScale(1);
      // Smoothly transition back to center
      setPosition({ x: 0, y: 0, originX: 50, originY: 50 });
    }
  };

  // Mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isZoomed) return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
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

  const handleBackdropClick = () => {
    onClose();
  };

  if (!isOpen) return null;

  // Use portal to render modal at document root level
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-0 z-[10000] bg-black flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Floating Controls */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {/* Zoom toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (isZoomed) {
                  setIsZoomed(false);
                  setScale(1);
                  setPosition({ x: 0, y: 0, originX: 50, originY: 50 });
                } else {
                  setIsZoomed(true);
                  setScale(2);
                  setPosition({ x: 0, y: 0, originX: 50, originY: 50 });
                }
              }}
              className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur-sm"
              title={isZoomed ? "Fit to view" : "Zoom to actual size"}
            >
              {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
            </motion.button>

            {/* Pan indicator when zoomed */}
            {isZoomed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-2 rounded-full bg-blue-500/60 text-blue-100 backdrop-blur-sm"
                title="Drag to pan • Double-click to zoom out"
              >
                <Move className="h-5 w-5" />
              </motion.div>
            )}
            
            {/* Download */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDownload}
              className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur-sm"
              title="Download"
            >
              <Download className="h-5 w-5" />
            </motion.button>
            
            {/* Close */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur-sm"
              title="Close"
            >
              <X className="h-5 w-5" />
            </motion.button>
          </div>

          {/* Full-screen image container */}
          <div 
            ref={containerRef}
            className="flex-1 flex items-center justify-center overflow-hidden p-4"
            onClick={handleBackdropClick}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt={alt}
              className={`select-none ${
                isDragging 
                  ? '' // No transitions while dragging for responsiveness
                  : 'transition-all duration-300 ease-out' // Smooth transitions for zoom in/out
              } ${
                isZoomed 
                  ? 'cursor-grab active:cursor-grabbing' 
                  : 'max-w-full max-h-full object-contain cursor-pointer'
              }`}
              style={{
                imageRendering: 'crisp-edges',
                transform: isZoomed 
                  ? `scale(${scale}) translate(${position.x}px, ${position.y}px)` 
                  : 'none',
                transformOrigin: isZoomed 
                  ? `${position.originX}% ${position.originY}%` 
                  : 'center',
                maxWidth: isZoomed ? 'none' : '100%',
                maxHeight: isZoomed ? 'none' : '100%'
              }}
              draggable={false}
              onLoad={handleImageLoad}
              onClick={handleImageClick}
              onDoubleClick={handleDoubleClick}
              onMouseDown={handleMouseDown}
            />
          </div>


        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
