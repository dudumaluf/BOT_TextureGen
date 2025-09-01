"use client";

import { useAppStore } from "@/store/appStore";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { ArrowUp, X, Grid3X3, Grid2X2, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function GalleryPanel() {
  const { 
    generations, 
    setGenerations, 
    loadGeneration, 
    toggleGallery,
    addToQueue
  } = useAppStore();
  const supabase = createClient();
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');

  const handleAddToUpgradeQueue = async (generation: any) => {
    if (generation.status !== 'completed') {
      toast.error("Can only upgrade completed generations");
      return;
    }
    
    addToQueue({
      ...generation,
      type: 'upgrade',
      originalId: generation.id
    });
    
    toast.success(`Added "${generation.subject_prompt || 'Generation'}" to upgrade queue`);
  };

  useEffect(() => {
    const fetchGenerations = async () => {
      const { data, error } = await supabase
        .from('generations')
        .select('*, model:models(*)')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching generations:", error);
      } else {
        setGenerations(data);
      }
    };
    fetchGenerations();
  }, [setGenerations, supabase]);

  return (
    <div className="h-full flex flex-col">
      {/* Header with Grid Size Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Gallery</h3>
        
        <div className="flex items-center gap-2">
          {/* Grid Size Controls */}
          <div className="flex items-center gap-1 mr-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setGridSize('large')}
              className={`p-1.5 rounded-md transition-colors ${
                gridSize === 'large' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Large thumbnails"
            >
              <Grid2X2 className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setGridSize('medium')}
              className={`p-1.5 rounded-md transition-colors ${
                gridSize === 'medium' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Medium thumbnails"
            >
              <Grid3X3 className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setGridSize('small')}
              className={`p-1.5 rounded-md transition-colors ${
                gridSize === 'small' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Small thumbnails"
            >
              <LayoutGrid className="h-4 w-4" />
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleGallery}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {generations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-medium mb-2">No generations yet</p>
            <p className="text-sm text-center">Upload a model and reference to start!</p>
          </div>
        ) : (
          <div className={`grid gap-3 ${
            gridSize === 'large' ? 'grid-cols-1' : 
            gridSize === 'medium' ? 'grid-cols-2' : 
            'grid-cols-3'
          }`}>
            {generations.map((gen, index) => (
              <motion.div
                key={gen.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-white rounded-xl p-3 border hover:border-blue-300 cursor-pointer hover:shadow-md transition-all"
                onClick={() => loadGeneration(gen)}
              >
                {/* Thumbnail */}
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                  {gen.thumbnail_storage_path ? (
                    <img 
                      src={gen.thumbnail_storage_path} 
                      alt="Generation thumbnail" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="space-y-2">
                  <p className="text-sm font-medium truncate" title={gen.subject_prompt || ''}>
                    {gen.subject_prompt || 'Untitled Generation'}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        gen.status === 'completed' ? 'bg-green-500' :
                        gen.status === 'processing' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <p className="text-xs text-gray-500 capitalize">{gen.status}</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {gen.created_at ? new Date(gen.created_at).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>

                {/* Upgrade Icon - Minimalist */}
                {gen.status === 'completed' && (
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToUpgradeQueue(gen);
                    }}
                    className="absolute top-2 right-2 p-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-white/40 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all opacity-0 group-hover:opacity-100"
                    title="Add to Upgrade Queue"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </motion.button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}