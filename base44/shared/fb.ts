const GRAPH = 'https://graph.facebook.com/v21.0';

export async function graph(path, { token, method = 'GET', params = {}, body = null } = {}) {
  const url = new URL(GRAPH + path);
  if (method === 'GET') {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, typeof v === 'string' ? v : JSON.stringify(v));
    }
    url.searchParams.set('access_token', token);
  }
  const opts = { method };
  if (method !== 'GET') {
    const form = new URLSearchParams();
    for (const [k, v] of Object.entries(body || {})) {
      if (v === undefined || v === null) continue;
      form.set(k, typeof v === 'string' ? v : JSON.stringify(v));
    }
    form.set('access_token', token);
    opts.body = form;
  }
  const res = await fetch(url.toString(), opts);
  const data = await res.json();
  if (!res.ok || data.error) {
    const msg = data?.error?.error_user_msg || data?.error?.message || 'Facebook API error';
    throw new Error(msg);
  }
  return data;
}

export async function getUserToken(base44) {
  const user = await base44.auth.me();
  if (!user) throw new Error('Unauthorized');
  const rows = await base44.entities.FbSettings.filter({ created_by_id: user.id }, '-updated_date', 1);
  if (!rows.length || !rows[0].user_token) throw new Error('لم يتم إضافة توكن المستخدم بعد');
  return { token: rows[0].user_token, user };
}

export async function getPageToken(token, pageId) {
  const data = await graph('/' + pageId, { token, params: { fields: 'access_token,name' } });
  if (!data.access_token) throw new Error('لا يوجد توكن لهذه الصفحة');
  return data;
}

export function normalizeAccountId(id) {
  return String(id).startsWith('act_') ? String(id) : 'act_' + id;
}