import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const keyword = req.query.keyword || "";
    const country = req.query.country || "GLOBAL";
    const mode = req.query.mode || "keyword";
    const activeOnly = req.query.activeOnly === "true";

    const token = process.env.APIFY_API_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "APIFY_API_TOKEN missing in Vercel env variables",
      });
    }

    const actor = "apify/facebook-ads-scraper";

    const input = {
      searchTerms: [keyword],
      country,
      activeOnly,
      limit: 20,
    };

    const run = await fetch(
      `https://api.apify.com/v2/acts/${actor}/runs?token=${token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }
    );

    const data = await run.json();

    if (!data.data?.id) {
      return res.status(500).json({
        error: "Failed to start Apify run",
        details: data,
      });
    }

    res.status(200).json({
      status: "RUNNING",
      runId: data.data.id,
    });
  } catch (err: any) {
    console.error("ADS API ERROR:", err);

    res.status(500).json({
      error: "Server crashed",
      details: err.message,
    });
  }
}
