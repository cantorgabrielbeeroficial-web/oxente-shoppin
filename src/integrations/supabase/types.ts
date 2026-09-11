export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string;
          complement: string | null;
          created_at: string;
          district: string;
          id: string;
          is_default: boolean;
          label: string;
          number: string;
          recipient_name: string;
          state: string;
          street: string;
          user_id: string;
          zip_code: string;
        };
        Insert: {
          city: string;
          complement?: string | null;
          created_at?: string;
          district: string;
          id?: string;
          is_default?: boolean;
          label?: string;
          number: string;
          recipient_name?: string;
          state: string;
          street: string;
          user_id: string;
          zip_code: string;
        };
        Update: {
          city?: string;
          complement?: string | null;
          created_at?: string;
          district?: string;
          id?: string;
          is_default?: boolean;
          label?: string;
          number?: string;
          recipient_name?: string;
          state?: string;
          street?: string;
          user_id?: string;
          zip_code?: string;
        };
        Relationships: [];
      };
      cart_items: {
        Row: {
          added_at: string;
          id: string;
          product_id: string;
          quantity: number;
          user_id: string;
        };
        Insert: {
          added_at?: string;
          id?: string;
          product_id: string;
          quantity?: number;
          user_id: string;
        };
        Update: {
          added_at?: string;
          id?: string;
          product_id?: string;
          quantity?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      live_comments: {
        Row: {
          body: string;
          content_id: string;
          created_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          body: string;
          content_id: string;
          created_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          body?: string;
          content_id?: string;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      video_likes: {
        Row: {
          content_id: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          content_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          content_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      video_shares: {
        Row: {
          content_id: string;
          created_at: string;
          id: string;
          user_id: string | null;
        };
        Insert: {
          content_id: string;
          created_at?: string;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          content_id?: string;
          created_at?: string;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      store_followers: {
        Row: {
          created_at: string;
          store_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          store_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          store_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "store_followers_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "store_followers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      loyalty_accounts: {
        Row: {
          balance: number;
          checkin_streak: number;
          created_at: string;
          last_checkin_date: string | null;
          referral_code: string;
          referred_by: string | null;
          tier: Database["public"]["Enums"]["hat_tier"];
          total_spent: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          balance?: number;
          checkin_streak?: number;
          created_at?: string;
          last_checkin_date?: string | null;
          referral_code?: string;
          referred_by?: string | null;
          tier?: Database["public"]["Enums"]["hat_tier"];
          total_spent?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          balance?: number;
          checkin_streak?: number;
          created_at?: string;
          last_checkin_date?: string | null;
          referral_code?: string;
          referred_by?: string | null;
          tier?: Database["public"]["Enums"]["hat_tier"];
          total_spent?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          browser_enabled: boolean;
          phone_enabled: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          browser_enabled?: boolean;
          phone_enabled?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          browser_enabled?: boolean;
          phone_enabled?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      loyalty_transactions: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          order_id: string | null;
          reason: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          order_id?: string | null;
          reason: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          order_id?: string | null;
          reason?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          quantity: number;
          unit_price: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          quantity: number;
          unit_price: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          quantity?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          buyer_id: string;
          created_at: string;
          credits_applied: number;
          id: string;
          payout_status: Database["public"]["Enums"]["payout_status"];
          platform_fee: number;
          seller_net: number;
          shipping_address: string;
          shipping_recipient: string;
          status: Database["public"]["Enums"]["order_status"];
          store_id: string;
          total: number;
        };
        Insert: {
          buyer_id: string;
          created_at?: string;
          credits_applied?: number;
          id?: string;
          payout_status?: Database["public"]["Enums"]["payout_status"];
          platform_fee?: number;
          seller_net?: number;
          shipping_address?: string;
          shipping_recipient?: string;
          status?: Database["public"]["Enums"]["order_status"];
          store_id: string;
          total?: number;
        };
        Update: {
          buyer_id?: string;
          created_at?: string;
          credits_applied?: number;
          id?: string;
          payout_status?: Database["public"]["Enums"]["payout_status"];
          platform_fee?: number;
          seller_net?: number;
          shipping_address?: string;
          shipping_recipient?: string;
          status?: Database["public"]["Enums"]["order_status"];
          store_id?: string;
          total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      payouts: {
        Row: {
          created_at: string;
          gross_amount: number;
          id: string;
          net_amount: number;
          order_id: string;
          platform_fee: number;
          provider_transfer_id: string | null;
          status: Database["public"]["Enums"]["payout_status"];
          store_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          gross_amount: number;
          id?: string;
          net_amount: number;
          order_id: string;
          platform_fee: number;
          provider_transfer_id?: string | null;
          status?: Database["public"]["Enums"]["payout_status"];
          store_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          gross_amount?: number;
          id?: string;
          net_amount?: number;
          order_id?: string;
          platform_fee?: number;
          provider_transfer_id?: string | null;
          status?: Database["public"]["Enums"]["payout_status"];
          store_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payouts_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payouts_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          active: boolean;
          category_id: string | null;
          created_at: string;
          description: string;
          height_cm: number | null;
          id: string;
          image_url: string | null;
          images: string[] | null;
          length_cm: number | null;
          name: string;
          price: number;
          stock: number;
          store_id: string;
          variations: Json | null;
          weight_kg: number | null;
          width_cm: number | null;
        };
        Insert: {
          active?: boolean;
          category_id?: string | null;
          created_at?: string;
          description?: string;
          height_cm?: number | null;
          id?: string;
          image_url?: string | null;
          images?: string[] | null;
          length_cm?: number | null;
          name: string;
          price: number;
          stock?: number;
          store_id: string;
          variations?: Json | null;
          weight_kg?: number | null;
          width_cm?: number | null;
        };
        Update: {
          active?: boolean;
          category_id?: string | null;
          created_at?: string;
          description?: string;
          height_cm?: number | null;
          id?: string;
          image_url?: string | null;
          images?: string[] | null;
          length_cm?: number | null;
          name?: string;
          price?: number;
          stock?: number;
          store_id?: string;
          variations?: Json | null;
          weight_kg?: number | null;
          width_cm?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      seller_applications: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          reviewed_at: string | null;
          status: Database["public"]["Enums"]["application_status"];
          store_name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          reviewed_at?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          store_name: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          reviewed_at?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          store_name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      stores: {
        Row: {
          active: boolean;
          banner_url: string | null;
          created_at: string;
          description: string;
          id: string;
          logo_url: string | null;
          name: string;
          owner_id: string | null;
          slug: string;
          store_kind: "bodega" | "interligada";
        };
        Insert: {
          active?: boolean;
          banner_url?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          logo_url?: string | null;
          name: string;
          owner_id?: string | null;
          slug: string;
          store_kind?: "bodega" | "interligada";
        };
        Update: {
          active?: boolean;
          banner_url?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          logo_url?: string | null;
          name?: string;
          owner_id?: string | null;
          slug?: string;
          store_kind?: "bodega" | "interligada";
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_my_store: {
        Args: { _description: string; _name: string };
        Returns: {
          active: boolean;
          banner_url: string | null;
          created_at: string;
          description: string;
          id: string;
          logo_url: string | null;
          name: string;
          owner_id: string | null;
          slug: string;
          store_kind: "bodega" | "interligada";
        };
        SetofOptions: {
          from: "*";
          to: "stores";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      decrement_stock: {
        Args: { _product_id: string; _quantity: number };
        Returns: undefined;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      loyalty_apply_credits: {
        Args: {
          _amount: number;
          _order_id: string;
          _reason: string;
          _user_id: string;
        };
        Returns: number;
      };
      loyalty_register_spend: {
        Args: { _amount: number; _user_id: string };
        Returns: Database["public"]["Enums"]["hat_tier"];
      };
      owns_store: { Args: { _store_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "seller" | "buyer";
      application_status: "pending" | "approved" | "rejected";
      hat_tier: "bronze" | "prata" | "ouro";
      order_status: "pendente" | "confirmado" | "enviado" | "entregue" | "cancelado";
      payout_status: "pendente" | "processando" | "repassado" | "cancelado";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "seller", "buyer"],
      application_status: ["pending", "approved", "rejected"],
      hat_tier: ["bronze", "prata", "ouro"],
      order_status: ["pendente", "confirmado", "enviado", "entregue", "cancelado"],
      payout_status: ["pendente", "processando", "repassado", "cancelado"],
    },
  },
} as const;
