import { create } from 'zustand'
import { ModelPreset, defaultModelPresets } from '@/lib/model-presets'

export interface TextureOutput {
  diffuse: string | null;
  normal: string | null;
  height: string | null;
  thumbnail: string | null;
}

export interface ModelRecord {
  id: string;
  name: string;
  storage_path: string;
  user_id: string;
  created_at?: string;
}

export interface GenerationRecord {
  id: string;
  status: string;
  subject_prompt?: string;
  style_prompt?: string;
  seed: number;
  reference_image_path?: string;
  diffuse_storage_path?: string;
  normal_storage_path?: string;
  height_storage_path?: string;
  thumbnail_storage_path?: string;
  depth_preview_storage_path?: string;
  front_preview_storage_path?: string;
  high_quality?: boolean;
  created_at?: string;
  model_id?: string;
  user_id?: string;
  error_message?: string; // Error message when generation fails
  model?: ModelRecord; // Relational data from Supabase joins
}

export interface QueueItem {
  id: string;
  type: 'generation' | 'upgrade';
  modelFileName: string | null;
  modelId: string | null;
  referenceImageUrl: string | null;
  referenceImageName: string | null;
  mainPrompt: string;
  selectedStyle: string;
  seed: number;
  referenceStrength: number;
  highQuality: boolean;
  status: string;
  originalId?: string;
  subject_prompt?: string;
  thumbnail_storage_path?: string;
  viewAngle?: number;
  userId?: string; // Track which user created this queue item
}

interface GenerationPair {
  id: string;
  fastGeneration?: GenerationRecord;
  hqGeneration?: GenerationRecord;
  canUpgrade: boolean;
  isUpgrading: boolean;
  currentTextures: {
    diffuse: string | null;
    normal: string | null;
    height: string | null;
    thumbnail: string | null;
  };
}

interface ModelSettings {
  cameraDistance: number;
  objectScale: number;
  objectPosition: { x: number; y: number; z: number };
  objectRotation: { x: number; y: number; z: number }; // Rotation in radians
  materialSettings: {
    metalness: number;
    roughness: number;
    normalScale: number;
    displacementScale: number;
  };
  lastUpdated: string; // ISO timestamp
}

