import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { AppConfig, PackageKey } from "./types";

export default function Settings({ config, reload }: { config: AppConfig; reload: () => void }) {
  const [jazzcashNumber, setJazzcashNumber] = useState(config.jazzcashNumber);
  const [easypaisaNumber, setEasypaisaNumber] = useState(config.easypaisaNumber);
  const [accountName, setAccountName] = useState(config.accountName);
  const [adReward, setAdReward] = useState(String(config.adReward));
  const [minWithdrawal, setMinWithdrawal] = useState(String(config.minWithdrawal));
  const [packages, setPackages] = useState(config.packages);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setJazzcashNumber(config.jazzcashNumber);
    setEasypaisaNumber(config.easypaisaNumber);
    setAccountName(config.accountName);
    setAdReward(String(config.adReward));
    setMinWithdrawal(String(config.minWithdrawal));
    setPackages(config.packages);
  }, [config]);

  function updatePackage(key: PackageKey, field: "price" | "dailyAds" | "label", value: string) {
    setPackages((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: field === "label" ? value : Number(value),
      },
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await apiRequest("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          jazzcashNumber,
          easypaisaNumber,
          accountName,
          adReward: parseFloat(adReward),
          minWithdrawal: parseFloat(minWithdrawal),
          packages,
        }),
      });
      reload();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6 max-w-2xl">
      <h2 className="text-lg font-bold text-gray-800">Platform Settings</h2>

      <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4">
        <p className="font-semibold text-gray-800">Payment Receiving Accounts</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500">JazzCash Number</label>
            <input
              value={jazzcashNumber}
              onChange={(e) => setJazzcashNumber(e.target.value)}
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">EasyPaisa Number</label>
            <input
              value={easypaisaNumber}
              onChange={(e) => setEasypaisaNumber(e.target.value)}
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-gray-500">Account Holder Name</label>
            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4">
        <p className="font-semibold text-gray-800">Earnings &amp; Withdrawal</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500">Reward per Ad (USD)</label>
            <input
              type="number"
              step="0.01"
              value={adReward}
              onChange={(e) => setAdReward(e.target.value)}
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">Minimum Withdrawal (USD)</label>
            <input
              type="number"
              step="0.01"
              value={minWithdrawal}
              onChange={(e) => setMinWithdrawal(e.target.value)}
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4">
        <p className="font-semibold text-gray-800">Membership Packages</p>
        {(Object.keys(packages) as PackageKey[]).map((key) => (
          <div key={key} className="border border-gray-100 rounded-xl p-3 grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500">Label</label>
              <input
                value={packages[key].label}
                onChange={(e) => updatePackage(key, "label", e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500">Price (Rs)</label>
              <input
                type="number"
                value={packages[key].price}
                onChange={(e) => updatePackage(key, "price", e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500">Daily Ads Limit</label>
              <input
                type="number"
                value={packages[key].dailyAds}
                onChange={(e) => updatePackage(key, "dailyAds", e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="self-start bg-jb-red text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 disabled:opacity-60"
      >
        <Save size={16} />
        {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
      </button>
    </form>
  );
}
