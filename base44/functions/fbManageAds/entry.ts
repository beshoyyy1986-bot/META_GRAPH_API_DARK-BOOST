import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { graph, getUserToken, normalizeAccountId } from '../../shared/fb.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await getUserToken(base44);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    if (action === 'list') {
      if (!body.ad_account_id) return Response.json({ error: 'اختر الحساب الإعلاني' }, { status: 400 });
      const act = normalizeAccountId(body.ad_account_id);
      const data = await graph('/' + act + '/ads', {
        token,
        params: {
          limit: 50,
          fields: 'id,name,status,effective_status,created_time,adset{id,name,status,daily_budget,start_time,end_time},creative{id,body,thumbnail_url}'
        }
      });
      return Response.json({ ads: data.data || [] });
    }

    if (action === 'update_ad') {
      if (!body.ad_id) return Response.json({ error: 'مفقود رقم الإعلان' }, { status: 400 });
      const payload = {};
      if (body.status) payload.status = body.status;
      if (body.name) payload.name = body.name;
      await graph('/' + body.ad_id, { token, method: 'POST', body: payload });
      return Response.json({ ok: true });
    }

    if (action === 'update_adset') {
      if (!body.adset_id) return Response.json({ error: 'مفقود رقم المجموعة' }, { status: 400 });
      const payload = {};
      if (body.status) payload.status = body.status;
      if (body.daily_budget_usd) payload.daily_budget = Math.round(Number(body.daily_budget_usd) * 100);
      if (body.end_time) payload.end_time = body.end_time;
      if (body.start_time) payload.start_time = body.start_time;
      await graph('/' + body.adset_id, { token, method: 'POST', body: payload });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}