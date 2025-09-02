"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";

interface IntroAnimationProps {
  onComplete: () => void;
  type: 'pre-login' | 'post-login'; // Different flows
}

export default function IntroAnimation({ onComplete, type }: IntroAnimationProps) {
  const [currentStep, setCurrentStep] = useState<'logo' | 'video' | 'complete'>('logo');

  useEffect(() => {
    if (type === 'pre-login') {
      // Pre-login: Just show logo then complete
      const timer = setTimeout(() => {
        onComplete();
      }, 3000); // Logo shows for 3s then fade out
      
      return () => clearTimeout(timer);
    } else {
      // Post-login: Show video then complete
      const timer1 = setTimeout(() => {
        setCurrentStep('video');
      }, 100); // Quick transition to video
      
      const timer2 = setTimeout(() => {
        setCurrentStep('complete');
      }, 3000); // Video shows for 3s
      
      const timer3 = setTimeout(() => {
        onComplete();
      }, 3500); // Complete after fade out
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [onComplete, type]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <AnimatePresence>
        {/* Static Logo (Pre-login) */}
        {type === 'pre-login' && currentStep === 'logo' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            <div className="relative">
              <Image
                src="/logo.png"
                alt="Company Logo"
                width={120}
                height={120}
                className="invert"
                style={{ filter: 'invert(1)' }}
              />
            </div>
          </motion.div>
        )}

        {/* TextureGen Logo (Post-login) */}
        {type === 'post-login' && currentStep === 'video' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            <Image
              src="/logo_texturegen_white_on_transparent.png"
              alt="TextureGen Logo"
              width={200}
              height={200}
              className="object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
