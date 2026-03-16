export default async function handler(req, res) {
  const { keyword } = req.query;

  if (!keyword) {
    return res.status(400).json({ error: 'Missing keyword' });
  }

  try {
    const response = await fetch(
      `https://api.apify.com/v2/acts/apify~facebook-ads-scraper/run-sync-get-dataset-items?token=${process.env.APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startUrls: [
            {
              url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&q=${encodeURIComponent(
                String(keyword)
              )}&search_type=keyword_unordered`,
            },
          ],
          resultsLimit: 25,
          includeAboutPage: true,
          isDetailsPerAd: true,
        }),
      }
    );

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch ads' });
  }
}
