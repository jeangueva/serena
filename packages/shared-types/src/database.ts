/**
 * Tipos de la base de datos de Supabase.
 * Espejo exacto de supabase/migrations/0001_init.sql.
 */
import type { ExtractedData } from "./extracted-data";

export type SubscriptionTier = "trial" | "starter" | "clinic" | "enterprise";

export type PatientStatus = "pending_onboarding" | "in_progress" | "completed";

export type MessageType = "audio_in" | "text_in" | "text_out";

export type Clinic = {
  id: string;
  name: string;
  subscription_tier: SubscriptionTier;
  created_at: string;
};

export type Patient = {
  id: string;
  clinic_id: string;
  full_name: string;
  whatsapp_number: string;
  status: PatientStatus;
  extracted_data: ExtractedData;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type OnboardingLog = {
  id: string;
  patient_id: string;
  message_type: MessageType;
  transcription: string | null;
  media_id: string | null;
  timestamp: string;
};

export type UrgencyAlert = {
  id: string;
  patient_id: string;
  clinic_id: string;
  motivo: string;
  frase_paciente: string | null;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
};

export type ProcessedMessage = {
  message_id: string;
  patient_id: string | null;
  processed_at: string;
};

/** Fila de `clinic_members`: une un usuario de Supabase Auth con su clinica (tenant). */
export type ClinicMember = {
  clinic_id: string;
  user_id: string;
  role: "owner" | "staff";
  created_at: string;
};

/** Shape que consume `@supabase/supabase-js` como generico `Database`. */
export interface Database {
  public: {
    Tables: {
      clinics: {
        Row: Clinic;
        Insert: Omit<Clinic, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<Clinic, "id">>;
        Relationships: [];
      };
      clinic_members: {
        Row: ClinicMember;
        Insert: Omit<ClinicMember, "created_at"> & { created_at?: string };
        Update: Partial<ClinicMember>;
        Relationships: [];
      };
      patients: {
        Row: Patient;
        Insert: Omit<Patient, "id" | "created_at" | "updated_at" | "completed_at" | "extracted_data" | "status"> & {
          id?: string;
          status?: PatientStatus;
          extracted_data?: ExtractedData;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Omit<Patient, "id" | "clinic_id">>;
        Relationships: [];
      };
      urgency_alerts: {
        Row: UrgencyAlert;
        Insert: Omit<UrgencyAlert, "id" | "created_at" | "acknowledged_at" | "acknowledged_by"> & {
          id?: string;
          created_at?: string;
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
        };
        Update: Partial<Omit<UrgencyAlert, "id" | "clinic_id" | "patient_id">>;
        Relationships: [];
      };
      processed_messages: {
        Row: ProcessedMessage;
        Insert: Omit<ProcessedMessage, "processed_at"> & { processed_at?: string };
        Update: Partial<ProcessedMessage>;
        Relationships: [];
      };
      onboarding_logs: {
        Row: OnboardingLog;
        Insert: Omit<OnboardingLog, "id" | "timestamp"> & { id?: string; timestamp?: string };
        Update: Partial<Omit<OnboardingLog, "id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      subscription_tier: SubscriptionTier;
      patient_status: PatientStatus;
      message_type: MessageType;
    };
  };
}
