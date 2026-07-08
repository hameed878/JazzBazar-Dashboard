import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import {
  Home,
  MapPin,
  QrCode,
  Search,
  Star,
  PlayCircle,
  Wallet,
  MoreHorizontal,
  Clock,
  X,
} from "lucide-react";

type PackageKey = "basic" | "standard" | "premium";

interface AppConfig {
  jazzcashNumber: string;
  easypaisaNumber: string;
  accountName: string;
  adReward: number;
  minWithdrawal: number;
  packages: Record<PackageKey, { label: string; price: number; dailyAds: number }>;
}

interface AdItem {
  id: number;
  title: string;
  brand: string;
  category: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
}

export default function Dashboard() {
  const { user, setUser, logout } = useAuth();
  const [, navigate] = useLocation();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [activeAd, setActiveAd] = useState<AdItem | null>(null);
  const [watching, setWatching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<"jazzcash" | "easypaisa">("jazzcash");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [withdrawName, setWithdrawName] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    apiRequest("/api/config").then(setConfig).catch(() => {});
    apiRequest("/api/ads")
      .then((data) => setAds(data.ads))
      .catch(() => {});
  }, []);

  if (!user || !config) return null;

  const info = config.packages[user.pkg as PackageKey] || config.packages.basic;
  const today = new Date().toISOString().slice(0, 10);
  const watchedToday = user.lastAdDate === today ? user.adsWatchedToday : 0;
  const adsLeft = Math.max(info.dailyAds - watchedToday, 0);
  const isPending = user.status === "pending";
  const isRejected = user.status === "rejected";

  function openAdPicker() {
    if (isPending) {
      setMessage({ type: "error", text: "Your account is pending admin verification." });
      return;
    }
    if (isRejected) {
      setMessage({ type: "error", text: "Your payment was not verified. Contact support." });
      return;
    }
    if (adsLeft <= 0) {
      setMessage({ type: "error", text: "You've reached your daily ad limit. Come back tomorrow!" });
      return;
    }
    if (ads.length === 0) {
      setMessage({ type: "error", text: "No ads available right now, please check back soon." });
      return;
    }
    setMessage(null);
    setActiveAd(ads[Math.floor(Math.random() * ads.length)]);
    setProgress(0);
    setWatching(true);
  }

  function handleVideoEnded() {
    finishAdWatch();
  }

  async function finishAdWatch() {
    try {
      const data = await apiRequest("/api/ads/watch", { method: "POST" });
      setUser(data.user);
      setMessage({ type: "success", text: `You earned $${Number(data.reward).toFixed(2)}!` });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setWatching(false);
      setActiveAd(null);
      setProgress(0);
    }
  }

  function closeAdEarly() {
    setWatching(false);
    setActiveAd(null);
    setProgress(0);
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setWithdrawLoading(true);
    setMessage(null);
    try {
      const data = await apiRequest("/api/withdraw", {
        method: "POST",
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          method: withdrawMethod,
          accountNumber: withdrawAccount,
          accountName: withdrawName,
        }),
      });
      setUser({ ...user, balance: data.balance });
      setMessage({ type: "success", text: "Withdrawal request submitted!" });
      setShowWithdraw(false);
      setWithdrawAmount("");
      setWithdrawAccount("");
      setWithdrawName("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setWithdrawLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="mobile-shell pb-24">
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#121212] px-5 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-2xl font-extrabold tracking-tight">
            Jazz<span className="text-jb-yellow">Bazar</span>
          </h1>
          <div className="flex items-center gap-4 text-white">
            <button onClick={handleLogout} title="Logout">
              <MoreHorizontal size={22} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <div className="w-12 h-12 rounded-full bg-jb-yellow flex items-center justify-center font-bold text-[#121212]">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-gray-400 text-xs">Good to see you!</p>
            <p className="text-white font-bold text-lg">{user.name}</p>
          </div>
        </div>

        {isPending && (
          <div className="mt-4 bg-jb-yellow/10 border border-jb-yellow/40 rounded-xl px-4 py-3 flex items-center gap-2">
            <Clock size={16} className="text-jb-yellow shrink-0" />
            <p className="text-jb-yellow text-xs font-medium">
              Your payment is being verified by our admin team. This usually takes a few hours.
            </p>
          </div>
        )}

        {isRejected && (
          <div className="mt-4 bg-jb-red/10 border border-jb-red/40 rounded-xl px-4 py-3">
            <p className="text-jb-red text-xs font-medium">
              Your payment could not be verified. Please contact support.
            </p>
          </div>
        )}

        <div className="mt-5">
          <p className="text-gray-400 text-xs">Available Balance</p>
          <p className="text-white text-4xl font-extrabold mt-1">
            ${parseFloat(user.balance).toFixed(2)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-jb-yellow text-xs font-semibold px-2 py-1 bg-jb-yellow/10 rounded-full">
              {info.label} Plan
            </span>
            <span className="text-gray-400 text-xs">{adsLeft}/{info.dailyAds} ads left today</span>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={openAdPicker}
            disabled={watching || isPending}
            className="flex-1 bg-jb-red text-white font-bold rounded-2xl py-3.5 flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition disabled:opacity-50"
          >
            <PlayCircle size={18} />
            Watch Ads
          </button>
          <button
            onClick={() => setShowWithdraw(true)}
            disabled={isPending}
            className="flex-1 bg-gray-700 text-white font-bold rounded-2xl py-3.5 flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition disabled:opacity-50"
          >
            <Wallet size={18} />
            Withdraw
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mx-5 mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
            message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-jb-red"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="px-5 mt-6">
        <p className="font-bold text-gray-800 mb-3">My JazzBazar</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: <PlayCircle size={22} />, label: "Watch Ads", action: openAdPicker },
            { icon: <Wallet size={22} />, label: "Withdraw", action: () => setShowWithdraw(true) },
            { icon: <Star size={22} />, label: `${info.label} Plan`, action: () => {} },
            { icon: <Clock size={22} />, label: "History", action: () => {} },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={item.action}
              className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-2 text-center active:scale-95 transition"
            >
              <div className="text-jb-red">{item.icon}</div>
              <p className="text-[11px] font-medium text-gray-600">{item.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-gray-800">Watch &amp; Earn</p>
          <span className="text-xs text-jb-red font-semibold">${config.adReward.toFixed(2)} / ad</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {ads.map((ad) => (
            <button
              key={ad.id}
              onClick={() => {
                if (isPending || isRejected) return openAdPicker();
                if (adsLeft <= 0) return openAdPicker();
                setMessage(null);
                setActiveAd(ad);
                setProgress(0);
                setWatching(true);
              }}
              className="bg-white rounded-2xl shadow-sm overflow-hidden text-left active:scale-95 transition disabled:opacity-50"
              disabled={isPending || isRejected}
            >
              <div className="relative">
                <img src={ad.thumbnailUrl} alt={ad.brand} className="w-full h-24 object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <PlayCircle className="text-white" size={28} />
                </div>
                <span className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
                  {ad.category}
                </span>
              </div>
              <div className="p-2">
                <p className="text-xs font-bold text-gray-800 truncate">{ad.brand}</p>
                <p className="text-[10px] text-gray-400 truncate">{ad.title}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-6">
        <p className="font-bold text-gray-800 mb-3">Upgrade Your Plan</p>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(config.packages).map(([key, p]) => (
            <div
              key={key}
              className={`rounded-2xl p-3 text-center shadow-sm ${
                user.pkg === key ? "bg-jb-red text-white" : "bg-white text-gray-700"
              }`}
            >
              <p className="font-bold text-sm">{p.label}</p>
              <p className={`text-[10px] mt-1 ${user.pkg === key ? "text-white/80" : "text-gray-400"}`}>
                {p.dailyAds} ads/day
              </p>
              <p className="text-xs font-semibold mt-1">Rs {p.price.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 flex justify-around py-3">
        <NavIcon icon={<Home size={20} />} label="Home" active />
        <NavIcon icon={<MapPin size={20} />} label="Locator" />
        <NavIcon icon={<QrCode size={20} />} label="Scan" />
        <NavIcon icon={<Search size={20} />} label="Search" />
        <NavIcon icon={<Star size={20} />} label="Favorites" />
      </div>

      {watching && activeAd && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <div>
              <p className="text-xs text-gray-400">Sponsored by</p>
              <p className="font-bold text-sm">{activeAd.brand}</p>
            </div>
            <button onClick={closeAdEarly} className="text-gray-400">
              <X size={22} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <video
              ref={videoRef}
              src={activeAd.videoUrl}
              autoPlay
              playsInline
              className="max-h-full max-w-full"
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (v.duration) setProgress((v.currentTime / v.duration) * 100);
              }}
              onEnded={handleVideoEnded}
            />
          </div>
          <div className="px-4 pb-6">
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-jb-yellow transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-center text-white/70 text-xs mt-2">
              Watch till the end to earn ${config.adReward.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {showWithdraw && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-[480px] rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
            <p className="font-bold text-gray-800 text-lg mb-1">Withdraw Funds</p>
            <p className="text-xs text-gray-500 mb-4">
              Available balance: ${parseFloat(user.balance).toFixed(2)} · Minimum ${config.minWithdrawal}
            </p>
            <form onSubmit={handleWithdraw} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500">Amount (USD)</label>
                <input
                  type="number"
                  min={config.minWithdrawal}
                  max={parseFloat(user.balance)}
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`Min $${config.minWithdrawal}`}
                  required
                  className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Withdraw Via</label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value as any)}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red bg-white"
                >
                  <option value="jazzcash">JazzCash</option>
                  <option value="easypaisa">EasyPaisa</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Account Number</label>
                <input
                  value={withdrawAccount}
                  onChange={(e) => setWithdrawAccount(e.target.value)}
                  placeholder="03xxxxxxxxx"
                  required
                  className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Account Holder Name</label>
                <input
                  value={withdrawName}
                  onChange={(e) => setWithdrawName(e.target.value)}
                  placeholder="Full name on account"
                  required
                  className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWithdraw(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold rounded-xl py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={withdrawLoading}
                  className="flex-1 bg-jb-red text-white font-bold rounded-xl py-3 disabled:opacity-60"
                >
                  {withdrawLoading ? "Submitting..." : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NavIcon({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 ${active ? "text-jb-red" : "text-gray-400"}`}>
      {icon}
      <p className="text-[10px] font-medium">{label}</p>
    </div>
  );
}
