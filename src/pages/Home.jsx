import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Image as UIImage } from "@/components/ui/image";
import { Loader2, LogIn } from "lucide-react";
import TokenCard from "@/components/fb/TokenCard";
import CreateAdForm from "@/components/fb/CreateAdForm";
import ManageAdsTab from "@/components/fb/ManageAdsTab";

const LOGO = "https://media.base44.com/images/public/6a937c8038d309da949a0880/fe2487424_ChatGPTImageAug30202602_19_24AM.png";

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [settings, setSettings] = useState(null);
  const [pages, setPages] = useState([]);
  const [adAccounts, setAdAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assetsError, setAssetsError] = useState("");

  const loadAssets = async () => {
    setAssetsError("");
    try {
      const res = await base44.functions.invoke("fbAssets", {});
      if (res.data?.error) setAssetsError(res.data.error);
      setPages(res.data?.pages || []);
      setAdAccounts(res.data?.ad_accounts || []);
    } catch (e) {
      setAssetsError(e?.response?.data?.error || e?.message || "تعذّر جلب الصفحات والحسابات — تأكد من صحة التوكن");
      setPages([]);
      setAdAccounts([]);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        setAuthed(true);
        const rows = await base44.entities.FbSettings.filter({ created_by_id: user.id }, "-updated_date", 1);
        setSettings(rows[0] || null);
        if (rows[0]?.user_token) await loadAssets();
      } catch (e) {
        setAuthed(false);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-[#08090c] text-zinc-100 flex items-start justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <UIImage src={LOGO} fittingType="fill" alt="BM DARK POST" className="w-9 h-9 rounded-xl shrink-0" />
          <div>
            <h1 className="text-sm font-semibold tracking-tight">BM DARK POST TOOL</h1>
            <p className="text-[10px] text-zinc-500">إعلانات دارك بوست مجدولة بالدولار</p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-4 shadow-2xl space-y-4">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-emerald-400" /></div>
          ) : !authed ? (
            <div className="text-center py-8 space-y-4">
              <UIImage src={LOGO} fittingType="fill" alt="BM DARK POST" className="w-14 h-14 rounded-2xl mx-auto" />
              <div>
                <p className="text-sm font-medium text-zinc-100">أهلًا بك في BM DARK POST TOOL</p>
                <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">أنشئ وأدر إعلانات فيسبوك دارك بوست المجدولة بالدولار. سجّل الدخول للبدء.</p>
              </div>
              <Button onClick={() => base44.auth.redirectToLogin(window.location.href)} className="h-10 px-6 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-semibold hover:opacity-90">
                <LogIn className="w-4 h-4 me-1.5" /> تسجيل الدخول
              </Button>
            </div>
          ) : (
            <>
              <TokenCard
                settings={settings}
                onSaved={async (s) => { setSettings(s); await loadAssets(); }}
              />
              {assetsError && <p className="text-xs text-rose-400">{assetsError}</p>}

              {settings?.user_token && (
                <Tabs defaultValue="create">
                  <TabsList className="w-full bg-black/40 border border-white/10 h-9">
                    <TabsTrigger value="create" className="flex-1 text-xs data-[state=active]:bg-emerald-500 data-[state=active]:text-black">إعلان جديد</TabsTrigger>
                    <TabsTrigger value="manage" className="flex-1 text-xs data-[state=active]:bg-emerald-500 data-[state=active]:text-black">إدارة الإعلانات</TabsTrigger>
                  </TabsList>
                  <TabsContent value="create" className="mt-4">
                    <CreateAdForm pages={pages} adAccounts={adAccounts} />
                  </TabsContent>
                  <TabsContent value="manage" className="mt-4">
                    <ManageAdsTab adAccounts={adAccounts} />
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}