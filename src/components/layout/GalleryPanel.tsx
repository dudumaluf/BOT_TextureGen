"use client";

import { useAppStore } from "@/store/appStore";
import Image from "next/image";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function GalleryPanel() {
  const { isGalleryOpen, generations, setGenerations, loadGeneration } = useAppStore();
  const supabase = createClient();

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
    <AnimatePresence>
      {isGalleryOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              const { toggleGallery } = useAppStore.getState();
              toggleGallery();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-bold text-gray-800"
                >
                  My Generations
                </motion.h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    const { toggleGallery } = useAppStore.getState();
                    toggleGallery();
                  }}
                  className="p-2 rounded-full hover:bg-white/50 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {generations.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500"
                  >
                    <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium mb-2">No generations yet</p>
                    <p className="text-sm text-center max-w-md">Upload a 3D model and reference image to create your first AI-generated texture!</p>
                  </motion.div>
                ) : (
                  generations.map((gen, index) => (
                    <motion.div
                      key={gen.id}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ 
                        delay: index * 0.05,
                        type: "spring",
                        damping: 20,
                        stiffness: 300
                      }}
                      className="bg-white border rounded-xl p-3 shadow-sm hover:shadow-md cursor-pointer hover:border-blue-300 transition-all group"
                      onClick={() => {
                        loadGeneration(gen);
                        const { toggleGallery } = useAppStore.getState();
                        toggleGallery();
                      }}
                    >
                      <div className="aspect-square relative mb-3 overflow-hidden rounded-lg bg-gray-100">
                        {gen.thumbnail_storage_path ? (
                          <img 
                            src={gen.thumbnail_storage_path} 
                            alt="Generation thumbnail" 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
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
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
