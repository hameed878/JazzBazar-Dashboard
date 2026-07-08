import { useMemo, useState } from "react";
import { Search, Pencil, ShieldAlert } from "lucide-react";
import type { AdminUser, PackageKey } from "./types";
import UserEditModal from "./UserEditModal";

export default function Users({
  users,
  packages,
  reload,
}: {
  users: AdminUser[];
  packages: Record<PackageKey, { label: string; price: number; dailyAds: number }>;
  reload: () => void;
}) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => !u.isAdmin)
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.phone.includes(q));
  }, [users, query]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-bold text-gray-800">All Users ({filtered.length})</h2>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or phone..."
            className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Package</th>
                <th className="text-left px-4 py-3">Balance</th>
                <th className="text-left px-4 py-3">Ads Watched</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">
                    No users found
                  </td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    <div className="flex items-center gap-1.5">
                      {u.name}
                      {u.isBanned && <ShieldAlert size={14} className="text-red-500" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.phone}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{packages[u.pkg as PackageKey]?.label || u.pkg}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">${parseFloat(u.balance).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-600">{u.totalAdsWatched}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
                        u.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : u.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditing(u)}
                      className="flex items-center gap-1 text-jb-red text-xs font-semibold px-3 py-1.5 rounded-lg border border-jb-red/30 hover:bg-red-50"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <UserEditModal
          user={editing}
          packages={packages}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      )}
    </div>
  );
}
