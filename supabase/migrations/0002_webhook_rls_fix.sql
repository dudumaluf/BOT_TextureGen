-- Temporarily allow webhook updates by modifying the RLS policy
-- This allows updates to generations table without user authentication

-- Drop the existing policy
DROP POLICY IF EXISTS "Allow users to manage their own generations" ON public.generations;

-- Create a new policy that allows updates without authentication for webhook operations
CREATE POLICY "Allow users to manage their own generations" ON public.generations
    FOR ALL USING (
        auth.uid() = user_id OR 
        auth.uid() IS NULL -- Allow webhook operations without authentication
    );
