-- Mock data for the Pharmacy Management System
-- Run this script after schema.sql to populate the database with test data

-- Mock Users (Pharmacy Staff)
INSERT INTO users (email, first_name, last_name, role, phone, license_number, is_active)
VALUES
  ('admin@pharmacy.com', 'Admin', 'User', 'admin', '555-123-4567', 'ADM-1234', true),
  ('john.doe@pharmacy.com', 'John', 'Doe', 'pharmacist', '555-234-5678', 'RPH-5678', true),
  ('sarah.smith@pharmacy.com', 'Sarah', 'Smith', 'pharmacist', '555-345-6789', 'RPH-6789', true),
  ('mike.johnson@pharmacy.com', 'Mike', 'Johnson', 'technician', '555-456-7890', 'TECH-7890', true),
  ('lisa.brown@pharmacy.com', 'Lisa', 'Brown', 'technician', '555-567-8901', 'TECH-8901', true),
  ('james.wilson@pharmacy.com', 'James', 'Wilson', 'cashier', '555-678-9012', null, true),
  ('emma.davis@pharmacy.com', 'Emma', 'Davis', 'technician', '555-789-0123', 'TECH-0123', false);

-- Mock Patients
INSERT INTO patients (first_name, last_name, date_of_birth, address, phone, email, insurance_provider, insurance_policy_number, insurance_group_number, allergies, medical_conditions)
VALUES
  ('Robert', 'Martin', '1965-05-12', '123 Oak St, Springfield, IL', '555-111-2222', 'robert.martin@email.com', 'Blue Cross', 'BC-987654321', 'GRP-12345', ARRAY['Penicillin', 'Sulfa'], ARRAY['Hypertension', 'Type 2 Diabetes']),
  ('Patricia', 'Wilson', '1978-08-23', '456 Maple Ave, Springfield, IL', '555-222-3333', 'patricia.wilson@email.com', 'Aetna', 'AE-123456789', 'GRP-54321', ARRAY['Latex'], ARRAY['Asthma']),
  ('Michael', 'Thompson', '1982-03-15', '789 Pine Rd, Springfield, IL', '555-333-4444', 'michael.thompson@email.com', 'UnitedHealth', 'UH-456789123', 'GRP-67890', ARRAY['Ibuprofen'], ARRAY['Rheumatoid Arthritis']),
  ('Jennifer', 'Davis', '1990-11-04', '321 Cedar Blvd, Springfield, IL', '555-444-5555', 'jennifer.davis@email.com', 'Cigna', 'CI-789123456', 'GRP-23456', NULL, NULL),
  ('William', 'Johnson', '1973-06-30', '654 Birch St, Springfield, IL', '555-555-6666', 'william.johnson@email.com', 'Medicare', 'MC-456123789', 'GRP-78901', ARRAY['Codeine', 'Morphine'], ARRAY['COPD', 'Congestive Heart Failure']),
  ('Elizabeth', 'Brown', '1986-09-18', '987 Willow Way, Springfield, IL', '555-666-7777', 'elizabeth.brown@email.com', 'Humana', 'HU-321654987', 'GRP-34567', NULL, ARRAY['Hypothyroidism']),
  ('David', 'Miller', '1958-12-05', '159 Spruce Dr, Springfield, IL', '555-777-8888', 'david.miller@email.com', 'Medicaid', 'MD-654987321', 'GRP-89012', ARRAY['Aspirin'], ARRAY['Type 1 Diabetes', 'Hypertension']),
  ('Susan', 'Taylor', '1995-02-27', '753 Elm Ct, Springfield, IL', '555-888-9999', 'susan.taylor@email.com', 'Anthem', 'AN-987321654', 'GRP-45678', NULL, NULL),
  ('James', 'Anderson', '1970-07-20', '246 Aspen Ave, Springfield, IL', '555-999-0000', 'james.anderson@email.com', 'Kaiser', 'KA-159753456', 'GRP-56789', ARRAY['Tetracycline'], ARRAY['Gout', 'Hypertension']),
  ('Mary', 'Jackson', '1988-04-09', '864 Poplar Ln, Springfield, IL', '555-000-1111', 'mary.jackson@email.com', 'Blue Shield', 'BS-852741963', 'GRP-67890', ARRAY['Nuts'], ARRAY['Migraine', 'Anxiety']);

