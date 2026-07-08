import { useState } from "react";
import { Plus, Pencil, Trash2, Video } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { AdminAd } from "./types";
import AdEditModal from "./AdEditModal";

export default function Ads({ ads, reload }: { ads: AdminAd[]; reload: () => void }) {
  const [editing, setEditing] = useState<AdminAd | null>(null);
  const [creating, setCreating] = useState(false);

  async function toggleActive(ad: AdminAd) {
    await apiRequest(`/api/admin/ads/${ad.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !ad.active }),
    });
    reload();
  }

  async function remove(ad: AdminAd) {
    if (!confirm(`Delete the ad "${ad.title}"?`)) return;
    await apiRequest(`/api/admin/ads/${ad.id}`, { method: "DELETE" });
    reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Ads Library ({ads.length})</h2>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 bg-jb-red text-white text-sm font-semibold px-4 py-2 rounded-xl"
        >
          <Plus size={16} /> Add Ad
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ads.length === 0 && (
          <div className="bg-white rounded-2xl p-6 text-center text-gray-400 text-sm col-span-full">
            No ads yet — add one to get started.
          </div>
        )}
        {ads.map((ad) => (
          <div key={ad.id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="relative h-32 bg-gray-100">
              {ad.thumbnailUrl ? (
                <img src={ad.thumbnailUrl} alt={ad.brand} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Video size={28} />
                </div>
              )}
              <span
                className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full ${
                  ad.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
                }`}
              >
                {ad.active ? "Active" : "Hidden"}
              </span>
              <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                {ad.category}
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col gap-1">
              <p className="font-bold text-gray-800 text-sm truncate">{ad.brand}</p>
              <p className="text-xs text-gray-400 truncate">{ad.title}</p>
              <p className="text-[11px] text-gray-400 mt-1">{ad.duration}s duration</p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => toggleActive(ad)}
                className="flex-1 text-xs font-semibold py-2.5 text-gray-600 hover:bg-gray-50"
              >
                {ad.active ? "Hide" : "Activate"}
              </button>
              <button
                onClick={() => setEditing(ad)}
                className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-2.5 text-jb-red border-l border-gray-100 hover:bg-red-50"
              >
                <Pencil size={13} /> Edit
              </button>
              <button
                onClick={() => remove(ad)}
                className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-2.5 text-red-600 border-l border-gray-100 hover:bg-red-50"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {(editing || creating) && (
        <AdEditModal
          ad={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={reload}
        />
      )}
    </div>
  );
}
