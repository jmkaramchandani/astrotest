export default async function handler(req, res) {
  const { keyword, runId } = req.query;

  if (keyword && !runId) {
    const startResponse = await fetch(
      `https://api.apify.com/v2/acts/apify~facebook-ads-scraper/runs?token=${process.env.APIFY_API_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startUrls: [
            {
              url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=${keyword}&search_type=keyword_unordered`
            }
          ],
          resultsLimit: 10
        })
      }
    );

    const data = await startResponse.json();

    return res.status(200).json({
      status: "RUNNING",
      runId: data.data.id
    });
  }

  if (runId) {
    const runResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${process.env.APIFY_API_TOKEN}`
    );

    const runData = await runResponse.json();

    const status = runData.data.status;
    const datasetId = runData.data.defaultDatasetId;

    if (status !== "SUCCEEDED") {
      return res.status(200).json({
        status,
        runId
      });
    }

    const itemsResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?clean=true&token=${process.env.APIFY_API_TOKEN}`
    );

    const items = await itemsResponse.json();

    return res.status(200).json({
      status: "SUCCEEDED",
      items
    });
  }

  return res.status(400).json({
    error: "Provide keyword or runId"
  });
}
