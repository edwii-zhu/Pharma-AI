-- Create tables for the Pharmacy Management System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    insurance_group_number TEXT,
    allergies TEXT[],
    medical_conditions TEXT[]
);

-- Medications table
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    generic_name TEXT,
    ndc TEXT NOT NULL UNIQUE,
    manufacturer TEXT,
    dosage_form TEXT NOT NULL,
    strength TEXT NOT NULL,
    route TEXT NOT NULL,
    description TEXT,
    warnings TEXT,
    interactions TEXT[],
    requires_prescription BOOLEAN NOT NULL DEFAULT TRUE
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    account_number TEXT
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    batch_number TEXT,
    expiration_date DATE NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    reorder_level INTEGER NOT NULL DEFAULT 10,
    location TEXT,
    CONSTRAINT quantity_check CHECK (quantity >= 0)
);

-- Create index on medication_id
CREATE INDEX IF NOT EXISTS inventory_medication_id_idx ON inventory(medication_id);

-- Prescribers table
CREATE TABLE IF NOT EXISTS prescribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    npi_number TEXT NOT NULL UNIQUE,
    dea_number TEXT,
    specialty TEXT,
    phone TEXT,
    email TEXT,
    address TEXT
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'pharmacist', 'technician', 'cashier')),
    phone TEXT,
    license_number TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    prescriber_id UUID NOT NULL REFERENCES prescribers(id) ON DELETE RESTRICT,
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE RESTRICT,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT,
    quantity INTEGER NOT NULL,
    refills INTEGER NOT NULL DEFAULT 0,
    instructions TEXT NOT NULL,
    date_written DATE NOT NULL,
    date_filled TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'filled', 'picked_up', 'cancelled')) DEFAULT 'pending',
    verification_pharmacist_id UUID REFERENCES users(id) ON DELETE SET NULL,
    original_document_url TEXT,
    notes TEXT,
    CONSTRAINT quantity_check CHECK (quantity > 0),
    CONSTRAINT refills_check CHECK (refills >= 0)
);

-- Create indices for prescriptions table
CREATE INDEX IF NOT EXISTS prescriptions_patient_id_idx ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS prescriptions_medication_id_idx ON prescriptions(medication_id);
CREATE INDEX IF NOT EXISTS prescriptions_prescriber_id_idx ON prescriptions(prescriber_id);
CREATE INDEX IF NOT EXISTS prescriptions_status_idx ON prescriptions(status);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    type TEXT NOT NULL CHECK (type IN ('low_stock', 'expiration', 'interaction', 'verification_needed')),
    message TEXT NOT NULL,
    related_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium'
);

-- Create index for unread alerts
CREATE INDEX IF NOT EXISTS alerts_is_read_idx ON alerts(is_read);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to update updated_at automatically
CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON patients
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_medications_updated_at
BEFORE UPDATE ON medications
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
BEFORE UPDATE ON inventory
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_prescribers_updated_at
BEFORE UPDATE ON prescribers
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at
BEFORE UPDATE ON prescriptions
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON suppliers
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at
BEFORE UPDATE ON alerts
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create a function to generate alerts for low stock
CREATE OR REPLACE FUNCTION create_low_stock_alert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity <= NEW.reorder_level AND OLD.quantity > OLD.reorder_level THEN
        INSERT INTO alerts (type, message, related_id, priority)
        SELECT 
            'low_stock', 
            'Low stock alert: ' || m.name || ' (' || m.dosage_form || ' ' || m.strength || ') has only ' || NEW.quantity || ' units remaining.',
            NEW.id,
            CASE
                WHEN NEW.quantity = 0 THEN 'high'
                WHEN NEW.quantity <= (NEW.reorder_level / 2) THEN 'medium'
                ELSE 'low'
            END
        FROM medications m
        WHERE m.id = NEW.medication_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for low stock alerts
CREATE TRIGGER inventory_low_stock_alert
AFTER UPDATE ON inventory
FOR EACH ROW EXECUTE PROCEDURE create_low_stock_alert();

-- Create a function to generate alerts for prescriptions needing verification
CREATE OR REPLACE FUNCTION create_prescription_verification_alert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'pending' AND (OLD.status IS NULL OR OLD.status <> 'pending') THEN
        INSERT INTO alerts (type, message, related_id, priority)
        SELECT 
            'verification_needed', 
            'New prescription needs verification for patient: ' || p.first_name || ' ' || p.last_name,
            NEW.id,
            'medium'
        FROM patients p
        WHERE p.id = NEW.patient_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for prescription verification alerts
CREATE TRIGGER prescription_verification_alert
AFTER INSERT OR UPDATE ON prescriptions
FOR EACH ROW EXECUTE PROCEDURE create_prescription_verification_alert();

-- Create a function to generate alerts for expiring medications
CREATE OR REPLACE FUNCTION create_expiration_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if item is within 30 days of expiration and has stock
    IF NEW.expiration_date - CURRENT_DATE <= 30 AND 
       NEW.expiration_date - CURRENT_DATE > 0 AND
       NEW.quantity > 0 AND
       (OLD.expiration_date - CURRENT_DATE > 30 OR OLD.quantity = 0 OR OLD.expiration_date IS NULL) THEN
        
        INSERT INTO alerts (type, message, related_id, priority)
        SELECT 
            'expiration', 
            'Expiration alert: ' || m.name || ' (' || m.dosage_form || ' ' || m.strength || ') - Batch ' || 
            COALESCE(NEW.batch_number, 'Unknown') || ' expires in ' || (NEW.expiration_date - CURRENT_DATE) || ' days.',
            NEW.id,
            CASE
                WHEN NEW.expiration_date - CURRENT_DATE <= 7 THEN 'high'
                WHEN NEW.expiration_date - CURRENT_DATE <= 15 THEN 'medium'
                ELSE 'low'
            END
        FROM medications m
        WHERE m.id = NEW.medication_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for expiration alerts
CREATE TRIGGER inventory_expiration_alert
AFTER INSERT OR UPDATE ON inventory
FOR EACH ROW EXECUTE PROCEDURE create_expiration_alert(); 