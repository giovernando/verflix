-- Add preferences to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{"language": "English", "preferred_genre": "Action", "notifications": {"new_releases": true, "recommendations": true, "email": true}}'::jsonb;
