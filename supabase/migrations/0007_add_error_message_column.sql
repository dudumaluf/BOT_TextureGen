-- Add error_message column to generations table for better error tracking
ALTER TABLE generations 
ADD COLUMN error_message TEXT;

-- Add comment to document the column
COMMENT ON COLUMN generations.error_message IS 'Stores error messages when generation fails or is cancelled';
