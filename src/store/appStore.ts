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
  model?: ModelRecord; // Relational data from Supabase joins
}

export interface QueueItem {
  id: string;
  type: 'generation' | 'upgrade';
  queueType: 'continuous' | 'batch'; // New field to distinguish queue types
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
  isBottomBarOpen: boolean; // Bottom control bar visibility
  isSettingsOpen: boolean; // Settings panel visibility
  isGalleryOpen: boolean;
  generations: GenerationRecord[]; // Holds the list of past generations
  modelPresets: ModelPreset[]; // Available model presets
  activeModelPresetId: string; // Currently selected model preset
  isAdminMode: boolean; // Admin mode for advanced controls
  userEmail: string | null; // Current user email
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
  setPromptPanelHeight: (height: number) => void;
  resetCamera: () => void;
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
  addToContinuousQueue: (item: Omit<QueueItem, 'queueType'>) => void;
  addToBatchQueue: (item: Omit<QueueItem, 'queueType'>) => void;
  removeFromQueue: (itemId: string) => void;
  toggleGallery: () => void;
  toggleBottomBar: () => void;
  toggleSettings: () => void;
  setGenerations: (generations: GenerationRecord[]) => void;
  loadGeneration: (generation: GenerationRecord) => void;
  setModelPresets: (presets: ModelPreset[]) => void;
  setActiveModelPreset: (presetId: string) => void;
  addModelPreset: (preset: ModelPreset) => void;
  updateModelPreset: (presetId: string, updates: Partial<ModelPreset>) => void;
  deleteModelPreset: (presetId: string) => void;
  setUserEmail: (email: string | null) => void;
  setAdminMode: (isAdmin: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
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
  isBottomBarOpen: true, // Start open for initial setup
  isSettingsOpen: false,
  isGalleryOpen: false,
  generations: [],
  modelPresets: defaultModelPresets,
  activeModelPresetId: 'standard-juggernaut',
  isAdminMode: false,
  userEmail: null,
  setModelUrl: (url) => set({ modelUrl: url }),
  setModelId: (id) => set({ modelId: id }),
  setModelFileName: (name) => set({ modelFileName: name }),
  setReferenceImageUrl: (url) => set({ referenceImageUrl: url }),
  setReferenceImageName: (name) => set({ referenceImageName: name }),
  setEnvironment: (env) => set({ environment: env }),
  setBackgroundColor: (color) => set({ backgroundColor: color }),
  setShowEnvironmentBackground: (show) => set({ showEnvironmentBackground: show }),
  setTheme: (theme) => set({ theme }),
  setMaterialSettings: (settings) => set((state) => ({ materialSettings: { ...state.materialSettings, ...settings } })),
  setCameraDistance: (distance) => set({ cameraDistance: distance }),
  setObjectScale: (scale) => set({ objectScale: scale }),
  setPromptPanelHeight: (height) => set({ promptPanelHeight: height }),
  resetCamera: () => set((state) => ({ 
    cameraDistance: 5, 
    objectScale: 1, 
    resetCameraTrigger: state.resetCameraTrigger + 1 
  })),
  setAsDefaults: () => set((state) => ({
    defaultSettings: {
      cameraDistance: state.cameraDistance,
      objectScale: state.objectScale,
      materialSettings: { ...state.materialSettings }
    }
  })),
  resetToDefaults: () => set((state) => ({
    cameraDistance: state.defaultSettings.cameraDistance,
    objectScale: state.defaultSettings.objectScale,
    materialSettings: { ...state.defaultSettings.materialSettings }
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
  setGeneratedTextures: (textures) => set((state) => ({ generatedTextures: { ...state.generatedTextures, ...textures } })),
  setCurrentGeneration: (generation) => set({ currentGeneration: generation }),
  setCanUpgrade: (canUpgrade) => set((state) => ({ 
    currentGeneration: state.currentGeneration ? { ...state.currentGeneration, canUpgrade } : null 
  })),
  setIsUpgrading: (isUpgrading) => set((state) => ({ 
    currentGeneration: state.currentGeneration ? { ...state.currentGeneration, isUpgrading } : null 
  })),
  addToQueue: (item) => set((state) => ({ 
    generationQueue: [...state.generationQueue, { ...item, id: item.id || Date.now().toString() }],
    queueCount: state.queueCount + 1
  })),
  addToContinuousQueue: (item) => set((state) => ({ 
    generationQueue: [...state.generationQueue, { ...item, queueType: 'continuous', id: item.id || Date.now().toString() }],
    queueCount: state.queueCount + 1
  })),
  addToBatchQueue: (item) => set((state) => ({ 
    generationQueue: [...state.generationQueue, { ...item, queueType: 'batch', id: item.id || Date.now().toString() }],
    queueCount: state.queueCount + 1
  })),
  removeFromQueue: (itemId) => set((state) => ({ 
    generationQueue: state.generationQueue.filter(item => item.id !== itemId && item.originalId !== itemId),
    queueCount: Math.max(0, state.queueCount - 1)
  })),
  toggleGallery: () => set((state) => ({ isGalleryOpen: !state.isGalleryOpen })),
  toggleBottomBar: () => set((state) => ({ isBottomBarOpen: !state.isBottomBarOpen })),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
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
  },
  setModelPresets: (presets) => set({ modelPresets: presets }),
  setActiveModelPreset: (presetId) => set((state) => ({
    activeModelPresetId: presetId,
    modelPresets: state.modelPresets.map(preset => ({
      ...preset,
      isActive: preset.id === presetId
    }))
  })),
  addModelPreset: (preset) => set((state) => ({
    modelPresets: [...state.modelPresets, preset]
  })),
  updateModelPreset: (presetId, updates) => set((state) => ({
    modelPresets: state.modelPresets.map(preset => 
      preset.id === presetId 
        ? { ...preset, ...updates, lastModified: new Date().toISOString() }
        : preset
    )
  })),
  deleteModelPreset: (presetId) => set((state) => ({
    modelPresets: state.modelPresets.filter(preset => preset.id !== presetId)
  })),
  setUserEmail: (email) => set({ 
    userEmail: email,
    isAdminMode: email === 'ddmaluf@gmail.com' // Auto-enable admin mode for your email
  }),
  setAdminMode: (isAdmin) => set({ isAdminMode: isAdmin }),
}));