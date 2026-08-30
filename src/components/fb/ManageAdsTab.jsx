import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Play, Pause, RefreshCw, Save } from "lucide-react";
import { DarkSelect } from "@/components/fb/AdSelects";

export default function ManageAdsTab({ adAccounts }) {
  const [account, setAccount] = useState("");
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [edits, setEdits] = useState({});

  const load = async (acc = account) => {
    if (!acc) return;
    setErr(""); setLoading(true);
    try {
      const res = await base44.functions.invoke("fbManageAds", { action: "list", ad_account_id: acc });
      if (res.data?.error) setErr(res.data.error);
      setAds(res.data?.ads || []);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "تعذّر جلب الإعلانات");
      setAds([]);
    }
    setLoading(false);
  };

  const toggle = async (ad) => {
    setBusy(ad.id);
    const next = ad.effective_status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      const res = await base44.functions.invoke("fbManageAds", { action: "update_ad", ad_id: ad.id, status: next });
      if (res.data?.error) setErr(res.data.error);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "تعذّر تحديث حالة الإعلان");
    }
    setBusy(""); load();
  };

  const saveBudget = async (ad) => {
    const val = edits[ad.id];
    if (!val) return;
    setBusy(ad.id);
    try {
      const res = await base44.functions.invoke("fbManageAds", { action: "update_adset", adset_id: ad.adset?.id, daily_budget_usd: Number(val) });
      if (res.data?.error) setErr(res.data.error);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "تعذّر حفظ الميزانية");
    }
    setBusy(""); load();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <DarkSelect value={account} onValueChange={(v) => { setAccount(v); load(v); }} placeholder="اختر الحساب الإعلاني"
            options={adAccounts.map((a) => ({ value: a.id, label: a.name }))} />
        </div>
        <Button onClick={() => load()} className="h-9 px-3 bg-white/10 hover:bg-white/20">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>
      {err && <p className="text-xs text-rose-400">{err}</p>}

      {!loading && account && ads.length === 0 && <p className="text-xs text-zinc-500 text-center py-6">لا توجد إعلانات في هذا الحساب</p>}

      <div className="space-y-2">
        {ads.map((ad) => (
          <div key={ad.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
            <div className="flex items-start gap-2">
              {ad.creative?.thumbnail_url && <img src={ad.creative.thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-200 truncate">{ad.name}</p>
                <p className="text-[10px] text-zinc-500 truncate">{ad.creative?.body || ""}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${ad.effective_status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-500/15 text-zinc-400"}`}>
                {ad.effective_status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number" min="1"
                value={edits[ad.id] ?? (ad.adset?.daily_budget ? Number(ad.adset.daily_budget) / 100 : "")}
                onChange={(e) => setEdits((p) => ({ ...p, [ad.id]: e.target.value }))}
                className="bg-black/40 border-white/10 text-zinc-100 text-xs h-8 w-24"
              />
              <Button onClick={() => saveBudget(ad)} disabled={busy === ad.id} className="h-8 px-2.5 bg-white/10 hover:bg-white/20 text-[11px]">
                <Save className="w-3.5 h-3.5 me-1" /> حفظ الميزانية
              </Button>
              <Button onClick={() => toggle(ad)} disabled={busy === ad.id}
                className={`h-8 px-2.5 text-[11px] ms-auto ${ad.effective_status === "ACTIVE" ? "bg-rose-500/80 hover:bg-rose-500" : "bg-emerald-500 text-black hover:bg-emerald-400"}`}>
                {busy === ad.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : ad.effective_status === "ACTIVE"
                  ? <><Pause className="w-3.5 h-3.5 me-1" /> إيقاف</>
                  : <><Play className="w-3.5 h-3.5 me-1" /> تشغيل</>}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}