import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { Home, MapPin, QrCode, Search, Star, PlayCircle, Wallet, MoreHorizontal, Clock } from "lucide-react";

const PACKAGE_INFO: Record<string, { label: string; dailyAds: number; price: number }> = {
  basic: { label: "Basic", dailyAds: 5, price: 1500 },
  standard: { label: "Standard", dailyAds: 10, price: 4500 },
  premium: { label: "Premium", dailyAds: 15, price: 9500 },
};

export default function Dashboard() {
  const { user, setUser, logout } = useAuth();
  const [, navigate] = useLocation();
  const [watching, setWatching] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  if (!user) return null;

  const info = PACKAGE_INFO[user.pkg] || PACKAGE_INFO.basic;
  const today = new Date().toISOString().slice(0, 10);
  const watchedToday = user.lastAdDate === today ? user.adsWatchedToday : 0;
  const adsLeft = Math.max(info.dailyAds - watchedToday, 0);
  const isPending = user.status === "pending";
  const isRejected = user.status === "rejected";

  async function handleWatchAd() {
    if (isPending) {
      setMessage({ type: "error", text: "Your account is pending admin verification." });
      return;
    }
    if (adsLeft <= 0) {
      setMessage({ type: "error", text: "You've reached your daily ad limit. Come back tomorrow!" });
      return;
    }
    setWatching(true);
    setMessage(null);
    setTimeout(async () => {
      try {
        const data = await apiRequest("/api/ads/watch", { method: "POST" });
        setUser(data.user);
        setMessage({ type: "success", text: `You earned Rs ${data.reward}!` });
      } catch (err: any) {
        setMessage({ type: "error", text: err.message });
      } finally {
        setWatching(false);
      }
    }, 3000);
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setWithdrawLoading(true);
    setMessage(null);
    try {
      const data = await apiRequest("/api/withdraw", {
        method: "POST",
        body: JSON.stringify({ amount: parseFloat(withdrawAmount) }),
      });
      setUser({ ...user, balance: data.balance });
      setMessage({ type: "success", text: "Withdrawal request submitted!" });
      setShowWithdraw(false);
      setWithdrawAmount("");
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
      <div className="bg-[#121212] px-5 pt-10 pb-6">
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
            Rs. {parseFloat(user.balance).toLocaleString()}
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
            onClick={handleWatchAd}
            disabled={watching || isPending}
            className="flex-1 bg-jb-red text-white font-bold rounded-2xl py-3.5 flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition disabled:opacity-50"
          >
            <PlayCircle size={18} />
            {watching ? "Watching..." : "Watch Ads"}
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
            { icon: <PlayCircle size={22} />, label: "Watch Ads", action: handleWatchAd },
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
        <p className="font-bold text-gray-800 mb-3">Upgrade Your Plan</p>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(PACKAGE_INFO).map(([key, p]) => (
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

      {showWithdraw && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-[480px] rounded-t-3xl p-6">
            <p className="font-bold text-gray-800 text-lg mb-1">Withdraw Funds</p>
            <p className="text-xs text-gray-500 mb-4">
              Available balance: Rs. {parseFloat(user.balance).toLocaleString()} · Minimum Rs. 500
            </p>
            <form onSubmit={handleWithdraw} className="flex flex-col gap-4">
              <input
                type="number"
                min={500}
                max={parseFloat(user.balance)}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
              />
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
