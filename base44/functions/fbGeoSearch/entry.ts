import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { graph, getUserToken } from '../../shared/fb.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await getUserToken(base44);
    const { kind = 'country', q = '', country_code = null } = await req.json().catch(() => ({}));

    const params = {
      type: 'adgeolocation',
      q: String(q).slice(0, 50),
      limit: 100,
      location_types: kind === 'country' ? ['country'] : ['region', 'city']
    };
    if (kind !== 'country' && country_code) params.country_code = country_code;

    const data = await graph('/search', { token, params });
    const results = (data.data || []).map(r => ({
      key: r.key,
      name: r.name,
      type: r.type,
      country_code: r.country_code,
      region: r.region,
      label: [r.name, r.region, r.country_name].filter(Boolean).join(' - ')
    }));
    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}