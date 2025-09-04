"use client";

import { useAppStore } from "@/store/appStore";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sun, Layers, Camera, RotateCcw, ChevronDown, ChevronRight, Star, RotateCcw as Reset } from "lucide-react";
import { useState } from "react";

interface ScenePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScenePanel({ isOpen, onClose }: ScenePanelProps) {
  const { 
    environment, 
    setEnvironment, 
    backgroundColor,
    setBackgroundColor,
    showEnvironmentBackground,
    setShowEnvironmentBackground,
    materialSettings, 
    setMaterialSettings,
    cameraDistance,
    setCameraDistance,
    objectScale,
    setObjectScale,
    setAsDefaults,
    resetToDefaults,
    resetCamera,
    theme 
  } = useAppStore();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['environment']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const environments = [
    { name: 'venice_sunset_1k.hdr', label: 'Venice Sunset', preview: '🌅' },
    { name: 'cyclorama_hard_light_1k.hdr', label: 'Studio Cyclorama', preview: '💡' }
  ];

  return (
    <motion.div
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: isOpen ? 0 : -320, opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`absolute top-0 left-0 bottom-0 w-72 z-20 pointer-events-auto ${
        theme === 'dark' 
          ? 'bg-gray-900/95 border-r border-gray-700' 
          : 'bg-white border-r border-gray-200'
      }`}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Scene Settings</h3>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={`p-1 rounded-full transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          
          {/* Environment & Background Section */}
          <div className={`rounded-lg border ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => toggleSection('environment')}
              className={`w-full flex items-center justify-between p-3 transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sun className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <h4 className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Environment</h4>
              </div>
              {expandedSections.has('environment') ? 
                <ChevronDown className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} /> : 
                <ChevronRight className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
              }
            </motion.button>
            
            <AnimatePresence>
              {expandedSections.has('environment') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 pt-0 space-y-3">
                    {/* Environment Selection */}
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        HDRI Environment
                      </label>
                      <select
                        value={environment}
                        onChange={(e) => setEnvironment(e.target.value)}
                        className={`w-full p-2 border rounded-lg text-sm appearance-none cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                        }`}
                      >
                        {environments.map((env) => (
                          <option key={env.name} value={env.name}>
                            {env.preview} {env.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Background Mode Toggle */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showEnvironmentBackground}
                        onChange={(e) => setShowEnvironmentBackground(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Show HDRI Background</span>
                    </label>

                    {/* Background Color Picker */}
                    {!showEnvironmentBackground && (
                      <div className="space-y-2">
                        <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          Background Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="w-8 h-6 rounded border cursor-pointer"
                          />
                          <input
                            type="text"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className={`flex-1 p-1.5 text-xs border rounded font-mono ${
                              theme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-200 text-gray-900'
                            }`}
                            placeholder="#f3f4f6"
                          />
                        </div>
                        
                        <div className="flex gap-1">
                          {[
                            { name: 'White', color: '#ffffff' },
                            { name: 'Gray', color: '#f3f4f6' },
                            { name: 'Dark', color: '#374151' },
                            { name: 'Black', color: '#000000' }
                          ].map((preset) => (
                            <button
                              key={preset.color}
                              onClick={() => setBackgroundColor(preset.color)}
                              className="w-5 h-5 rounded border hover:scale-110 transition-transform"
                              style={{ backgroundColor: preset.color }}
                              title={preset.name}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Material Section */}
          <div className={`rounded-lg border ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => toggleSection('materials')}
              className={`w-full flex items-center justify-between p-3 transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <h4 className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Materials</h4>
              </div>
              {expandedSections.has('materials') ? 
                <ChevronDown className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} /> : 
                <ChevronRight className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
              }
            </motion.button>
            
            <AnimatePresence>
              {expandedSections.has('materials') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 pt-0 space-y-3">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Metalness: {materialSettings.metalness.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={materialSettings.metalness}
                        onChange={(e) => setMaterialSettings({ metalness: parseFloat(e.target.value) })}
                        className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                          theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                        }`}
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Roughness: {materialSettings.roughness.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={materialSettings.roughness}
                        onChange={(e) => setMaterialSettings({ roughness: parseFloat(e.target.value) })}
                        className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                          theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                        }`}
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Normal Intensity: {materialSettings.normalScale.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={materialSettings.normalScale}
                        onChange={(e) => setMaterialSettings({ normalScale: parseFloat(e.target.value) })}
                        className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                          theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                        }`}
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Displacement: {materialSettings.displacementScale.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.01"
                        value={materialSettings.displacementScale}
                        onChange={(e) => setMaterialSettings({ displacementScale: parseFloat(e.target.value) })}
                        className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                          theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Camera & Object Section */}
          <div className={`rounded-lg border ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => toggleSection('camera')}
              className={`w-full flex items-center justify-between p-3 transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Camera className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <h4 className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Camera & Object</h4>
              </div>
              {expandedSections.has('camera') ? 
                <ChevronDown className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} /> : 
                <ChevronRight className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
              }
            </motion.button>
            
            <AnimatePresence>
              {expandedSections.has('camera') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 pt-0 space-y-3">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Camera Distance: {cameraDistance.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="0.5"
                        value={cameraDistance}
                        onChange={(e) => setCameraDistance(parseFloat(e.target.value))}
                        className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                          theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Object Scale: {objectScale.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={objectScale}
                        onChange={(e) => setObjectScale(parseFloat(e.target.value))}
                        className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                          theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                        }`}
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={resetCamera}
                      className={`w-full p-2 rounded border transition-colors text-xs font-medium ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 hover:border-gray-500 text-gray-200'
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      Reset View
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}