-- Mock Suppliers
INSERT INTO suppliers (name, contact_person, phone, email, address, account_number)
VALUES
  ('PharmaDirect', 'John Smith', '555-123-4567', 'john.smith@pharmadirect.com', '123 Distributor Way, Chicago, IL', 'PD-12345'),
  ('MedSupply Inc.', 'Sarah Johnson', '555-234-5678', 'sarah.j@medsupply.com', '456 Medical Blvd, Chicago, IL', 'MS-67890'),
  ('Global Pharmaceuticals', 'Michael Brown', '555-345-6789', 'michael.b@globalrx.com', '789 Pharma Ave, Chicago, IL', 'GP-24680'),
  ('HealthSource Distribution', 'Lisa Davis', '555-456-7890', 'lisa.d@healthsource.com', '101 Health St, Chicago, IL', 'HD-13579'),
  ('MediTech Suppliers', 'Robert Wilson', '555-567-8901', 'robert.w@meditech.com', '202 Tech Road, Chicago, IL', 'MT-97531');

-- Mock Medications
INSERT INTO medications (name, generic_name, ndc, manufacturer, dosage_form, strength, route, description, warnings, interactions, requires_prescription)
VALUES
  ('Lisinopril', 'Lisinopril', '12345-6789-01', 'PharmaCorp', 'Tablet', '10 mg', 'Oral', 'Used to treat high blood pressure', 'May cause dizziness', ARRAY['potassium supplements', 'spironolactone'], true),
  ('Metformin', 'Metformin HCl', '12345-6789-02', 'MediCo', 'Tablet', '500 mg', 'Oral', 'Used to treat type 2 diabetes', 'Take with food', ARRAY['cimetidine', 'furosemide'], true),
  ('Atorvastatin', 'Atorvastatin Calcium', '12345-6789-03', 'PharmaTech', 'Tablet', '20 mg', 'Oral', 'Used to lower cholesterol', 'May cause muscle pain', ARRAY['erythromycin', 'itraconazole'], true),
  ('Levothyroxine', 'Levothyroxine Sodium', '12345-6789-04', 'ThyroMed', 'Tablet', '50 mcg', 'Oral', 'Used to treat hypothyroidism', 'Take on empty stomach', ARRAY['calcium supplements', 'iron supplements'], true),
  ('Amoxicillin', 'Amoxicillin', '12345-6789-05', 'BactaPharm', 'Capsule', '500 mg', 'Oral', 'Antibiotic for bacterial infections', 'Complete full course', ARRAY['probenecid', 'allopurinol'], true),
  ('Ibuprofen', 'Ibuprofen', '12345-6789-06', 'PainRelief', 'Tablet', '200 mg', 'Oral', 'Used for pain and inflammation', 'Take with food', ARRAY['aspirin', 'warfarin'], false),
  ('Omeprazole', 'Omeprazole', '12345-6789-07', 'GastroHealth', 'Capsule', '20 mg', 'Oral', 'Used for acid reflux', 'Do not crush or chew', ARRAY['clopidogrel', 'diazepam'], true),
  ('Albuterol', 'Albuterol Sulfate', '12345-6789-08', 'BreatheEasy', 'Inhaler', '90 mcg/actuation', 'Inhalation', 'Used for asthma and COPD', 'Do not exceed recommended dose', ARRAY['beta-blockers', 'digoxin'], true),
  ('Aspirin', 'Acetylsalicylic Acid', '12345-6789-09', 'HeartHealth', 'Tablet', '81 mg', 'Oral', 'Used for pain and heart health', 'May cause stomach bleeding', ARRAY['warfarin', 'methotrexate'], false),
  ('Gabapentin', 'Gabapentin', '12345-6789-10', 'NeuraMed', 'Capsule', '300 mg', 'Oral', 'Used for nerve pain and seizures', 'May cause drowsiness', ARRAY['morphine', 'hydrocodone'], true),
  ('Acetaminophen', 'Acetaminophen', '12345-6789-11', 'PainRelief', 'Tablet', '500 mg', 'Oral', 'Used for pain and fever', 'Do not exceed 4000 mg daily', ARRAY['warfarin', 'alcohol'], false),
  ('Hydrochlorothiazide', 'Hydrochlorothiazide', '12345-6789-12', 'CardioMed', 'Tablet', '25 mg', 'Oral', 'Used for high blood pressure', 'May increase sun sensitivity', ARRAY['lithium', 'digoxin'], true);

