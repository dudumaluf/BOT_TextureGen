-- Create a function that can update generations without RLS restrictions
-- This is specifically for webhook operations

CREATE OR REPLACE FUNCTION update_generation_webhook(
  generation_id UUID,
  new_status generation_status DEFAULT 'completed',
  diffuse_path TEXT DEFAULT NULL,
  normal_path TEXT DEFAULT NULL,
  height_path TEXT DEFAULT NULL,
  thumbnail_path TEXT DEFAULT NULL
)
RETURNS TABLE(id UUID, status generation_status)
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
BEGIN
  UPDATE public.generations 
  SET 
    status = new_status,
    diffuse_storage_path = COALESCE(diffuse_path, diffuse_storage_path),
    normal_storage_path = COALESCE(normal_path, normal_storage_path),
    height_storage_path = COALESCE(height_path, height_storage_path),
    thumbnail_storage_path = COALESCE(thumbnail_path, thumbnail_storage_path)
  WHERE generations.id = generation_id
  RETURNING generations.id, generations.status;
  
  RETURN QUERY SELECT generations.id, generations.status 
  FROM public.generations 
  WHERE generations.id = generation_id;
END;
$$;

-- Grant execute permission to authenticated users (for the webhook API)
GRANT EXECUTE ON FUNCTION update_generation_webhook TO authenticated;
