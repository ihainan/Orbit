-- Up Migration

-- Insert default user (for single-user application)
-- Change the username and email to your own before first run
INSERT INTO users (username, email)
VALUES ('admin', 'admin@example.com')
ON CONFLICT (username) DO NOTHING;

-- Down Migration

DELETE FROM users WHERE username = 'admin' AND email = 'admin@example.com';
