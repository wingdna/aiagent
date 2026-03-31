-- 1. Add slug column
ALTER TABLE agents ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 2. Initialize existing data
UPDATE agents 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- 3. Cleanup trailing hyphens
UPDATE agents 
SET slug = TRIM(BOTH '-' FROM slug);

-- 4. Handle duplicates (basic SQL approach, might need manual intervention or more complex logic for perfect uniqueness)
-- This is a placeholder for duplicate handling. In a real scenario, you'd use a unique constraint violation to catch these or a more complex update.
-- For now, we assume names are relatively unique or the user will handle collisions manually as per instructions.
