-- Add category column
ALTER TABLE puzzles ADD COLUMN category text;

-- Create a function to get the first tag as category
CREATE OR REPLACE FUNCTION get_first_tag(tags text[])
RETURNS text AS $$
BEGIN
  IF tags IS NULL OR array_length(tags, 1) IS NULL THEN
    RETURN 'Other';
  END IF;
  RETURN tags[1];
END;
$$ LANGUAGE plpgsql;

-- Migrate data from tags to category
UPDATE puzzles
SET category = get_first_tag(tags)
WHERE category IS NULL;

-- Make category required
ALTER TABLE puzzles ALTER COLUMN category SET NOT NULL;

-- Drop the tags column
ALTER TABLE puzzles DROP COLUMN tags;

-- Drop the helper function
DROP FUNCTION get_first_tag; 