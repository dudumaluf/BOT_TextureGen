// Model preset system for TextureGen
// Allows switching between different AI models with optimized parameters

export interface ModelPreset {
  id: string;
  name: string;
  displayName: string;
  description: string;
  modelPath: string;
  category: 'lightning' | 'standard';
  isActive: boolean;
  
  // KSampler parameters (Node 180)
  ksampler: {
    steps: number;
    cfg: number;
    sampler_name: string;
    scheduler: string;
  };
  
  // First Ultimate SD Upscale parameters (Node 222)
  upscaler1: {
    steps: number;
    cfg: number;
    sampler_name: string;
    scheduler: string;
    upscale_by: number;
    denoise: number;
  };
  
  // Second Ultimate SD Upscale parameters (Node 227)
  upscaler2: {
    steps: number;
    cfg: number;
    sampler_name: string;
    scheduler: string;
    upscale_by: number;
    denoise: number;
  };
  
  // Performance characteristics
  performance: {
    fastModeTime: string;
    qualityModeTime: string;
    vramUsage: string;
    speedRating: 1 | 2 | 3 | 4 | 5; // 1 = slowest, 5 = fastest
    qualityRating: 1 | 2 | 3 | 4 | 5; // 1 = lowest, 5 = highest
  };
  
  // Creation metadata
  createdAt: string;
  lastModified: string;
  isCustom: boolean; // true for user-created presets
}

// Default model presets
export const defaultModelPresets: ModelPreset[] = [
  {
    id: 'standard-juggernaut',
    name: 'juggernautXL_standard',
    displayName: 'Standard Juggernaut',
    description: 'Current working configuration - balanced quality and speed',
    modelPath: 'sdxl\\juggernautXL_juggXIByRundiffusion.safetensors',
    category: 'standard',
    isActive: true,
    
    ksampler: {
      steps: 45,
      cfg: 5.5,
      sampler_name: 'dpmpp_2m',
      scheduler: 'karras'
    },
    
    upscaler1: {
      steps: 30,
      cfg: 4,
      sampler_name: 'dpmpp_2m',
      scheduler: 'karras',
      upscale_by: 4,
      denoise: 0.4
    },
    
    upscaler2: {
      steps: 25,
      cfg: 4,
      sampler_name: 'dpmpp_2m',
      scheduler: 'karras',
      upscale_by: 2,
      denoise: 0.3
    },
    
    performance: {
      fastModeTime: '2-3 min',
      qualityModeTime: '12-15 min',
      vramUsage: '12-16 GB',
      speedRating: 3,
      qualityRating: 5
    },
    
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    isCustom: false
  },
  
  {
    id: 'lightning-realvisxl',
    name: 'realvisxlV50_v50LightningBakedvae',
    displayName: 'RealVisXL v5.0 Lightning',
    description: 'Ultra-fast RealVisXL Lightning model - 6 steps for incredible speed',
    modelPath: 'sdxl\\realvisxlV50_v50LightningBakedvae.safetensors',
    category: 'lightning',
    isActive: false,
    
    ksampler: {
      steps: 6,
      cfg: 2.0,
      sampler_name: 'dpmpp_sde',
      scheduler: 'karras'
    },
    
    upscaler1: {
      steps: 12,
      cfg: 2.0,
      sampler_name: 'dpmpp_sde',
      scheduler: 'karras',
      upscale_by: 4,
      denoise: 0.2
    },
    
    upscaler2: {
      steps: 8,
      cfg: 2.0,
      sampler_name: 'dpmpp_sde',
      scheduler: 'karras',
      upscale_by: 2,
      denoise: 0.15
    },
    
    performance: {
      fastModeTime: '30-60 sec',
      qualityModeTime: '3-5 min',
      vramUsage: '8-12 GB',
      speedRating: 5,
      qualityRating: 4
    },
    
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    isCustom: false
  },

  {
    id: 'turbo-juggernaut',
    name: 'juggernautXL_v9RdphotoLightning',
    displayName: 'Juggernaut Turbo',
    description: 'Fast Juggernaut model with photo-realistic results',
    modelPath: 'sdxl\\juggernautXL_v9RdphotoLightning.safetensors',
    category: 'lightning',
    isActive: false,
    
    ksampler: {
      steps: 8,
      cfg: 2.5,
      sampler_name: 'dpmpp_sde',
      scheduler: 'karras'
    },
    
    upscaler1: {
      steps: 15,
      cfg: 2.5,
      sampler_name: 'dpmpp_sde',
      scheduler: 'karras',
      upscale_by: 4,
      denoise: 0.25
    },
    
    upscaler2: {
      steps: 10,
      cfg: 2.5,
      sampler_name: 'dpmpp_sde',
      scheduler: 'karras',
      upscale_by: 2,
      denoise: 0.2
    },
    
    performance: {
      fastModeTime: '60-90 sec',
      qualityModeTime: '4-7 min',
      vramUsage: '10-14 GB',
      speedRating: 4,
      qualityRating: 5
    },
    
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    isCustom: false
  },

  {
    id: 'protovision-xl',
    name: 'protovisionXLHighFidelity3D',
    displayName: 'ProtoVision XL 3D',
    description: 'Specialized for high-fidelity 3D textures and materials',
    modelPath: 'sdxl\\protovisionXLHighFidelity3D_releaseV660Bakedvae.safetensors',
    category: 'standard',
    isActive: false,
    
    ksampler: {
      steps: 35,
      cfg: 6.0,
      sampler_name: 'dpmpp_2m',
      scheduler: 'karras'
    },
    
    upscaler1: {
      steps: 25,
      cfg: 4.5,
      sampler_name: 'dpmpp_2m',
      scheduler: 'karras',
      upscale_by: 4,
      denoise: 0.35
    },
    
    upscaler2: {
      steps: 20,
      cfg: 4.5,
      sampler_name: 'dpmpp_2m',
      scheduler: 'karras',
      upscale_by: 2,
      denoise: 0.25
    },
    
    performance: {
      fastModeTime: '2-4 min',
      qualityModeTime: '10-14 min',
      vramUsage: '12-18 GB',
      speedRating: 3,
      qualityRating: 5
    },
    
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    isCustom: false
  }
];

