-- Add front_preview_storage_path column to generations table
ALTER TABLE public.generations
ADD COLUMN front_preview_storage_path TEXT;
