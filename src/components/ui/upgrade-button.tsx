"use client";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/appStore";
import { toast } from "sonner";
import { Zap, Clock, ArrowUp } from "lucide-react";
import { motion } from "framer-motion";

export default function UpgradeButton() {
  const { 
    currentGeneration, 
    setIsUpgrading, 
    setCurrentGeneration,
    modelFileName,
    modelId,
    referenceImageUrl,
    referenceImageName,
    mainPrompt,
    selectedStyle,
    seed,
    referenceStrength
  } = useAppStore();

  if (!currentGeneration?.canUpgrade || currentGeneration?.isUpgrading) {
    return null;
  }

  const handleUpgrade = async () => {
    if (!modelFileName || !modelId || !referenceImageName) {
      toast.error("Missing model or reference image for upgrade");
      return;
    }

    setIsUpgrading(true);
    toast.info("🚀 Upgrading to High Quality... (12-15 minutes)");

    try {
      // Start high-quality generation with same parameters
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelFileName,
          modelId,
          referenceImageUrl,
          referenceImageName,
          mainPrompt,
          selectedStyle,
          seed,
          highQuality: true, // Force high quality
          referenceStrength,
          parentId: currentGeneration.fastGeneration?.id // Link to fast generation
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to start upgrade');
      }

      // Update current generation with HQ info
      setCurrentGeneration({
        ...currentGeneration,
        hqGeneration: { id: result.generationId, status: 'processing' },
        isUpgrading: true,
        canUpgrade: false
      });

      toast.success("High Quality upgrade started! You'll be notified when ready.");

    } catch (error: any) {
      console.error("Error starting upgrade:", error);
      toast.error(error.message || "Failed to start upgrade");
      setIsUpgrading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className="mt-4"
    >
      <Button 
        onClick={handleUpgrade}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
        size="lg"
      >
        <div className="flex items-center gap-2">
          <ArrowUp className="h-4 w-4" />
          <span>Upgrade to High Quality</span>
          <Clock className="h-4 w-4" />
        </div>
      </Button>
      
      <div className="mt-2 text-xs text-center text-gray-500 flex items-center justify-center gap-1">
        <Zap className="h-3 w-3" />
        <span>Current: Fast Mode • Upgrade: Maximum Detail (12-15 min)</span>
      </div>
    </motion.div>
  );
}
