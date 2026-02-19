-- Migration: Add repost support to posts table
-- Date: 2025-10-11
-- Description: Add the ability for users to repost existing posts with optional comments

-- Add columns for repost functionality
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reposted_from_id INTEGER REFERENCES posts(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS repost_comment TEXT;

-- Create index for repost queries (to efficiently find all reposts of a post)
CREATE INDEX IF NOT EXISTS idx_posts_reposted_from_id ON posts(reposted_from_id);

-- Add comments to document the columns
COMMENT ON COLUMN posts.reposted_from_id IS 'ID of the original post if this is a repost';
COMMENT ON COLUMN posts.repost_comment IS 'User comment added when reposting';
