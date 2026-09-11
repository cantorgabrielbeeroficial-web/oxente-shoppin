export type HatTier = "bronze" | "prata" | "ouro";

export type TierConfig = {
  tier: HatTier;
  label: string;
  subtitle: string;
  cashback: number;
  minSpent: number;
  perks: string[];
};

/** Comissão retida pela plataforma Oxente em cada venda. */
export const PLATFORM_FEE_RATE = 0.12;

/** Percentual máximo do pedido que pode ser pago com Créditos Oxente. */
export const MAX_CREDIT_SHARE = 0.5;

export const CHECKIN_REWARD = 2;
export const REFERRAL_REWARD = 15;

export const TIERS: TierConfig[] = [
  {
    tier: "bronze",
    label: "Chapéu de Bronze",
    subtitle: "Iniciante",
    cashback: 0.01,
    minSpent: 0,
    perks: ["Cashback de 1% em todas as compras", "Ofertas exclusivas de lojas parceiras"],
  },
  {
    tier: "prata",
    label: "Chapéu de Prata",
    subtitle: "Intermediário",
    cashback: 0.03,
    minSpent: 500,
    perks: ["Cashback de 3% em todas as compras", "Descontos em fretes parceiros"],
  },
  {
    tier: "ouro",
    label: "Chapéu de Ouro",
    subtitle: "VIP",
    cashback: 0.05,
    minSpent: 2000,
    perks: ["Cashback máximo de 5%", "Acesso antecipado a lançamentos do sertão"],
  },
];

export function tierConfig(tier: HatTier): TierConfig {
  return TIERS.find((item) => item.tier === tier) ?? TIERS[0]!;
}

export function nextTier(tier: HatTier): TierConfig | null {
  const index = TIERS.findIndex((item) => item.tier === tier);
  return TIERS[index + 1] ?? null;
}

export function cashbackRate(tier: HatTier): number {
  return tierConfig(tier).cashback;
}

export function tierForSpend(totalSpent: number): HatTier {
  if (totalSpent >= 2000) return "ouro";
  if (totalSpent >= 500) return "prata";
  return "bronze";
}

export type LoyaltyTransaction = {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
};

export type LoyaltyState = {
  balance: number;
  totalSpent: number;
  tier: HatTier;
  referralCode: string;
  checkedInToday: boolean;
  checkinStreak: number;
  hasReferrer: boolean;
  transactions: LoyaltyTransaction[];
};
