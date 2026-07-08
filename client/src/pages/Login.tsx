import { useState } from "react";
import { useLocation, Link } from "wouter";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [, navigate] = useLocation();
  const { setUser } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ phone, password }),
      });
      setUser(data.user);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mobile-shell flex flex-col">
      <div className="bg-[#121212] px-6 pt-14 pb-10 rounded-b-[32px]">
        <h1 className="text-white text-3xl font-extrabold tracking-tight">
          Jazz<span className="text-jb-yellow">Bazar</span>
        </h1>
        <p className="text-gray-400 mt-2 text-sm">Welcome back! Log in to your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 -mt-6 flex flex-col gap-4">
        <div className="bg-white rounded-2xl shadow-lg p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500">Phone Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03xxxxxxxxx"
              required
              className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-jb-red text-sm rounded-xl px-4 py-3 font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-jb-red text-white font-bold rounded-xl py-3.5 shadow-md active:scale-[0.98] transition disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-2">
          Don't have an account?{" "}
          <Link href="/signup" className="text-jb-red font-semibold">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}
