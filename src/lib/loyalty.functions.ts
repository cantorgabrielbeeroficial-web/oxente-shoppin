import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CHECKIN_REWARD, REFERRAL_REWARD, tierForSpend, type LoyaltyState } from "./loyalty";

const ACCOUNT_SELECT =
  "user_id, balance, total_spent, tier, last_checkin_date, checkin_streak, referral_code, referred_by";

/** RPC exige string; pedidos avulsos não têm order_id. */
const NO_ORDER = null as unknown as string;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export const getLoyalty = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LoyaltyState> => {
    const { supabase, userId } = context;

    let { data: account } = await supabase
      .from("loyalty_accounts")
      .select(ACCOUNT_SELECT)
      .eq("user_id", userId)
      .maybeSingle();

    if (!account) {
      await supabase.from("loyalty_accounts").insert({ user_id: userId });
      const created = await supabase
        .from("loyalty_accounts")
        .select(ACCOUNT_SELECT)
        .eq("user_id", userId)
        .maybeSingle();
      account = created.data;
    }

    const { data: transactions } = await supabase
      .from("loyalty_transactions")
      .select("id, amount, reason, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8);

    return {
      balance: Number(account?.balance ?? 0),
      totalSpent: Number(account?.total_spent ?? 0),
      tier: account?.tier ?? "bronze",
      referralCode: account?.referral_code ?? "",
      checkedInToday: account?.last_checkin_date === todayISO(),
      checkinStreak: account?.checkin_streak ?? 0,
      hasReferrer: Boolean(account?.referred_by),
      transactions: (transactions ?? []).map((row) => ({
        id: row.id,
        amount: Number(row.amount),
        reason: row.reason,
        created_at: row.created_at,
      })),
    };
  });

export const dailyCheckin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ balance: number; reward: number; streak: number }> => {
    const { supabase, userId } = context;
    const today = todayISO();

    const { data: account } = await supabase
      .from("loyalty_accounts")
      .select("last_checkin_date, checkin_streak")
      .eq("user_id", userId)
      .maybeSingle();

    if (account?.last_checkin_date === today) {
      throw new Error("Você já fez o check-in de hoje. Volte amanhã!");
    }

    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const streak = account?.last_checkin_date === yesterday ? (account.checkin_streak ?? 0) + 1 : 1;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("loyalty_accounts")
      .upsert({ user_id: userId, last_checkin_date: today, checkin_streak: streak });

    const { data: balance, error } = await supabaseAdmin.rpc("loyalty_apply_credits", {
      _user_id: userId,
      _amount: CHECKIN_REWARD,
      _reason: `Check-in diário (sequência de ${streak})`,
      _order_id: NO_ORDER,
    });
    if (error) throw new Error(error.message);

    return { balance: Number(balance ?? 0), reward: CHECKIN_REWARD, streak };
  });

export const redeemReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ code: z.string().trim().min(4).max(16) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ balance: number; reward: number }> => {
    const { supabase, userId } = context;

    const { data: mine } = await supabase
      .from("loyalty_accounts")
      .select("referral_code, referred_by")
      .eq("user_id", userId)
      .maybeSingle();

    const code = data.code.toUpperCase();
    if (mine?.referred_by) throw new Error("Você já usou um código de indicação.");
    if (mine?.referral_code === code) throw new Error("Você não pode usar seu próprio código.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: owner } = await supabaseAdmin
      .from("loyalty_accounts")
      .select("user_id")
      .eq("referral_code", code)
      .maybeSingle();
    if (!owner) throw new Error("Código de indicação não encontrado.");

    await supabaseAdmin
      .from("loyalty_accounts")
      .upsert({ user_id: userId, referred_by: owner.user_id });

    const { data: balance, error } = await supabaseAdmin.rpc("loyalty_apply_credits", {
      _user_id: userId,
      _amount: REFERRAL_REWARD,
      _reason: "Bônus por usar código de indicação",
      _order_id: NO_ORDER,
    });
    if (error) throw new Error(error.message);

    await supabaseAdmin.rpc("loyalty_apply_credits", {
      _user_id: owner.user_id,
      _amount: REFERRAL_REWARD,
      _reason: "Bônus por indicar um novo comprador",
      _order_id: NO_ORDER,
    });

    return { balance: Number(balance ?? 0), reward: REFERRAL_REWARD };
  });

/** Recalcula o nível a partir do total gasto (usado após pedidos). */
export function tierFromSpend(totalSpent: number) {
  return tierForSpend(totalSpent);
}
