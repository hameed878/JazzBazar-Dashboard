import { useState } from "react";
import { X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { AdminAd } from "./types";

export default function AdEditModal({
  ad,
  onClose,
  onSaved,
}: {
  ad: AdminAd | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(ad?.title || "");
  const [brand, setBrand] = useState(ad?.brand || "");
  const [category, setCategory] = useState(ad?.category || "General");
  const [videoUrl, setVideoUrl] = useState(ad?.videoUrl || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(ad?.thumbnailUrl || "");
  const [duration, setDuration] = useState(String(ad?.duration ?? 15));
  const [active, setActive] = useState(ad?.active ?? true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        title,
        brand,
        category,
        videoUrl,
        thumbnailUrl,
        duration: parseInt(duration, 10),
        active,
      };
      if (ad) {
        await apiRequest(`/api/admin/ads/${ad.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiRequest("/api/admin/ads", { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <p className="font-bold text-gray-800">{ad ? "Edit Ad" : "Add New Ad"}</p>
          <button onClick={onClose} className="text-gray-400">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500">Ad Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Falak Mobile — Unlimited 4G Load Offer"
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500">Brand Name</label>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                placeholder="Telecom, Food, Fashion..."
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">Video URL (.mp4)</label>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              required
              placeholder="https://..."
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">Thumbnail Image URL</label>
            <input
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="/ads/example.png or https://..."
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">Duration (seconds)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min={3}
              max={120}
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jb-red"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active (visible to users)
          </label>

          {error && <div className="bg-red-50 text-jb-red text-sm rounded-xl px-4 py-3 font-medium">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 font-semibold px-4 py-2.5 rounded-xl">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-jb-red text-white font-semibold px-5 py-2.5 rounded-xl disabled:opacity-60"
            >
              {saving ? "Saving..." : ad ? "Save Changes" : "Add Ad"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
