"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, X, Copy, Edit, Trash2, Zap, Target } from "lucide-react";
import { useAppStore, type ModelPreset } from "@/store/appStore";
import { samplerOptions, schedulerOptions, createCustomPreset, availableModels } from "@/lib/model-presets";
import { toast } from "sonner";

interface ModelPresetEditorProps {
  preset: ModelPreset;
  isEditing: boolean;
  onSave: (updatedPreset: ModelPreset) => void;
  onCancel: () => void;
  onDuplicate: (basePreset: ModelPreset) => void;
  theme: 'light' | 'dark';
}

export default function ModelPresetEditor({
  preset,
  isEditing,
  onSave,
  onCancel,
  onDuplicate,
  theme
}: ModelPresetEditorProps) {
  const [editedPreset, setEditedPreset] = useState<ModelPreset>(preset);

  const handleSave = () => {
    // Validate required fields
    if (!editedPreset.displayName.trim()) {
      toast.error('Preset name is required');
      return;
    }
    
    const updatedPreset = {
      ...editedPreset,
      lastModified: new Date().toISOString()
    };
    
    onSave(updatedPreset);
    toast.success(`Preset "${updatedPreset.displayName}" saved`);
  };

  const handleDuplicate = () => {
    const duplicatedPreset = createCustomPreset(
      preset,
      { displayName: `${preset.displayName} Copy` },
      `${preset.displayName} Copy`
    );
    onDuplicate(duplicatedPreset);
    toast.success('Preset duplicated');
  };

  if (!isEditing) {
    return (
      <div className={`p-4 rounded-xl border transition-all ${
        preset.isActive
          ? theme === 'dark'
            ? 'bg-blue-900/30 border-blue-500 shadow-lg'
            : 'bg-blue-50 border-blue-300 shadow-lg'
          : theme === 'dark'
            ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Category icon */}
            <div className={`p-2 rounded-lg ${
              preset.category === 'lightning' 
                ? 'bg-yellow-500/20 text-yellow-600' 
                : 'bg-green-500/20 text-green-600'
            }`}>
              {preset.category === 'lightning' ? <Zap className="h-4 w-4" /> : <Target className="h-4 w-4" />}
            </div>
            
            <div>
              <h4 className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                {preset.displayName}
              </h4>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {preset.performance.fastModeTime} • {preset.ksampler.steps} steps
              </p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {preset.isActive && (
              <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
              }`}>
                Active
              </div>
            )}
          </div>
        </div>
        
        {/* Compact parameter display */}
        <div className={`p-2 rounded text-xs font-mono ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
          CFG {preset.ksampler.cfg} • {preset.ksampler.sampler_name} • {preset.ksampler.scheduler}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`p-6 rounded-xl border ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
            Edit Model Preset
          </h4>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Save className="h-4 w-4" />
              Save
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCancel}
              className={`px-4 py-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Cancel
            </motion.button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
              Preset Name
            </label>
            <input
              type="text"
              value={editedPreset.displayName}
              onChange={(e) => setEditedPreset(prev => ({ ...prev, displayName: e.target.value }))}
              className={`w-full p-3 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
              Model Selection
            </label>
            <select
              value={editedPreset.modelPath}
              onChange={(e) => {
                const selectedModel = availableModels.find(m => m.path === e.target.value);
                setEditedPreset(prev => ({ 
                  ...prev, 
                  modelPath: e.target.value,
                  name: selectedModel?.name || prev.name
                }));
              }}
              className={`w-full p-3 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <optgroup label="⚡ Lightning Models">
                {availableModels.filter(m => m.category === 'lightning').map((model) => (
                  <option key={model.path} value={model.path}>
                    {model.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="🎯 Standard Models">
                {availableModels.filter(m => m.category === 'standard').map((model) => (
                  <option key={model.path} value={model.path}>
                    {model.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="🎨 Artistic Models">
                {availableModels.filter(m => m.category === 'artistic').map((model) => (
                  <option key={model.path} value={model.path}>
                    {model.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
            Description
          </label>
          <textarea
            value={editedPreset.description}
            onChange={(e) => setEditedPreset(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
            className={`w-full p-3 rounded-lg border resize-none ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>

        {/* KSampler Parameters */}
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h5 className={`font-medium mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
            Main Generation (KSampler)
          </h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Steps</label>
              <input
                type="number"
                min="1"
                max="150"
                value={editedPreset.ksampler.steps}
                onChange={(e) => setEditedPreset(prev => ({
                  ...prev,
                  ksampler: { ...prev.ksampler, steps: parseInt(e.target.value) }
                }))}
                className={`w-full p-2 rounded border text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">CFG Scale</label>
              <input
                type="number"
                min="1"
                max="30"
                step="0.5"
                value={editedPreset.ksampler.cfg}
                onChange={(e) => setEditedPreset(prev => ({
                  ...prev,
                  ksampler: { ...prev.ksampler, cfg: parseFloat(e.target.value) }
                }))}
                className={`w-full p-2 rounded border text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Sampler</label>
              <select
                value={editedPreset.ksampler.sampler_name}
                onChange={(e) => setEditedPreset(prev => ({
                  ...prev,
                  ksampler: { ...prev.ksampler, sampler_name: e.target.value }
                }))}
                className={`w-full p-2 rounded border text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {samplerOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Scheduler</label>
              <select
                value={editedPreset.ksampler.scheduler}
                onChange={(e) => setEditedPreset(prev => ({
                  ...prev,
                  ksampler: { ...prev.ksampler, scheduler: e.target.value }
                }))}
                className={`w-full p-2 rounded border text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {schedulerOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Upscaler 1 Parameters */}
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h5 className={`font-medium mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
            First Upscaler (4x)
          </h5>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium mb-1">Steps</label>
              <input
                type="number"
                min="1"
                max="100"
                value={editedPreset.upscaler1.steps}
                onChange={(e) => setEditedPreset(prev => ({
                  ...prev,
                  upscaler1: { ...prev.upscaler1, steps: parseInt(e.target.value) }
                }))}
                className={`w-full p-2 rounded border text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">CFG</label>
              <input
                type="number"
                min="1"
                max="20"
                step="0.5"
                value={editedPreset.upscaler1.cfg}
                onChange={(e) => setEditedPreset(prev => ({
                  ...prev,
                  upscaler1: { ...prev.upscaler1, cfg: parseFloat(e.target.value) }
                }))}
                className={`w-full p-2 rounded border text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Denoise</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={editedPreset.upscaler1.denoise}
                onChange={(e) => setEditedPreset(prev => ({
                  ...prev,
                  upscaler1: { ...prev.upscaler1, denoise: parseFloat(e.target.value) }
                }))}
                className={`w-full p-2 rounded border text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Sampler</label>
              <select
                value={editedPreset.upscaler1.sampler_name}
                onChange={(e) => setEditedPreset(prev => ({
                  ...prev,
                  upscaler1: { ...prev.upscaler1, sampler_name: e.target.value }
                }))}
                className={`w-full p-2 rounded border text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {samplerOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Scheduler</label>
              <select
                value={editedPreset.upscaler1.scheduler}
                onChange={(e) => setEditedPreset(prev => ({
                  ...prev,
                  upscaler1: { ...prev.upscaler1, scheduler: e.target.value }
                }))}
                className={`w-full p-2 rounded border text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {schedulerOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Upscaler 2 Parameters */}
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h5 className={`font-medium mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
            Second Upscaler (2x)
          </h5>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium mb-1">Steps</label>
              <input
                type="number"
                min="1"
                max="100"
                value={editedPreset.upscaler2.steps}
                onChange={(e) => setEditedPreset(prev => ({
                  ...prev,
                  upscaler2: { ...prev.upscaler2, steps: parseInt(e.target.value) }
                }))}
                className={`w-full p-2 rounded border text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">CFG</label>
              <input
                type="number"
                min="1"
                max="20"
                step="0.5"
                value={editedPreset.upscaler2.cfg}
                onChange={(e) => setEditedPreset(prev => ({
                  ...prev,
                  upscaler2: { ...prev.upscaler2, cfg: parseFloat(e.target.value) }
                }))}
                className={`w-full p-2 rounded border text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Denoise</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={editedPreset.upscaler2.denoise}
                onChange={(e) => setEditedPreset(prev => ({
                  ...prev,
                  upscaler2: { ...prev.upscaler2, denoise: parseFloat(e.target.value) }
                }))}
                className={`w-full p-2 rounded border text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Sampler</label>
              <select
                value={editedPreset.upscaler2.sampler_name}
                onChange={(e) => setEditedPreset(prev => ({
                  ...prev,
                  upscaler2: { ...prev.upscaler2, sampler_name: e.target.value }
                }))}
                className={`w-full p-2 rounded border text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {samplerOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Scheduler</label>
              <select
                value={editedPreset.upscaler2.scheduler}
                onChange={(e) => setEditedPreset(prev => ({
                  ...prev,
                  upscaler2: { ...prev.upscaler2, scheduler: e.target.value }
                }))}
                className={`w-full p-2 rounded border text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {schedulerOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Performance Estimation */}
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
          <h5 className={`font-medium mb-2 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>
            Performance Estimation
          </h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Speed Rating (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={editedPreset.performance.speedRating}
                onChange={(e) => setEditedPreset(prev => ({
                  ...prev,
                  performance: { ...prev.performance, speedRating: parseInt(e.target.value) as 1|2|3|4|5 }
                }))}
                className={`w-full p-2 rounded border text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Quality Rating (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={editedPreset.performance.qualityRating}
                onChange={(e) => setEditedPreset(prev => ({
                  ...prev,
                  performance: { ...prev.performance, qualityRating: parseInt(e.target.value) as 1|2|3|4|5 }
                }))}
                className={`w-full p-2 rounded border text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
