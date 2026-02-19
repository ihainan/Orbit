-- Migration: Add location fields to posts table
-- Date: 2025-10-11
-- Description: Add location tracking fields for posts (latitude, longitude, address, etc.)

-- Add location columns to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_accuracy DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS location_address TEXT,
ADD COLUMN IF NOT EXISTS location_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS location_province VARCHAR(100),
ADD COLUMN IF NOT EXISTS location_district VARCHAR(100);

-- Create index on location_city for faster filtering queries
CREATE INDEX IF NOT EXISTS idx_posts_location_city ON posts(location_city);

-- Add comments to document the purpose
COMMENT ON COLUMN posts.location_latitude IS 'GPS latitude coordinate (WGS84)';
COMMENT ON COLUMN posts.location_longitude IS 'GPS longitude coordinate (WGS84)';
COMMENT ON COLUMN posts.location_accuracy IS 'Location accuracy in meters';
COMMENT ON COLUMN posts.location_address IS 'Full formatted address from reverse geocoding';
COMMENT ON COLUMN posts.location_city IS 'City name';
COMMENT ON COLUMN posts.location_province IS 'Province/State name';
COMMENT ON COLUMN posts.location_district IS 'District/County name';
