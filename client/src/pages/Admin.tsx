import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { CheckCircle, XCircle, ShieldCheck } from "lucide-react";

interface AdminUser {
  id: number;
  name: string;
  phone: string;
  pkg: string;
  paymentMethod: string;
  transactionImage: string;
  status: string;
  balance: string;
  isAdmin: boolean;
}

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest("/api/auth/me");
        if (data.user.isAdmin) {
          setLoggedIn(true);
          loadUsers();
        }
      } catch {}
    })();
  }, []);

  async function loadUsers() {
    const data = await apiRequest("/api/admin/users");
    setUsers(data.users);
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
      await loadUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function approve(id: number) {
    await apiRequest(`/api/admin/users/${id}/approve`, { method: "POST" });
    loadUsers();
  }

  async function reject(id: number) {
    await apiRequest(`/api/admin/users/${id}/reject`, { method: "POST" });
    loadUsers();
  }

  const filteredUsers = users.filter((u) => (filter === "all" ? true : u.status === filter) && !u.isAdmin);

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
          <button
            disabled={loading}
            className="bg-jb-red text-white font-bold rounded-xl py-3 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-extrabold text-gray-800 mb-4">JazzBazar Admin Dashboard</h1>

        <div className="flex gap-2 mb-4">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${
                filter === f ? "bg-jb-red text-white" : "bg-white text-gray-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {filteredUsers.length === 0 && (
            <div className="bg-white rounded-2xl p-6 text-center text-gray-400">No users found</div>
          )}
          {filteredUsers.map((u) => (
            <div key={u.id} className="bg-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-4">
              <img
                src={u.transactionImage}
                alt="Transaction proof"
                className="w-full sm:w-32 h-32 object-cover rounded-xl border border-gray-100"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-gray-800">{u.name}</p>
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
                </div>
                <p className="text-sm text-gray-500 mt-1">{u.phone}</p>
                <p className="text-sm text-gray-500 capitalize">
                  {u.pkg} plan · {u.paymentMethod}
                </p>
                <p className="text-sm text-gray-500">Balance: Rs {parseFloat(u.balance).toLocaleString()}</p>

                {u.status === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => approve(u.id)}
                      className="flex items-center gap-1 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl"
                    >
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button
                      onClick={() => reject(u.id)}
                      className="flex items-center gap-1 bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-xl"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
