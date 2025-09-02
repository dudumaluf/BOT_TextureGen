-- Add high_quality column to generations table
-- This tracks whether a generation used high quality mode or fast mode

ALTER TABLE public.generations 
ADD COLUMN high_quality BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.generations.high_quality IS 'Indicates if generation used high quality mode (true) or fast mode (false)';
