import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { graph, getUserToken, getPageToken, normalizeAccountId } from '../../shared/fb.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await getUserToken(base44);
    const p = await req.json();

    if (!p.page_id || !p.ad_account_id || !p.message) {
      return Response.json({ error: 'الصفحة والحساب الإعلاني والمحتوى مطلوبين' }, { status: 400 });
    }

    const act = normalizeAccountId(p.ad_account_id);
    const page = await getPageToken(token, p.page_id);
    const pageToken = page.access_token;

    const minutes = Number(p.start_after_minutes || 10);
    const start = new Date(Date.now() + minutes * 60000);
    const days = Number(p.days || 0);
    const end = days > 0 ? new Date(start.getTime() + days * 86400000) : null;

    const geo = {};
    if (p.targeting_mode === 'regions') {
      const regions = (p.regions || []).filter(r => r.type === 'region').map(r => ({ key: r.key }));
      const cities = (p.regions || []).filter(r => r.type === 'city').map(r => ({ key: r.key }));
      if (regions.length) geo.regions = regions;
      if (cities.length) geo.cities = cities;
      if (!regions.length && !cities.length) return Response.json({ error: 'اختر محافظة أو مدينة واحدة على الأقل' }, { status: 400 });
    } else {
      if (!(p.countries || []).length) return Response.json({ error: 'اختر دولة واحدة على الأقل' }, { status: 400 });
      geo.countries = p.countries;
    }

    const targeting = {
      geo_locations: geo,
      age_min: Number(p.age_min || 18),
      age_max: Number(p.age_max || 65)
    };
    if (Array.isArray(p.genders) && p.genders.length === 1) targeting.genders = p.genders;

    const name = (p.message || 'Dark Post').slice(0, 40);
    const adStatus = p.ad_status === 'PAUSED' ? 'PAUSED' : 'ACTIVE';

    const campaign = await graph('/' + act + '/campaigns', {
      token, method: 'POST',
      body: {
        name: 'DP - ' + name,
        objective: 'OUTCOME_TRAFFIC',
        status: adStatus,
        special_ad_categories: [],
        buying_type: 'AUCTION'
      }
    });

    const adset = await graph('/' + act + '/adsets', {
      token, method: 'POST',
      body: {
        name: 'DP AdSet - ' + name,
        campaign_id: campaign.id,
        daily_budget: Math.round(Number(p.daily_budget_usd || 5) * 100),
        billing_event: 'IMPRESSIONS',
        optimization_goal: 'LINK_CLICKS',
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
        start_time: start.toISOString(),
        end_time: end ? end.toISOString() : null,
        targeting,
        status: adStatus
      }
    });

    const linkData = {
      message: p.message,
      link: p.link || ('https://www.facebook.com/' + p.page_id)
    };
    if (p.image_url) linkData.picture = p.image_url;

    const creative = await graph('/' + act + '/adcreatives', {
      token: pageToken, method: 'POST',
      body: {
        name: 'DP Creative - ' + name,
        object_story_spec: { page_id: p.page_id, link_data: linkData },
        degrees_of_freedom_spec: { creative_features_spec: { standard_enhancements: { enroll_status: 'OPT_OUT' } } }
      }
    });

    const ad = await graph('/' + act + '/ads', {
      token, method: 'POST',
      body: {
        name: 'DP Ad - ' + name,
        adset_id: adset.id,
        creative: { creative_id: creative.id },
        status: adStatus
      }
    });

    const record = await base44.entities.DarkPostAd.create({
      page_id: p.page_id,
      page_name: page.name,
      ad_account_id: act,
      message: p.message,
      image_url: p.image_url || null,
      link: linkData.link,
      targeting_mode: p.targeting_mode || 'countries',
      countries: p.countries || [],
      regions: (p.regions || []).map(r => ({ key: r.key, name: r.label || r.name })),
      genders: p.genders || [],
      age_min: Number(p.age_min || 18),
      age_max: Number(p.age_max || 65),
      daily_budget_usd: Number(p.daily_budget_usd || 5),
      days,
      start_after_minutes: minutes,
      scheduled_start: start.toISOString(),
      fb_campaign_id: campaign.id,
      fb_adset_id: adset.id,
      fb_creative_id: creative.id,
      fb_ad_id: ad.id,
      status: 'created'
    });

    return Response.json({ ok: true, record, scheduled_start: start.toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}