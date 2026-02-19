-- Up Migration

-- Repost support
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reposted_from_id INTEGER REFERENCES posts(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS repost_comment TEXT;
CREATE INDEX IF NOT EXISTS idx_posts_reposted_from_id ON posts(reposted_from_id);
COMMENT ON COLUMN posts.reposted_from_id IS 'ID of the original post if this is a repost';
COMMENT ON COLUMN posts.repost_comment IS 'User comment added when reposting';

-- Location fields
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_accuracy DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS location_address TEXT,
ADD COLUMN IF NOT EXISTS location_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS location_province VARCHAR(100),
ADD COLUMN IF NOT EXISTS location_district VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_posts_location_city ON posts(location_city);
COMMENT ON COLUMN posts.location_latitude IS 'GPS latitude coordinate (WGS84)';
COMMENT ON COLUMN posts.location_longitude IS 'GPS longitude coordinate (WGS84)';
COMMENT ON COLUMN posts.location_accuracy IS 'Location accuracy in meters';
COMMENT ON COLUMN posts.location_address IS 'Full formatted address from reverse geocoding';
COMMENT ON COLUMN posts.location_city IS 'City name';
COMMENT ON COLUMN posts.location_province IS 'Province/State name';
COMMENT ON COLUMN posts.location_district IS 'District/County name';

-- Soft delete
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts(deleted_at);
COMMENT ON COLUMN posts.deleted_at IS 'Timestamp when the post was soft deleted (NULL means not deleted)';

-- Whisper mode
ALTER TABLE posts ADD COLUMN IF NOT EXISTS whisper_mode BOOLEAN DEFAULT false NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_whisper_mode ON posts(whisper_mode);

-- Down Migration

DROP INDEX IF EXISTS idx_posts_whisper_mode;
ALTER TABLE posts DROP COLUMN IF EXISTS whisper_mode;

DROP INDEX IF EXISTS idx_posts_deleted_at;
ALTER TABLE posts DROP COLUMN IF EXISTS deleted_at;

DROP INDEX IF EXISTS idx_posts_location_city;
ALTER TABLE posts
DROP COLUMN IF EXISTS location_latitude,
DROP COLUMN IF EXISTS location_longitude,
DROP COLUMN IF EXISTS location_accuracy,
DROP COLUMN IF EXISTS location_address,
DROP COLUMN IF EXISTS location_city,
DROP COLUMN IF EXISTS location_province,
DROP COLUMN IF EXISTS location_district;

DROP INDEX IF EXISTS idx_posts_reposted_from_id;
ALTER TABLE posts DROP COLUMN IF EXISTS repost_comment;
ALTER TABLE posts DROP COLUMN IF EXISTS reposted_from_id;
