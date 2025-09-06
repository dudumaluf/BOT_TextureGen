"use client";

import { useAppStore, type GenerationRecord } from "@/store/appStore";
import { useEffect, useState, useCallback, memo } from "react";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { ArrowUp, X, Grid3X3, Grid2X2, LayoutGrid, Trash2, CheckSquare, Square, Check } from "lucide-react";
import { toast } from "sonner";
import { useResponsive } from "@/hooks/useResponsive";

// Memoized gallery item to prevent unnecessary re-renders during animations
const GalleryItem = memo(({ 
  gen, 
  index, 
  isSelected, 
  isSelectionMode, 
  theme, 
  onToggleSelection, 
  onLoadGeneration 
}: {
  gen: GenerationRecord;
  index: number;
  isSelected: boolean;
  isSelectionMode: boolean;
  theme: 'light' | 'dark';
  onToggleSelection: (id: string) => void;
  onLoadGeneration: (gen: GenerationRecord) => void;
}) => (
  <motion.div
    key={gen.id}
    layoutId={`gallery-item-${gen.id}`}
    initial={false}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className={`group relative aspect-square cursor-pointer overflow-hidden transition-all duration-200 ease-out border border-gray-200 ${
      isSelected 
        ? 'ring-2 ring-blue-500 ring-inset' 
        : 'hover:brightness-110'
    }`}
    onClick={() => {
      if (isSelectionMode) {
        onToggleSelection(gen.id);
      } else {
        onLoadGeneration(gen);
      }
    }}
  >
    {/* Full-bleed Thumbnail */}
    <div className="absolute inset-0">
      {(gen.front_preview_storage_path || gen.thumbnail_storage_path) ? (
        <img 
          src={gen.front_preview_storage_path || gen.thumbnail_storage_path} 
          alt="Generation thumbnail" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>

    {/* Top Left - Processing Spinner */}
    {gen.status === 'processing' && (
      <div className="absolute top-2 left-2 z-10">
        <div className="w-3 h-3 border border-white/60 border-t-white rounded-full animate-spin shadow-sm" />
      </div>
    )}

    {/* Bottom Overlay - Title Only */}
    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-white/90 via-white/70 to-transparent backdrop-blur-sm text-black transform translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-200">
      <p className="text-sm font-semibold truncate" title={gen.subject_prompt || ''}>
        {gen.subject_prompt || 'Untitled Generation'}
      </p>
    </div>

    {/* Top Overlay - Quality Badge with Hover Transition */}
    <div className="absolute top-2 right-2">
      {/* Tiny circle (default state) */}
      <div className={`w-2 h-2 rounded-full transition-all duration-300 ease-out group-hover:opacity-0 ${
        gen.high_quality 
          ? 'bg-green-500' 
          : 'bg-yellow-500'
      }`} />
      
      {/* Full pill (hover state) */}
      <span className={`absolute top-0 right-0 px-2 py-1 text-xs font-bold rounded-full shadow-lg bg-transparent border-2 text-gray-700 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out transform scale-75 group-hover:scale-100 ${
        gen.high_quality 
          ? 'border-green-500 text-green-600' 
          : 'border-yellow-500 text-yellow-600'
      }`}>
        {gen.high_quality ? '4K' : '2K'}
      </span>
    </div>

    {/* Selection Checkbox */}
    {isSelectionMode && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute top-2 left-2 z-10"
      >
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-lg ${
          isSelected 
            ? 'bg-blue-500 border-blue-500' 
            : 'bg-white/90 border-white/90'
        }`}>
          {isSelected && <CheckSquare className="h-4 w-4 text-white" />}
        </div>
      </motion.div>
    )}

    {/* Selection Overlay */}
    {isSelected && (
      <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500" />
    )}
  </motion.div>
));

GalleryItem.displayName = 'GalleryItem';

export default function GalleryPanel() {
  const { 
    generations, 
    setGenerations, 
    loadGeneration, 
    toggleGallery,
    addToQueue,
    theme
  } = useAppStore();
  const { isMobile } = useResponsive();
  const supabase = createClient();
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const handleAddToUpgradeQueue = async (generation: GenerationRecord) => {
    if (generation.status !== 'completed') {
      toast.error("Can only upgrade completed generations");
      return;
    }
    
    addToQueue({
      id: Date.now().toString(),
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

  const toggleSelection = useCallback((generationId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(generationId)) {
        newSet.delete(generationId);
      } else {
        newSet.add(generationId);
      }
      return newSet;
    });
  }, []);

  const handleLoadGeneration = useCallback((generation: GenerationRecord) => {
    loadGeneration(generation);
    
    // Auto-close gallery on mobile after selecting a generation for better UX
    if (isMobile) {
      toggleGallery();
    }
  }, [loadGeneration, isMobile, toggleGallery]);

  const selectAll = () => {
    setSelectedItems(new Set(generations.map((gen: any) => gen.id)));
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
      setGenerations(generations.filter((gen: any) => !selectedItems.has(gen.id)));
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

  // Real-time subscription for generation updates
  useEffect(() => {
    const channel = supabase
      .channel('generations-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'generations'
        },
        async (payload) => {
          console.log('Real-time: Generation change detected', payload);
          
          // Add a small delay to ensure database consistency after webhook updates
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Refresh the entire generations list to ensure consistency
          const { data, error } = await supabase
            .from('generations')
            .select('*, model:models(*)')
            .order('created_at', { ascending: false }) as { data: GenerationRecord[] | null, error: any };
          
          if (!error && data) {
            setGenerations(data);
            console.log(`Real-time: Updated gallery with ${data.length} generations`, {
              recentCompleted: data.filter(g => g.status === 'completed').slice(0, 3).map(g => ({ 
                id: g.id, 
                hasTextures: !!g.diffuse_storage_path 
              }))
            });
          } else if (error) {
            console.error('Real-time: Error fetching updated generations:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, setGenerations]);

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
        
        <div className="flex items-center gap-1">
          {/* Single row of controls */}
          {isSelectionMode ? (
            <>
              {/* Selection Mode: Select All + Delete Selected in single row */}
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
            </>
          ) : (
            <>
              {/* Normal Mode: Multi-select + Grid Size in single row */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsSelectionMode(true)}
                className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                title="Multi-select to delete items"
              >
                <CheckSquare className="h-4 w-4" />
              </motion.button>
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
            </>
          )}

          {/* Single Close button - exits selection mode OR closes gallery */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (isSelectionMode) {
                clearSelection(); // Exit selection mode
              } else {
                toggleGallery(); // Close gallery (desktop only)
              }
            }}
            className="hidden sm:block p-1 rounded-full hover:bg-gray-100 transition-colors"
            title={isSelectionMode ? "Cancel Selection (Esc)" : "Close Gallery"}
          >
            <X className="h-4 w-4 text-gray-500" />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto gallery-scroll">
        {generations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-medium mb-2">No generations yet</p>
            <p className="text-sm text-center">Upload a model and reference to start!</p>
          </div>
        ) : (
          <div className={`grid ${
            gridSize === 'large' ? 'grid-cols-1' : 
            gridSize === 'medium' ? 'grid-cols-2' : 
            'grid-cols-3'
          }`}>
            {generations.map((gen: any, index: number) => (
              <GalleryItem
                key={gen.id}
                gen={gen}
                index={index}
                isSelected={selectedItems.has(gen.id)}
                isSelectionMode={isSelectionMode}
                theme={theme}
                onToggleSelection={toggleSelection}
                onLoadGeneration={handleLoadGeneration}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}