export type UsageHistoryEntry = {
  date: string;
  count: number;
};

export type UsageSnapshot = {
  plan: "free" | "premium";
  limit: number;
  used: number;
  remaining: number;
  usageHistory: UsageHistoryEntry[];
};
