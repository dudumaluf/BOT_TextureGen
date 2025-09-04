-- Add depth_preview_storage_path column to generations table
ALTER TABLE generations 
ADD COLUMN depth_preview_storage_path TEXT;
