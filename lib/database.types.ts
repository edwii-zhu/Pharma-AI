export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          priority: string
          related_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          priority?: string
          related_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          priority?: string
          related_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_related_id_fkey"
            columns: ["related_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          }
        ]
      }
      inventory: {
        Row: {
          batch_number: string | null
          created_at: string
          expiration_date: string | null
          id: string
          location: string | null
          medication_id: string
          purchase_date: string | null
          purchase_price: number | null
          quantity: number
          reorder_level: number
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          location?: string | null
          medication_id: string
          purchase_date?: string | null
          purchase_price?: number | null
          quantity: number
          reorder_level: number
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          location?: string | null
          medication_id?: string
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number
          reorder_level?: number
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          }
        ]
      }
      medications: {
        Row: {
          created_at: string
          description: string | null
          dosage_form: string
          id: string
          manufacturer: string | null
          name: string
          ndc_code: string | null
          requires_refrigeration: boolean | null
          strength: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          dosage_form: string
          id?: string
          manufacturer?: string | null
          name: string
          ndc_code?: string | null
          requires_refrigeration?: boolean | null
          strength: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          dosage_form?: string
          id?: string
          manufacturer?: string | null
          name?: string
          ndc_code?: string | null
          requires_refrigeration?: boolean | null
          strength?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          allergies: string[] | null
          created_at: string
          date_of_birth: string
          email: string | null
          first_name: string
          id: string
          insurance_group_number: string | null
          insurance_member_id: string | null
          insurance_provider: string | null
          last_name: string
          medical_conditions: string[] | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          allergies?: string[] | null
          created_at?: string
          date_of_birth: string
          email?: string | null
          first_name: string
          id?: string
          insurance_group_number?: string | null
          insurance_member_id?: string | null
          insurance_provider?: string | null
          last_name: string
          medical_conditions?: string[] | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          allergies?: string[] | null
          created_at?: string
          date_of_birth?: string
          email?: string | null
          first_name?: string
          id?: string
          insurance_group_number?: string | null
          insurance_member_id?: string | null
          insurance_provider?: string | null
          last_name?: string
          medical_conditions?: string[] | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prescribers: {
        Row: {
          address: string | null
          created_at: string
          dea_number: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          npi_number: string | null
          phone: string | null
          specialty: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          dea_number?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          npi_number?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          dea_number?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          npi_number?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          created_at: string
          date_filled: string | null
          date_written: string
          dosage: string
          duration: string | null
          frequency: string
          id: string
          instructions: string
          medication_id: string
          notes: string | null
          original_document_url: string | null
          patient_id: string
          prescriber_id: string
          quantity: number
          refills: number
          status: string
          updated_at: string
          verification_pharmacist_id: string | null
          contraindication_data: Json | null
        }
        Insert: {
          created_at?: string
          date_filled?: string | null
          date_written: string
          dosage: string
          duration?: string | null
          frequency: string
          id?: string
          instructions: string
          medication_id: string
          notes?: string | null
          original_document_url?: string | null
          patient_id: string
          prescriber_id: string
          quantity: number
          refills: number
          status?: string
          updated_at?: string
          verification_pharmacist_id?: string | null
          contraindication_data?: Json | null
        }
        Update: {
          created_at?: string
          date_filled?: string | null
          date_written?: string
          dosage?: string
          duration?: string | null
          frequency?: string
          id?: string
          instructions?: string
          medication_id?: string
          notes?: string | null
          original_document_url?: string | null
          patient_id?: string
          prescriber_id?: string
          quantity?: number
          refills?: number
          status?: string
          updated_at?: string
          verification_pharmacist_id?: string | null
          contraindication_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_prescriber_id_fkey"
            columns: ["prescriber_id"]
            isOneToOne: false
            referencedRelation: "prescribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_verification_pharmacist_id_fkey"
            columns: ["verification_pharmacist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 