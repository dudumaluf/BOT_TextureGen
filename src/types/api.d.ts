// API response types for better type safety

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface GenerationApiResponse extends ApiResponse {
  generationId?: string;
}

export interface UploadApiResponse extends ApiResponse {
  publicUrl?: string;
  modelId?: string;
  comfyFileName?: string;
}

export interface ComfyUIApiResponse extends ApiResponse {
  queue?: any;
  stats?: any;
  promptId?: string;
}

// Request body types
export interface GenerateRequest {
  modelFileName: string;
  modelId: string;
  referenceImageUrl: string;
  referenceImageName: string;
  mainPrompt: string;
  selectedStyle: string;
  seed: number;
  highQuality: boolean;
  referenceStrength?: number;
  modelPresetId?: string;
  modelPresetData?: any;
  viewAngle?: number;
}

export interface ComfyUIControlRequest {
  action: 'interrupt' | 'clear' | 'delete';
  promptId?: string;
}

// Supabase table types
export interface GenerationRow {
  id: string;
  user_id: string;
  model_id: string;
  style_prompt: string;
  subject_prompt: string;
  reference_image_path: string;
  seed: number;
  status: 'processing' | 'completed' | 'failed';
  high_quality: boolean;
  diffuse_storage_path?: string;
  normal_storage_path?: string;
  height_storage_path?: string;
  thumbnail_storage_path?: string;
  depth_preview_storage_path?: string;
  front_preview_storage_path?: string;
  comfyui_prompt_id?: string;
  error_message?: string;
  created_at: string;
}

export interface ModelRow {
  id: string;
  name: string;
  storage_path: string;
  user_id: string;
  created_at: string;
}

export interface ModelSettingsRow {
  id: string;
  user_id: string;
  model_filename: string;
  camera_distance: number;
  object_scale: number;
  object_position_x: number;
  object_position_y: number;
  object_position_z: number;
  object_rotation_x: number;
  object_rotation_y: number;
  object_rotation_z: number;
  material_metalness: number;
  material_roughness: number;
  material_normal_scale: number;
  material_displacement_scale: number;
  created_at: string;
  updated_at: string;
}
