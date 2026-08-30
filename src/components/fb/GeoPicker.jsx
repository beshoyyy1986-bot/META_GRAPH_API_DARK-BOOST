import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Globe2, MapPin, Check } from "lucide-react";

export default function GeoPicker({ value, onChange }) {
  const { targeting_mode, countries, regions, country_code } = value;
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const kind = targeting_mode === "regions" && country_code ? "region" : "country";

  const search = async () => {
    setErr(""); setLoading(true);
    try {
      const res = await base44.functions.invoke("fbGeoSearch", { kind, q, country_code });
      if (res.data?.error) setErr(res.data.error);
      setResults(res.data?.results || []);
    } catch (e) { setErr(e?.message || "خطأ"); }
    setLoading(false);
  };

  const isCountrySelected = (key) => countries.includes(key);
  const isRegionSelected = (key) => regions.some((x) => x.key === key);

  const toggleCountry = (r) => {
    if (targeting_mode === "regions") {
      onChange({ ...value, country_code: r.key, regions: [] });
      setResults([]); setQ("");
    } else {
      onChange({ ...value, countries: isCountrySelected(r.key) ? countries.filter((c) => c !== r.key) : [...countries, r.key] });
    }
  };

  const toggleRegion = (r) => {
    onChange({ ...value, regions: isRegionSelected(r.key) ? regions.filter((x) => x.key !== r.key) : [...regions, r] });
  };

  const selectAll = () => {
    if (kind === "country" && targeting_mode === "countries") {
      const keys = results.map((r) => r.key).filter((k) => !countries.includes(k));
      onChange({ ...value, countries: [...countries, ...keys] });
    } else if (kind === "region") {
      const add = results.filter((r) => !isRegionSelected(r.key));
      onChange({ ...value, regions: [...regions, ...add] });
    }
  };

  const selectedCount = targeting_mode === "countries" ? countries.length : regions.length;

  const Row = ({ r }) => {
    const selected = kind === "country" ? (targeting_mode === "regions" ? country_code === r.key : isCountrySelected(r.key)) : isRegionSelected(r.key);
    return (
      <button
        key={r.key + r.type}
        type="button"
        onClick={() => (kind === "country" ? toggleCountry(r) : toggleRegion(r))}
        className="w-full flex items-center gap-2 px-3 py-2 text-start hover:bg-white/5"
      >
        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected ? "bg-emerald-500 border-emerald-500" : "border-white/20"}`}>
          {selected && <Check className="w-3 h-3 text-black" />}
        </span>
        <span className="text-xs text-zinc-300 flex-1">{r.label} <span className="text-zinc-500">· {r.type}</span></span>
      </button>
    );
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: "countries", label: "دول", icon: Globe2 },
          { id: "regions", label: "مدن ومحافظات", icon: MapPin }
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => { onChange({ targeting_mode: m.id, countries: [], regions: [], country_code: null }); setResults([]); setQ(""); }}
            className={`flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs border transition-all ${
              targeting_mode === m.id ? "bg-emerald-500 text-black border-emerald-500" : "bg-white/[0.03] text-zinc-400 border-white/10 hover:border-white/25"
            }`}
          >
            <m.icon className="w-3.5 h-3.5" /> {m.label}
          </button>
        ))}
      </div>

      {targeting_mode === "regions" && country_code && (
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>الدولة: <span className="text-emerald-400">{country_code}</span></span>
          <button type="button" onClick={() => onChange({ ...value, country_code: null, regions: [] })} className="text-rose-400">تغيير</button>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
          placeholder={kind === "country" ? "ابحث عن دولة" : "ابحث عن محافظة أو مدينة"}
          className="bg-black/40 border-white/10 text-zinc-100 text-xs h-9"
        />
        <Button type="button" onClick={search} className="h-9 px-3 bg-white/10 hover:bg-white/20">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>
      {err && <p className="text-xs text-rose-400">{err}</p>}

      {results.length > 0 && (
        <div className="max-h-40 overflow-auto rounded-xl border border-white/10 divide-y divide-white/5">
          <button type="button" onClick={selectAll} className="w-full flex items-center gap-2 px-3 py-2 text-start text-xs text-emerald-400 hover:bg-white/5">
            <span className="w-4 h-4 rounded border border-emerald-500/50 flex items-center justify-center shrink-0"><Check className="w-3 h-3" /></span>
            تحديد الكل ({results.length})
          </button>
          {results.map((r) => <Row key={r.key + r.type} r={r} />)}
        </div>
      )}

      {selectedCount > 0 && (
        <p className="text-[11px] text-zinc-500">المحدد: <span className="text-emerald-400">{selectedCount}</span></p>
      )}
    </div>
  );
}