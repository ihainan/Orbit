-- Migration: Add avatar_id to posts table
-- Date: 2025-10-10
-- Description: Link posts with avatars to preserve historical avatar information

-- Add avatar_id column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS avatar_id INTEGER REFERENCES avatars(id) ON DELETE SET NULL;

-- Create index for avatar_id
CREATE INDEX IF NOT EXISTS idx_posts_avatar_id ON posts(avatar_id);

-- Optional: Set avatar_id for existing posts to current avatar
-- This will associate all existing posts with the current avatar if one exists
DO $$
DECLARE
  current_avatar_id INTEGER;
BEGIN
  -- Get the current avatar ID (if any)
  SELECT id INTO current_avatar_id FROM avatars WHERE is_current = true LIMIT 1;

  -- If a current avatar exists, update posts that don't have an avatar
  IF current_avatar_id IS NOT NULL THEN
    UPDATE posts
    SET avatar_id = current_avatar_id
    WHERE avatar_id IS NULL;
  END IF;
END $$;
