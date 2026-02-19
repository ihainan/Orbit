-- Migration: Add whisper_mode to posts table
-- Description: Add whisper_mode field to mark posts as private/intimate content
-- Date: 2025-10-13

-- Add whisper_mode column to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS whisper_mode BOOLEAN DEFAULT false NOT NULL;

-- Create index for better query performance when filtering by whisper_mode
CREATE INDEX IF NOT EXISTS idx_posts_whisper_mode ON posts(whisper_mode);

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: whisper_mode field added to posts table';
END $$;
