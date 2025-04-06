export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      patients: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          first_name: string
          last_name: string
          date_of_birth: string
          address: string
          phone: string
          email: string | null
          insurance_provider: string | null
          insurance_policy_number: string | null
          insurance_group_number: string | null
          allergies: string[] | null
          medical_conditions: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          first_name: string
          last_name: string
          date_of_birth: string
          address: string
          phone: string
          email?: string | null
          insurance_provider?: string | null
          insurance_policy_number?: string | null
          insurance_group_number?: string | null
          allergies?: string[] | null
          medical_conditions?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          first_name?: string
          last_name?: string
          date_of_birth?: string
          address?: string
          phone?: string
          email?: string | null
          insurance_provider?: string | null
          insurance_policy_number?: string | null
          insurance_group_number?: string | null
          allergies?: string[] | null
          medical_conditions?: string[] | null
        }
      }
      medications: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          generic_name: string | null
          ndc: string
          manufacturer: string | null
          dosage_form: string
          strength: string
          route: string
          description: string | null
          warnings: string | null
          interactions: string[] | null
          requires_prescription: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          generic_name?: string | null
          ndc: string
          manufacturer?: string | null
          dosage_form: string
          strength: string
          route: string
          description?: string | null
          warnings?: string | null
          interactions?: string[] | null
          requires_prescription: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          generic_name?: string | null
          ndc?: string
          manufacturer?: string | null
          dosage_form?: string
          strength?: string
          route?: string
          description?: string | null
          warnings?: string | null
          interactions?: string[] | null
          requires_prescription?: boolean
        }
      }
      inventory: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          medication_id: string
          quantity: number
          batch_number: string | null
          expiration_date: string
          cost_price: number
          selling_price: number
          supplier_id: string | null
          reorder_level: number
          location: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          medication_id: string
          quantity: number
          batch_number?: string | null
          expiration_date: string
          cost_price: number
          selling_price: number
          supplier_id?: string | null
          reorder_level: number
          location?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          medication_id?: string
          quantity?: number
          batch_number?: string | null
          expiration_date?: string
          cost_price?: number
          selling_price?: number
          supplier_id?: string | null
          reorder_level?: number
          location?: string | null
        }
      }
      prescribers: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          first_name: string
          last_name: string
          npi_number: string
          dea_number: string | null
          specialty: string | null
          phone: string | null
          email: string | null
          address: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          first_name: string
          last_name: string
          npi_number: string
          dea_number?: string | null
          specialty?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          first_name?: string
          last_name?: string
          npi_number?: string
          dea_number?: string | null
          specialty?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
        }
      }
      prescriptions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          patient_id: string
          prescriber_id: string
          medication_id: string
          dosage: string
          frequency: string
          duration: string | null
          quantity: number
          refills: number
          instructions: string
          date_written: string
          date_filled: string | null
          status: 'pending' | 'verified' | 'filled' | 'picked_up' | 'cancelled'
          verification_pharmacist_id: string | null
          original_document_url: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          patient_id: string
          prescriber_id: string
          medication_id: string
          dosage: string
          frequency: string
          duration?: string | null
          quantity: number
          refills: number
          instructions: string
          date_written: string
          date_filled?: string | null
          status?: 'pending' | 'verified' | 'filled' | 'picked_up' | 'cancelled'
          verification_pharmacist_id?: string | null
          original_document_url?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          patient_id?: string
          prescriber_id?: string
          medication_id?: string
          dosage?: string
          frequency?: string
          duration?: string | null
          quantity?: number
          refills?: number
          instructions?: string
          date_written?: string
          date_filled?: string | null
          status?: 'pending' | 'verified' | 'filled' | 'picked_up' | 'cancelled'
          verification_pharmacist_id?: string | null
          original_document_url?: string | null
          notes?: string | null
        }
      }
      suppliers: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          contact_person: string | null
          phone: string
          email: string | null
          address: string
          account_number: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          contact_person?: string | null
          phone: string
          email?: string | null
          address: string
          account_number?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          contact_person?: string | null
          phone?: string
          email?: string | null
          address?: string
          account_number?: string | null
        }
      }
      users: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          first_name: string
          last_name: string
          role: 'admin' | 'pharmacist' | 'technician' | 'cashier'
          phone: string | null
          license_number: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          email: string
          first_name: string
          last_name: string
          role: 'admin' | 'pharmacist' | 'technician' | 'cashier'
          phone?: string | null
          license_number?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: 'admin' | 'pharmacist' | 'technician' | 'cashier'
          phone?: string | null
          license_number?: string | null
          is_active?: boolean
        }
      }
      alerts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          type: 'low_stock' | 'expiration' | 'interaction' | 'verification_needed'
          message: string
          related_id: string | null
          is_read: boolean
          priority: 'low' | 'medium' | 'high'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          type: 'low_stock' | 'expiration' | 'interaction' | 'verification_needed'
          message: string
          related_id?: string | null
          is_read?: boolean
          priority?: 'low' | 'medium' | 'high'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          type?: 'low_stock' | 'expiration' | 'interaction' | 'verification_needed'
          message?: string
          related_id?: string | null
          is_read?: boolean
          priority?: 'low' | 'medium' | 'high'
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 