ALTER TABLE rankings ADD COLUMN IF NOT EXISTS shortlisted boolean;
CREATE INDEX IF NOT EXISTS idx_rankings_drive_shortlisted
  ON rankings(drive_id, shortlisted) WHERE shortlisted = true;
