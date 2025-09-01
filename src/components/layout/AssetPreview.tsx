"use client";

import { useAppStore } from "@/store/appStore";
import Image from "next/image";
import { useState } from "react";
import { Button } from "../ui/button";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AssetPreview() {
  const { referenceImageUrl, generatedTextures } = useAppStore();
  const [isOpen, setIsOpen] = useState(true);

  const hasContent = referenceImageUrl || generatedTextures.diffuse || generatedTextures.thumbnail;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 z-10">
      <div className="flex justify-end">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button onClick={() => setIsOpen(!isOpen)} size="icon" variant="ghost">
            <motion.div
              animate={{ rotate: isOpen ? 0 : 180 }}
              transition={{ duration: 0.2 }}
            >
              {isOpen ? <EyeOff /> : <Eye />}
            </motion.div>
          </Button>
        </motion.div>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="mt-2 flex gap-2 rounded-lg bg-white/90 p-3 shadow-lg backdrop-blur-md border"
          >
            {referenceImageUrl && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <p className="text-xs font-semibold mb-1">Reference</p>
                <div className="relative overflow-hidden rounded">
                  <Image 
                    src={referenceImageUrl} 
                    alt="Reference" 
                    width={100} 
                    height={100} 
                    className="rounded transition-transform duration-300 hover:scale-110" 
                  />
                </div>
              </motion.div>
            )}
            {generatedTextures.thumbnail && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <p className="text-xs font-semibold mb-1">Front View</p>
                <div className="relative overflow-hidden rounded">
                  <img 
                    src={generatedTextures.thumbnail} 
                    alt="Front View" 
                    width={100} 
                    height={100} 
                    className="rounded transition-transform duration-300 hover:scale-110" 
                  />
                </div>
              </motion.div>
            )}
            {generatedTextures.diffuse && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <p className="text-xs font-semibold mb-1">Diffuse</p>
                <div className="relative overflow-hidden rounded">
                  <img 
                    src={generatedTextures.diffuse} 
                    alt="Diffuse" 
                    width={100} 
                    height={100} 
                    className="rounded transition-transform duration-300 hover:scale-110" 
                  />
                </div>
              </motion.div>
            )}
            {generatedTextures.normal && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <p className="text-xs font-semibold mb-1">Normal</p>
                <div className="relative overflow-hidden rounded">
                  <img 
                    src={generatedTextures.normal} 
                    alt="Normal" 
                    width={100} 
                    height={100} 
                    className="rounded transition-transform duration-300 hover:scale-110" 
                  />
                </div>
              </motion.div>
            )}
            {generatedTextures.height && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <p className="text-xs font-semibold mb-1">Height</p>
                <div className="relative overflow-hidden rounded">
                  <img 
                    src={generatedTextures.height} 
                    alt="Height" 
                    width={100} 
                    height={100} 
                    className="rounded transition-transform duration-300 hover:scale-110" 
                  />
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
