"use client";

import { useAppStore } from "@/store/appStore";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sun, Layers, Camera, RotateCcw, ChevronDown, ChevronRight, Star, RotateCcw as Reset, Target, Box, Save, Download } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import EditableSlider from "@/components/ui/EditableSlider";

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
    objectPosition,
    setObjectPosition,
    objectRotation,
    setObjectRotation,
    autoFrameModel,
    resetModelPosition,
    setAsDefaults,
    resetToDefaults,
    resetCamera,
    theme,
    modelFileName,
    saveModelSettings,
    loadModelSettings,
    hasModelSettings
  } = useAppStore();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['environment', 'camera', 'object']));

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
      className={`absolute top-0 left-0 bottom-0 w-full sm:w-72 z-20 pointer-events-auto ${
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
          <div className="flex items-center gap-1">
            {/* Save as Default Icon */}
            {modelFileName && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={async () => {
                  const success = await saveModelSettings(modelFileName);
                  if (success) {
                    toast.success("💾 Settings saved as default for this model!");
                  } else {
                    toast.error("Failed to save settings");
                  }
                }}
                className={`p-1 rounded-full transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-green-900/30 text-green-400 hover:text-green-300' 
                    : 'hover:bg-green-50 text-green-600 hover:text-green-700'
                }`}
                title="Save current settings as default for this model"
              >
                <Save className="h-4 w-4" />
              </motion.button>
            )}
            {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={`hidden sm:block p-1 rounded-full transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>
        </div>


        {/* Content */}
        <div className="flex-1 overflow-y-auto panel-scroll p-4 space-y-3">
          
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
                    <EditableSlider
                      label="Metalness"
                        value={materialSettings.metalness}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(value) => setMaterialSettings({ metalness: value })}
                    />
                    
                    <EditableSlider
                      label="Roughness"
                        value={materialSettings.roughness}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(value) => setMaterialSettings({ roughness: value })}
                    />
                    
                    <EditableSlider
                      label="Normal Intensity"
                        value={materialSettings.normalScale}
                      min={0}
                      max={2}
                      step={0.01}
                      onChange={(value) => setMaterialSettings({ normalScale: value })}
                    />
                    
                    <EditableSlider
                      label="Displacement"
                        value={materialSettings.displacementScale}
                      min={0}
                      max={0.5}
                      step={0.01}
                      onChange={(value) => setMaterialSettings({ displacementScale: value })}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Camera Controls */}
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
                <h4 className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Camera</h4>
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
                    <EditableSlider
                      label="Camera Distance"
                        value={cameraDistance}
                      min={1}
                      max={200}
                      step={0.01}
                      onChange={setCameraDistance}
                      formatValue={(val) => val.toFixed(1)}
                    />

                    {/* Camera Controls */}
                    <div className="space-y-2">
                      {/* Fit to View Button - Simple and Consistent */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          // Simple fit to view: just adjust camera distance to frame the model nicely
                          const currentScale = objectScale;
                          const optimalDistance = Math.max(5, currentScale * 8); // Simple formula
                          const finalDistance = Math.min(200, optimalDistance);
                          setCameraDistance(finalDistance);
                          resetCamera(); // Reset camera position/rotation but keep new distance
                          toast.success("📐 Model fitted to view!");
                        }}
                        className={`w-full p-2 rounded-lg border transition-all duration-200 flex items-center justify-center gap-2 ${
                          theme === 'dark'
                            ? 'bg-blue-900/20 border-blue-700/50 text-blue-300 hover:bg-blue-900/30 hover:border-blue-600'
                            : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300'
                        }`}
                        title="Adjust camera distance to perfectly frame the model at current scale"
                      >
                        <Target className="h-4 w-4" />
                        <span className="text-sm font-medium">Fit to View</span>
                      </motion.button>

                      {/* Reset Camera Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={async () => {
                          if (modelFileName) {
                            // Try to load saved settings first
                            const loaded = await loadModelSettings(modelFileName);
                            if (loaded) {
                              toast.success("📷 Camera reset to saved settings!");
                            } else {
                              // Fallback to global defaults if no saved settings
                              setCameraDistance(5);
                              resetCamera();
                              toast.success("📷 Camera reset to defaults!");
                            }
                          } else {
                            // No model loaded, use global defaults
                            setCameraDistance(5);
                            resetCamera();
                            toast.success("📷 Camera reset to defaults!");
                          }
                        }}
                        className={`w-full p-2 rounded-lg border transition-all duration-200 flex items-center justify-center gap-2 ${
                          theme === 'dark'
                            ? 'bg-gray-800/50 border-gray-600/50 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                        title="Reset camera distance and view to defaults"
                      >
                        <Camera className="h-4 w-4" />
                        <span className="text-sm font-medium">Reset Camera</span>
                      </motion.button>
                    </div>

                    {/* Model Settings - Only show if model is loaded */}
                    {modelFileName && (
                      <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          Model: {modelFileName.split('/').pop()?.replace('.glb', '') || 'Unknown'}
                        </div>
                      </div>
                    )}

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Object Controls */}
          <div className={`rounded-lg border ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => toggleSection('object')}
              className={`w-full flex items-center justify-between p-3 transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Box className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <h4 className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Object</h4>
              </div>
              {expandedSections.has('object') ? 
                <ChevronDown className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} /> : 
                <ChevronRight className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
              }
            </motion.button>
            
            <AnimatePresence>
              {expandedSections.has('object') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 pt-0 space-y-3">
                    <EditableSlider
                      label="Object Scale"
                      value={objectScale}
                      min={0.01}
                      max={5}
                      step={0.01}
                      onChange={setObjectScale}
                    />

                    {/* Position Controls */}
                    <div className="space-y-3">
                      <div className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Position
                      </div>
                      
                      <EditableSlider
                        label="X Position"
                        value={objectPosition.x}
                        min={-1000}
                        max={1000}
                        step={0.01}
                        onChange={(value) => setObjectPosition({
                          ...objectPosition,
                          x: value
                        })}
                        formatValue={(val) => val.toFixed(1)}
                      />

                      <EditableSlider
                        label="Y Position"
                        value={objectPosition.y}
                        min={-1000}
                        max={1000}
                        step={0.01}
                        onChange={(value) => setObjectPosition({
                          ...objectPosition,
                          y: value
                        })}
                        formatValue={(val) => val.toFixed(1)}
                      />

                      <EditableSlider
                        label="Z Position"
                        value={objectPosition.z}
                        min={-1000}
                        max={1000}
                        step={0.01}
                        onChange={(value) => setObjectPosition({
                          ...objectPosition,
                          z: value
                        })}
                        formatValue={(val) => val.toFixed(1)}
                      />
                    </div>

                    {/* Rotation Controls */}
                    <div className="space-y-2">
                      <div className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Rotation
                      </div>
                      
                      <EditableSlider
                        label="X Rotation"
                        value={objectRotation.x}
                        min={-Math.PI}
                        max={Math.PI}
                        step={0.01}
                        onChange={(value) => setObjectRotation({
                          ...objectRotation,
                          x: value
                        })}
                        formatValue={(val) => `${Math.round(val * 180 / Math.PI)}°`}
                      />

                      <EditableSlider
                        label="Y Rotation"
                        value={objectRotation.y}
                        min={-Math.PI}
                        max={Math.PI}
                        step={0.01}
                        onChange={(value) => setObjectRotation({
                          ...objectRotation,
                          y: value
                        })}
                        formatValue={(val) => `${Math.round(val * 180 / Math.PI)}°`}
                      />

                      <EditableSlider
                        label="Z Rotation"
                        value={objectRotation.z}
                        min={-Math.PI}
                        max={Math.PI}
                        step={0.01}
                        onChange={(value) => setObjectRotation({
                          ...objectRotation,
                          z: value
                        })}
                        formatValue={(val) => `${Math.round(val * 180 / Math.PI)}°`}
                      />
                    </div>

                    {/* Object Controls */}
                    <div className="space-y-2">
                      {/* Model Name */}
                      {modelFileName && (
                        <div className={`text-xs text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {modelFileName.length > 30 ? `${modelFileName.substring(0, 30)}...` : modelFileName}
                        </div>
                      )}
                      
                      {/* Reset Object Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                        onClick={async () => {
                          if (modelFileName) {
                            // Try to load saved settings first
                            const loaded = await loadModelSettings(modelFileName);
                            if (loaded) {
                              toast.success("📦 Object reset to saved settings!");
                            } else {
                              // Fallback to global defaults if no saved settings
                              setObjectScale(1);
                              setObjectPosition({ x: 0, y: 0, z: 0 });
                              setObjectRotation({ x: 0, y: 0, z: 0 });
                              toast.success("📦 Object reset to defaults!");
                            }
                          } else {
                            // No model loaded, use global defaults
                            setObjectScale(1);
                            setObjectPosition({ x: 0, y: 0, z: 0 });
                            setObjectRotation({ x: 0, y: 0, z: 0 });
                            toast.success("📦 Object reset to defaults!");
                          }
                        }}
                        className={`w-full p-2 rounded-lg border transition-all duration-200 flex items-center justify-center gap-2 ${
                        theme === 'dark'
                            ? 'bg-gray-800/50 border-gray-600/50 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                        title="Reset object scale and position to defaults"
                    >
                        <Box className="h-4 w-4" />
                        <span className="text-sm font-medium">Reset Object</span>
                    </motion.button>
                    </div>
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