-- Mock Inventory
INSERT INTO inventory (medication_id, quantity, batch_number, expiration_date, cost_price, selling_price, supplier_id, reorder_level, location)
SELECT 
  m.id, 
  CASE 
    WHEN random() < 0.2 THEN floor(random() * 10)::int  -- 20% chance of low stock (0-9)
    ELSE floor(random() * 90 + 10)::int  -- 80% chance of normal stock (10-99)
  END,
  'BN-' || floor(random() * 9000 + 1000)::text,
  CURRENT_DATE + floor(random() * 730)::int,  -- Expiration date between now and 2 years
  (random() * 50 + 5)::numeric(10,2),  -- Cost between $5 and $55
  (random() * 100 + 10)::numeric(10,2),  -- Selling price between $10 and $110
  (SELECT id FROM suppliers ORDER BY random() LIMIT 1),
  floor(random() * 15 + 5)::int,  -- Reorder level between 5 and 20
  CASE floor(random() * 3)::int
    WHEN 0 THEN 'Shelf A'
    WHEN 1 THEN 'Shelf B'
    WHEN 2 THEN 'Controlled Cabinet'
  END
FROM medications m;

-- Mock Prescribers
INSERT INTO prescribers (first_name, last_name, npi_number, dea_number, specialty, phone, email, address)
VALUES
  ('Dr. Thomas', 'Reynolds', 'NPI123456789', 'DEA-AR1234567', 'Family Medicine', '555-111-2233', 'dr.reynolds@clinic.com', '123 Medical Plaza, Springfield, IL'),
  ('Dr. Emily', 'Chen', 'NPI234567890', 'DEA-BC2345678', 'Internal Medicine', '555-222-3344', 'dr.chen@hospital.org', '456 Health Center Dr, Springfield, IL'),
  ('Dr. Marcus', 'Williams', 'NPI345678901', 'DEA-CD3456789', 'Cardiology', '555-333-4455', 'dr.williams@heartclinic.com', '789 Cardio Lane, Springfield, IL'),
  ('Dr. Sophia', 'Patel', 'NPI456789012', 'DEA-DE4567890', 'Endocrinology', '555-444-5566', 'dr.patel@endocrine.org', '101 Diabetes Center, Springfield, IL'),
  ('Dr. Jackson', 'Lee', 'NPI567890123', 'DEA-EF5678901', 'Neurology', '555-555-6677', 'dr.lee@neuro.com', '202 Brain Way, Springfield, IL');

