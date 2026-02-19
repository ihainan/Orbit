-- Up Migration

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create avatars table (to keep history of avatars)
CREATE TABLE IF NOT EXISTS avatars (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    avatar_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_current BOOLEAN DEFAULT false
);

-- Create posts table (core table)
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    avatar_id INTEGER REFERENCES avatars(id) ON DELETE SET NULL,
    content_type VARCHAR(50) NOT NULL,
    text_content TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create media table
CREATE TABLE IF NOT EXISTS media (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    media_type VARCHAR(50) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    is_external BOOLEAN DEFAULT false,
    thumbnail_url VARCHAR(500),
    file_size BIGINT,
    mime_type VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_avatar_id ON posts(avatar_id);
CREATE INDEX IF NOT EXISTS idx_media_post_id ON media(post_id);
CREATE INDEX IF NOT EXISTS idx_avatars_user_id ON avatars(user_id);
CREATE INDEX IF NOT EXISTS idx_avatars_is_current ON avatars(is_current) WHERE is_current = true;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for posts table
CREATE OR REPLACE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Down Migration

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP INDEX IF EXISTS idx_avatars_is_current;
DROP INDEX IF EXISTS idx_avatars_user_id;
DROP INDEX IF EXISTS idx_media_post_id;
DROP INDEX IF EXISTS idx_posts_avatar_id;
DROP INDEX IF EXISTS idx_posts_user_id;
DROP INDEX IF EXISTS idx_posts_created_at;
DROP TABLE IF EXISTS media;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS avatars;
DROP TABLE IF EXISTS users;
