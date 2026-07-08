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
  Clock,
  X,
  TrendingUp,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  LogOut,
  ArrowUpRight,
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

interface Withdrawal {
  id: number;
  amount: string;
  method: string;
  accountNumber: string;
  accountName: string;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const { user, setUser, logout } = useAuth();
  const [, navigate] = useLocation();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [activeAd, setActiveAd] = useState<AdItem | null>(null);
  const [watching, setWatching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<"jazzcash" | "easypaisa">("jazzcash");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [withdrawName, setWithdrawName] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showPlanInfo, setShowPlanInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "history" | "plan">("home");
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
  const adProgressPct = info.dailyAds > 0 ? (watchedToday / info.dailyAds) * 100 : 0;

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
    setVideoError(false);
    setActiveAd(ads[Math.floor(Math.random() * ads.length)]);
    setProgress(0);
    setWatching(true);
  }

  function startSpecificAd(ad: AdItem) {
    if (isPending || isRejected) { openAdPicker(); return; }
    if (adsLeft <= 0) { openAdPicker(); return; }
    setMessage(null);
    setVideoError(false);
    setActiveAd(ad);
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
      setMessage({ type: "success", text: `🎉 You earned $${Number(data.reward).toFixed(2)}!` });
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
    setVideoError(false);
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
      setMessage({ type: "success", text: "Withdrawal request submitted successfully!" });
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

  async function openHistory() {
    setShowHistory(true);
    setHistoryLoading(true);
    try {
      const data = await apiRequest("/api/withdrawals");
      setWithdrawals(data.withdrawals);
    } catch {
      setWithdrawals([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const planColors: Record<string, string> = {
    basic: "from-gray-600 to-gray-800",
    standard: "from-blue-600 to-blue-800",
    premium: "from-amber-500 to-orange-600",
  };

  return (
    <div className="mobile-shell pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#121212] px-5 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-2xl font-extrabold tracking-tight">
            Jazz<span className="text-jb-yellow">Bazar</span>
          </h1>
          <button onClick={handleLogout} className="text-white/60 hover:text-white p-1" title="Logout">
            <LogOut size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <div className="w-11 h-11 rounded-full bg-jb-yellow flex items-center justify-center font-bold text-[#121212] text-sm">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-gray-400 text-xs">Welcome back</p>
            <p className="text-white font-bold">{user.name}</p>
          </div>
        </div>

        {isPending && (
          <div className="mt-4 bg-jb-yellow/10 border border-jb-yellow/40 rounded-xl px-4 py-3 flex items-center gap-2">
            <Clock size={15} className="text-jb-yellow shrink-0" />
            <p className="text-jb-yellow text-xs font-medium">
              Your payment is under review — usually takes a few hours.
            </p>
          </div>
        )}
        {isRejected && (
          <div className="mt-4 bg-jb-red/10 border border-jb-red/40 rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertCircle size={15} className="text-jb-red shrink-0" />
            <p className="text-jb-red text-xs font-medium">Payment not verified. Please contact support.</p>
          </div>
        )}

        {/* Balance card */}
        <div className="mt-5 bg-white/5 border border-white/10 rounded-2xl px-4 py-4">
          <p className="text-gray-400 text-xs mb-1">Available Balance</p>
          <p className="text-white text-3xl font-extrabold">${parseFloat(user.balance).toFixed(2)}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r ${planColors[user.pkg] || planColors.basic} text-white`}>
              {info.label}
            </span>
            <span className="text-gray-400 text-xs">{adsLeft} ads left today</span>
          </div>
          {/* Daily progress */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
              <span>Daily quota</span>
              <span>{watchedToday}/{info.dailyAds}</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-jb-yellow rounded-full transition-all duration-500"
                style={{ width: `${adProgressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={openAdPicker}
            disabled={watching || isPending}
            className="flex-1 bg-jb-red text-white font-bold rounded-2xl py-3.5 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition disabled:opacity-50"
          >
            <PlayCircle size={18} />
            Watch Ads
          </button>
          <button
            onClick={() => { setShowWithdraw(true); setMessage(null); }}
            disabled={isPending}
            className="flex-1 bg-white/10 border border-white/20 text-white font-bold rounded-2xl py-3.5 flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50"
          >
            <Wallet size={18} />
            Withdraw
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mx-5 mt-4 rounded-xl px-4 py-3 text-sm font-medium flex items-start gap-2 ${
            message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-jb-red"
          }`}
        >
          {message.type === "success" ? <CheckCircle size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Quick actions */}
      <div className="px-5 mt-6">
        <p className="font-bold text-gray-800 mb-3">Quick Actions</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: <PlayCircle size={20} />, label: "Watch Ads", action: openAdPicker, color: "text-jb-red" },
            { icon: <Wallet size={20} />, label: "Withdraw", action: () => { setShowWithdraw(true); setMessage(null); }, color: "text-blue-500" },
            { icon: <TrendingUp size={20} />, label: "My Plan", action: () => setShowPlanInfo(true), color: "text-amber-500" },
            { icon: <Clock size={20} />, label: "History", action: openHistory, color: "text-green-500" },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={item.action}
              className="bg-white rounded-2xl shadow-sm p-3 flex flex-col items-center gap-2 text-center active:scale-95 transition"
            >
              <div className={item.color}>{item.icon}</div>
              <p className="text-[11px] font-semibold text-gray-600">{item.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Earnings stats */}
      <div className="px-5 mt-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">Total Earned</p>
            <p className="font-extrabold text-gray-800 text-lg">${parseFloat(user.balance).toFixed(2)}</p>
            <p className="text-[10px] text-green-500 font-semibold mt-0.5 flex items-center gap-0.5">
              <ArrowUpRight size={11} /> {user.totalAdsWatched} ads watched
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">Today's Progress</p>
            <p className="font-extrabold text-gray-800 text-lg">{watchedToday}/{info.dailyAds}</p>
            <p className="text-[10px] text-jb-red font-semibold mt-0.5">
              ${(watchedToday * config.adReward).toFixed(2)} earned today
            </p>
          </div>
        </div>
      </div>

      {/* Watch & Earn */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-gray-800">Watch &amp; Earn</p>
          <span className="text-xs text-jb-red font-semibold bg-red-50 px-2 py-1 rounded-full">
            +${config.adReward.toFixed(2)} / ad
          </span>
        </div>
        {ads.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <PlayCircle size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No ads available for your plan yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {ads.map((ad) => (
              <button
                key={ad.id}
                onClick={() => startSpecificAd(ad)}
                className="bg-white rounded-2xl shadow-sm overflow-hidden text-left active:scale-95 transition"
                disabled={isPending || isRejected}
              >
                <div className="relative">
                  <img
                    src={ad.thumbnailUrl || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80"}
                    alt={ad.brand}
                    className="w-full h-24 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-1.5">
                      <PlayCircle className="text-jb-red" size={20} />
                    </div>
                  </div>
                  <span className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                    {ad.category}
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-bold text-gray-800 truncate">{ad.brand}</p>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">{ad.title}</p>
                  <p className="text-[10px] text-jb-red font-semibold mt-1">+${config.adReward.toFixed(2)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Package upgrade */}
      <div className="px-5 mt-6 mb-4">
        <p className="font-bold text-gray-800 mb-3">Plans</p>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(config.packages).map(([key, p]) => (
            <div
              key={key}
              className={`rounded-2xl p-3 text-center shadow-sm border ${
                user.pkg === key
                  ? "bg-jb-red border-jb-red text-white"
                  : "bg-white border-gray-100 text-gray-700"
              }`}
            >
              {user.pkg === key && <p className="text-[9px] font-bold text-white/70 uppercase mb-1">Current</p>}
              <p className="font-bold text-sm">{p.label}</p>
              <p className={`text-[10px] mt-0.5 ${user.pkg === key ? "text-white/80" : "text-gray-400"}`}>
                {p.dailyAds} ads/day
              </p>
              <p className="text-xs font-semibold mt-1">Rs {p.price.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 flex justify-around py-3">
        <NavIcon icon={<Home size={20} />} label="Home" active={activeTab === "home"} onClick={() => setActiveTab("home")} />
        <NavIcon icon={<Clock size={20} />} label="History" active={activeTab === "history"} onClick={() => { setActiveTab("history"); openHistory(); }} />
        <NavIcon icon={<PlayCircle size={20} />} label="Watch" onClick={openAdPicker} />
        <NavIcon icon={<TrendingUp size={20} />} label="Plan" active={activeTab === "plan"} onClick={() => { setActiveTab("plan"); setShowPlanInfo(true); }} />
        <NavIcon icon={<Wallet size={20} />} label="Withdraw" onClick={() => { setShowWithdraw(true); setMessage(null); }} />
      </div>

      {/* ── Ad Player ── */}
      {watching && activeAd && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-black/80">
            <div>
              <p className="text-gray-400 text-[10px] uppercase tracking-wide">Sponsored</p>
              <p className="text-white font-bold text-sm">{activeAd.brand}</p>
            </div>
            <button
              onClick={closeAdEarly}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center bg-black">
            {videoError ? (
              <div className="text-center px-8">
                <AlertCircle size={48} className="text-gray-500 mx-auto mb-3" />
                <p className="text-white/70 text-sm mb-2">Video failed to load</p>
                <p className="text-white/40 text-xs mb-6">Please try a different ad</p>
                <button
                  onClick={closeAdEarly}
                  className="bg-white/10 text-white font-bold px-6 py-3 rounded-2xl"
                >
                  Go Back
                </button>
              </div>
            ) : (
              <video
                ref={videoRef}
                key={activeAd.videoUrl}
                src={activeAd.videoUrl}
                autoPlay
                muted
                playsInline
                controls={false}
                className="max-h-full max-w-full w-full"
                onTimeUpdate={(e) => {
                  const v = e.currentTarget;
                  if (v.duration) setProgress((v.currentTime / v.duration) * 100);
                }}
                onEnded={handleVideoEnded}
                onError={() => setVideoError(true)}
              />
            )}
          </div>

          <div className="px-4 pt-3 pb-6 bg-black/80">
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-jb-yellow rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-white/60 text-xs">{activeAd.title}</p>
              <p className="text-jb-yellow text-xs font-bold">+${config.adReward.toFixed(2)}</p>
            </div>
            <p className="text-center text-white/40 text-[10px] mt-1">
              Watch till the end to earn your reward
            </p>
          </div>
        </div>
      )}

      {/* ── Withdraw Modal ── */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-[480px] rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-gray-800 text-lg">Withdraw Funds</p>
                <p className="text-xs text-gray-400">Balance: ${parseFloat(user.balance).toFixed(2)} · Min ${config.minWithdrawal}</p>
              </div>
              <button onClick={() => setShowWithdraw(false)} className="text-gray-400">
                <X size={20} />
              </button>
            </div>
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
                <div className="flex gap-2 mt-1">
                  {(["jazzcash", "easypaisa"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setWithdrawMethod(m)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${
                        withdrawMethod === m
                          ? "bg-jb-red text-white border-jb-red"
                          : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {m === "jazzcash" ? "JazzCash" : "EasyPaisa"}
                    </button>
                  ))}
                </div>
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
              {message && showWithdraw && (
                <div className="bg-red-50 text-jb-red text-sm rounded-xl px-4 py-3 font-medium">
                  {message.text}
                </div>
              )}
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

      {/* ── History Modal ── */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-[480px] rounded-t-3xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <p className="font-bold text-gray-800">Withdrawal History</p>
              <button onClick={() => setShowHistory(false)} className="text-gray-400">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4">
              {historyLoading ? (
                <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
              ) : withdrawals.length === 0 ? (
                <div className="text-center py-10">
                  <Wallet size={40} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No withdrawal requests yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {withdrawals.map((w) => (
                    <div key={w.id} className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">${parseFloat(w.amount).toFixed(2)}</p>
                        <p className="text-xs text-gray-400 mt-0.5 capitalize">{w.method} · {w.accountNumber}</p>
                        <p className="text-[10px] text-gray-300 mt-0.5">
                          {new Date(w.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full capitalize ${
                        w.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : w.status === "rejected"
                          ? "bg-red-100 text-red-600"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {w.status === "approved" ? "Paid" : w.status === "rejected" ? "Rejected" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Plan Info Modal ── */}
      {showPlanInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-[480px] rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <p className="font-bold text-gray-800 text-lg">Membership Plans</p>
              <button onClick={() => setShowPlanInfo(false)} className="text-gray-400">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {Object.entries(config.packages).map(([key, p]) => (
                <div
                  key={key}
                  className={`rounded-2xl p-5 border-2 ${
                    user.pkg === key ? "border-jb-red bg-red-50" : "border-gray-100 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${planColors[key] || planColors.basic} flex items-center justify-center`}>
                        <Star size={14} className="text-white" />
                      </div>
                      <p className="font-bold text-gray-800">{p.label} Plan</p>
                    </div>
                    {user.pkg === key && (
                      <span className="text-xs font-bold text-jb-red bg-red-100 px-2 py-1 rounded-full">Current</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-gray-400 text-xs">Daily Ads</p>
                      <p className="font-bold text-gray-800 mt-0.5">{p.dailyAds} ads/day</p>
                    </div>
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-gray-400 text-xs">Daily Earning</p>
                      <p className="font-bold text-gray-800 mt-0.5">${(p.dailyAds * config.adReward).toFixed(2)}/day</p>
                    </div>
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-gray-400 text-xs">Package Price</p>
                      <p className="font-bold text-gray-800 mt-0.5">Rs {p.price.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-gray-400 text-xs">Monthly Max</p>
                      <p className="font-bold text-gray-800 mt-0.5">${(p.dailyAds * config.adReward * 30).toFixed(0)}/mo</p>
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400 text-center pb-2">
                To upgrade your plan, contact admin support.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavIcon({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-2 ${active ? "text-jb-red" : "text-gray-400"}`}
    >
      {icon}
      <p className="text-[10px] font-medium">{label}</p>
    </button>
  );
}
