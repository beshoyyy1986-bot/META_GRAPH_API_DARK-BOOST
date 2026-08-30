import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { graph, getUserToken } from '../../shared/fb.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await getUserToken(base44);

    const pagesData = await graph('/me/accounts', {
      token,
      params: { fields: 'id,name,access_token', limit: 100 }
    });
    const pages = (pagesData.data || []).map((p) => ({ id: p.id, name: p.name, access_token: p.access_token }));

    const adData = await graph('/me/adaccounts', {
      token,
      params: { fields: 'id,name,account_id,account_status,currency', limit: 100 }
    });
    const ad_accounts = (adData.data || []).map((a) => ({ id: a.id, name: a.name }));

    return Response.json({ pages, ad_accounts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}