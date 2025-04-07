-- Sample contraindication data for testing
-- Run this after adding the contraindication_data column

-- Update a few prescriptions with sample contraindication data

-- Example 1: Prescription with no contraindications
UPDATE prescriptions
SET contraindication_data = '{
  "hasSevereContraindications": false,
  "contraindications": []
}'::jsonb
WHERE id = (SELECT id FROM prescriptions ORDER BY created_at DESC LIMIT 1 OFFSET 0);

-- Example 2: Prescription with a minor drug interaction
UPDATE prescriptions
SET contraindication_data = '{
  "hasSevereContraindications": false,
  "contraindications": [
    {
      "type": "drug-interaction",
      "description": "Mild interaction with caffeine. May increase stimulant effects.",
      "severity": "low",
      "recommendation": "Advise patient to limit caffeine intake while taking this medication."
    }
  ]
}'::jsonb
WHERE id = (SELECT id FROM prescriptions ORDER BY created_at DESC LIMIT 1 OFFSET 1);

-- Example 3: Prescription with multiple contraindications including a severe one
UPDATE prescriptions
SET contraindication_data = '{
  "hasSevereContraindications": true,
  "contraindications": [
    {
      "type": "drug-interaction",
      "description": "Severe interaction with warfarin. May significantly increase bleeding risk.",
      "severity": "high",
      "recommendation": "Consider alternative medication or close monitoring if co-administered."
    },
    {
      "type": "condition",
      "description": "Use with caution in patients with liver impairment.",
      "severity": "medium",
      "recommendation": "Reduce dosage by 50% in patients with hepatic dysfunction."
    },
    {
      "type": "allergy",
      "description": "Contains inactive ingredients similar to sulfa drugs.",
      "severity": "low",
      "recommendation": "Monitor for allergic reactions in patients with sulfa sensitivities."
    }
  ]
}'::jsonb
WHERE id = (SELECT id FROM prescriptions ORDER BY created_at DESC LIMIT 1 OFFSET 2);

-- Example 4: Age-related contraindication
UPDATE prescriptions
SET contraindication_data = '{
  "hasSevereContraindications": false,
  "contraindications": [
    {
      "type": "age",
      "description": "Not recommended for children under 12 years of age.",
      "severity": "medium",
      "recommendation": "Verify patient age before dispensing. Use pediatric formulation for younger patients."
    }
  ]
}'::jsonb
WHERE id = (SELECT id FROM prescriptions ORDER BY created_at DESC LIMIT 1 OFFSET 3);

-- Verify the updates
SELECT id, status, contraindication_data 
FROM prescriptions 
WHERE contraindication_data IS NOT NULL
LIMIT 10; 