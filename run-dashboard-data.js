// Script to run dashboard data SQL against Supabase
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function runDashboardData() {
  console.log('🔄 Adding dashboard data to the database...');
  
  try {
    // IMPORTANT: Since we can't directly execute arbitrary SQL with the JavaScript client,
    // we'll implement the individual operations directly using the Supabase client API.
    
    console.log('1️⃣ Adding pending prescriptions...');
    
    // First get the IDs we need
    const { data: patientMiller } = await supabase
      .from('patients')
      .select('id')
      .eq('last_name', 'Miller')
      .limit(1)
      .single();
      
    const { data: patientTaylor } = await supabase
      .from('patients')
      .select('id')
      .eq('last_name', 'Taylor')
      .limit(1)
      .single();
      
    const { data: patientAnderson } = await supabase
      .from('patients')
      .select('id')
      .eq('last_name', 'Anderson')
      .limit(1)
      .single();
      
    const { data: prescriberChen } = await supabase
      .from('prescribers')
      .select('id')
      .eq('last_name', 'Chen')
      .limit(1)
      .single();
      
    const { data: prescriberLee } = await supabase
      .from('prescribers')
      .select('id')
      .eq('last_name', 'Lee')
      .limit(1)
      .single();
      
    const { data: prescriberPatel } = await supabase
      .from('prescribers')
      .select('id')
      .eq('last_name', 'Patel')
      .limit(1)
      .single();
      
    const { data: medAcetaminophen } = await supabase
      .from('medications')
      .select('id')
      .eq('name', 'Acetaminophen')
      .limit(1)
      .single();
      
    const { data: medIbuprofen } = await supabase
      .from('medications')
      .select('id')
      .eq('name', 'Ibuprofen')
      .limit(1)
      .single();
      
    const { data: medOmeprazole } = await supabase
      .from('medications')
      .select('id')
      .eq('name', 'Omeprazole')
      .limit(1)
      .single();
    
    // Add new pending prescriptions
    const { error: rxError } = await supabase
      .from('prescriptions')
      .insert([
        {
          patient_id: patientMiller.id,
          prescriber_id: prescriberChen.id,
          medication_id: medAcetaminophen.id,
          dosage: '500 mg',
          frequency: 'Every 6 hours as needed',
          duration: '14 days',
          quantity: 28,
          refills: 0,
          instructions: 'Take 1 tablet by mouth every 6 hours as needed for pain',
          date_written: new Date().toISOString().split('T')[0],
          status: 'pending',
          original_document_url: 'https://supabase.storage.bucket/prescriptions/rx-new-001.pdf',
          notes: 'Patient experiencing mild to moderate pain'
        },
        {
          patient_id: patientTaylor.id,
          prescriber_id: prescriberLee.id,
          medication_id: medIbuprofen.id,
          dosage: '200 mg',
          frequency: 'Every 6 hours as needed',
          duration: '7 days',
          quantity: 16,
          refills: 0,
          instructions: 'Take 1 tablet by mouth every 6 hours as needed for pain or inflammation',
          date_written: new Date().toISOString().split('T')[0],
          status: 'pending',
          original_document_url: 'https://supabase.storage.bucket/prescriptions/rx-new-002.pdf',
          notes: 'Patient experiencing mild inflammation'
        },
        {
          patient_id: patientAnderson.id,
          prescriber_id: prescriberPatel.id,
          medication_id: medOmeprazole.id,
          dosage: '20 mg',
          frequency: 'Once daily',
          duration: '30 days',
          quantity: 30,
          refills: 2,
          instructions: 'Take 1 capsule by mouth once daily before breakfast',
          date_written: new Date().toISOString().split('T')[0],
          status: 'pending',
          original_document_url: 'https://supabase.storage.bucket/prescriptions/rx-new-003.pdf',
          notes: 'Patient experiencing acid reflux'
        }
      ]);
      
    if (rxError) {
      console.error('❌ Error adding prescriptions:', rxError);
    } else {
      console.log('✅ Prescriptions added successfully');
    }
    
    // Create low stock items
    console.log('2️⃣ Creating low stock items...');
    
    // Get random medications
    const { data: medications } = await supabase
      .from('medications')
      .select('id')
      .limit(3);
    
    if (medications) {
      for (const med of medications) {
        // Get current inventory for this medication
        const { data: inventory } = await supabase
          .from('inventory')
          .select('*')
          .eq('medication_id', med.id)
          .limit(1)
          .single();
          
        if (inventory) {
          // Update to low stock
          const newQuantity = Math.floor(Math.random() * inventory.reorder_level);
          const { error: updateError } = await supabase
            .from('inventory')
            .update({ quantity: newQuantity })
            .eq('id', inventory.id);
            
          if (updateError) {
            console.error(`❌ Error updating inventory ${inventory.id}:`, updateError);
          } else {
            console.log(`✅ Updated inventory for medication ${med.id} to quantity ${newQuantity}`);
          }
        }
      }
    }
    
    // Add drug interaction alerts
    console.log('3️⃣ Adding drug interaction alerts...');
    
    // Get random prescription IDs
    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('id')
      .limit(2);
      
    // Get lisinopril prescription
    const { data: lisinoprilRx } = await supabase
      .from('prescriptions')
      .select('id')
      .eq('medication_id', 
        supabase.from('medications').select('id').eq('name', 'Lisinopril').limit(1)
      )
      .limit(1)
      .single();
    
    const { error: alertError } = await supabase
      .from('alerts')
      .insert([
        {
          type: 'interaction',
          message: 'Potential interaction: Warfarin and Aspirin may increase bleeding risk',
          related_id: prescriptions[0].id,
          is_read: false,
          priority: 'high'
        },
        {
          type: 'interaction',
          message: 'Potential interaction: Lisinopril and Potassium supplements may cause hyperkalemia',
          related_id: lisinoprilRx?.id || prescriptions[0].id,
          is_read: false,
          priority: 'high'
        },
        {
          type: 'interaction',
          message: 'Potential interaction: Simvastatin and Erythromycin may increase risk of muscle injury',
          related_id: prescriptions[1].id,
          is_read: false,
          priority: 'medium'
        }
      ]);
      
    if (alertError) {
      console.error('❌ Error adding alerts:', alertError);
    } else {
      console.log('✅ Drug interaction alerts added successfully');
    }
    
    // Add more inventory items with expiration dates
    console.log('4️⃣ Adding inventory items with expiring dates...');
    
    const { data: medAmoxicillin } = await supabase
      .from('medications')
      .select('id')
      .eq('name', 'Amoxicillin')
      .limit(1)
      .single();
      
    const { data: medGabapentin } = await supabase
      .from('medications')
      .select('id')
      .eq('name', 'Gabapentin')
      .limit(1)
      .single();
    
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .limit(1)
      .single();
    
    // Add expiring inventory
    const { error: invError } = await supabase
      .from('inventory')
      .insert([
        {
          medication_id: medAmoxicillin.id,
          quantity: 15,
          batch_number: 'BN-EXP-001',
          expiration_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
          cost_price: 10.50,
          selling_price: 24.99,
          supplier_id: supplier.id,
          reorder_level: 20,
          location: 'Shelf A'
        },
        {
          medication_id: medIbuprofen.id,
          quantity: 8,
          batch_number: 'BN-EXP-002',
          expiration_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days from now
          cost_price: 5.25,
          selling_price: 12.99,
          supplier_id: supplier.id,
          reorder_level: 15,
          location: 'Shelf B'
        },
        {
          medication_id: medGabapentin.id,
          quantity: 3,
          batch_number: 'BN-EXP-003',
          expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
          cost_price: 18.75,
          selling_price: 45.99,
          supplier_id: supplier.id,
          reorder_level: 10,
          location: 'Controlled Cabinet'
        }
      ]);
      
    if (invError) {
      console.error('❌ Error adding inventory items:', invError);
    } else {
      console.log('✅ Expiring inventory items added successfully');
      
      // Now add expiration alerts for these items
      console.log('5️⃣ Adding expiration alerts...');
      
      // Get the newly added inventory items
      const { data: newInventory } = await supabase
        .from('inventory')
        .select('id, batch_number, expiration_date, medication_id, medications(name, dosage_form, strength)')
        .in('batch_number', ['BN-EXP-001', 'BN-EXP-002', 'BN-EXP-003']);
      
      if (newInventory) {
        const expiryAlerts = newInventory.map(item => {
          const daysUntilExpiry = Math.ceil((new Date(item.expiration_date) - new Date()) / (24 * 60 * 60 * 1000));
          return {
            type: 'expiration',
            message: `Expiration alert: ${item.medications.name} (${item.medications.dosage_form} ${item.medications.strength}) - Batch ${item.batch_number} expires in ${daysUntilExpiry} days.`,
            related_id: item.id,
            is_read: false,
            priority: daysUntilExpiry <= 7 ? 'high' : 'medium'
          };
        });
        
        const { error: expiryAlertError } = await supabase
          .from('alerts')
          .insert(expiryAlerts);
          
        if (expiryAlertError) {
          console.error('❌ Error adding expiration alerts:', expiryAlertError);
        } else {
          console.log('✅ Expiration alerts added successfully');
        }
      }
    }
    
    console.log('✅ All dashboard data has been added to the database!');
  } catch (error) {
    console.error('❌ Error running dashboard data script:', error);
  }
}

// Run the main function
runDashboardData(); 