-- Mock Prescriptions (some pending, some filled)
INSERT INTO prescriptions (patient_id, prescriber_id, medication_id, dosage, frequency, duration, quantity, refills, instructions, date_written, date_filled, status, verification_pharmacist_id, original_document_url, notes)
VALUES
  -- Prescription 1 (Verified)
  (
    (SELECT id FROM patients WHERE last_name = 'Martin' LIMIT 1),
    (SELECT id FROM prescribers WHERE last_name = 'Reynolds' LIMIT 1),
    (SELECT id FROM medications WHERE name = 'Lisinopril' LIMIT 1),
    '10 mg', 'Once daily', '30 days', 30, 3,
    'Take one tablet by mouth once daily for blood pressure',
    CURRENT_DATE - 5,
    CURRENT_DATE - 4,
    'verified',
    (SELECT id FROM users WHERE last_name = 'Doe' LIMIT 1),
    'https://supabase.storage.bucket/prescriptions/rx-001.pdf',
    'Patient has been on this medication for 2 years'
  ),
  
  -- Prescription 2 (Filled)
  (
    (SELECT id FROM patients WHERE last_name = 'Wilson' LIMIT 1),
    (SELECT id FROM prescribers WHERE last_name = 'Chen' LIMIT 1),
    (SELECT id FROM medications WHERE name = 'Albuterol' LIMIT 1),
    '90 mcg', '2 puffs every 4-6 hours as needed', '30 days', 1, 2,
    'Inhale 2 puffs by mouth every 4-6 hours as needed for shortness of breath',
    CURRENT_DATE - 10,
    CURRENT_DATE - 9,
    'filled',
    (SELECT id FROM users WHERE last_name = 'Smith' LIMIT 1),
    'https://supabase.storage.bucket/prescriptions/rx-002.pdf',
    'Patient reports increased asthma symptoms during spring'
  ),
  
  -- Prescription 3 (Picked Up)
  (
    (SELECT id FROM patients WHERE last_name = 'Thompson' LIMIT 1),
    (SELECT id FROM prescribers WHERE last_name = 'Williams' LIMIT 1),
    (SELECT id FROM medications WHERE name = 'Metformin' LIMIT 1),
    '500 mg', 'Twice daily with meals', '90 days', 180, 0,
    'Take one tablet by mouth twice daily with breakfast and dinner',
    CURRENT_DATE - 20,
    CURRENT_DATE - 19,
    'picked_up',
    (SELECT id FROM users WHERE last_name = 'Doe' LIMIT 1),
    'https://supabase.storage.bucket/prescriptions/rx-003.pdf',
    'New diabetes diagnosis, counsel on diet and medication'
  ),
  
  -- Prescription 4 (Pending)
  (
    (SELECT id FROM patients WHERE last_name = 'Davis' LIMIT 1),
    (SELECT id FROM prescribers WHERE last_name = 'Patel' LIMIT 1),
    (SELECT id FROM medications WHERE name = 'Amoxicillin' LIMIT 1),
    '500 mg', 'Three times daily', '10 days', 30, 0,
    'Take one capsule by mouth three times daily until all medication is gone',
    CURRENT_DATE - 1,
    NULL,
    'pending',
    NULL,
    'https://supabase.storage.bucket/prescriptions/rx-004.pdf',
    'Treating sinus infection'
  ),
  
  -- Prescription 5 (Cancelled)
  (
    (SELECT id FROM patients WHERE last_name = 'Johnson' LIMIT 1),
    (SELECT id FROM prescribers WHERE last_name = 'Lee' LIMIT 1),
    (SELECT id FROM medications WHERE name = 'Gabapentin' LIMIT 1),
    '300 mg', 'Three times daily', '30 days', 90, 2,
    'Take one capsule by mouth three times daily for nerve pain',
    CURRENT_DATE - 15,
    NULL,
    'cancelled',
    (SELECT id FROM users WHERE last_name = 'Smith' LIMIT 1),
    'https://supabase.storage.bucket/prescriptions/rx-005.pdf',
    'Cancelled due to insurance coverage issue'
  ),
  
  -- Prescription 6 (Pending)
  (
    (SELECT id FROM patients WHERE last_name = 'Brown' LIMIT 1),
    (SELECT id FROM prescribers WHERE last_name = 'Reynolds' LIMIT 1),
    (SELECT id FROM medications WHERE name = 'Levothyroxine' LIMIT 1),
    '50 mcg', 'Once daily', '90 days', 90, 3,
    'Take one tablet by mouth once daily on an empty stomach',
    CURRENT_DATE,
    NULL,
    'pending',
    NULL,
    'https://supabase.storage.bucket/prescriptions/rx-006.pdf',
    'Annual thyroid medication refill'
  ),
  
  -- Prescription 7 (Picked Up)
  (
    (SELECT id FROM patients WHERE last_name = 'Miller' LIMIT 1),
    (SELECT id FROM prescribers WHERE last_name = 'Williams' LIMIT 1),
    (SELECT id FROM medications WHERE name = 'Atorvastatin' LIMIT 1),
    '20 mg', 'Once daily at bedtime', '90 days', 90, 3,
    'Take one tablet by mouth once daily at bedtime for cholesterol',
    CURRENT_DATE - 30,
    CURRENT_DATE - 29,
    'picked_up',
    (SELECT id FROM users WHERE last_name = 'Doe' LIMIT 1),
    'https://supabase.storage.bucket/prescriptions/rx-007.pdf',
    'Patient reports no side effects from medication'
  ),
  
  -- Prescription 8 (Filled)
  (
    (SELECT id FROM patients WHERE last_name = 'Taylor' LIMIT 1),
    (SELECT id FROM prescribers WHERE last_name = 'Chen' LIMIT 1),
    (SELECT id FROM medications WHERE name = 'Omeprazole' LIMIT 1),
    '20 mg', 'Once daily before breakfast', '30 days', 30, 2,
    'Take one capsule by mouth once daily 30 minutes before breakfast',
    CURRENT_DATE - 3,
    CURRENT_DATE - 2,
    'filled',
    (SELECT id FROM users WHERE last_name = 'Smith' LIMIT 1),
    'https://supabase.storage.bucket/prescriptions/rx-008.pdf',
    'Patient reports significant improvement in acid reflux symptoms'
  ),
  
  -- Prescription 9 (Pending)
  (
    (SELECT id FROM patients WHERE last_name = 'Anderson' LIMIT 1),
    (SELECT id FROM prescribers WHERE last_name = 'Reynolds' LIMIT 1),
    (SELECT id FROM medications WHERE name = 'Hydrochlorothiazide' LIMIT 1),
    '25 mg', 'Once daily', '30 days', 30, 2,
    'Take one tablet by mouth once daily for blood pressure',
    CURRENT_DATE - 1,
    NULL,
    'pending',
    NULL,
    'https://supabase.storage.bucket/prescriptions/rx-009.pdf',
    'New prescription for hypertension'
  ),
  
  -- Prescription 10 (Verified)
  (
    (SELECT id FROM patients WHERE last_name = 'Jackson' LIMIT 1),
    (SELECT id FROM prescribers WHERE last_name = 'Patel' LIMIT 1),
    (SELECT id FROM medications WHERE name = 'Metformin' LIMIT 1),
    '500 mg', 'Twice daily with meals', '30 days', 60, 5,
    'Take one tablet by mouth twice daily with meals',
    CURRENT_DATE - 2,
    NULL,
    'verified',
    (SELECT id FROM users WHERE last_name = 'Doe' LIMIT 1),
    'https://supabase.storage.bucket/prescriptions/rx-010.pdf',
    'Patient is newly diagnosed with type 2 diabetes'
  );