// Workflow node mappings for parameter injection
export const workflowNodeMappings = {
  // Main model checkpoint
  checkpoint: '183.inputs.ckpt_name',
  
  // KSampler (Node 180)
  ksampler_steps: '180.inputs.steps',
  ksampler_cfg: '180.inputs.cfg', 
  ksampler_sampler: '180.inputs.sampler_name',
  ksampler_scheduler: '180.inputs.scheduler',
  
  // First Ultimate SD Upscale (Node 222)
  upscaler1_steps: '222.inputs.steps',
  upscaler1_cfg: '222.inputs.cfg',
  upscaler1_sampler: '222.inputs.sampler_name', 
  upscaler1_scheduler: '222.inputs.scheduler',
  upscaler1_upscale_by: '222.inputs.upscale_by',
  upscaler1_denoise: '222.inputs.denoise',
  
  // Second Ultimate SD Upscale (Node 227)
  upscaler2_steps: '227.inputs.steps',
  upscaler2_cfg: '227.inputs.cfg',
  upscaler2_sampler: '227.inputs.sampler_name',
  upscaler2_scheduler: '227.inputs.scheduler', 
  upscaler2_upscale_by: '227.inputs.upscale_by',
  upscaler2_denoise: '227.inputs.denoise'
};

// Helper functions
export function getActiveModelPreset(presets: ModelPreset[]): ModelPreset | null {
  return presets.find(preset => preset.isActive) || null;
}

