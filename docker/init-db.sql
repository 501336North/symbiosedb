-- Initialize SymbioseDB database with necessary extensions

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable Apache AGE extension for graph queries (if available)
-- Note: AGE needs to be installed separately in the image
-- CREATE EXTENSION IF NOT EXISTS age;

-- Create a sample vectors table for testing
CREATE TABLE IF NOT EXISTS vectors (
  id TEXT PRIMARY KEY,
  embedding vector(384), -- Standard embedding dimension
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster similarity search
CREATE INDEX IF NOT EXISTS vectors_embedding_idx
ON vectors
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create a sample users table for testing SQL queries
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert some test data
INSERT INTO users (name, email) VALUES
  ('Alice', 'alice@example.com'),
  ('Bob', 'bob@example.com'),
  ('Charlie', 'charlie@example.com')
ON CONFLICT (email) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO symbiosedb;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO symbiosedb;

-- Display success message
DO $$
BEGIN
  RAISE NOTICE 'SymbioseDB database initialized successfully!';
  RAISE NOTICE 'Extensions: vector';
  RAISE NOTICE 'Tables: vectors, users';
END $$;
