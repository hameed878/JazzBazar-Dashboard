import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Check, Upload, Copy } from "lucide-react";

type PackageKey = "basic" | "standard" | "premium";

const PACKAGES: Record<PackageKey, { label: string; price: number; dailyAds: number; tagline: string }> = {
  basic: { label: "Basic", price: 1500, dailyAds: 5, tagline: "Great to get started" },
  standard: { label: "Standard", price: 4500, dailyAds: 10, tagline: "Most popular choice" },
  premium: { label: "Premium", price: 9500, dailyAds: 15, tagline: "Maximum earnings" },
};

const ACCOUNT_NUMBER = "03448311279";
const ACCOUNT_NAME = "JazzBazar Official";

export default function Signup() {
  const [, navigate] = useLocation();
  const { setUser } = useAuth();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [pkg, setPkg] = useState<PackageKey | "">("");
  const [paymentMethod, setPaymentMethod] = useState<"jazzcash" | "easypaisa" | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError("Please enter your full name");
    if (phone.trim().length < 10) return setError("Please enter a valid phone number");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    setStep(2);
  }

  function handlePackageSelect(key: PackageKey) {
    setPkg(key);
    setStep(3);
  }

  function copyAccount() {
    navigator.clipboard.writeText(ACCOUNT_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!paymentMethod) return setError("Please select a payment method");
    if (!file) return setError("Please upload a screenshot of your transaction");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("password", password);
      formData.append("pkg", pkg);
      formData.append("paymentMethod", paymentMethod);
      formData.append("transactionImage", file);

      const data = await apiRequest("/api/auth/signup", {
        method: "POST",
        body: formData,
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
    <div className="mobile-shell flex flex-col pb-10">
      <div className="bg-[#121212] px-6 pt-14 pb-8 rounded-b-[32px]">
        <h1 className="text-white text-3xl font-extrabold tracking-tight">
          Jazz<span className="text-jb-yellow">Bazar</span>
        </h1>
        <p className="text-gray-400 mt-2 text-sm">Create your account and start earning today.</p>
        <div className="flex gap-2 mt-5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-jb-red" : "bg-gray-700"}`}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="px-6 -mt-4 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-lg p-5 flex flex-col gap-4">
            <p className="font-bold text-gray-800">Step 1: Your details</p>
            <div>
              <label className="text-xs font-semibold text-gray-500">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Umer Khan"
                className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03xxxxxxxxx"
                className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-jb-red text-sm rounded-xl px-4 py-3 font-medium">
              {error}
            </div>
          )}

          <button className="bg-jb-red text-white font-bold rounded-xl py-3.5 shadow-md active:scale-[0.98] transition">
            Continue
          </button>
          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-jb-red font-semibold">
              Log In
            </Link>
          </p>
        </form>
      )}

      {step === 2 && (
        <div className="px-6 -mt-4 flex flex-col gap-4">
          <p className="font-bold text-gray-800 px-1">Step 2: Choose your package</p>
          {(Object.keys(PACKAGES) as PackageKey[]).map((key) => {
            const p = PACKAGES[key];
            return (
              <button
                key={key}
                onClick={() => handlePackageSelect(key)}
                className="bg-white rounded-2xl shadow-lg p-5 flex items-center justify-between text-left active:scale-[0.98] transition border-2 border-transparent hover:border-jb-red"
              >
                <div>
                  <p className="font-bold text-gray-800 text-lg">{p.label}</p>
                  <p className="text-xs text-gray-500">{p.tagline}</p>
                  <p className="text-xs text-jb-red font-semibold mt-1">{p.dailyAds} ads / day</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-jb-red text-xl">Rs {p.price.toLocaleString()}</p>
                </div>
              </button>
            );
          })}
          <button onClick={() => setStep(1)} className="text-sm text-gray-500 font-medium mt-1">
            ← Back
          </button>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={handleFinalSubmit} className="px-6 -mt-4 flex flex-col gap-4">
          <p className="font-bold text-gray-800 px-1">Step 3: Payment</p>

          <div className="bg-white rounded-2xl shadow-lg p-5 flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-500">Selected Package</p>
            <div className="flex justify-between items-center">
              <p className="font-bold text-gray-800">{pkg ? PACKAGES[pkg as PackageKey].label : ""}</p>
              <p className="font-extrabold text-jb-red">
                Rs {pkg ? PACKAGES[pkg as PackageKey].price.toLocaleString() : ""}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-5 flex flex-col gap-3">
            <label className="text-xs font-semibold text-gray-500">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red bg-white"
            >
              <option value="">Select method</option>
              <option value="jazzcash">JazzCash</option>
              <option value="easypaisa">EasyPaisa</option>
            </select>
          </div>

          {paymentMethod && (
            <div className="bg-[#121212] rounded-2xl shadow-lg p-5 flex flex-col gap-2 text-white">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                Send payment to
              </p>
              <p className="text-xs text-gray-400">{ACCOUNT_NAME}</p>
              <div className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3 mt-1">
                <p className="font-mono text-lg tracking-wider">{ACCOUNT_NUMBER}</p>
                <button type="button" onClick={copyAccount} className="text-jb-yellow flex items-center gap-1 text-xs font-semibold">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Send exactly Rs {pkg ? PACKAGES[pkg as PackageKey].price.toLocaleString() : ""} via {paymentMethod === "jazzcash" ? "JazzCash" : "EasyPaisa"}
              </p>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg p-5 flex flex-col gap-3">
            <label className="text-xs font-semibold text-gray-500">
              Upload Transaction Screenshot
            </label>
            <label
              htmlFor="tx-image"
              className="border-2 border-dashed border-gray-300 rounded-xl py-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-jb-red transition"
            >
              {preview ? (
                <img src={preview} alt="Transaction preview" className="max-h-40 rounded-lg object-contain" />
              ) : (
                <>
                  <Upload className="text-gray-400" size={28} />
                  <p className="text-xs text-gray-500">Tap to upload screenshot</p>
                </>
              )}
            </label>
            <input
              id="tx-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
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
            {loading ? "Creating account..." : "Create Account"}
          </button>
          <button type="button" onClick={() => setStep(2)} className="text-sm text-gray-500 font-medium">
            ← Back
          </button>
        </form>
      )}
    </div>
  );
}
