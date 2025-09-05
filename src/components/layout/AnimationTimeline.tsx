"use client";

import { useAppStore } from "@/store/appStore";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useResponsive } from "@/hooks/useResponsive";

interface AnimationTimelineProps {
  isQueueOpen?: boolean;
  isSceneOpen?: boolean;
}

export default function AnimationTimeline({ isQueueOpen = false, isSceneOpen = false }: AnimationTimelineProps) {
  const {
    hasAnimations,
    animationNames,
    currentAnimation,
    animationTime,
    isAnimationPlaying,
    animationDuration,
    animationPlaybackSpeed,
    theme,
    isBottomBarOpen,
    promptPanelHeight,
    setCurrentAnimation,
    setAnimationTime,
    setIsAnimationPlaying,
    setAnimationPlaybackSpeed
  } = useAppStore();

  const { isMobile, isInitialized } = useResponsive();

  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mouseMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Available playback speeds
  const playbackSpeeds = [0.25, 0.5, 1, 1.5, 2, 3];
  const getSpeedLabel = (speed: number) => {
    if (speed === 1) return '1×';
    if (speed < 1) return `${speed}×`;
    return `${speed}×`;
  };

  // Auto-hide functionality
  const showTimeline = () => {
    setIsVisible(true);
    setIsFadingOut(false);
    
    // Clear any existing fade timeout
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }
    
    // Set new fade timeout (3 seconds)
    fadeTimeoutRef.current = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsFadingOut(false);
      }, 300); // Match fade animation duration
    }, 3000);
  };

  const handleCanvasInteraction = () => {
    if (hasAnimations && animationNames.length > 0) {
      showTimeline();
    }
  };

  // Canvas click and mouse move listeners
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const handleCanvasClick = () => {
      handleCanvasInteraction();
    };

    const handleMouseMove = () => {
      // Only show on mouse move if currently fading out
      if (isFadingOut && hasAnimations && animationNames.length > 0) {
        showTimeline();
      }
    };

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [hasAnimations, animationNames.length, isFadingOut]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }
    };
  }, []);

  // Show timeline initially when animations are detected
  useEffect(() => {
    if (hasAnimations && animationNames.length > 0 && !isVisible) {
      showTimeline();
    }
  }, [hasAnimations, animationNames.length]);

  // Don't render if no animations
  if (!hasAnimations || animationNames.length === 0) {
    return null;
  }

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  // Don't render during SSR/initial load to prevent hydration mismatch
  if (!isInitialized) {
    return null;
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const newTime = Math.max(0, Math.min(1, x / width));
    setAnimationTime(newTime);
  };

  const handleTimelineDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const newTime = Math.max(0, Math.min(1, x / width));
    setAnimationTime(newTime);
  };

  const handlePlayPause = () => {
    setIsAnimationPlaying(!isAnimationPlaying);
  };

  const handleSpeedChange = () => {
    const currentIndex = playbackSpeeds.indexOf(animationPlaybackSpeed);
    const nextIndex = (currentIndex + 1) % playbackSpeeds.length;
    const newSpeed = playbackSpeeds[nextIndex];
    setAnimationPlaybackSpeed(newSpeed);
    
    // Show timeline briefly when speed changes
    showTimeline();
  };

  const handleAnimationChange = (animName: string) => {
    setCurrentAnimation(animName);
    setAnimationTime(0);
    setIsAnimationPlaying(false);
    
    // Update duration for the selected animation
    const { animations } = useAppStore.getState();
    if (animations) {
      const animIndex = animationNames.indexOf(animName);
      const animation = animations[animIndex];
      if (animation) {
        const { setAnimationDuration } = useAppStore.getState();
        setAnimationDuration(animation.duration);
      }
    }
  };

  // Calculate position - mobile-first responsive design
  const getPlayerPosition = () => {
    // Calculate bottom position - place above the prompt panel (moved higher)
    let bottomPosition;
    if (isBottomBarOpen) {
      const totalOffset = 32 + promptPanelHeight + 50; // Increased gap above prompt panel
      bottomPosition = `${totalOffset}px`;
    } else {
      // Mobile: Higher position to avoid clashing with side toggles, Desktop: normal position
      bottomPosition = isMobile ? '140px' : '100px';
    }
    
    return { 
      bottom: bottomPosition,
      // Mobile: Full width with padding, Desktop: Fixed like prompt panel
      left: isMobile ? '16px' : '8px',
      right: isMobile ? '16px' : '8px',
      transform: 'none'
    };
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: isFadingOut ? 0 : 1,
          transition: { duration: isFadingOut ? 0.3 : 0.2, ease: "easeOut" }
        }}
        exit={{ opacity: 0 }}
        className="fixed z-30 pointer-events-auto"
        style={getPlayerPosition()}
        onMouseEnter={() => {
          // Keep visible on hover
          if (fadeTimeoutRef.current) {
            clearTimeout(fadeTimeoutRef.current);
          }
          setIsFadingOut(false);
        }}
        onMouseLeave={() => {
          // Resume fade timer on mouse leave
          showTimeline();
        }}
      >
        {/* Mobile-first responsive container */}
        <div className="w-full">
          {/* Mobile: Full width centered, Desktop: Match prompt panel structure */}
          <div className={`flex items-center w-full ${
            isMobile 
              ? 'justify-center gap-2 px-2' // Mobile: centered with tight spacing
              : 'gap-4 max-w-4xl mx-auto px-6' // Desktop: match prompt panel
          }`}>
            
            {/* Desktop spacer for upload panels (only on desktop) */}
            {!isMobile && <div className="w-20 flex-shrink-0"></div>}
            
            {/* Timeline controls container */}
            <div className={`flex items-center ${
              isMobile 
                ? 'gap-2 flex-1 justify-center' // Mobile: centered, full width
                : 'gap-4 flex-1' // Desktop: normal spacing
            }`}>
            {/* Play/Pause Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePlayPause}
              className={`${
                isMobile ? 'p-1.5' : 'p-2'
              } rounded-full transition-colors ${
                isAnimationPlaying
                  ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                  : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
              }`}
              title={isAnimationPlaying ? 'Pause' : 'Play'}
            >
              {isAnimationPlaying ? (
                <Pause className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              ) : (
                <Play className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              )}
            </motion.button>

            {/* Speed Control */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSpeedChange}
              className={`${
                isMobile ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'
              } rounded-lg font-mono backdrop-blur-sm border transition-all ${
                theme === 'dark'
                  ? 'bg-gray-800/90 border-gray-700 text-gray-200 hover:bg-gray-700/90'
                  : 'bg-white/90 border-gray-200 text-gray-800 hover:bg-gray-50/90'
              }`}
              title={`Playback Speed: ${getSpeedLabel(animationPlaybackSpeed)} (click to cycle)`}
            >
              {getSpeedLabel(animationPlaybackSpeed)}
            </motion.button>

            {/* Timeline */}
            <div className={`flex-1 flex items-center ${
              isMobile ? 'gap-2' : 'gap-3'
            }`}>
              {/* Animation Selector (if multiple) - Hide on mobile if too cramped */}
              {animationNames.length > 1 && !isMobile && (
                <select
                  value={currentAnimation || ''}
                  onChange={(e) => handleAnimationChange(e.target.value)}
                  className={`text-xs px-3 py-2 rounded-lg border backdrop-blur-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
                    theme === 'dark' 
                      ? 'bg-gray-800/90 border-gray-700 text-gray-200 hover:bg-gray-700/90' 
                      : 'bg-white/90 border-gray-200 text-gray-800 hover:bg-gray-50/90'
                  }`}
                  style={{
                    backgroundImage: 'none', // Remove default dropdown arrow styling
                  }}
                >
                  {animationNames.map((name: string, index: number) => (
                    <option 
                      key={`${name}-${index}`} 
                      value={name}
                      className={theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}
                    >
                      {name}
                    </option>
                  ))}
                </select>
              )}

              {/* Sleek Timeline */}
              <div className="flex-1 relative">
                <div
                  ref={timelineRef}
                  className={`relative ${
                    isMobile ? 'h-2' : 'h-1'
                  } rounded-full cursor-pointer ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                  }`}
                  onClick={handleTimelineClick}
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseMove={handleTimelineDrag}
                >
                  {/* Progress */}
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    style={{ width: `${animationTime * 100}%` }}
                  />
                  
                  {/* Playhead - Larger on mobile for better touch interaction */}
                  <div
                    className={`absolute top-1/2 transform -translate-y-1/2 ${
                      isMobile ? 'w-4 h-4' : 'w-3 h-3'
                    } bg-white rounded-full shadow-lg border-2 border-blue-500`}
                    style={{ 
                      left: `calc(${animationTime * 100}% - ${isMobile ? '8px' : '6px'})` 
                    }}
                  />
                </div>
              </div>

              {/* Time Display - Hide on mobile if too cramped */}
              {!isMobile && (
                <div className={`text-xs font-mono tabular-nums ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {Math.floor(animationTime * animationDuration * 30)}/{Math.floor(animationDuration * 30)}
                </div>
              )}
            </div>

                      </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
