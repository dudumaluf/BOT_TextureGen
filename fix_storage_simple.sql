-- Simple fix for Supabase Storage RLS
-- Run this in Supabase SQL Editor

-- First, let's see what policies exist
-- SELECT * FROM storage.policies WHERE bucket_id = 'generated_textures';

-- Delete any existing conflicting policies
DELETE FROM storage.policies WHERE bucket_id = 'generated_textures';

-- Create a simple, working policy
INSERT INTO storage.policies (
  bucket_id,
  name,
  definition,
  command,
  roles
) VALUES (
  'generated_textures',
  'Allow all operations',
  'true',
  'INSERT',
  ARRAY['authenticated', 'anon']::text[]
);

-- Also allow SELECT for reading
INSERT INTO storage.policies (
  bucket_id,
  name,
  definition,
  command,
  roles
) VALUES (
  'generated_textures',
  'Allow all reads',
  'true',
  'SELECT',
  ARRAY['authenticated', 'anon']::text[]
);
