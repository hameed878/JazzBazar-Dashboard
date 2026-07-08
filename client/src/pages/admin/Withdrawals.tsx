import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { AdminWithdrawal } from "./types";

export default function Withdrawals({ withdrawals, reload }: { withdrawals: AdminWithdrawal[]; reload: () => void }) {
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const filtered = withdrawals.filter((w) => (filter === "all" ? true : w.status === filter));

  async function approve(id: number) {
    await apiRequest(`/api/admin/withdrawals/${id}/approve`, { method: "POST" });
    reload();
  }

  async function reject(id: number) {
    await apiRequest(`/api/admin/withdrawals/${id}/reject`, { method: "POST" });
    reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-gray-800">Withdrawal Requests</h2>
        <div className="flex gap-2 flex-wrap">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
                filter === f ? "bg-jb-red text-white" : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Method</th>
                <th className="text-left px-4 py-3">Account</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">
                    No withdrawal requests found
                  </td>
                </tr>
              )}
              {filtered.map((w) => (
                <tr key={w.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800">{w.user?.name || "Unknown"}</p>
                    <p className="text-xs text-gray-400">{w.user?.phone}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-800">${parseFloat(w.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{w.method}</td>
                  <td className="px-4 py-3">
                    <p className="text-gray-800">{w.accountNumber}</p>
                    <p className="text-xs text-gray-400">{w.accountName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
                        w.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : w.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {w.status === "approved" ? "paid" : w.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(w.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {w.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => approve(w.id)}
                          title="Mark as paid"
                          className="flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                        >
                          <CheckCircle size={14} /> Pay
                        </button>
                        <button
                          onClick={() => reject(w.id)}
                          title="Reject and refund balance"
                          className="flex items-center gap-1 bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
