export interface AdminUser {
  id: number;
  name: string;
  phone: string;
  pkg: string;
  paymentMethod: string;
  transactionImage: string;
  status: string;
  balance: string;
  adsWatchedToday: number;
  totalAdsWatched: number;
  lastAdDate: string | null;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: string;
}

export interface AdminWithdrawal {
  id: number;
  userId: number;
  amount: string;
  method: string;
  accountNumber: string;
  accountName: string;
  status: string;
  createdAt: string;
  user: AdminUser | null;
}

export interface AdminAd {
  id: number;
  title: string;
  brand: string;
  category: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  active: boolean;
  createdAt: string;
}

export type PackageKey = "basic" | "standard" | "premium";

export interface AppConfig {
  jazzcashNumber: string;
  easypaisaNumber: string;
  accountName: string;
  adReward: number;
  minWithdrawal: number;
  packages: Record<PackageKey, { label: string; price: number; dailyAds: number }>;
}

export interface Stats {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  rejectedUsers: number;
  bannedUsers: number;
  totalBalance: number;
  totalAdsWatched: number;
  totalDeposits: number;
  approvedDeposits: number;
  pendingWithdrawals: number;
  pendingWithdrawalAmount: number;
  paidWithdrawalAmount: number;
}
