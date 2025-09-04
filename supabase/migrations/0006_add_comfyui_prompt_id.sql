-- Add comfyui_prompt_id column to generations table
-- This column stores the ComfyUI prompt ID for tracking and queue management
ALTER TABLE public.generations
ADD COLUMN comfyui_prompt_id TEXT;

-- Add index for better query performance when filtering by comfyui_prompt_id
CREATE INDEX idx_generations_comfyui_prompt_id ON public.generations(comfyui_prompt_id);

-- Add index for better query performance when filtering by status
CREATE INDEX IF NOT EXISTS idx_generations_status ON public.generations(status);
