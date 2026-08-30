import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Loader2, Rocket, CheckCircle2 } from "lucide-react";
import { DarkSelect, AGES } from "@/components/fb/AdSelects";
import GeoPicker from "@/components/fb/GeoPicker";

const label = "text-[11px] text-zinc-400 mb-1 block";

export default function CreateAdForm({ pages, adAccounts }) {
  const [f, setF] = useState({
    page_id: "", ad_account_id: "", message: "", link: "", image_url: "",
    gender: "all", age_min: "18", age_max: "65",
    daily_budget_usd: "5", days: "0", start_after_minutes: "15",
    ad_status: "ACTIVE"
  });
  const [geo, setGeo] = useState({ targeting_mode: "countries", countries: [], regions: [], country_code: null });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("image_url", file_url);
    setUploading(false);
  };

  const submit = async () => {
    setMsg(null);
    if (geo.targeting_mode === "countries" && geo.countries.length === 0) {
      setMsg({ type: "error", text: "اختر دولة واحدة على الأقل" }); return;
    }
    if (geo.targeting_mode === "regions" && geo.regions.length === 0) {
      setMsg({ type: "error", text: "اختر محافظة أو مدينة واحدة على الأقل" }); return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("fbCreateDarkPostAd", {
        page_id: f.page_id,
        ad_account_id: f.ad_account_id,
        message: f.message,
        link: f.link || null,
        image_url: f.image_url || null,
        targeting_mode: geo.targeting_mode,
        countries: geo.countries,
        regions: geo.regions,
        genders: f.gender === "all" ? [] : [Number(f.gender)],
        age_min: Number(f.age_min),
        age_max: Number(f.age_max),
        daily_budget_usd: Number(f.daily_budget_usd),
        days: Number(f.days),
        start_after_minutes: Number(f.start_after_minutes),
        ad_status: f.ad_status
      });
      if (res?.data?.error) {
        setMsg({ type: "error", text: res.data.error });
      } else if (res?.error) {
        setMsg({ type: "error", text: res.error });
      } else if (res?.data?.scheduled_start) {
        setMsg({ type: "ok", text: "تم إنشاء الإعلان ويبدأ في " + new Date(res.data.scheduled_start).toLocaleString("ar-EG") });
      } else {
        setMsg({ type: "error", text: "لم يستجب الخادم، تأكد من صحة التوكن والصفحة" });
      }
    } catch (e) {
      setMsg({ type: "error", text: e?.message || "حدث خطأ غير متوقع أثناء إنشاء الإعلان" });
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className={label}>الصفحة</span>
          <DarkSelect value={f.page_id} onValueChange={(v) => set("page_id", v)} placeholder="اختر صفحة"
            options={pages.map((p) => ({ value: p.id, label: p.name }))} />
        </div>
        <div>
          <span className={label}>الحساب الإعلاني</span>
          <DarkSelect value={f.ad_account_id} onValueChange={(v) => set("ad_account_id", v)} placeholder="اختر حساب"
            options={adAccounts.map((a) => ({ value: a.id, label: a.name }))} />
        </div>
      </div>

      <div>
        <span className={label}>محتوى الدارك بوست</span>
        <Textarea value={f.message} onChange={(e) => set("message", e.target.value)} rows={3}
          placeholder="اكتب نص الإعلان..." className="bg-black/40 border-white/10 text-zinc-100 text-xs" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className={label}>الرابط (اختياري)</span>
          <Input dir="ltr" value={f.link} onChange={(e) => set("link", e.target.value)} placeholder="https://"
            className="bg-black/40 border-white/10 text-zinc-100 text-xs h-9" />
        </div>
        <div>
          <span className={label}>صورة الإعلان</span>
          <label className="flex items-center justify-center gap-2 h-9 rounded-md border border-white/10 bg-black/40 text-[11px] text-zinc-400 cursor-pointer hover:border-white/25">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
            {f.image_url ? "تم رفع الصورة" : "رفع صورة"}
            <input type="file" accept="image/*" className="hidden" onChange={upload} />
          </label>
        </div>
      </div>

      {f.image_url && <img src={f.image_url} alt="preview" className="w-full h-28 object-cover rounded-xl border border-white/10" />}

      <div className="pt-1 border-t border-white/5">
        <span className={label}>الاستهداف الجغرافي</span>
        <GeoPicker value={geo} onChange={setGeo} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <span className={label}>الجنس</span>
          <DarkSelect value={f.gender} onValueChange={(v) => set("gender", v)} placeholder="الجنس"
            options={[{ value: "all", label: "الكل" }, { value: "1", label: "ذكور" }, { value: "2", label: "إناث" }]} />
        </div>
        <div>
          <span className={label}>من عمر</span>
          <DarkSelect value={f.age_min} onValueChange={(v) => set("age_min", v)} placeholder="18"
            options={AGES.map((a) => ({ value: a, label: a }))} />
        </div>
        <div>
          <span className={label}>إلى عمر</span>
          <DarkSelect value={f.age_max} onValueChange={(v) => set("age_max", v)} placeholder="65"
            options={AGES.map((a) => ({ value: a, label: a }))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className={label}>حالة الإعلان</span>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: "ACTIVE", label: "نشط" },
              { id: "PAUSED", label: "متوقف" }
            ].map((s) => (
              <button key={s.id} type="button"
                onClick={() => set("ad_status", s.id)}
                className={`h-9 rounded-md text-xs border transition-all ${
                  f.ad_status === s.id ? (s.id === "ACTIVE" ? "bg-emerald-500 text-black border-emerald-500" : "bg-amber-500 text-black border-amber-500") : "bg-black/40 text-zinc-400 border-white/10 hover:border-white/25"
                }`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className={label}>يبدأ بعد (دقيقة)</span>
          <Input type="number" min="1" value={f.start_after_minutes} onChange={(e) => set("start_after_minutes", e.target.value)}
            className="bg-black/40 border-white/10 text-zinc-100 text-xs h-9" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className={label}>الميزانية اليومية ($)</span>
          <Input type="number" min="1" value={f.daily_budget_usd} onChange={(e) => set("daily_budget_usd", e.target.value)}
            className="bg-black/40 border-white/10 text-zinc-100 text-xs h-9" />
        </div>
        <div>
          <span className={label}>عدد الأيام (0 = مستمر)</span>
          <Input type="number" min="0" value={f.days} onChange={(e) => set("days", e.target.value)}
            className="bg-black/40 border-white/10 text-zinc-100 text-xs h-9" />
        </div>
      </div>

      {msg && (
        <p className={`text-xs flex items-center gap-1.5 ${msg.type === "ok" ? "text-emerald-400" : "text-rose-400"}`}>
          {msg.type === "ok" && <CheckCircle2 className="w-3.5 h-3.5" />}{msg.text}
        </p>
      )}

      <Button onClick={submit} disabled={submitting || !f.page_id || !f.ad_account_id || !f.message}
        className="w-full h-10 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-semibold hover:opacity-90">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Rocket className="w-4 h-4 me-1.5" /> تشغيل الإعلان المجدول</>}
      </Button>
    </div>
  );
}