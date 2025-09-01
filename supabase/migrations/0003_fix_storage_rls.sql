-- Fix Storage RLS for webhook uploads
-- This allows the webhook to upload files to the generated_textures bucket

-- First, check current policies (for debugging)
-- SELECT * FROM storage.objects WHERE bucket_id = 'generated_textures';

-- Create a simple policy that allows webhook uploads
-- This is safe and won't break existing functionality
INSERT INTO storage.policies (
  id,
  bucket_id,
  name,
  definition,
  check_definition,
  command,
  roles
) VALUES (
  'allow_webhook_uploads_' || gen_random_uuid()::text,
  'generated_textures',
  'Allow webhook uploads',
  'true',  -- Allow all reads
  'true',  -- Allow all inserts
  'INSERT',
  ARRAY['authenticated', 'anon']
) ON CONFLICT DO NOTHING;

-- Also ensure SELECT policy exists for public access
INSERT INTO storage.policies (
  id,
  bucket_id,
  name,
  definition,
  check_definition,
  command,
  roles
) VALUES (
  'allow_public_select_' || gen_random_uuid()::text,
  'generated_textures',
  'Allow public read access',
  'true',  -- Allow all reads
  NULL,    -- No check needed for SELECT
  'SELECT',
  ARRAY['authenticated', 'anon']
) ON CONFLICT DO NOTHING;
