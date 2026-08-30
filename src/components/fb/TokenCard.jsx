import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyRound, Loader2, CheckCircle2, Pencil } from "lucide-react";

export default function TokenCard({ settings, onSaved }) {
  const [token, setToken] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const connected = !!settings?.user_token;

  const save = async () => {
    setErr(""); setSaving(true);
    try {
      const saved = settings
        ? await base44.entities.FbSettings.update(settings.id, { user_token: token.trim() })
        : await base44.entities.FbSettings.create({ user_token: token.trim() });
      setEditing(false); setToken("");
      await onSaved(saved);
    } catch (e) {
      setErr(e?.message || "خطأ في الحفظ");
    }
    setSaving(false);
  };

  if (connected && !editing) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.07] px-3 py-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="text-xs text-emerald-300 flex-1">حساب مربوط</span>
        <button type="button" onClick={() => setEditing(true)} className="text-zinc-400 hover:text-zinc-200">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs text-zinc-300">
        <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
        <span>User Access Token</span>
      </div>
      <Input
        dir="ltr"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="EAAB..."
        className="bg-black/40 border-white/10 text-zinc-100 text-xs h-9"
      />
      {err && <p className="text-xs text-rose-400">{err}</p>}
      <div className="flex gap-2">
        {connected && (
          <Button variant="ghost" onClick={() => setEditing(false)} className="h-9 px-3 text-zinc-400 hover:text-zinc-200 text-xs">
            إلغاء
          </Button>
        )}
        <Button onClick={save} disabled={!token.trim() || saving} className="flex-1 h-9 bg-emerald-500 hover:bg-emerald-400 text-black font-medium text-xs">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ وجلب الصفحات"}
        </Button>
      </div>
    </div>
  );
}