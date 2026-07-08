import { Users, UserCheck, UserX, Clock, Wallet, PlayCircle, DollarSign, Ban } from "lucide-react";
import type { Stats } from "./types";

export default function Overview({ stats }: { stats: Stats | null }) {
  if (!stats) return <div className="text-gray-400 text-sm">Loading stats...</div>;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: <Users size={18} />, color: "bg-blue-50 text-blue-600" },
    { label: "Pending Verification", value: stats.pendingUsers, icon: <Clock size={18} />, color: "bg-yellow-50 text-yellow-600" },
    { label: "Approved Users", value: stats.approvedUsers, icon: <UserCheck size={18} />, color: "bg-green-50 text-green-600" },
    { label: "Rejected Users", value: stats.rejectedUsers, icon: <UserX size={18} />, color: "bg-red-50 text-red-600" },
    { label: "Banned Users", value: stats.bannedUsers, icon: <Ban size={18} />, color: "bg-gray-100 text-gray-600" },
    { label: "Ads Watched (All Time)", value: stats.totalAdsWatched, icon: <PlayCircle size={18} />, color: "bg-purple-50 text-purple-600" },
    { label: "Total User Balance", value: `$${stats.totalBalance.toFixed(2)}`, icon: <DollarSign size={18} />, color: "bg-emerald-50 text-emerald-600" },
    { label: "Pending Withdrawals", value: `${stats.pendingWithdrawals} ($${stats.pendingWithdrawalAmount.toFixed(2)})`, icon: <Wallet size={18} />, color: "bg-orange-50 text-orange-600" },
    { label: "Paid Out", value: `$${stats.paidWithdrawalAmount.toFixed(2)}`, icon: <Wallet size={18} />, color: "bg-teal-50 text-teal-600" },
    { label: "Total Deposits (Rs)", value: `Rs ${stats.totalDeposits.toLocaleString()}`, icon: <DollarSign size={18} />, color: "bg-indigo-50 text-indigo-600" },
    { label: "Verified Deposits (Rs)", value: `Rs ${stats.approvedDeposits.toLocaleString()}`, icon: <DollarSign size={18} />, color: "bg-pink-50 text-pink-600" },
  ];

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-4">Overview</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.color}`}>{c.icon}</div>
            <p className="text-xl font-extrabold text-gray-800">{c.value}</p>
            <p className="text-xs text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
