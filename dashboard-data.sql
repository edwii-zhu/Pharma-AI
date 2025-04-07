-- SQL commands that will add more data to make the dashboard look better:

-- 1. Add more prescriptions with pending status for dashboard to show
INSERT INTO prescriptions (patient_id, prescriber_id, medication_id, dosage, frequency, duration, quantity, refills, instructions, date_written, date_filled, status, verification_pharmacist_id, original_document_url, notes)
VALUES
  -- Additional pending prescriptions
  (
    (SELECT id FROM patients WHERE last_name = 'Miller' LIMIT 1),
    (SELECT id FROM prescribers WHERE last_name = 'Chen' LIMIT 1),
    (SELECT id FROM medications WHERE name = 'Acetaminophen' LIMIT 1),
    '500 mg', 'Every 6 hours as needed', '14 days', 28, 0,
    'Take 1 tablet by mouth every 6 hours as needed for pain',
    CURRENT_DATE,
    NULL,
    'pending',
    NULL,
    'https://supabase.storage.bucket/prescriptions/rx-new-001.pdf',
    'Patient experiencing mild to moderate pain'
  ),
  (
    (SELECT id FROM patients WHERE last_name = 'Taylor' LIMIT 1),
    (SELECT id FROM prescribers WHERE last_name = 'Lee' LIMIT 1),
    (SELECT id FROM medications WHERE name = 'Ibuprofen' LIMIT 1),
    '200 mg', 'Every 6 hours as needed', '7 days', 16, 0,
    'Take 1 tablet by mouth every 6 hours as needed for pain or inflammation',
    CURRENT_DATE,
    NULL,
    'pending',
    NULL,
    'https://supabase.storage.bucket/prescriptions/rx-new-002.pdf',
    'Patient experiencing mild inflammation'
  ),
  (
    (SELECT id FROM patients WHERE last_name = 'Anderson' LIMIT 1),
    (SELECT id FROM prescribers WHERE last_name = 'Patel' LIMIT 1),
    (SELECT id FROM medications WHERE name = 'Omeprazole' LIMIT 1),
    '20 mg', 'Once daily', '30 days', 30, 2,
    'Take 1 capsule by mouth once daily before breakfast',
    CURRENT_DATE,
    NULL,
    'pending',
    NULL,
    'https://supabase.storage.bucket/prescriptions/rx-new-003.pdf',
    'Patient experiencing acid reflux'
  );

-- 2. Ensure we have low stock items for the dashboard
-- First, get some medication IDs to set low stock
WITH med_ids AS (
  SELECT id FROM medications ORDER BY random() LIMIT 3
)
UPDATE inventory
SET quantity = floor(random() * reorder_level)::int  -- Set quantity below reorder level
WHERE medication_id IN (SELECT id FROM med_ids)
  AND quantity > reorder_level;  -- Only update items that are currently above reorder level

-- 3. Add some additional drug interaction alerts
INSERT INTO alerts (type, message, related_id, is_read, priority)
VALUES
  ('interaction', 'Potential interaction: Warfarin and Aspirin may increase bleeding risk', 
   (SELECT id FROM prescriptions ORDER BY random() LIMIT 1),
   false, 'high'),
   
  ('interaction', 'Potential interaction: Lisinopril and Potassium supplements may cause hyperkalemia', 
   (SELECT id FROM prescriptions WHERE medication_id = (SELECT id FROM medications WHERE name = 'Lisinopril' LIMIT 1) LIMIT 1),
   false, 'high'),
   
  ('interaction', 'Potential interaction: Simvastatin and Erythromycin may increase risk of muscle injury', 
   (SELECT id FROM prescriptions ORDER BY random() LIMIT 1),
   false, 'medium');

-- 4. Add more expired or near-expiry items
INSERT INTO inventory (medication_id, quantity, batch_number, expiration_date, cost_price, selling_price, supplier_id, reorder_level, location)
VALUES
  (
    (SELECT id FROM medications WHERE name = 'Amoxicillin' LIMIT 1),
    15,
    'BN-EXP-001',
    CURRENT_DATE + 5,  -- About to expire in 5 days
    10.50,
    24.99,
    (SELECT id FROM suppliers ORDER BY random() LIMIT 1),
    20,
    'Shelf A'
  ),
  (
    (SELECT id FROM medications WHERE name = 'Ibuprofen' LIMIT 1),
    8,
    'BN-EXP-002',
    CURRENT_DATE + 10,  -- Expiring soon
    5.25,
    12.99,
    (SELECT id FROM suppliers ORDER BY random() LIMIT 1),
    15,
    'Shelf B'
  ),
  (
    (SELECT id FROM medications WHERE name = 'Gabapentin' LIMIT 1),
    3,
    'BN-EXP-003',
    CURRENT_DATE + 7,  -- Expiring soon
    18.75,
    45.99,
    (SELECT id FROM suppliers ORDER BY random() LIMIT 1),
    10,
    'Controlled Cabinet'
  );

-- 5. Add alerts for these expiring items
INSERT INTO alerts (type, message, related_id, is_read, priority)
SELECT 
  'expiration',
  'Expiration alert: ' || m.name || ' (' || m.dosage_form || ' ' || m.strength || ') - Batch ' || 
  i.batch_number || ' expires in ' || (i.expiration_date - CURRENT_DATE) || ' days.',
  i.id,
  false,
  CASE
    WHEN (i.expiration_date - CURRENT_DATE) <= 7 THEN 'high'
    ELSE 'medium'
  END
FROM inventory i
JOIN medications m ON i.medication_id = m.id
WHERE i.batch_number IN ('BN-EXP-001', 'BN-EXP-002', 'BN-EXP-003');
