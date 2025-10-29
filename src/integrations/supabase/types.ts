export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          created_at: string
          id: string
          program_id: string
          status: string
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          program_id: string
          status?: string
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          program_id?: string
          status?: string
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          note: string | null
          program_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          program_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          program_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      launch_companion_chats: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      launch_companion_progress: {
        Row: {
          business_location: string | null
          business_type: string | null
          checklist_items: Json | null
          completed_items: string[] | null
          created_at: string
          current_phase: string
          id: string
          phase_data: Json | null
          session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_location?: string | null
          business_type?: string | null
          checklist_items?: Json | null
          completed_items?: string[] | null
          created_at?: string
          current_phase?: string
          id?: string
          phase_data?: Json | null
          session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_location?: string | null
          business_type?: string | null
          checklist_items?: Json | null
          completed_items?: string[] | null
          created_at?: string
          current_phase?: string
          id?: string
          phase_data?: Json | null
          session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          business_name: string | null
          city: string | null
          county: string | null
          created_at: string
          demographics: string[] | null
          employees: number | null
          id: string
          industry_tags: string[] | null
          revenue_usd: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          demographics?: string[] | null
          employees?: number | null
          id?: string
          industry_tags?: string[] | null
          revenue_usd?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          demographics?: string[] | null
          employees?: number | null
          id?: string
          industry_tags?: string[] | null
          revenue_usd?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          city: string | null
          county: string | null
          created_at: string
          deadline: string | null
          demographics: string[] | null
          description: string
          id: string
          industry_tags: string[] | null
          interest_max: number | null
          interest_min: number | null
          level: Database["public"]["Enums"]["program_level"]
          max_amount: number | null
          min_amount: number | null
          name: string
          rolling: boolean | null
          secured: boolean | null
          sponsor: string
          state: string | null
          status: Database["public"]["Enums"]["program_status"] | null
          type: Database["public"]["Enums"]["program_type"]
          updated_at: string
          url: string
          use_cases: string[] | null
        }
        Insert: {
          city?: string | null
          county?: string | null
          created_at?: string
          deadline?: string | null
          demographics?: string[] | null
          description: string
          id?: string
          industry_tags?: string[] | null
          interest_max?: number | null
          interest_min?: number | null
          level: Database["public"]["Enums"]["program_level"]
          max_amount?: number | null
          min_amount?: number | null
          name: string
          rolling?: boolean | null
          secured?: boolean | null
          sponsor: string
          state?: string | null
          status?: Database["public"]["Enums"]["program_status"] | null
          type: Database["public"]["Enums"]["program_type"]
          updated_at?: string
          url: string
          use_cases?: string[] | null
        }
        Update: {
          city?: string | null
          county?: string | null
          created_at?: string
          deadline?: string | null
          demographics?: string[] | null
          description?: string
          id?: string
          industry_tags?: string[] | null
          interest_max?: number | null
          interest_min?: number | null
          level?: Database["public"]["Enums"]["program_level"]
          max_amount?: number | null
          min_amount?: number | null
          name?: string
          rolling?: boolean | null
          secured?: boolean | null
          sponsor?: string
          state?: string | null
          status?: Database["public"]["Enums"]["program_status"] | null
          type?: Database["public"]["Enums"]["program_type"]
          updated_at?: string
          url?: string
          use_cases?: string[] | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          id: string
          program_id: string
          remind_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          program_id: string
          remind_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          program_id?: string
          remind_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_metadata: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          last_synced: string
          records_synced: number | null
          status: string | null
          sync_type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_synced?: string
          records_synced?: number | null
          status?: string | null
          sync_type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_synced?: string
          records_synced?: number | null
          status?: string | null
          sync_type?: string
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
      program_level: "LOCAL" | "STATE" | "NATIONAL"
      program_status: "OPEN" | "ROLLING" | "CLOSED"
      program_type: "GRANT" | "LOAN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      program_level: ["LOCAL", "STATE", "NATIONAL"],
      program_status: ["OPEN", "ROLLING", "CLOSED"],
      program_type: ["GRANT", "LOAN"],
    },
  },
} as const
