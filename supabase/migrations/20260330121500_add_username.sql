-- Add username column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username text;

-- Optional: Update existing users to have a default username from their name or email
UPDATE public.profiles 
SET username = LOWER(REPLACE(name, ' ', '_'))
WHERE username IS NULL;
