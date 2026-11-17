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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      destinations: {
        Row: {
          country: string
          id: string
          name: string
          tagline: string
        }
        Insert: {
          country: string
          id?: string
          name: string
          tagline?: string
        }
        Update: {
          country?: string
          id?: string
          name?: string
          tagline?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          created_at: string
          description: string
          destination_id: string
          end_date: string | null
          id: string
          level_wanted: string
          players_needed: number
          poster_id: string
          sport: string
          start_date: string
          start_time: string | null
          status: string
          venue: string | null
        }
        Insert: {
          created_at?: string
          description?: string
          destination_id: string
          end_date?: string | null
          id?: string
          level_wanted: string
          players_needed: number
          poster_id: string
          sport?: string
          start_date: string
          start_time?: string | null
          status?: string
          venue?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          destination_id?: string
          end_date?: string | null
          id?: string
          level_wanted?: string
          players_needed?: number
          poster_id?: string
          sport?: string
          start_date?: string
          start_time?: string | null
          status?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations_with_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_poster_id_fkey"
            columns: ["poster_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_sports: {
        Row: {
          profile_id: string
          skill_tier: string
          sport: string
        }
        Insert: {
          profile_id: string
          skill_tier: string
          sport?: string
        }
        Update: {
          profile_id?: string
          skill_tier?: string
          sport?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_sports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_trips: {
        Row: {
          destination_id: string
          end_date: string
          profile_id: string
          start_date: string
        }
        Insert: {
          destination_id: string
          end_date: string
          profile_id: string
          start_date: string
        }
        Update: {
          destination_id?: string
          end_date?: string
          profile_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_trips_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_trips_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations_with_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_trips_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string
          created_at: string
          display_name: string
          home_city: string | null
          id: string
        }
        Insert: {
          bio?: string
          created_at?: string
          display_name: string
          home_city?: string | null
          id: string
        }
        Update: {
          bio?: string
          created_at?: string
          display_name?: string
          home_city?: string | null
          id?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          age_confirmed_at: string
          terms_accepted_at: string
          user_id: string
        }
        Insert: {
          age_confirmed_at?: string
          terms_accepted_at?: string
          user_id: string
        }
        Update: {
          age_confirmed_at?: string
          terms_accepted_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      destinations_with_counts: {
        Row: {
          country: string | null
          id: string | null
          name: string | null
          open_listings: number | null
          tagline: string | null
        }
        Insert: {
          country?: string | null
          id?: string | null
          name?: string | null
          open_listings?: never
          tagline?: string | null
        }
        Update: {
          country?: string | null
          id?: string | null
          name?: string | null
          open_listings?: never
          tagline?: string | null
        }
        Relationships: []
      }
      discover_listings: {
        Row: {
          created_at: string | null
          description: string | null
          destination_country: string | null
          destination_id: string | null
          destination_name: string | null
          end_date: string | null
          id: string | null
          level_wanted: string | null
          players_needed: number | null
          poster_name: string | null
          poster_skill_tier: string | null
          start_date: string | null
          start_time: string | null
          venue: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations_with_counts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_email_confirmed: { Args: never; Returns: boolean }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
