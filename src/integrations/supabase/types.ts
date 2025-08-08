export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author: string
          category: string
          content: string
          created_at: string
          date: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          author: string
          category?: string
          content: string
          created_at?: string
          date?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          category?: string
          content?: string
          created_at?: string
          date?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_tasks: {
        Row: {
          assigned_date: string
          completed_at: string | null
          created_at: string
          employee_id: string
          id: string
          is_completed: boolean | null
          priority: number | null
          task_description: string
          updated_at: string
        }
        Insert: {
          assigned_date?: string
          completed_at?: string | null
          created_at?: string
          employee_id: string
          id?: string
          is_completed?: boolean | null
          priority?: number | null
          task_description: string
          updated_at?: string
        }
        Update: {
          assigned_date?: string
          completed_at?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          is_completed?: boolean | null
          priority?: number | null
          task_description?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_tasks_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          hourly_rate: number
          id: string
          name: string
          position: string | null
          shift_type: string | null
        }
        Insert: {
          created_at?: string
          hourly_rate?: number
          id?: string
          name: string
          position?: string | null
          shift_type?: string | null
        }
        Update: {
          created_at?: string
          hourly_rate?: number
          id?: string
          name?: string
          position?: string | null
          shift_type?: string | null
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      expense_transactions: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          description: string
          id: string
          notes: string | null
          payment_account_id: string | null
          transaction_date: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          category_id: string
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          payment_account_id?: string | null
          transaction_date: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          payment_account_id?: string | null
          transaction_date?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_transactions_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_transactions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_tab_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          guest_tab_id: string
          id: string
          item_date: string
          notes: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          guest_tab_id: string
          id?: string
          item_date: string
          notes?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          guest_tab_id?: string
          id?: string
          item_date?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_tab_items_guest_tab_id_fkey"
            columns: ["guest_tab_id"]
            isOneToOne: false
            referencedRelation: "guest_tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_tabs: {
        Row: {
          check_in_date: string | null
          check_out_date: string | null
          created_at: string
          guest_name: string
          id: string
          is_settled: boolean
          notes: string | null
          payment_account_id: string | null
          settled_at: string | null
          total_balance: number
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string
          guest_name: string
          id?: string
          is_settled?: boolean
          notes?: string | null
          payment_account_id?: string | null
          settled_at?: string | null
          total_balance?: number
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string
          guest_name?: string
          id?: string
          is_settled?: boolean
          notes?: string | null
          payment_account_id?: string | null
          settled_at?: string | null
          total_balance?: number
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_tabs_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_tabs_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      income_transactions: {
        Row: {
          channel_id: string
          created_at: string
          description: string | null
          extra_fees: number
          id: string
          net_income: number
          notes: string | null
          payment_account_id: string | null
          rental_income: number
          tax_amount: number
          transaction_date: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          description?: string | null
          extra_fees?: number
          id?: string
          net_income?: number
          notes?: string | null
          payment_account_id?: string | null
          rental_income?: number
          tax_amount?: number
          transaction_date: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          description?: string | null
          extra_fees?: number
          id?: string
          net_income?: number
          notes?: string | null
          payment_account_id?: string | null
          rental_income?: number
          tax_amount?: number
          transaction_date?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_transactions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "rental_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_transactions_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_transactions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string
          cost_per_unit: number
          created_at: string
          current_stock: number
          id: string
          is_needed: boolean
          minimum_stock: number
          name: string
          needed_quantity: number | null
          notes: string | null
          supplier: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string
          cost_per_unit?: number
          created_at?: string
          current_stock?: number
          id?: string
          is_needed?: boolean
          minimum_stock?: number
          name: string
          needed_quantity?: number | null
          notes?: string | null
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string
          cost_per_unit?: number
          created_at?: string
          current_stock?: number
          id?: string
          is_needed?: boolean
          minimum_stock?: number
          name?: string
          needed_quantity?: number | null
          notes?: string | null
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          food_cost: number
          id: string
          image_url: string | null
          inventory_amount: number
          is_available: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          food_cost?: number
          id?: string
          image_url?: string | null
          inventory_amount?: number
          is_available?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          food_cost?: number
          id?: string
          image_url?: string | null
          inventory_amount?: number
          is_available?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id: string
          order_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "financial_tracker_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_name: string
          customer_whatsapp: string
          id: string
          location: string
          messaging_platform: string
          special_requests: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          customer_whatsapp: string
          id?: string
          location: string
          messaging_platform?: string
          special_requests?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          customer_whatsapp?: string
          id?: string
          location?: string
          messaging_platform?: string
          special_requests?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_accounts: {
        Row: {
          account_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          account_type: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          account_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_notes: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          note: string
          time_entry_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          note: string
          time_entry_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          note?: string
          time_entry_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_notes_employee_fk"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_notes_time_entry_fk"
            columns: ["time_entry_id"]
            isOneToOne: false
            referencedRelation: "time_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      profit_goals: {
        Row: {
          created_at: string
          goal_amount: number
          id: string
          month: number
          unit_id: string | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          goal_amount?: number
          id?: string
          month: number
          unit_id?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          goal_amount?: number
          id?: string
          month?: number
          unit_id?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "profit_goals_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_channels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          clock_in: string | null
          clock_out: string | null
          created_at: string
          employee_id: string
          entry_date: string
          id: string
          is_paid: boolean | null
          lunch_in: string | null
          lunch_out: string | null
          paid_amount: number | null
          paid_at: string | null
          updated_at: string
        }
        Insert: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          employee_id: string
          entry_date?: string
          id?: string
          is_paid?: boolean | null
          lunch_in?: string | null
          lunch_out?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          updated_at?: string
        }
        Update: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          employee_id?: string
          entry_date?: string
          id?: string
          is_paid?: boolean | null
          lunch_in?: string | null
          lunch_out?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_schedules: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          schedule_date: string
          time_in: string
          time_out: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          schedule_date: string
          time_in: string
          time_out: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          schedule_date?: string
          time_in?: string
          time_out?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      financial_tracker_orders: {
        Row: {
          amount: number | null
          created_at: string | null
          customer_name: string | null
          customer_whatsapp: string | null
          id: string | null
          location: string | null
          messaging_platform: string | null
          notes: string | null
          status: string | null
          transaction_date: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          customer_name?: string | null
          customer_whatsapp?: string | null
          id?: string | null
          location?: string | null
          messaging_platform?: string | null
          notes?: string | null
          status?: string | null
          transaction_date?: never
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          customer_name?: string | null
          customer_whatsapp?: string | null
          id?: string | null
          location?: string | null
          messaging_platform?: string | null
          notes?: string | null
          status?: string | null
          transaction_date?: never
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "manager" | "user"
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
      app_role: ["manager", "user"],
    },
  },
} as const
