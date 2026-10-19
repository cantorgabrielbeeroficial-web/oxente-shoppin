import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function AdminRoute() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || data?.role !== "admin") {
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
      }
      setLoading(false);
    }

    checkAdmin();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-lg font-medium">
        Verificando permissões de Administrador...
      </div>
    );
  }

  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}