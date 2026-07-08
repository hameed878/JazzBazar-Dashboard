import { useState } from "react";
import { X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { AdminUser, PackageKey } from "./types";

export default function UserEditModal({
  user,
  packages,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  packages: Record<PackageKey, { label: string; price: number; dailyAds: number }>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [pkg, setPkg] = useState(user.pkg);
  const [status, setStatus] = useState(user.status);
  const [balance, setBalance] = useState(user.balance);
  const [adsWatchedToday, setAdsWatchedToday] = useState(String(user.adsWatchedToday));
  const [isBanned, setIsBanned] = useState(user.isBanned);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const patch: Record<string, any> = {
        name,
        phone,
        pkg,
        status,
        balance: parseFloat(balance),
        adsWatchedToday: parseInt(adsWatchedToday, 10) || 0,
        isBanned,
      };
      if (password) patch.password = password;
      await apiRequest(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Permanently delete ${user.name}'s account? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await apiRequest(`/api/admin/users/${user.id}`, { method: "DELETE" });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <p className="font-bold text-gray-800">Edit User</p>
          <button onClick={onClose} className="text-gray-400">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Package</label>
              <select
                value={pkg}
                onChange={(e) => setPkg(e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-jb-red"
              >
                {(Object.keys(packages) as PackageKey[]).map((k) => (
                  <option key={k} value={k}>
                    {packages[k].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-jb-red"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Balance (USD)</label>
              <input
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Ads Watched Today</label>
              <input
                type="number"
                value={adsWatchedToday}
                onChange={(e) => setAdsWatchedToday(e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500">Reset Password (optional)</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isBanned} onChange={(e) => setIsBanned(e.target.checked)} />
            Ban this user (blocks login)
          </label>

          {error && <div className="bg-red-50 text-jb-red text-sm rounded-xl px-4 py-3 font-medium">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="text-jb-red text-sm font-semibold px-4 py-2.5 rounded-xl border border-jb-red/30 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete User"}
            </button>
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="bg-gray-100 text-gray-700 font-semibold px-4 py-2.5 rounded-xl">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-jb-red text-white font-semibold px-5 py-2.5 rounded-xl disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
