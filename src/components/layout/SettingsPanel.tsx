"use client";

import { useAppStore } from "@/store/appStore";
import { type ModelPreset } from "@/lib/model-presets";
import { getActiveModelPreset, createCustomPreset, samplerOptions, schedulerOptions } from "@/lib/model-presets";
import ModelPresetEditor from "./ModelPresetEditor";
import { motion, AnimatePresence } from "framer-motion";
import { X, Palette, Settings, Moon, Sun, Sliders, Save, RotateCcw, Plus, Trash2, LogOut, Edit, Copy, Zap, Target, Camera, Sparkles, Clock, Wrench, Brush } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SettingsModal() {
  const { 
    selectedStyle,
    setSelectedStyle,
    isSettingsOpen,
    toggleSettings,
    theme,
    setTheme,
    modelPresets,
    activeModelPresetId,
    setActiveModelPreset,
    addModelPreset,
    updateModelPreset,
    deleteModelPreset
  } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<'models' | 'styles' | 'appearance' | 'advanced'>('models');
  
  // Editable style templates state
  const [styleTemplates, setStyleTemplates] = useState<Record<string, string>>({
    photorealistic: "ultra-realistic photography, high-resolution detail, accurate color rendering, sharp fabric texture, visible stitching, natural lighting, smooth gradients, balanced exposure, crisp edges, noise-free, true-to-life realism",
    stylized: "artistic rendering, stylized textures, enhanced colors, creative interpretation, smooth surfaces",
    vintage: "aged appearance, weathered textures, vintage color palette, worn surfaces, nostalgic feel",
    industrial: "metallic surfaces, industrial materials, mechanical textures, hard edges, utilitarian design",
    artistic: "painterly textures, artistic interpretation, creative colors, expressive surfaces"
  });
  
  const [editingStyle, setEditingStyle] = useState<string | null>(null);
  const [newStyleName, setNewStyleName] = useState('');
  const [showAddStyle, setShowAddStyle] = useState(false);
  
  // Model preset management state
  const [editingPreset, setEditingPreset] = useState<string | null>(null);
  const [showAddPreset, setShowAddPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const handleCreateNewPreset = () => {
    // Create a new preset based on the current active preset
    const activePreset = modelPresets.find((p: any) => p.isActive) || modelPresets[0];
    const newPreset = createCustomPreset(
      activePreset,
      { displayName: 'New Custom Preset' },
      'New Custom Preset'
    );
    addModelPreset(newPreset);
    setEditingPreset(newPreset.id);
    toast.success('New preset created');
  };
  
  const supabase = createClient();
  const router = useRouter();

  const tabs = [
    { id: 'models', label: 'Models', icon: Settings },
    { id: 'styles', label: 'Styles', icon: Palette },
    { id: 'appearance', label: 'Theme', icon: Sun },
    { id: 'advanced', label: 'Advanced', icon: Sliders }
  ] as const;

  const handleStyleUpdate = (styleKey: string, newTemplate: string) => {
    setStyleTemplates(prev => ({
      ...prev,
      [styleKey]: newTemplate
    }));
    setEditingStyle(null);
  };

  const handleAddNewStyle = () => {
    if (newStyleName.trim() && !styleTemplates[newStyleName.toLowerCase()]) {
      setStyleTemplates(prev => ({
        ...prev,
        [newStyleName.toLowerCase()]: "Enter your custom style template here..."
      }));
      setNewStyleName('');
      setShowAddStyle(false);
      setEditingStyle(newStyleName.toLowerCase());
    }
  };

  const handleDeleteStyle = (styleKey: string) => {
    const newTemplates = { ...styleTemplates };
    delete newTemplates[styleKey];
    setStyleTemplates(newTemplates);
    
    // If the deleted style was selected, switch to photorealistic
    if (selectedStyle === styleKey) {
      setSelectedStyle('photorealistic');
    }
  };

  const handleDuplicateStyle = (styleKey: string, template: string) => {
    let duplicateName = `${styleKey} Copy`;
    let counter = 1;
    
    // Find a unique name
    while (styleTemplates[duplicateName]) {
      counter++;
      duplicateName = `${styleKey} Copy ${counter}`;
    }
    
    const newTemplates = {
      ...styleTemplates,
      [duplicateName]: template
    };
    
    setStyleTemplates(newTemplates);
    toast.success(`Style "${duplicateName}" created`);
  };

  const resetToDefaults = () => {
    setStyleTemplates({
      photorealistic: "ultra-realistic photography, high-resolution detail, accurate color rendering, sharp fabric texture, visible stitching, natural lighting, smooth gradients, balanced exposure, crisp edges, noise-free, true-to-life realism",
      stylized: "artistic rendering, stylized textures, enhanced colors, creative interpretation, smooth surfaces",
      vintage: "aged appearance, weathered textures, vintage color palette, worn surfaces, nostalgic feel",
      industrial: "metallic surfaces, industrial materials, mechanical textures, hard edges, utilitarian design",
      artistic: "painterly textures, artistic interpretation, creative colors, expressive surfaces"
    });
    setEditingStyle(null);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      router.push('/login');
    } catch (error: unknown) {
      toast.error("Error signing out");
      console.error("Sign out error:", error);
    }
  };

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSettings}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed inset-4 md:inset-8 lg:inset-16 rounded-2xl shadow-2xl z-50 flex flex-col max-h-[90vh] ${
              theme === 'dark' ? 'bg-gray-900' : 'bg-white'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  theme === 'dark' ? 'bg-blue-600/20' : 'bg-blue-100'
                }`}>
                  <Settings className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Settings</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleSettings}
                className={`p-2 rounded-full transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-gray-800 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Tabs */}
            <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <nav className="flex space-x-2 sm:space-x-8 px-3 sm:px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1 sm:gap-2 py-4 px-2 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                        activeTab === tab.id
                          ? theme === 'dark'
                            ? 'border-gray-300 text-gray-100'
                            : 'border-gray-700 text-gray-900'
                          : theme === 'dark'
                            ? 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-400'
                      }`}
                      whileHover={{ y: -1 }}
                      whileTap={{ y: 0 }}
                    >
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.label}</span>
                    </motion.button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                
                {/* Models Tab */}
                {activeTab === 'models' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>AI Model Presets</h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Configure different AI models with optimized parameters for speed and quality</p>
                    </div>
                    
                    {/* Header Actions */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {modelPresets.length} preset{modelPresets.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleCreateNewPreset}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900/30'
                            : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                        title="Create new preset"
                      >
                        <Plus className="h-4 w-4" />
                      </motion.button>
                    </div>

                    <div className="space-y-3">
                      {modelPresets.map((preset: any) => (
                        <div key={preset.id}>
                          {editingPreset === preset.id ? (
                            <ModelPresetEditor
                              preset={preset}
                              isEditing={true}
                              onSave={(updatedPreset) => {
                                updateModelPreset(preset.id, updatedPreset);
                                setEditingPreset(null);
                              }}
                              onCancel={() => setEditingPreset(null)}
                              onDuplicate={(newPreset) => {
                                addModelPreset(newPreset);
                              }}
                              theme={theme}
                            />
                          ) : (
                            <motion.div 
                              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                                preset.isActive
                                  ? theme === 'dark'
                                    ? 'bg-blue-900/30 border-blue-500 shadow-lg'
                                    : 'bg-blue-50 border-blue-300 shadow-lg'
                                  : theme === 'dark'
                                    ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                              }`}
                              whileHover={{ y: -1 }}
                              onClick={() => !preset.isActive && setActiveModelPreset(preset.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {/* Category icon */}
                                  <div className={`p-2 rounded-lg ${
                                    preset.category === 'lightning' 
                                      ? 'bg-yellow-500/20 text-yellow-600' 
                                      : 'bg-green-500/20 text-green-600'
                                  }`}>
                                    {preset.category === 'lightning' ? <Zap className="h-4 w-4" /> : <Target className="h-4 w-4" />}
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                                        {preset.displayName}
                                      </h4>
                                      {preset.isActive && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      )}
                                    </div>
                                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {preset.performance.fastModeTime} • Steps: {preset.ksampler.steps} • CFG: {preset.ksampler.cfg}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Compact action buttons */}
                                <div className="flex items-center gap-1">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const duplicatedPreset = createCustomPreset(
                                        preset,
                                        { displayName: `${preset.displayName} Copy` },
                                        `${preset.displayName} Copy`
                                      );
                                      addModelPreset(duplicatedPreset);
                                      toast.success('Preset duplicated');
                                    }}
                                    className={`p-2 rounded-lg transition-colors ${
                                      theme === 'dark'
                                        ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900/30'
                                        : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                                    }`}
                                    title="Duplicate preset"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </motion.button>
                                  
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingPreset(preset.id);
                                    }}
                                    className={`p-2 rounded-lg transition-colors ${
                                      theme === 'dark'
                                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                                    title="Edit parameters"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </motion.button>
                                  
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (preset.isCustom || confirm(`Delete "${preset.displayName}" preset?`)) {
                                        deleteModelPreset(preset.id);
                                        toast.success('Preset deleted');
                                      }
                                    }}
                                    className={`p-2 rounded-lg transition-colors ${
                                      theme === 'dark'
                                        ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30'
                                        : 'text-red-500 hover:text-red-600 hover:bg-red-50'
                                    }`}
                                    title="Delete preset"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </motion.button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
                
                {/* Style Templates Tab */}
                {activeTab === 'styles' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Style Templates</h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Customize and manage your texture generation styles</p>
                    </div>
                    
                    {/* Header Actions */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {Object.keys(styleTemplates).length} style{Object.keys(styleTemplates).length !== 1 ? 's' : ''}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={resetToDefaults}
                          className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            theme === 'dark'
                              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                          }`}
                          title="Reset all styles to defaults"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reset
                        </motion.button>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowAddStyle(true)}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900/30'
                            : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                        title="Create new style"
                      >
                        <Plus className="h-4 w-4" />
                      </motion.button>
                    </div>

                    {/* Add new style form */}
                    {showAddStyle && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`p-4 rounded-xl border ${
                          theme === 'dark'
                            ? 'bg-blue-900/30 border-blue-700'
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            placeholder="Style name (e.g., 'cyberpunk')"
                            value={newStyleName}
                            onChange={(e) => setNewStyleName(e.target.value)}
                            className={`flex-1 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              theme === 'dark'
                                ? 'bg-gray-800 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddNewStyle()}
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAddNewStyle}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Add
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setShowAddStyle(false);
                              setNewStyleName('');
                            }}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              theme === 'dark'
                                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                            }`}
                          >
                            Cancel
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Style templates grid */}
                    <div className="space-y-3">
                      {Object.entries(styleTemplates).map(([key, template]) => {
                        const getStyleIcon = (styleKey: string) => {
                          switch(styleKey) {
                            case 'photorealistic': return <Camera className="h-4 w-4" />;
                            case 'stylized': return <Sparkles className="h-4 w-4" />;
                            case 'vintage': return <Clock className="h-4 w-4" />;
                            case 'industrial': return <Wrench className="h-4 w-4" />;
                            case 'artistic': return <Brush className="h-4 w-4" />;
                            default: return <Palette className="h-4 w-4" />;
                          }
                        };

                        const getStyleColor = (styleKey: string) => {
                          switch(styleKey) {
                            case 'photorealistic': return 'bg-blue-500/20 text-blue-600';
                            case 'stylized': return 'bg-purple-500/20 text-purple-600';
                            case 'vintage': return 'bg-amber-500/20 text-amber-600';
                            case 'industrial': return 'bg-gray-500/20 text-gray-600';
                            case 'artistic': return 'bg-pink-500/20 text-pink-600';
                            default: return 'bg-green-500/20 text-green-600';
                          }
                        };

                        return (
                          <motion.div 
                            key={key} 
                            className={`p-4 rounded-xl border transition-all cursor-pointer ${
                              selectedStyle === key
                                ? theme === 'dark'
                                  ? 'bg-blue-900/30 border-blue-500 shadow-lg'
                                  : 'bg-blue-50 border-blue-300 shadow-lg'
                                : theme === 'dark'
                                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                            }`}
                            whileHover={{ y: -1 }}
                            onClick={() => selectedStyle !== key && setSelectedStyle(key)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {/* Style icon */}
                                <div className={`p-2 rounded-lg ${getStyleColor(key)}`}>
                                  {getStyleIcon(key)}
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className={`font-semibold capitalize ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                                      {key}
                                    </h4>
                                    {selectedStyle === key && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                  </div>
                                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {template.length > 50 ? `${template.substring(0, 50)}...` : template}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Compact action buttons */}
                              <div className="flex items-center gap-1">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicateStyle(key, template);
                                  }}
                                  className={`p-2 rounded-lg transition-colors ${
                                    theme === 'dark'
                                      ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900/30'
                                      : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                                  }`}
                                  title="Duplicate style"
                                >
                                  <Copy className="h-3 w-3" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingStyle(editingStyle === key ? null : key);
                                  }}
                                  className={`p-2 rounded-lg transition-colors ${
                                    theme === 'dark'
                                      ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900/30'
                                      : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                                  }`}
                                  title="Edit template"
                                >
                                  <Edit className="h-3 w-3" />
                                </motion.button>
                                {!['photorealistic', 'stylized', 'vintage', 'industrial', 'artistic'].includes(key) && (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteStyle(key);
                                    }}
                                    className={`p-2 rounded-lg transition-colors ${
                                      theme === 'dark'
                                        ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/30'
                                        : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                                    }`}
                                    title="Delete custom style"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          
                          {editingStyle === key ? (
                            <div className="space-y-3">
                              <textarea
                                className={`w-full p-3 text-sm rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                  theme === 'dark'
                                    ? 'bg-gray-800 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                                rows={4}
                                defaultValue={template}
                                placeholder="Enter your style template..."
                                onBlur={(e) => handleStyleUpdate(key, e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && e.ctrlKey) {
                                    handleStyleUpdate(key, e.currentTarget.value);
                                  }
                                }}
                              />
                              <div className="flex items-center gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    const textarea = document.querySelector(`textarea[defaultValue="${template}"]`) as HTMLTextAreaElement;
                                    if (textarea) handleStyleUpdate(key, textarea.value);
                                  }}
                                  className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                                >
                                  <Save className="h-3 w-3" />
                                  Save
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setEditingStyle(null)}
                                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                    theme === 'dark'
                                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                  }`}
                                >
                                  Cancel
                                </motion.button>
                              </div>
                              <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                <strong>Tip:</strong> Press Ctrl+Enter to save quickly
                              </p>
                            </div>
                          ) : (
                            <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{template}</p>
                          )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Appearance Tab */}
                {activeTab === 'appearance' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Appearance Settings</h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Customize the visual theme and interface</p>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Theme Selection */}
                      <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <h4 className={`font-medium mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Color Theme</h4>
                        <div className="flex items-center gap-4">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setTheme('light')}
                            className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 transition-colors ${
                              theme === 'light' 
                                ? 'bg-yellow-50 border-yellow-200 text-yellow-700' 
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <Sun className="h-5 w-5" />
                            <span className="font-medium">Light Mode</span>
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setTheme('dark')}
                            className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 transition-colors ${
                              theme === 'dark' 
                                ? 'bg-gray-800 border-gray-700 text-white' 
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <Moon className="h-5 w-5" />
                            <span className="font-medium">Dark Mode</span>
                          </motion.button>
                        </div>
                      </div>

                      {/* UI Preferences */}
                      <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <h4 className={`font-medium mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Interface Preferences</h4>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3">
                            <input type="checkbox" className="rounded" defaultChecked />
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Show animations</span>
                          </label>
                          <label className="flex items-center gap-3">
                            <input type="checkbox" className="rounded" defaultChecked />
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Auto-hide panels</span>
                          </label>
                          <label className="flex items-center gap-3">
                            <input type="checkbox" className="rounded" />
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Compact mode</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Advanced Tab */}
                {activeTab === 'advanced' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Advanced Settings</h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Fine-tune generation parameters and system behavior</p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <label className={`block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                          Upscaler Prompt Template
                        </label>
                        <textarea
                          className={`w-full p-3 text-sm rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-200 text-gray-900'
                          }`}
                          rows={4}
                          defaultValue="high-resolution, texture clarity, sharp edges, fabric/skin/material definition, no artifacts, clean background, photorealism"
                          placeholder="Customize upscaler prompt..."
                        />
                        <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          This template is used when upgrading textures to high quality
                        </p>
                      </div>
                      
                      <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <label className={`block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                          Default Quality Mode
                        </label>
                        <select className={`w-full p-3 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                        }`}>
                          <option value="fast">Fast Preview (2-3 min)</option>
                          <option value="quality">High Quality (12-15 min)</option>
                        </select>
                        
                        <div className={`mt-4 p-3 rounded-lg border ${
                          theme === 'dark'
                            ? 'bg-blue-900/30 border-blue-700'
                            : 'bg-blue-50 border-blue-200'
                        }`}>
                          <p className={`text-xs ${
                            theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                          }`}>
                            <strong>Tip:</strong> Fast mode generates a quick preview first, then you can upgrade to high quality if needed.
                          </p>
                        </div>
                      </div>

                      <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <label className={`block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                          Generation Timeout (minutes)
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="120"
                          defaultValue="45"
                          className={`w-full p-3 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-200 text-gray-900'
                          }`}
                        />
                        <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Maximum time to wait for generation completion
                        </p>
                      </div>

                      <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <label className={`block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                          Polling Interval (seconds)
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="60"
                          defaultValue="15"
                          className={`w-full p-3 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-200 text-gray-900'
                          }`}
                        />
                        <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          How often to check for generation completion
                        </p>
                      </div>
                    </div>

                    {/* Account Section */}
                    <div className={`mt-8 pt-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <h4 className={`font-medium mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Account</h4>
                      <div className={`p-4 rounded-xl border ${
                        theme === 'dark'
                          ? 'bg-red-900/30 border-red-700'
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium mb-1 ${
                              theme === 'dark' ? 'text-red-300' : 'text-red-800'
                            }`}>Sign Out</p>
                            <p className={`text-xs ${
                              theme === 'dark' ? 'text-red-400' : 'text-red-600'
                            }`}>End your current session</p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSignOut}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