-- Add some alerts (these would normally be generated by triggers, but adding some initial ones)

-- Low stock alerts
INSERT INTO alerts (type, message, related_id, is_read, priority)
SELECT 
  'low_stock',
  'Low stock alert: ' || m.name || ' (' || m.dosage_form || ' ' || m.strength || ') has only ' || i.quantity || ' units remaining.',
  i.id,
  false,
  CASE
    WHEN i.quantity = 0 THEN 'high'
    WHEN i.quantity <= (i.reorder_level / 2) THEN 'medium'
    ELSE 'low'
  END
FROM inventory i
JOIN medications m ON i.medication_id = m.id
WHERE i.quantity <= i.reorder_level
LIMIT 5;  -- Just add a few low stock alerts

-- Expiration alerts
INSERT INTO alerts (type, message, related_id, is_read, priority)
SELECT 
  'expiration',
  'Expiration alert: ' || m.name || ' (' || m.dosage_form || ' ' || m.strength || ') - Batch ' || 
  COALESCE(i.batch_number, 'Unknown') || ' expires in ' || (i.expiration_date - CURRENT_DATE) || ' days.',
  i.id,
  false,
  CASE
    WHEN (i.expiration_date - CURRENT_DATE) <= 7 THEN 'high'
    WHEN (i.expiration_date - CURRENT_DATE) <= 15 THEN 'medium'
    ELSE 'low'
  END
FROM inventory i
JOIN medications m ON i.medication_id = m.id
WHERE (i.expiration_date - CURRENT_DATE) <= 30
  AND (i.expiration_date - CURRENT_DATE) > 0
  AND i.quantity > 0
LIMIT 3;  -- Just add a few expiration alerts

-- Verification needed alerts
INSERT INTO alerts (type, message, related_id, is_read, priority)
SELECT 
  'verification_needed',
  'New prescription needs verification for patient: ' || p.first_name || ' ' || p.last_name,
  rx.id,
  false,
  'medium'
FROM prescriptions rx
JOIN patients p ON rx.patient_id = p.id
WHERE rx.status = 'pending'
LIMIT 3;  -- Just add a few verification alerts

-- Add some drug interaction alerts
INSERT INTO alerts (type, message, related_id, is_read, priority)
VALUES
  ('interaction', 'Potential interaction detected: Lisinopril and potassium supplements may cause hyperkalemia', 
   (SELECT id FROM prescriptions WHERE medication_id = (SELECT id FROM medications WHERE name = 'Lisinopril' LIMIT 1) LIMIT 1),
   false, 'high'),
   
  ('interaction', 'Potential interaction detected: Amoxicillin may reduce the effectiveness of oral contraceptives', 
   (SELECT id FROM prescriptions WHERE medication_id = (SELECT id FROM medications WHERE name = 'Amoxicillin' LIMIT 1) LIMIT 1),
   false, 'medium'),
   
  ('interaction', 'Potential interaction detected: Omeprazole may increase Atorvastatin levels', 
   (SELECT id FROM prescriptions WHERE medication_id = (SELECT id FROM medications WHERE name = 'Omeprazole' LIMIT 1) LIMIT 1),
   true, 'low'); 