export function applyPresetToWorkflow(workflow: any, preset: ModelPreset): any {
  const updatedWorkflow = JSON.parse(JSON.stringify(workflow));
  
  console.log(`Applying preset "${preset.displayName}" to workflow:`);
  console.log(`- Model: ${preset.modelPath}`);
  console.log(`- KSampler: ${preset.ksampler.steps} steps, CFG ${preset.ksampler.cfg}, ${preset.ksampler.sampler_name}`);
  console.log(`- Upscaler1: ${preset.upscaler1.steps} steps, CFG ${preset.upscaler1.cfg}, denoise ${preset.upscaler1.denoise}`);
  console.log(`- Upscaler2: ${preset.upscaler2.steps} steps, CFG ${preset.upscaler2.cfg}, denoise ${preset.upscaler2.denoise}`);
  
  // Apply checkpoint
  updatedWorkflow['183'].inputs.ckpt_name = preset.modelPath;
  
  // Apply KSampler parameters
  updatedWorkflow['180'].inputs.steps = preset.ksampler.steps;
  updatedWorkflow['180'].inputs.cfg = preset.ksampler.cfg;
  updatedWorkflow['180'].inputs.sampler_name = preset.ksampler.sampler_name;
  updatedWorkflow['180'].inputs.scheduler = preset.ksampler.scheduler;
  
  // Apply first upscaler parameters
  updatedWorkflow['222'].inputs.steps = preset.upscaler1.steps;
  updatedWorkflow['222'].inputs.cfg = preset.upscaler1.cfg;
  updatedWorkflow['222'].inputs.sampler_name = preset.upscaler1.sampler_name;
  updatedWorkflow['222'].inputs.scheduler = preset.upscaler1.scheduler;
  updatedWorkflow['222'].inputs.upscale_by = preset.upscaler1.upscale_by;
  updatedWorkflow['222'].inputs.denoise = preset.upscaler1.denoise;
  
  // Apply second upscaler parameters (if not bypassed)
  if (updatedWorkflow['227']) {
    updatedWorkflow['227'].inputs.steps = preset.upscaler2.steps;
    updatedWorkflow['227'].inputs.cfg = preset.upscaler2.cfg;
    updatedWorkflow['227'].inputs.sampler_name = preset.upscaler2.sampler_name;
    updatedWorkflow['227'].inputs.scheduler = preset.upscaler2.scheduler;
    updatedWorkflow['227'].inputs.upscale_by = preset.upscaler2.upscale_by;
    updatedWorkflow['227'].inputs.denoise = preset.upscaler2.denoise;
  }
  
  console.log('Workflow updated with preset parameters');
  return updatedWorkflow;
}

export function createCustomPreset(
  basePreset: ModelPreset,
  overrides: Partial<ModelPreset>,
  customName: string
): ModelPreset {
  return {
    ...basePreset,
    ...overrides,
    id: `custom-${Date.now()}`,
    displayName: customName,
    isActive: false,
    isCustom: true,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };
}

