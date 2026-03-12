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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      issue_reports: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          issue_id: string
          latitude: number | null
          longitude: number | null
          pincode: string | null
          reporter_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          issue_id: string
          latitude?: number | null
          longitude?: number | null
          pincode?: string | null
          reporter_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          issue_id?: string
          latitude?: number | null
          longitude?: number | null
          pincode?: string | null
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_reports_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          assignee_id: string | null
          authority_name: string | null
          category: Database["public"]["Enums"]["issue_category"]
          created_at: string
          created_by: string | null
          description: string
          downvotes_count: number
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          pincode: string | null
          priority: Database["public"]["Enums"]["priority_label"]
          priority_score: number
          reports_count: number
          resolved_at: string | null
          status: Database["public"]["Enums"]["issue_status"]
          title: string | null
          updated_at: string
          upvotes_count: number
        }
        Insert: {
          assignee_id?: string | null
          authority_name?: string | null
          category: Database["public"]["Enums"]["issue_category"]
          created_at?: string
          created_by?: string | null
          description: string
          downvotes_count?: number
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          pincode?: string | null
          priority?: Database["public"]["Enums"]["priority_label"]
          priority_score?: number
          reports_count?: number
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          title?: string | null
          updated_at?: string
          upvotes_count?: number
        }
        Update: {
          assignee_id?: string | null
          authority_name?: string | null
          category?: Database["public"]["Enums"]["issue_category"]
          created_at?: string
          created_by?: string | null
          description?: string
          downvotes_count?: number
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          pincode?: string | null
          priority?: Database["public"]["Enums"]["priority_label"]
          priority_score?: number
          reports_count?: number
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          title?: string | null
          updated_at?: string
          upvotes_count?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          issue_id: string | null
          message: string
          type: Database["public"]["Enums"]["notification_type"] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          issue_id?: string | null
          message: string
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          issue_id?: string | null
          message?: string
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      pincode_zones: {
        Row: {
          area: string | null
          authority_id: string | null
          city: string
          pincode: string
          state: string
          ward: string | null
        }
        Insert: {
          area?: string | null
          authority_id?: string | null
          city: string
          pincode: string
          state: string
          ward?: string | null
        }
        Update: {
          area?: string | null
          authority_id?: string | null
          city?: string
          pincode?: string
          state?: string
          ward?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      status_logs: {
        Row: {
          changed_by_id: string
          comment: string | null
          created_at: string
          id: string
          issue_id: string
          new_status: Database["public"]["Enums"]["issue_status"]
          old_status: Database["public"]["Enums"]["issue_status"] | null
        }
        Insert: {
          changed_by_id: string
          comment?: string | null
          created_at?: string
          id?: string
          issue_id: string
          new_status: Database["public"]["Enums"]["issue_status"]
          old_status?: Database["public"]["Enums"]["issue_status"] | null
        }
        Update: {
          changed_by_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          issue_id?: string
          new_status?: Database["public"]["Enums"]["issue_status"]
          old_status?: Database["public"]["Enums"]["issue_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "status_logs_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          issue_id: string
          user_id: string
          vote_type: Database["public"]["Enums"]["vote_type"]
        }
        Insert: {
          created_at?: string
          issue_id: string
          user_id: string
          vote_type: Database["public"]["Enums"]["vote_type"]
        }
        Update: {
          created_at?: string
          issue_id?: string
          user_id?: string
          vote_type?: Database["public"]["Enums"]["vote_type"]
        }
        Relationships: [
          {
            foreignKeyName: "votes_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_authority: {
        Args: {
          p_assignee_id: string
          p_authority_name: string
          p_comment?: string
          p_issue_id: string
        }
        Returns: Json
      }
      create_notification: {
        Args: {
          p_issue_id: string
          p_message: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_user_id: string
        }
        Returns: string
      }
      get_dashboard_stats: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recalculate_issue_priority: {
        Args: { p_issue_id: string }
        Returns: undefined
      }
      refresh_issue_reports_count: {
        Args: { p_issue_id: string }
        Returns: undefined
      }
      refresh_issue_vote_counts: {
        Args: { p_issue_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "citizen" | "admin" | "authority"
      issue_category:
        | "pothole"
        | "garbage"
        | "sewer_overflow"
        | "water_leakage"
        | "street_light"
        | "road_damage"
        | "other"
      issue_status:
        | "reported"
        | "verified"
        | "assigned"
        | "in_progress"
        | "resolved"
        | "rejected"
      notification_type:
        | "issue_created"
        | "issue_verified"
        | "authority_assigned"
        | "status_changed"
        | "issue_resolved"
        | "issue_rejected"
        | "duplicate_linked"
      priority_label: "low" | "medium" | "high"
      vote_type: "up" | "down"
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
      app_role: ["citizen", "admin", "authority"],
      issue_category: [
        "pothole",
        "garbage",
        "sewer_overflow",
        "water_leakage",
        "street_light",
        "road_damage",
        "other",
      ],
      issue_status: [
        "reported",
        "verified",
        "assigned",
        "in_progress",
        "resolved",
        "rejected",
      ],
      notification_type: [
        "issue_created",
        "issue_verified",
        "authority_assigned",
        "status_changed",
        "issue_resolved",
        "issue_rejected",
        "duplicate_linked",
      ],
      priority_label: ["low", "medium", "high"],
      vote_type: ["up", "down"],
    },
  },
} as const
