-- Drop existing tables if they exist (in reverse order of creation due to foreign keys)
DROP TABLE IF EXISTS public.generations;
DROP TABLE IF EXISTS public.models;
DROP TYPE IF EXISTS public.generation_status;

-- Create the models table
CREATE TABLE public.models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT,
    storage_path TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create the generation status type
CREATE TYPE public.generation_status AS ENUM ('processing', 'completed', 'failed');

-- Create the generations table with all columns
CREATE TABLE public.generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    model_id UUID REFERENCES public.models(id) ON DELETE SET NULL,
    status public.generation_status DEFAULT 'processing',
    subject_prompt TEXT,
    style_prompt TEXT,
    seed BIGINT,
    reference_image_path TEXT,
    diffuse_storage_path TEXT,
    normal_storage_path TEXT,
    height_storage_path TEXT,
    thumbnail_storage_path TEXT,
    comfyui_prompt_id TEXT,
    error_message TEXT
);

-- Enable Row Level Security for both tables
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- Create policies for tables
DROP POLICY IF EXISTS "Allow users to manage their own models" ON public.models;
CREATE POLICY "Allow users to manage their own models" ON public.models
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to manage their own generations" ON public.generations;
CREATE POLICY "Allow users to manage their own generations" ON public.generations
    FOR ALL USING (auth.uid() = user_id);