interface AppState {
  modelUrl: string | null;
  modelId: string | null;
  modelFileName: string | null; // For ComfyUI workflow
  referenceImageUrl: string | null; // For UI preview
  referenceImageName: string | null; // For ComfyUI workflow
  environment: string;
  backgroundColor: string;
  showEnvironmentBackground: boolean;
  theme: 'light' | 'dark';
  materialSettings: {
    metalness: number;
    roughness: number;
    normalScale: number;
    displacementScale: number;
  };
  cameraDistance: number;
  objectScale: number;
  objectPosition: { x: number; y: number; z: number };
  objectRotation: { x: number; y: number; z: number }; // Rotation in radians
  promptPanelHeight: number;
  resetCameraTrigger: number; // Increment to trigger camera reset
  defaultSettings: {
    cameraDistance: number;
    objectScale: number;
    materialSettings: {
      metalness: number;
      roughness: number;
      normalScale: number;
      displacementScale: number;
    };
  };
  seed: number;
  isLoading: boolean;
  mainPrompt: string; // Single prompt field
  selectedStyle: string; // Style dropdown selection
  referenceStrength: number; // Reference influence (0.0-1.0)
  highQuality: boolean; // Toggle for second upscaler
  viewAngle: number; // View selection (1-6) for depth map generation
  showDepthPreview: boolean; // Whether to show depth map preview before full generation
  depthPreviewUrl: string | null; // URL of the depth map preview image
  modelUpDirection: '+Y' | '-Y' | '+Z' | '-Z' | '+X' | '-X'; // Up direction for GLB orientation
  // Animation controls
  hasAnimations: boolean; // Whether current model has animations
  animations: any[] | null; // Raw animation objects from GLB
  animationNames: string[]; // Available animation names
  currentAnimation: string | null; // Currently selected animation
  animationTime: number; // Current animation time (0-1)
  isAnimationPlaying: boolean; // Whether animation is playing
  animationDuration: number; // Duration of current animation in seconds
  animationPlaybackSpeed: number; // Animation playback speed multiplier (0.5x, 1x, 2x, etc.)
  showAnimationTimeline: boolean; // Whether to show animation timeline
  generatedTextures: {
    diffuse: string | null;
    normal: string | null;
    height: string | null;
    thumbnail: string | null;
    depth_preview: string | null;
    front_preview: string | null;
  };
  currentGeneration: GenerationPair | null; // Current generation pair
  generationQueue: QueueItem[]; // Background queue (both generations and upgrades)
  queueCount: number; // Number of items in queue
  comfyUIQueue: any | null; // ComfyUI server queue status
  isBottomBarOpen: boolean; // Bottom control bar visibility
  isSettingsOpen: boolean; // Settings panel visibility
  isGalleryOpen: boolean;
  isAssetPreviewOpen: boolean; // Asset preview panel visibility
  generations: GenerationRecord[]; // Holds the list of past generations
  modelPresets: ModelPreset[]; // Available model presets
  activeModelPresetId: string; // Currently selected model preset
  isAdminMode: boolean; // Admin mode for advanced controls
  userEmail: string | null; // Current user email
  modelSettings: Map<string, ModelSettings>; // Settings per model filename
  setModelUrl: (url: string | null) => void;
  setModelId: (id: string | null) => void;
  setModelFileName: (name: string | null) => void;
  setReferenceImageUrl: (url: string | null) => void;
  setReferenceImageName: (name: string | null) => void;
  setEnvironment: (env: string) => void;
  setBackgroundColor: (color: string) => void;
  setShowEnvironmentBackground: (show: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setMaterialSettings: (settings: Partial<{ metalness: number; roughness: number; normalScale: number; displacementScale: number; }>) => void;
  setCameraDistance: (distance: number) => void;
  setObjectScale: (scale: number) => void;
  setObjectPosition: (position: { x: number; y: number; z: number }) => void;
  setObjectRotation: (rotation: { x: number; y: number; z: number }) => void;
  setPromptPanelHeight: (height: number) => void;
  resetCamera: () => void;
  autoFrameModel: () => void;
  resetModelPosition: () => void;
  setAsDefaults: () => void;
  resetToDefaults: () => void;
  setSeed: (seed: number) => void;
  setIsLoading: (loading: boolean) => void;
  setMainPrompt: (prompt: string) => void;
  setSelectedStyle: (style: string) => void;
  setReferenceStrength: (strength: number) => void;
  setHighQuality: (quality: boolean) => void;
  setViewAngle: (angle: number) => void;
  setShowDepthPreview: (show: boolean) => void;
  setDepthPreviewUrl: (url: string | null) => void;
  setModelUpDirection: (direction: '+Y' | '-Y' | '+Z' | '-Z' | '+X' | '-X') => void;
  // Animation actions
  setHasAnimations: (hasAnimations: boolean) => void;
  setAnimations: (animations: any[] | null) => void;
  setAnimationNames: (names: string[]) => void;
  setCurrentAnimation: (name: string | null) => void;
  setAnimationTime: (time: number) => void;
  setIsAnimationPlaying: (playing: boolean) => void;
  setAnimationDuration: (duration: number) => void;
  setAnimationPlaybackSpeed: (speed: number) => void;
  setShowAnimationTimeline: (show: boolean) => void;
  setGeneratedTextures: (textures: Partial<TextureOutput>) => void;
  setCurrentGeneration: (generation: GenerationPair | null) => void;
  setCanUpgrade: (canUpgrade: boolean) => void;
  setIsUpgrading: (isUpgrading: boolean) => void;
  addToQueue: (item: QueueItem) => void;
  removeFromQueue: (itemId: string) => void;
  setComfyUIQueue: (queue: any | null) => void;
  toggleGallery: () => void;
  toggleBottomBar: () => void;
  toggleSettings: () => void;
  toggleAssetPreview: () => void;
  setAssetPreviewOpen: (open: boolean) => void;
  setGenerations: (generations: GenerationRecord[]) => void;
  loadGeneration: (generation: GenerationRecord) => void;
  setModelPresets: (presets: ModelPreset[]) => void;
  setActiveModelPreset: (presetId: string) => void;
  addModelPreset: (preset: ModelPreset) => void;
  updateModelPreset: (presetId: string, updates: Partial<ModelPreset>) => void;
  deleteModelPreset: (presetId: string) => void;
  setUserEmail: (email: string | null) => void;
  setAdminMode: (isAdmin: boolean) => void;
  saveModelSettings: (modelFileName: string) => Promise<boolean>;
  loadModelSettings: (modelFileName: string) => Promise<boolean>;
  hasModelSettings: (modelFileName: string) => Promise<boolean>;
}

export const useAppStore = create<AppState>((set: any) => ({
  modelUrl: null,
  modelId: null,
  modelFileName: null,
  referenceImageUrl: null,
  referenceImageName: null,
  environment: 'venice_sunset_1k.hdr',
  backgroundColor: '#f3f4f6', // Default light gray
  showEnvironmentBackground: false, // Use solid color by default
  theme: 'light',
  materialSettings: {
    metalness: 0.0,
    roughness: 1.0,
    normalScale: 0.3,
    displacementScale: 0.0,
  },
  cameraDistance: 5,
  objectScale: 1,
  objectPosition: { x: 0, y: 0, z: 0 },
  objectRotation: { x: 0, y: 0, z: 0 }, // No rotation by default
  promptPanelHeight: 180, // Default height
  resetCameraTrigger: 0,
  defaultSettings: {
    cameraDistance: 5,
    objectScale: 1,
    materialSettings: {
      metalness: 0.0,
      roughness: 1.0,
      normalScale: 0.3,
      displacementScale: 0.0,
    }
  },
  seed: Math.floor(Math.random() * 1000000),
  isLoading: false,
  mainPrompt: "brown bomber jacket",
  selectedStyle: "photorealistic",
  referenceStrength: 0.7,
  highQuality: false, // Default to fast mode for better UX
  viewAngle: 1, // Default to front view
      showDepthPreview: true, // Enable depth preview by default
    depthPreviewUrl: null, // No depth preview initially
    modelUpDirection: '+Y', // Default to +Y-up (standard for most 3D software)
    // Animation defaults
  hasAnimations: false,
  animations: null,
  animationNames: [],
  currentAnimation: null,
  animationTime: 0,
  isAnimationPlaying: false,
  animationDuration: 0,
  animationPlaybackSpeed: 1, // Default 1x speed
  showAnimationTimeline: false,
  generatedTextures: {
    diffuse: null,
    normal: null,
    height: null,
    thumbnail: null,
    depth_preview: null,
    front_preview: null,
  },
  currentGeneration: null,
  generationQueue: [],
  queueCount: 0,
  comfyUIQueue: null,
  isBottomBarOpen: false, // Start closed - user opens when needed
  isSettingsOpen: false,
  isGalleryOpen: false,
  isAssetPreviewOpen: false,
  generations: [],
  modelPresets: defaultModelPresets,
  activeModelPresetId: 'standard-juggernaut',
  isAdminMode: false,
  userEmail: null,
  modelSettings: new Map<string, ModelSettings>(),
  setModelUrl: (url) => set({ modelUrl: url }),
  setModelId: (id) => set({ modelId: id }),
  setModelFileName: (name) => set({ modelFileName: name }),
  setReferenceImageUrl: (url) => set({ referenceImageUrl: url }),
  setReferenceImageName: (name) => set({ referenceImageName: name }),
  setEnvironment: (env) => set({ environment: env }),
  setBackgroundColor: (color) => set({ backgroundColor: color }),
  setShowEnvironmentBackground: (show) => set({ showEnvironmentBackground: show }),
  setTheme: (theme) => set({ theme }),
  setMaterialSettings: (settings) => set((state: any) => ({ materialSettings: { ...state.materialSettings, ...settings } })),
  setCameraDistance: (distance) => set({ cameraDistance: distance }),
  setObjectScale: (scale) => set({ objectScale: scale }),
  setObjectPosition: (position) => set({ objectPosition: position }),
  setObjectRotation: (rotation) => set({ objectRotation: rotation }),
  setPromptPanelHeight: (height) => set({ promptPanelHeight: height }),
  resetCamera: () => set((state: any) => ({ 
    cameraDistance: 5, 
    objectScale: 1, 
    resetCameraTrigger: state.resetCameraTrigger + 1 
  })),
  
  autoFrameModel: () => {
    console.log("🎯 Store autoFrameModel called - this should be replaced by Model component");
    // This will be replaced by the Model component implementation
    set((state: any) => ({ 
      resetCameraTrigger: state.resetCameraTrigger + 1 
    }));
  },
  
  resetModelPosition: () => {
    console.log("🔄 Store resetModelPosition called - this should be replaced by Model component");
    // This will be replaced by the Model component implementation
    set((state: any) => ({ 
      objectScale: 1,
      cameraDistance: 5,
      resetCameraTrigger: state.resetCameraTrigger + 1 
    }));
  },
  setAsDefaults: () => set((state: any) => ({
    defaultSettings: {
      cameraDistance: state.cameraDistance,
      objectScale: state.objectScale,
      materialSettings: { ...state.materialSettings }
    }
  })),
  resetToDefaults: () => set((state: any) => ({
    cameraDistance: state.defaultSettings.cameraDistance,
    objectScale: state.defaultSettings.objectScale,
    materialSettings: { ...state.defaultSettings.materialSettings },
    objectPosition: { x: 0, y: 0, z: 0 },
    objectRotation: { x: 0, y: 0, z: 0 },
    resetCameraTrigger: state.resetCameraTrigger + 1
  })),
  setSeed: (seed) => set({ seed }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setMainPrompt: (prompt) => set({ mainPrompt: prompt }),
  setSelectedStyle: (style) => set({ selectedStyle: style }),
  setReferenceStrength: (strength) => set({ referenceStrength: strength }),
  setHighQuality: (quality) => set({ highQuality: quality }),
  setViewAngle: (angle) => set({ viewAngle: angle }),
      setShowDepthPreview: (show) => set({ showDepthPreview: show }),
    setDepthPreviewUrl: (url) => set({ depthPreviewUrl: url }),
    setModelUpDirection: (direction) => set({ modelUpDirection: direction }),
    // Animation actions
  setHasAnimations: (hasAnimations) => set({ hasAnimations }),
  setAnimations: (animations) => set({ animations }),
  setAnimationNames: (names) => set({ animationNames: names }),
  setCurrentAnimation: (name) => set({ currentAnimation: name }),
  setAnimationTime: (time) => set({ animationTime: time }),
  setIsAnimationPlaying: (playing) => set({ isAnimationPlaying: playing }),
  setAnimationDuration: (duration) => set({ animationDuration: duration }),
  setAnimationPlaybackSpeed: (speed) => set({ animationPlaybackSpeed: speed }),
  setShowAnimationTimeline: (show) => set({ showAnimationTimeline: show }),
  setGeneratedTextures: (textures) => set((state: any) => ({ generatedTextures: { ...state.generatedTextures, ...textures } })),
  setCurrentGeneration: (generation) => set({ currentGeneration: generation }),
  setCanUpgrade: (canUpgrade) => set((state: any) => ({ 
    currentGeneration: state.currentGeneration ? { ...state.currentGeneration, canUpgrade } : null 
  })),
  setIsUpgrading: (isUpgrading) => set((state: any) => ({ 
    currentGeneration: state.currentGeneration ? { ...state.currentGeneration, isUpgrading } : null 
  })),
  addToQueue: (item) => set((state: any) => ({ 
    generationQueue: [...state.generationQueue, { ...item, id: item.id || Date.now().toString() }],
    queueCount: state.queueCount + 1
  })),
  removeFromQueue: (itemId) => set((state: any) => ({ 
    generationQueue: state.generationQueue.filter((item: any) => item.id !== itemId && item.originalId !== itemId),
    queueCount: Math.max(0, state.queueCount - 1)
  })),
  setComfyUIQueue: (queue: any | null) => set({ comfyUIQueue: queue }),
  toggleGallery: () => set((state: any) => ({ isGalleryOpen: !state.isGalleryOpen })),
  toggleBottomBar: () => set((state: any) => ({ isBottomBarOpen: !state.isBottomBarOpen })),
  toggleSettings: () => set((state: any) => ({ isSettingsOpen: !state.isSettingsOpen })),
  toggleAssetPreview: () => set((state: any) => ({ isAssetPreviewOpen: !state.isAssetPreviewOpen })),
  setAssetPreviewOpen: (open) => set({ isAssetPreviewOpen: open }),
  setGenerations: (generations) => set({ generations }),
  loadGeneration: (generation) => {
    // Extract filename from reference image URL for ComfyUI
    let referenceImageName = null;
    if (generation.reference_image_path) {
      // For Supabase URLs, extract just the filename from the path
      const urlParts = generation.reference_image_path.split('/');
      const encodedFilename = urlParts[urlParts.length - 1];
      // Decode URL-encoded characters (like %20 for spaces)
      referenceImageName = decodeURIComponent(encodedFilename);
      console.log('Extracted reference image name:', referenceImageName);
    }
    
    // Debug model loading
    console.log('Loading generation:', {
      hasModel: !!generation.model,
      storagePath: generation.model?.storage_path,
      modelName: generation.model?.name,
      modelId: generation.model_id
    });
    
    // Extract ComfyUI filename from storage path (the UUID-filename part)
    let modelFileName = null;
    if (generation.model?.storage_path) {
      const pathParts = generation.model.storage_path.split('/');
      modelFileName = pathParts[pathParts.length - 1]; // Gets "uuid-eisenhower_jacket.glb"
      console.log('Extracted model filename for ComfyUI:', modelFileName);
    }
    
    set({
      modelUrl: generation.model?.storage_path ? `https://bnstnamdtlveluavjkcy.supabase.co/storage/v1/object/public/models/${generation.model.storage_path}` : null,
      modelId: generation.model_id,
      modelFileName: modelFileName,
      referenceImageUrl: generation.reference_image_path,
      referenceImageName: referenceImageName,
      mainPrompt: generation.subject_prompt || "brown bomber jacket",
      selectedStyle: generation.style_prompt || "photorealistic",
      seed: generation.seed,
      generatedTextures: {
        diffuse: generation.diffuse_storage_path || null,
        normal: generation.normal_storage_path || null,
        height: generation.height_storage_path || null,
        thumbnail: generation.thumbnail_storage_path || null,
        depth_preview: generation.depth_preview_storage_path || null,
        front_preview: generation.front_preview_storage_path || null,
      }
    });
    
    // Auto-load model settings if available
    if (modelFileName) {
      const { loadModelSettings } = useAppStore.getState();
      loadModelSettings(modelFileName).then((loaded: any) => {
        if (loaded) {
          console.log(`🎯 Auto-loaded settings for model: ${modelFileName}`);
        }
      }).catch((error: any) => {
        console.error('Error auto-loading model settings:', error);
      });
    }
  },
  setModelPresets: (presets) => set({ modelPresets: presets }),
  setActiveModelPreset: (presetId) => set((state: any) => ({
    activeModelPresetId: presetId,
    modelPresets: state.modelPresets.map((preset: any) => ({
      ...preset,
      isActive: preset.id === presetId
    }))
  })),
  addModelPreset: (preset) => set((state: any) => ({
    modelPresets: [...state.modelPresets, preset]
  })),
  updateModelPreset: (presetId, updates) => set((state: any) => ({
    modelPresets: state.modelPresets.map((preset: any) => 
      preset.id === presetId 
        ? { ...preset, ...updates, lastModified: new Date().toISOString() }
        : preset
    )
  })),
  deleteModelPreset: (presetId) => set((state: any) => ({
    modelPresets: state.modelPresets.filter((preset: any) => preset.id !== presetId)
  })),
  setUserEmail: (email) => set({ 
    userEmail: email,
    isAdminMode: email === 'ddmaluf@gmail.com' // Auto-enable admin mode for your email
  }),
  setAdminMode: (isAdmin) => set({ isAdminMode: isAdmin }),
  
  // Model-specific settings management
  saveModelSettings: async (modelFileName: string): Promise<boolean> => {
    const state = useAppStore.getState();
    if (!modelFileName) return false;
    
    const settings = {
      modelFileName,
      cameraDistance: state.cameraDistance,
      objectScale: state.objectScale,
      objectPosition: { ...state.objectPosition },
      objectRotation: { ...state.objectRotation },
      materialSettings: { ...state.materialSettings }
    };
    
    try {
      const response = await fetch('/api/model-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update local cache
        const newModelSettings = new Map(state.modelSettings);
        newModelSettings.set(modelFileName, {
          cameraDistance: state.cameraDistance,
          objectScale: state.objectScale,
          objectPosition: { ...state.objectPosition },
          objectRotation: { ...state.objectRotation },
          materialSettings: { ...state.materialSettings },
          lastUpdated: new Date().toISOString()
        });
        
        set({ modelSettings: newModelSettings as Map<string, ModelSettings> });
        console.log(`💾 Saved settings for model: ${modelFileName}`);
        return true;
      } else {
        console.error('Failed to save model settings:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error saving model settings:', error);
      return false;
    }
  },
  
  loadModelSettings: async (modelFileName) => {
    const state = useAppStore.getState();
    if (!modelFileName) return false;
    
    // Check local cache first
    if (state.modelSettings.has(modelFileName)) {
      const settings = state.modelSettings.get(modelFileName)!;
      
      set({
        cameraDistance: settings.cameraDistance,
        objectScale: settings.objectScale,
        objectPosition: { ...settings.objectPosition },
        objectRotation: { ...settings.objectRotation },
        materialSettings: { ...settings.materialSettings },
        resetCameraTrigger: state.resetCameraTrigger + 1
      });
      
      console.log(`📂 Loaded cached settings for model: ${modelFileName}`);
      return true;
    }
    
    // Fetch from database
    try {
      const response = await fetch(`/api/model-settings?model_filename=${encodeURIComponent(modelFileName)}`);
      const result = await response.json();
      
      if (result.success && result.settings) {
        const dbSettings = result.settings;
        
        const settings: ModelSettings = {
          cameraDistance: dbSettings.camera_distance,
          objectScale: dbSettings.object_scale,
          objectPosition: {
            x: dbSettings.object_position_x,
            y: dbSettings.object_position_y,
            z: dbSettings.object_position_z
          },
          objectRotation: {
            x: dbSettings.object_rotation_x || 0,
            y: dbSettings.object_rotation_y || 0,
            z: dbSettings.object_rotation_z || 0
          },
          materialSettings: {
            metalness: dbSettings.material_metalness,
            roughness: dbSettings.material_roughness,
            normalScale: dbSettings.material_normal_scale,
            displacementScale: dbSettings.material_displacement_scale
          },
          lastUpdated: dbSettings.updated_at
        };
        
        // Update local cache
        const newModelSettings = new Map(state.modelSettings);
        newModelSettings.set(modelFileName, settings);
        
        set({
          modelSettings: newModelSettings as Map<string, ModelSettings>,
          cameraDistance: settings.cameraDistance,
          objectScale: settings.objectScale,
          objectPosition: { ...settings.objectPosition },
          objectRotation: { ...settings.objectRotation },
          materialSettings: { ...settings.materialSettings },
          resetCameraTrigger: state.resetCameraTrigger + 1
        });
        
        console.log(`📂 Loaded database settings for model: ${modelFileName}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error loading model settings:', error);
      return false;
    }
  },
  
  hasModelSettings: async (modelFileName: string): Promise<boolean> => {
    const state: any = useAppStore.getState();
    if (!modelFileName) return false;
    
    // Check local cache first
    if (state.modelSettings.has(modelFileName)) {
      return true;
    }
    
    // Check database
    try {
      const response: any = await fetch(`/api/model-settings?model_filename=${encodeURIComponent(modelFileName)}`);
      const result: any = await response.json();
      return result.success && result.settings !== null;
    } catch (error) {
      console.error('Error checking model settings:', error);
      return false;
    }
  },
}));