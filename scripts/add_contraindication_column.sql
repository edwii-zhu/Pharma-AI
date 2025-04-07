-- Add contraindication_data column to prescriptions table
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS contraindication_data JSONB;

-- Add comment to column
COMMENT ON COLUMN prescriptions.contraindication_data IS 'Stores data about drug interactions and other contraindications in JSON format';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_contraindication_data_exists ON prescriptions ((contraindication_data IS NOT NULL));

-- Sample update for testing (optional)
-- UPDATE prescriptions 
-- SET contraindication_data = '{"hasSevereContraindications": false, "contraindications": []}'::jsonb 
-- WHERE contraindication_data IS NULL; 