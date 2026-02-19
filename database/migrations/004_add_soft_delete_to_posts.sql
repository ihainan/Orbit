-- Migration: Add soft delete support to posts table
-- Date: 2025-10-13
-- Description: Add deleted_at field to implement soft delete functionality for posts

-- Add deleted_at column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Create index for faster queries that filter out deleted posts
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts(deleted_at);

-- Add comment to document the column
COMMENT ON COLUMN posts.deleted_at IS 'Timestamp when the post was soft deleted (NULL means not deleted)';
