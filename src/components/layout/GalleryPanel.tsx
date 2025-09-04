"use client";

import { useAppStore, type GenerationRecord } from "@/store/appStore";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { ArrowUp, X, Grid3X3, Grid2X2, LayoutGrid, Trash2, CheckSquare, Square, Check } from "lucide-react";
import { toast } from "sonner";

export default function GalleryPanel() {
  const { 
    generations, 
    setGenerations, 
    loadGeneration, 
    toggleGallery,
    addToBatchQueue,
    theme
  } = useAppStore();
  const supabase = createClient();
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const handleAddToUpgradeQueue = async (generation: GenerationRecord) => {
    if (generation.status !== 'completed') {
      toast.error("Can only upgrade completed generations");
      return;
    }
    
    addToBatchQueue({
      ...generation,
      type: 'upgrade' as const,
      originalId: generation.id,
      mainPrompt: generation.subject_prompt || 'Untitled Generation',
      selectedStyle: generation.style_prompt || 'photorealistic',
      referenceStrength: 0.7, // Default for upgrades
      // Preserve all original generation data
      modelFileName: generation.model?.name || null,
      modelId: generation.model_id || null,
      referenceImageUrl: generation.reference_image_path || '',
      referenceImageName: generation.model?.name || null,
      seed: generation.seed || 0,
      highQuality: true, // Upgrades are always high quality
      status: 'queued'
    });
    
    toast.success(`Added "${generation.subject_prompt || 'Generation'}" to upgrade queue`);
  };

  const toggleSelection = (generationId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(generationId)) {
        newSet.delete(generationId);
      } else {
        newSet.add(generationId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedItems(new Set(generations.map(gen => gen.id)));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const deleteSelected = async () => {
    if (selectedItems.size === 0) return;
    
    const confirmMessage = selectedItems.size === 1 
      ? "Delete this generation?" 
      : `Delete ${selectedItems.size} generations?`;
      
    if (!confirm(confirmMessage)) return;
    
    try {
      const itemsArray = Array.from(selectedItems);
      
      // Delete from database
      const { error } = await supabase
        .from('generations')
        .delete()
        .in('id', itemsArray);
      
      if (error) throw error;
      
      // Update local state
      setGenerations(generations.filter(gen => !selectedItems.has(gen.id)));
      clearSelection();
      
      toast.success(`Deleted ${itemsArray.length} generation(s)`);
      
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Failed to delete generations');
    }
  };

  const deleteAll = async () => {
    if (generations.length === 0) return;
    
    if (!confirm(`Delete ALL ${generations.length} generations? This cannot be undone.`)) return;
    
    try {
      const { error } = await supabase
        .from('generations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using dummy condition)
      
      if (error) throw error;
      
      setGenerations([]);
      clearSelection();
      
      toast.success('All generations deleted');
      
    } catch (error: any) {
      console.error('Delete all error:', error);
      toast.error('Failed to delete all generations');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSelectionMode) return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      } else if (e.key === 'Escape') {
        clearSelection();
      } else if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSelectionMode, selectedItems, generations]);

  useEffect(() => {
    const fetchGenerations = async () => {
      const { data, error } = await supabase
        .from('generations')
        .select('*, model:models(*)')
        .order('created_at', { ascending: false }) as { data: GenerationRecord[] | null, error: any };
      
      if (error) {
        console.error("Error fetching generations:", error);
      } else {
        setGenerations(data || []);
      }
    };
    fetchGenerations();
  }, [setGenerations, supabase]);

  return (
    <div className="h-full flex flex-col">
      {/* Header with Controls */}
      <div className={`flex items-center justify-between p-4 border-b ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <h3 className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Gallery</h3>
          {selectedItems.size > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {selectedItems.size} selected
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Selection Mode Controls */}
          {isSelectionMode ? (
            <div className="flex items-center gap-1 mr-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={selectAll}
                className="p-1.5 rounded-md text-blue-600 hover:bg-blue-100 transition-colors"
                title="Select All (Ctrl+A)"
              >
                <Check className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={deleteSelected}
                disabled={selectedItems.size === 0}
                className="p-1.5 rounded-md text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                title="Delete Selected (Delete key)"
              >
                <Trash2 className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={clearSelection}
                className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                title="Cancel Selection (Esc)"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>
          ) : (
            <>
              {/* Management Controls */}
              <div className="flex items-center gap-1 mr-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsSelectionMode(true)}
                  className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Multi-select to delete items"
                >
                  <CheckSquare className="h-4 w-4" />
                </motion.button>
                {/* Delete All button removed - only show delete when items are selected */}
              </div>

              {/* Grid Size Toggle */}
              <div className="flex items-center gap-1 mr-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
                    const currentIndex = sizes.indexOf(gridSize);
                    const nextIndex = (currentIndex + 1) % sizes.length;
                    setGridSize(sizes[nextIndex]);
                  }}
                  className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                  title={`Grid Size: ${gridSize} (click to cycle)`}
                >
                  {gridSize === 'large' && <Grid2X2 className="h-4 w-4" />}
                  {gridSize === 'medium' && <Grid3X3 className="h-4 w-4" />}
                  {gridSize === 'small' && <LayoutGrid className="h-4 w-4" />}
                </motion.button>
              </div>
            </>
          )}

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleGallery}
            className="hidden sm:block p-1 rounded-full hover:bg-gray-100 transition-colors"
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
            {generations.map((gen, index) => {
              const isSelected = selectedItems.has(gen.id);
              return (
                <motion.div
                  key={gen.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group relative rounded-xl p-3 border cursor-pointer hover:shadow-md transition-all duration-200 ease-out ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-500 shadow-md' 
                      : theme === 'dark'
                        ? 'bg-gray-900 border-gray-700 hover:border-blue-400'
                        : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => {
                    if (isSelectionMode) {
                      toggleSelection(gen.id);
                    } else {
                      loadGeneration(gen);
                    }
                  }}
                >
                {/* Thumbnail */}
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                  {(gen.front_preview_storage_path || gen.thumbnail_storage_path) ? (
                    <img 
                      src={gen.front_preview_storage_path || gen.thumbnail_storage_path} 
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
                <div className="space-y-2 min-w-0">
                  <p className={`text-sm font-medium truncate overflow-hidden ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`} title={gen.subject_prompt || ''}>
                    {gen.subject_prompt || 'Untitled Generation'}
                  </p>
                  <div className="flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-shrink">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        gen.status === 'completed' ? 'bg-green-500' :
                        gen.status === 'processing' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <p className="text-xs text-gray-500 capitalize truncate">{gen.status}</p>
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {gen.created_at ? new Date(gen.created_at).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>

                {/* Selection Checkbox */}
                {isSelectionMode && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 left-2 z-10"
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {isSelected && <CheckSquare className="h-3 w-3 text-white" />}
                    </div>
                  </motion.div>
                )}

                {/* Quality Indicator */}
                <div className={`absolute top-2 flex items-center gap-1 ${isSelectionMode ? 'right-2' : 'left-2'}`}>
                  <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                    gen.high_quality 
                      ? 'bg-green-500 text-white' 
                      : 'bg-orange-500 text-white'
                  }`}>
                    {gen.high_quality ? 'HQ' : 'LQ'}
                  </span>
                </div>


              </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}