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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      delivery_lines: {
        Row: {
          delivery_id: string
          id: string
          product_id: string
          qty: number
        }
        Insert: {
          delivery_id: string
          id?: string
          product_id: string
          qty?: number
        }
        Update: {
          delivery_id?: string
          id?: string
          product_id?: string
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "delivery_lines_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_orders: {
        Row: {
          created_at: string
          created_by: string | null
          customer: string
          id: string
          location_id: string
          reference: string
          scheduled_date: string | null
          status: Database["public"]["Enums"]["doc_status"]
          validated_at: string | null
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer: string
          id?: string
          location_id: string
          reference: string
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          validated_at?: string | null
          warehouse_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer?: string
          id?: string
          location_id?: string
          reference?: string
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          validated_at?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          id: string
          name: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          name: string
          reorder_point: number
          reorder_qty: number
          sku: string
          unit_cost: number
          unit_of_measure: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          name: string
          reorder_point?: number
          reorder_qty?: number
          sku: string
          unit_cost?: number
          unit_of_measure?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          name?: string
          reorder_point?: number
          reorder_qty?: number
          sku?: string
          unit_cost?: number
          unit_of_measure?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      receipt_lines: {
        Row: {
          id: string
          product_id: string
          qty_expected: number
          qty_received: number
          receipt_id: string
        }
        Insert: {
          id?: string
          product_id: string
          qty_expected?: number
          qty_received?: number
          receipt_id: string
        }
        Update: {
          id?: string
          product_id?: string
          qty_expected?: number
          qty_received?: number
          receipt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_lines_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          created_at: string
          created_by: string | null
          expected_date: string | null
          id: string
          location_id: string
          reference: string
          status: Database["public"]["Enums"]["doc_status"]
          supplier: string
          validated_at: string | null
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          location_id: string
          reference: string
          status?: Database["public"]["Enums"]["doc_status"]
          supplier: string
          validated_at?: string | null
          warehouse_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          location_id?: string
          reference?: string
          status?: Database["public"]["Enums"]["doc_status"]
          supplier?: string
          validated_at?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_ledger: {
        Row: {
          created_at: string
          created_by: string | null
          delta: number
          id: string
          location_id: string
          product_id: string
          ref_doc_id: string | null
          ref_label: string | null
          type: Database["public"]["Enums"]["ledger_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          delta: number
          id?: string
          location_id: string
          product_id: string
          ref_doc_id?: string | null
          ref_label?: string | null
          type: Database["public"]["Enums"]["ledger_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          delta?: number
          id?: string
          location_id?: string
          product_id?: string
          ref_doc_id?: string | null
          ref_label?: string | null
          type?: Database["public"]["Enums"]["ledger_type"]
        }
        Relationships: [
          {
            foreignKeyName: "stock_ledger_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ledger_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_levels: {
        Row: {
          location_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          location_id: string
          product_id: string
          quantity?: number
        }
        Update: {
          location_id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_levels_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_levels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
      warehouses: {
        Row: {
          address: string | null
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_delivery: {
        Args: { p_delivery_id: string }
        Returns: Database["public"]["Enums"]["doc_status"]
      }
      validate_receipt: {
        Args: { p_receipt_id: string }
        Returns: Database["public"]["Enums"]["doc_status"]
      }
    }
    Enums: {
      app_role: "manager" | "staff"
      doc_status:
        | "draft"
        | "waiting"
        | "picking"
        | "packing"
        | "ready"
        | "done"
        | "canceled"
        | "backorder"
      ledger_type: "receipt" | "delivery" | "transfer" | "adjustment"
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
    Enums: {
      app_role: ["manager", "staff"],
      doc_status: [
        "draft",
        "waiting",
        "picking",
        "packing",
        "ready",
        "done",
        "canceled",
        "backorder",
      ],
      ledger_type: ["receipt", "delivery", "transfer", "adjustment"],
    },
  },
} as const
