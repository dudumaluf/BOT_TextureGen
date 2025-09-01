import { create } from 'zustand'

interface GenerationPair {
  id: string;
  fastGeneration?: any;
  hqGeneration?: any;
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
  seed: number;
  isLoading: boolean;
  stylePrompt: string;
  subjectPrompt: string;
  highQuality: boolean; // Toggle for second upscaler
  generatedTextures: {
    diffuse: string | null;
    normal: string | null;
    height: string | null;
    thumbnail: string | null;
  };
  currentGeneration: GenerationPair | null; // Current generation pair
  generationQueue: any[]; // Background queue (both generations and upgrades)
  queueCount: number; // Number of items in queue
  isBottomBarOpen: boolean; // Bottom control bar visibility
  isGalleryOpen: boolean;
  generations: any[]; // Holds the list of past generations
  setModelUrl: (url: string | null) => void;
  setModelId: (id: string | null) => void;
  setModelFileName: (name: string | null) => void;
  setReferenceImageUrl: (url: string | null) => void;
  setReferenceImageName: (name: string | null) => void;
  setEnvironment: (env: string) => void;
  setSeed: (seed: number) => void;
  setIsLoading: (loading: boolean) => void;
  setStylePrompt: (prompt: string) => void;
  setSubjectPrompt: (prompt: string) => void;
  setHighQuality: (quality: boolean) => void;
  setGeneratedTextures: (textures: Partial<TextureOutput>) => void;
  setCurrentGeneration: (generation: GenerationPair | null) => void;
  setCanUpgrade: (canUpgrade: boolean) => void;
  setIsUpgrading: (isUpgrading: boolean) => void;
  addToQueue: (item: any) => void;
  removeFromQueue: (itemId: string) => void;
  toggleGallery: () => void;
  toggleBottomBar: () => void;
  setGenerations: (generations: any[]) => void;
  loadGeneration: (generation: any) => void;
}

export const useAppStore = create<AppState>((set) => ({
  modelUrl: null,
  modelId: null,
  modelFileName: null,
  referenceImageUrl: null,
  referenceImageName: null,
  environment: 'venice_sunset_1k.hdr',
  seed: Math.floor(Math.random() * 1000000),
  isLoading: false,
  stylePrompt: "ultra-realistic photography, high-resolution detail, accurate color rendering, sharp fabric texture, visible stitching, natural lighting, smooth gradients, balanced exposure, crisp edges, noise-free, true-to-life realism",
  subjectPrompt: "brown bomber jacket, displayed front-facing, centered in frame, straight-on view, front zipper closure, ribbed collar cuffs and hem, two diagonal side pockets, long sleeves, casual menswear outerwear",
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
  isGalleryOpen: false,
  generations: [],
  setModelUrl: (url) => set({ modelUrl: url }),
  setModelId: (id) => set({ modelId: id }),
  setModelFileName: (name) => set({ modelFileName: name }),
  setReferenceImageUrl: (url) => set({ referenceImageUrl: url }),
  setReferenceImageName: (name) => set({ referenceImageName: name }),
  setEnvironment: (env) => set({ environment: env }),
  setSeed: (seed) => set({ seed }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setStylePrompt: (prompt) => set({ stylePrompt: prompt }),
  setSubjectPrompt: (prompt) => set({ subjectPrompt: prompt }),
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
  setGenerations: (generations) => set({ generations }),
  loadGeneration: (generation) => set({
    modelUrl: generation.model?.storage_path ? `https://bnstnamdtlveluavjkcy.supabase.co/storage/v1/object/public/models/${generation.model.storage_path}` : null,
    modelId: generation.model_id,
    modelFileName: generation.model?.name || null,
    referenceImageUrl: generation.reference_image_path,
    stylePrompt: generation.style_prompt,
    subjectPrompt: generation.subject_prompt,
    seed: generation.seed,
    generatedTextures: {
      diffuse: generation.diffuse_storage_path,
      normal: generation.normal_storage_path,
      height: generation.height_storage_path,
      thumbnail: generation.thumbnail_storage_path,
    }
  }),
}));