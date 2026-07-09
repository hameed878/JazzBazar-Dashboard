import { useState } from "react";
import { X, ExternalLink, User, Calendar, Play, CreditCard } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { AdminUser, PackageKey } from "./types";

const PKG_ORDER: PackageKey[] = ["basic", "standard", "premium"];

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
  // Normalise pkg so it always matches one of the three known values
  const normalisedPkg = (PKG_ORDER.includes(user.pkg as PackageKey) ? user.pkg : "basic") as PackageKey;

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [pkg, setPkg] = useState<string>(normalisedPkg);
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

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })
    : "—";

  const planColors: Record<PackageKey, string> = {
    basic: "bg-gray-100 text-gray-700",
    standard: "bg-blue-100 text-blue-700",
    premium: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <p className="font-bold text-gray-800">Edit User</p>
            <p className="text-xs text-gray-400">ID #{user.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Read-only info strip */}
        <div className="px-6 pt-4 pb-3 bg-gray-50 border-b border-gray-100 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400 shrink-0" />
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Joined</p>
              <p className="text-xs text-gray-700 font-medium">{joinDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Play size={14} className="text-gray-400 shrink-0" />
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Total Ads Watched</p>
              <p className="text-xs text-gray-700 font-medium">{user.totalAdsWatched}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-gray-400 shrink-0" />
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Payment Method</p>
              <p className="text-xs text-gray-700 font-medium capitalize">{user.paymentMethod || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <User size={14} className="text-gray-400 shrink-0" />
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Current Plan</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${planColors[normalisedPkg]}`}>
                {packages[normalisedPkg]?.label ?? normalisedPkg}
              </span>
            </div>
          </div>
          {user.transactionImage && (
            <div className="col-span-2 flex items-center gap-2">
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">Transaction Receipt</p>
                <a
                  href={user.transactionImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:underline"
                >
                  <ExternalLink size={12} />
                  View Receipt Image
                </a>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">

          {/* Editable fields */}
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
                {/* Fixed order: basic → standard → premium */}
                {PKG_ORDER.map((k) => (
                  <option key={k} value={k}>
                    {packages[k]?.label ?? k}
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
                min="0"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500">Ads Watched Today</label>
              <input
                type="number"
                min="0"
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

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isBanned}
              onChange={(e) => setIsBanned(e.target.checked)}
              className="accent-jb-red"
            />
            Ban this user (blocks login)
          </label>

          {error && (
            <div className="bg-red-50 text-jb-red text-sm rounded-xl px-4 py-3 font-medium">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="text-jb-red text-sm font-semibold px-4 py-2.5 rounded-xl border border-jb-red/30 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete User"}
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-100 text-gray-700 font-semibold px-4 py-2.5 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-jb-red text-white font-semibold px-5 py-2.5 rounded-xl disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
