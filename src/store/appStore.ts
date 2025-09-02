import { create } from 'zustand'

interface TextureOutput {
  diffuse: string | null;
  normal: string | null;
  height: string | null;
  thumbnail: string | null;
}

interface GenerationRecord {
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
  high_quality?: boolean;
  created_at?: string;
}

interface QueueItem {
  id: string;
  type: 'generation' | 'upgrade';
  modelFileName: string | null;
  modelId: string | null;
  referenceImageUrl: string;
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
  generatedTextures: {
    diffuse: string | null;
    normal: string | null;
    height: string | null;
    thumbnail: string | null;
  };
  currentGeneration: GenerationPair | null; // Current generation pair
  generationQueue: QueueItem[]; // Background queue (both generations and upgrades)
  queueCount: number; // Number of items in queue
  isBottomBarOpen: boolean; // Bottom control bar visibility
  isSettingsOpen: boolean; // Settings panel visibility
  isGalleryOpen: boolean;
  generations: GenerationRecord[]; // Holds the list of past generations
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
  setAsDefaults: () => void;
  resetToDefaults: () => void;
  setSeed: (seed: number) => void;
  setIsLoading: (loading: boolean) => void;
  setMainPrompt: (prompt: string) => void;
  setSelectedStyle: (style: string) => void;
  setReferenceStrength: (strength: number) => void;
  setHighQuality: (quality: boolean) => void;
  setGeneratedTextures: (textures: Partial<TextureOutput>) => void;
  setCurrentGeneration: (generation: GenerationPair | null) => void;
  setCanUpgrade: (canUpgrade: boolean) => void;
  setIsUpgrading: (isUpgrading: boolean) => void;
  addToQueue: (item: QueueItem) => void;
  removeFromQueue: (itemId: string) => void;
  toggleGallery: () => void;
  toggleBottomBar: () => void;
  toggleSettings: () => void;
  setGenerations: (generations: GenerationRecord[]) => void;
  loadGeneration: (generation: GenerationRecord) => void;
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
    normalScale: 1.0,
    displacementScale: 0.1,
  },
  cameraDistance: 5,
  objectScale: 1,
  promptPanelHeight: 180, // Default height
  defaultSettings: {
    cameraDistance: 5,
    objectScale: 1,
    materialSettings: {
      metalness: 0.0,
      roughness: 1.0,
      normalScale: 1.0,
      displacementScale: 0.1,
    }
  },
  seed: Math.floor(Math.random() * 1000000),
  isLoading: false,
  mainPrompt: "brown bomber jacket",
  selectedStyle: "photorealistic",
  referenceStrength: 0.7,
  highQuality: false, // Default to fast mode for better UX
  generatedTextures: {
    diffuse: null,
    normal: null,
    height: null,
    thumbnail: null,
  },
  currentGeneration: null,
  generationQueue: [],
  queueCount: 0,
  isBottomBarOpen: true, // Start open for initial setup
  isSettingsOpen: false,
  isGalleryOpen: false,
  generations: [],
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
      referenceImageName = urlParts[urlParts.length - 1];
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
        diffuse: generation.diffuse_storage_path,
        normal: generation.normal_storage_path,
        height: generation.height_storage_path,
        thumbnail: generation.thumbnail_storage_path,
      }
    });
  },
}));