import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { ShieldCheck, LayoutGrid, ImageIcon, Wallet, Users as UsersIcon, Settings as SettingsIcon, Video, LogOut, Menu, X } from "lucide-react";
import type { AdminUser, AdminWithdrawal, AdminAd, AppConfig, Stats } from "./admin/types";
import Overview from "./admin/Overview";
import Deposits from "./admin/Deposits";
import Withdrawals from "./admin/Withdrawals";
import Users from "./admin/Users";
import Settings from "./admin/Settings";
import Ads from "./admin/Ads";

type Tab = "overview" | "deposits" | "withdrawals" | "users" | "ads" | "settings";

const TABS: { key: Tab; label: string; icon: JSX.Element }[] = [
  { key: "overview", label: "Overview", icon: <LayoutGrid size={18} /> },
  { key: "deposits", label: "Deposits", icon: <ImageIcon size={18} /> },
  { key: "withdrawals", label: "Withdrawals", icon: <Wallet size={18} /> },
  { key: "users", label: "Users", icon: <UsersIcon size={18} /> },
  { key: "ads", label: "Ads", icon: <Video size={18} /> },
  { key: "settings", label: "Settings", icon: <SettingsIcon size={18} /> },
];

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [ads, setAds] = useState<AdminAd[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest("/api/auth/me");
        if (data.user.isAdmin) {
          setLoggedIn(true);
          await loadAll();
        }
      } catch {
      } finally {
        setCheckingSession(false);
      }
    })();
  }, []);

  async function loadAll() {
    const [statsData, usersData, withdrawalsData, adsData, configData] = await Promise.all([
      apiRequest("/api/admin/stats"),
      apiRequest("/api/admin/users"),
      apiRequest("/api/admin/withdrawals"),
      apiRequest("/api/admin/ads"),
      apiRequest("/api/admin/settings"),
    ]);
    setStats(statsData);
    setUsers(usersData.users);
    setWithdrawals(withdrawalsData.withdrawals);
    setAds(adsData.ads);
    setConfig(configData);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiRequest("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ phone, password }),
      });
      setLoggedIn(true);
      await loadAll();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await apiRequest("/api/auth/logout", { method: "POST" });
    setLoggedIn(false);
    setPhone("");
    setPassword("");
  }

  if (checkingSession) {
    return <div className="min-h-screen flex items-center justify-center bg-[#121212]" />;
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212] px-6">
        <form onSubmit={handleLogin} className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 justify-center mb-2">
            <ShieldCheck className="text-jb-red" />
            <p className="font-extrabold text-xl">JazzBazar Admin</p>
          </div>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Admin phone"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
          />
          {error && <p className="text-jb-red text-sm font-medium">{error}</p>}
          <button disabled={loading} className="bg-jb-red text-white font-bold rounded-xl py-3 disabled:opacity-60">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#121212] text-white flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-jb-red" size={22} />
            <p className="font-extrabold text-lg">JazzBazar</p>
          </div>
          <button className="lg:hidden text-white/70" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                tab === t.key ? "bg-jb-red text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 mx-3 mb-4 rounded-xl text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 min-w-0">
        <div className="lg:hidden flex items-center justify-between bg-white px-4 py-3 shadow-sm sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu size={22} />
          </button>
          <p className="font-bold text-gray-800 capitalize">{tab}</p>
          <div className="w-6" />
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {tab === "overview" && <Overview stats={stats} />}
          {tab === "deposits" && <Deposits users={users} reload={loadAll} />}
          {tab === "withdrawals" && <Withdrawals withdrawals={withdrawals} reload={loadAll} />}
          {tab === "users" && config && <Users users={users} packages={config.packages} reload={loadAll} />}
          {tab === "ads" && <Ads ads={ads} reload={loadAll} />}
          {tab === "settings" && config && <Settings config={config} reload={loadAll} />}
        </div>
      </main>
    </div>
  );
}
