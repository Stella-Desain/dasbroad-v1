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
      gcal_events_cache: {
        Row: {
          attachments_json: Json | null
          attendees_json: Json | null
          calendar_id: string
          color_id: string | null
          conference_data_json: Json | null
          created: string | null
          creator_json: Json | null
          deleted: boolean | null
          description: string | null
          end_json: Json
          event_id: string
          event_type: string | null
          extended_properties_json: Json | null
          hangout_link: string | null
          html_link: string | null
          ical_uid: string | null
          last_synced_at: string | null
          location: string | null
          organizer_json: Json | null
          original_start_time: Json | null
          raw_event_json: Json
          recurrence: Json | null
          recurring_event_id: string | null
          reminders_json: Json | null
          sequence: number | null
          start_json: Json
          status: string | null
          summary: string | null
          transparency: string | null
          updated: string | null
          visibility: string | null
        }
        Insert: {
          attachments_json?: Json | null
          attendees_json?: Json | null
          calendar_id?: string
          color_id?: string | null
          conference_data_json?: Json | null
          created?: string | null
          creator_json?: Json | null
          deleted?: boolean | null
          description?: string | null
          end_json: Json
          event_id: string
          event_type?: string | null
          extended_properties_json?: Json | null
          hangout_link?: string | null
          html_link?: string | null
          ical_uid?: string | null
          last_synced_at?: string | null
          location?: string | null
          organizer_json?: Json | null
          original_start_time?: Json | null
          raw_event_json: Json
          recurrence?: Json | null
          recurring_event_id?: string | null
          reminders_json?: Json | null
          sequence?: number | null
          start_json: Json
          status?: string | null
          summary?: string | null
          transparency?: string | null
          updated?: string | null
          visibility?: string | null
        }
        Update: {
          attachments_json?: Json | null
          attendees_json?: Json | null
          calendar_id?: string
          color_id?: string | null
          conference_data_json?: Json | null
          created?: string | null
          creator_json?: Json | null
          deleted?: boolean | null
          description?: string | null
          end_json?: Json
          event_id?: string
          event_type?: string | null
          extended_properties_json?: Json | null
          hangout_link?: string | null
          html_link?: string | null
          ical_uid?: string | null
          last_synced_at?: string | null
          location?: string | null
          organizer_json?: Json | null
          original_start_time?: Json | null
          raw_event_json?: Json
          recurrence?: Json | null
          recurring_event_id?: string | null
          reminders_json?: Json | null
          sequence?: number | null
          start_json?: Json
          status?: string | null
          summary?: string | null
          transparency?: string | null
          updated?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      gcal_sync_state: {
        Row: {
          calendar_id: string
          created_at: string | null
          error_message: string | null
          last_full_sync_at: string | null
          last_incremental_sync_at: string | null
          next_sync_token: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          calendar_id?: string
          created_at?: string | null
          error_message?: string | null
          last_full_sync_at?: string | null
          last_incremental_sync_at?: string | null
          next_sync_token?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          calendar_id?: string
          created_at?: string | null
          error_message?: string | null
          last_full_sync_at?: string | null
          last_incremental_sync_at?: string | null
          next_sync_token?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gcal_watch_channels: {
        Row: {
          calendar_id: string
          channel_id: string
          channel_token: string
          created_at: string | null
          expiration_at: string
          expiration_ms: number
          id: string
          resource_id: string
          updated_at: string | null
        }
        Insert: {
          calendar_id?: string
          channel_id: string
          channel_token: string
          created_at?: string | null
          expiration_at: string
          expiration_ms: number
          id?: string
          resource_id: string
          updated_at?: string | null
        }
        Update: {
          calendar_id?: string
          channel_id?: string
          channel_token?: string
          created_at?: string | null
          expiration_at?: string
          expiration_ms?: number
          id?: string
          resource_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      google_oauth_tokens: {
        Row: {
          access_token: string | null
          created_at: string | null
          id: string
          refresh_token: string
          scopes: string
          token_expiry: string | null
          updated_at: string | null
          user_label: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          refresh_token: string
          scopes?: string
          token_expiry?: string | null
          updated_at?: string | null
          user_label?: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          refresh_token?: string
          scopes?: string
          token_expiry?: string | null
          updated_at?: string | null
          user_label?: string
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
    Enums: {},
  },
} as const
