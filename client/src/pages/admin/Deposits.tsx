import { useState } from "react";
import { CheckCircle, XCircle, Image as ImageIcon, Download, X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { AdminUser } from "./types";

export default function Deposits({ users, reload }: { users: AdminUser[]; reload: () => void }) {
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [preview, setPreview] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => (filter === "all" ? true : u.status === filter) && !u.isAdmin);

  async function approve(id: number) {
    await apiRequest(`/api/admin/users/${id}/approve`, { method: "POST" });
    reload();
  }

  async function reject(id: number) {
    await apiRequest(`/api/admin/users/${id}/reject`, { method: "POST" });
    reload();
  }

  function downloadImage(url: string, filename: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function filenameFromUrl(url: string) {
    return url.split("/").pop() || "transaction.jpg";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-gray-800">Deposit Verification</h2>
        <div className="flex gap-2 flex-wrap">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
                filter === f ? "bg-jb-red text-white" : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filteredUsers.length === 0 && (
          <div className="bg-white rounded-2xl p-6 text-center text-gray-400 text-sm">No users found</div>
        )}
        {filteredUsers.map((u) => (
          <div key={u.id} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row gap-4">
            {/* Thumbnail */}
            <div className="relative w-full sm:w-32 h-32 shrink-0">
              <button
                onClick={() => u.transactionImage && setPreview(u.transactionImage)}
                className="w-full h-full rounded-xl overflow-hidden border border-gray-100"
              >
                {u.transactionImage ? (
                  <img src={u.transactionImage} alt="Transaction proof" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                    <ImageIcon size={24} />
                  </div>
                )}
              </button>
              {u.transactionImage && (
                <button
                  onClick={() => downloadImage(u.transactionImage!, filenameFromUrl(u.transactionImage!))}
                  title="Download image"
                  className="absolute bottom-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg p-1.5 transition-colors"
                >
                  <Download size={14} />
                </button>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
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
              <p className="text-sm text-gray-500">Balance: ${parseFloat(u.balance).toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1">Joined {new Date(u.createdAt).toLocaleDateString()}</p>

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

      {/* Lightbox */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/85 flex flex-col items-center justify-center z-50 p-6"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-h-full max-w-full flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={preview} alt="Transaction proof full size" className="max-h-[80vh] max-w-full rounded-xl" />
            <div className="flex gap-3">
              <button
                onClick={() => downloadImage(preview, filenameFromUrl(preview))}
                className="flex items-center gap-2 bg-white text-gray-800 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Download size={16} /> Download
              </button>
              <button
                onClick={() => setPreview(null)}
                className="flex items-center gap-2 bg-white/10 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-white/20 transition-colors"
              >
                <X size={16} /> Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