// Your available SDXL models (from your ComfyUI installation)
export const availableModels = [
  { path: 'sdxl\\juggernautXL_v9_RunDiffusionPhoto_v2.safetensors', name: 'Juggernaut XL v9 Photo v2', category: 'standard' },
  { path: 'sdxl\\juggernautXL_X_RunDiffusion_Hyper.safetensors', name: 'Juggernaut XL Hyper', category: 'lightning' },
  { path: 'sdxl\\ProteusV0.4.safetensors', name: 'Proteus v0.4', category: 'standard' },
  { path: 'sdxl\\SDXLFaetastic_v24.safetensors', name: 'SDXL Faetastic v24', category: 'artistic' },
  { path: 'sdxl\\albedobaseXL_v21.safetensors', name: 'Albedo Base XL v21', category: 'standard' },
  { path: 'sdxl\\artium_v20.safetensors', name: 'Artium v20', category: 'artistic' },
  { path: 'sdxl\\artium_v20Turboboosted.safetensors', name: 'Artium v20 Turbo', category: 'lightning' },
  { path: 'sdxl\\brixlAMustInYour_v5EndOfTheLine.safetensors', name: 'Brixl AMust v5', category: 'standard' },
  { path: 'sdxl\\colossusProjectXLSFW_49Hera.safetensors', name: 'Colossus Project XL v49', category: 'standard' },
  { path: 'sdxl\\crystalClearXL_ccxl.safetensors', name: 'Crystal Clear XL', category: 'standard' },
  { path: 'sdxl\\dreamshaperXL_alpha2Xl10.safetensors', name: 'Dreamshaper XL Alpha2', category: 'artistic' },
  { path: 'sdxl\\dreamshaperXL_lightningDPMSDE.safetensors', name: 'Dreamshaper XL Lightning', category: 'lightning' },
  { path: 'sdxl\\dreamshaperXL_v2TurboDPMSDE.safetensors', name: 'Dreamshaper XL v2 Turbo', category: 'lightning' },
  { path: 'sdxl\\fenrisXL_SDXLLightning.safetensors', name: 'Fenris XL Lightning', category: 'lightning' },
  { path: 'sdxl\\juggernautXL_v10TurboBoost.safetensors', name: 'Juggernaut XL v10 Turbo', category: 'lightning' },
  { path: 'sdxl\\juggernautXL_juggXIByRundiffusion.safetensors', name: 'Juggernaut XL (Standard)', category: 'standard' },
  { path: 'sdxl\\juggernautXL_juggernautX.safetensors', name: 'Juggernaut X', category: 'standard' },
  { path: 'sdxl\\juggernautXL_v9RdphotoLightning.safetensors', name: 'Juggernaut XL v9 Lightning', category: 'lightning' },
  { path: 'sdxl\\vividXL_alphaV04.safetensors', name: 'Vivid XL Alpha v04', category: 'artistic' },
  { path: 'sdxl\\protovisionXLHighFidelity3D_releaseV660Bakedvae.safetensors', name: 'ProtoVision XL 3D v660', category: 'standard' },
  { path: 'sdxl\\realvisxlV40_v40LightningBakedvae.safetensors', name: 'RealVis XL v4.0 Lightning', category: 'lightning' },
  { path: 'sdxl\\realvisxlV50_v40Bakedvae.safetensors', name: 'RealVis XL v5.0', category: 'standard' },
  { path: 'sdxl\\realvisxlV50_v40LightningBakedvae.safetensors', name: 'RealVis XL v5.0 Lightning v40', category: 'lightning' },
  { path: 'sdxl\\realvisxlV50_v50LightningBakedvae.safetensors', name: 'RealVis XL v5.0 Lightning v50', category: 'lightning' },
  { path: 'sdxl\\sdxl_xl_base_1.0.safetensors', name: 'SDXL Base 1.0', category: 'standard' },
  { path: 'sdxl\\xl_refiner_1.0.safetensors', name: 'XL Refiner 1.0', category: 'standard' },
  { path: 'sdxl\\UnstableDiffusers_nihilmania.safetensors', name: 'Unstable Diffusers Nihilmania', category: 'artistic' },
  { path: 'sdxl\\starlightXLAnimated_v3.safetensors', name: 'Starlight XL Animated v3', category: 'artistic' },
  { path: 'sdxl\\wildcardxXLTURBO_wildcardxXLTURBOV10.safetensors', name: 'Wildcard XL Turbo v10', category: 'lightning' },
  { path: 'sdxl\\zavychromaXL_v70.safetensors', name: 'Zavy Chroma XL v70', category: 'artistic' }
];

// Sampler and scheduler options (from your ComfyUI installation)
export const samplerOptions = [
  'euler',
  'euler_cfg_pp',
  'euler_ancestral',
  'euler_ancestral_cfg_pp',
  'heun',
  'heunpp2',
  'dpm_2',
  'dpm_2_ancestral',
  'lms',
  'dpm_fast',
  'dpm_adaptive',
  'dpmpp_2s_ancestral',
  'dpmpp_2s_ancestral_cfg_pp',
  'dpmpp_sde',
  'dpmpp_sde_gpu',
  'dpmpp_2m',
  'dpmpp_2m_alt',
  'dpmpp_2m_cfg_pp',
  'dpmpp_2m_sde',
  'dpmpp_2m_sde_gpu',
  'dpmpp_3m_sde',
  'dpmpp_3m_sde_gpu',
  'ddpm',
  'lcm',
  'ipndm',
  'ipndm_v',
  'deis',
  'res_multistep',
  'res_multistep_cfg_pp',
  'res_multistep_ancestral',
  'res_multistep_ancestral_cfg_pp',
  'gradient_estimation',
  'gradient_estimation_cfg_pp',
  'er_sde',
  'seeds_2',
  'seeds_3',
  'sa_solver',
  'sa_solver_pece',
  'ddim',
  'uni_pc',
  'uni_pc_bh2'
];

export const schedulerOptions = [
  'karras',
  'sgm_uniform',
  'normal',
  'simple',
  'ddim_uniform',
  'exponential',
  'polyexponential'
];
