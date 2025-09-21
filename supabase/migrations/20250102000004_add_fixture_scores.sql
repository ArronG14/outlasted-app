/*
  # Add Score and Status Columns to Fixtures Table
  
  This migration adds the missing columns needed for live scores:
  - `home_score` (integer, nullable) - Home team score
  - `away_score` (integer, nullable) - Away team score  
  - `status` (text, default 'scheduled') - Match status: 'scheduled', 'live', 'finished'
*/

-- Add score columns to fixtures table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fixtures' AND column_name = 'home_score') THEN
    ALTER TABLE fixtures ADD COLUMN home_score integer;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fixtures' AND column_name = 'away_score') THEN
    ALTER TABLE fixtures ADD COLUMN away_score integer;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fixtures' AND column_name = 'status') THEN
    ALTER TABLE fixtures ADD COLUMN status text DEFAULT 'scheduled';
  END IF;
END $$;

-- Add check constraint for status values
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'fixtures_status_check') THEN
    ALTER TABLE fixtures ADD CONSTRAINT fixtures_status_check CHECK (status IN ('scheduled', 'live', 'finished'));
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_fixtures_status ON fixtures(status);
CREATE INDEX IF NOT EXISTS idx_fixtures_scores ON fixtures(home_score, away_score) WHERE home_score IS NOT NULL AND away_score IS NOT NULL;
