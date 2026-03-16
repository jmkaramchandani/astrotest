export default async function handler(req, res) {
  const { keyword = '', country = 'IN' } = req.query;

  if (!keyword) {
    return res.status(400).json({ error: 'Missing keyword' });
  }

  const params = new URLSearchParams({
    search_terms: String(keyword),
    access_token: process.env.META_ACCESS_TOKEN || '',
    ad_reached_countries: JSON.stringify([String(country)]),
    fields:
      'id,ad_snapshot_url,page_id,page_name,ad_delivery_start_time,ad_delivery_stop_time,publisher_platforms',
  });

  try {
    const response = await fetch(
      `https://graph.facebook.com/v25.0/ads_archive?${params.toString()}`
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch ads from Meta' });
  }
}
