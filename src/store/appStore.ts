import { create } from 'zustand'

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
  generatedTextures: {
    diffuse: string | null;
    normal: string | null;
    height: string | null;
    thumbnail: string | null;
  };
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
  setGeneratedTextures: (textures: Partial<TextureOutput>) => void;
  toggleGallery: () => void;
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
  generatedTextures: {
    diffuse: null,
    normal: null,
    height: null,
    thumbnail: null,
  },
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
  setGeneratedTextures: (textures) => set((state) => ({ generatedTextures: { ...state.generatedTextures, ...textures } })),
  toggleGallery: () => set((state) => ({ isGalleryOpen: !state.isGalleryOpen })),
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
