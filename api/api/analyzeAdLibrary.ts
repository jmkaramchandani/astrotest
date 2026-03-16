export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { adLibraryUrl, maxItems = 30 } = req.body || {};

  if (!adLibraryUrl) {
    return res.status(400).json({ error: 'Missing adLibraryUrl' });
  }

  try {
    // 1) Start Apify actor run
    const actorId = 'apify/facebook-ads-scraper';

    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${process.env.APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startUrls: [{ url: adLibraryUrl }],
          resultsLimit: maxItems,
        }),
      }
    );

    const runData = await runResponse.json();

    if (!runResponse.ok) {
      return res.status(500).json({
        error: 'Failed to start Apify run',
        details: runData,
      });
    }

    const runId = runData?.data?.id;
    const datasetId = runData?.data?.defaultDatasetId;

    if (!runId || !datasetId) {
      return res.status(500).json({
        error: 'Missing Apify run or dataset ID',
        details: runData,
      });
    }

    // 2) Poll until finished
    let status = runData?.data?.status;
    let attempts = 0;

    while (status !== 'SUCCEEDED' && attempts < 30) {
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${process.env.APIFY_API_TOKEN}`
      );
      const statusData = await statusResponse.json();

      status = statusData?.data?.status;

      if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        return res.status(500).json({
          error: 'Apify run failed',
          details: statusData,
        });
      }

      attempts += 1;
    }

    if (status !== 'SUCCEEDED') {
      return res.status(504).json({ error: 'Timed out waiting for scraper results' });
    }

    // 3) Get scraped ads
    const itemsResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?clean=true&token=${process.env.APIFY_API_TOKEN}`
    );
    const items = await itemsResponse.json();

    // 4) Normalize ads
    const ads = (items || []).map((item) => ({
      pageName: item.pageName || item.page_name || 'Unknown advertiser',
      adText: item.adText || item.primaryText || item.caption || '',
      headline: item.headline || item.title || '',
      cta: item.cta || item.callToAction || '',
      mediaType: item.mediaType || item.format || item.creativeType || 'unknown',
      platforms: item.publisherPlatforms || item.platforms || [],
      startDate: item.startDate || item.adDeliveryStartTime || '',
      endDate: item.endDate || item.adDeliveryStopTime || '',
      adSnapshotUrl: item.adSnapshotUrl || item.ad_snapshot_url || '',
      imageUrl: item.imageUrl || '',
      videoUrl: item.videoUrl || '',
      landingPage: item.landingPageUrl || item.destinationUrl || '',
    }));

    // 5) Lightweight analysis
    const hooks = ads
      .map((ad) => ad.adText || ad.headline)
      .filter(Boolean)
      .map((text) => text.split(/[.!?\n]/)[0].trim())
      .filter((x) => x.length > 10);

    const hookCounts = {};
    for (const hook of hooks) {
      hookCounts[hook] = (hookCounts[hook] || 0) + 1;
    }

    const topHooks = Object.entries(hookCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hook, count]) => ({ hook, count }));

    const formatCounts = {};
    for (const ad of ads) {
      const key = String(ad.mediaType || 'unknown').toLowerCase();
      formatCounts[key] = (formatCounts[key] || 0) + 1;
    }

    const topFormats = Object.entries(formatCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([format, count]) => ({ format, count }));

    const ctaCounts = {};
    for (const ad of ads) {
      const key = (ad.cta || '').trim();
      if (!key) continue;
      ctaCounts[key] = (ctaCounts[key] || 0) + 1;
    }

    const topCtas = Object.entries(ctaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cta, count]) => ({ cta, count }));

    const scriptGenerator = {
      hook:
        topHooks[0]?.hook ||
        'Discover the hidden pattern that most people miss.',
      body:
        'Show the pain point, reveal the insight, and promise a simple next step.',
      cta:
        topCtas[0]?.cta || 'Learn More',
    };

    return res.status(200).json({
      ads,
      analysis: {
        totalAds: ads.length,
        topHooks,
        topFormats,
        topCtas,
        scriptGenerator,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to analyze Ad Library URL',
      details: String(error),
    });
  }
}
