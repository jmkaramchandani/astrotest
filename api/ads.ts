import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const {
      keyword = "",
      runId,
      country = "GLOBAL",
      activeOnly = "true",
      mode = "keyword",
      competitorNames = "",
      landingDomain = "",
    } = req.query;

    const token = process.env.APIFY_API_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "APIFY_API_TOKEN missing in Vercel env variables",
      });
    }

    function buildAdLibraryUrl(searchTerm: string, selectedCountry: string, onlyActive: boolean) {
      const params = new URLSearchParams({
        active_status: onlyActive ? "active" : "all",
        ad_type: "all",
        q: searchTerm,
        search_type: "keyword_unordered",
      });

      if (selectedCountry && selectedCountry !== "GLOBAL") {
        params.set("country", selectedCountry);
      }

      return `https://www.facebook.com/ads/library/?${params.toString()}`;
    }

    function normalizeAd(item: any) {
      return {
        title:
          item?.snapshot?.title ||
          item?.snapshot?.body?.text ||
          item?.snapshot?.caption ||
          item?.adText ||
          item?.headline ||
          item?.title ||
          "Untitled Ad",
        body:
          item?.snapshot?.body?.text ||
          item?.snapshot?.caption ||
          item?.adText ||
          item?.primaryText ||
          "",
        format:
          item?.snapshot?.displayFormat ||
          item?.displayFormat ||
          item?.mediaType ||
          item?.format ||
          "Unknown",
        pageName:
          item?.pageName ||
          item?.aboutPageInfo?.name ||
          item?.snapshot?.pageName ||
          item?.page_name ||
          "Unknown advertiser",
        platforms: Array.isArray(
          item?.publisherPlatform ||
            item?.publisherPlatforms ||
            item?.platforms ||
            item?.snapshot?.publisherPlatforms
        )
          ? item?.publisherPlatform ||
            item?.publisherPlatforms ||
            item?.platforms ||
            item?.snapshot?.publisherPlatforms
          : [],
        imageUrl:
          item?.snapshot?.images?.[0]?.url ||
          item?.imageUrl ||
          item?.snapshot?.imageUrl ||
          "",
        videoUrl:
          item?.snapshot?.videos?.[0]?.url ||
          item?.videoUrl ||
          item?.snapshot?.videoUrl ||
          "",
        adSnapshotUrl:
          item?.adSnapshotUrl ||
          item?.snapshot?.adSnapshotUrl ||
          item?.url ||
          "",
        landingPage:
          item?.landingPage ||
          item?.landingPageUrl ||
          item?.destinationUrl ||
          item?.snapshot?.linkUrl ||
          "",
        startDate:
          item?.startDateFormatted ||
          item?.snapshot?.startDateFormatted ||
          item?.startDate ||
          "",
        endDate:
          item?.endDateFormatted ||
          item?.snapshot?.endDateFormatted ||
          item?.endDate ||
          "",
        active:
          item?.isActive === true ||
          item?.snapshot?.isActive === true ||
          false,
      };
    }

    if ((keyword && !runId) || (mode === "competitor" && competitorNames && !runId)) {
      const selectedCountry = String(country || "GLOBAL").toUpperCase();
      const onlyActive = String(activeOnly) === "true";

      let startUrls: { url: string }[] = [];

      if (mode === "competitor") {
        const names = String(competitorNames)
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);

        if (!names.length) {
          return res.status(400).json({
            error: "Provide competitorNames when mode=competitor",
          });
        }

        startUrls = names.map((name) => ({
          url: buildAdLibraryUrl(name, selectedCountry, onlyActive),
        }));
      } else {
        if (!keyword) {
          return res.status(400).json({
            error: "Provide keyword when mode=keyword or mode=landing",
          });
        }

        startUrls = [
          {
            url: buildAdLibraryUrl(String(keyword), selectedCountry, onlyActive),
          },
        ];
      }

      const startResponse = await fetch(
        `https://api.apify.com/v2/acts/apify~facebook-ads-scraper/runs?token=${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startUrls,
            resultsLimit: 15,
            includeAboutPage: true,
            isDetailsPerAd: true,
          }),
        }
      );

      const startData = await startResponse.json();

      if (!startResponse.ok) {
        return res.status(startResponse.status).json({
          error: "Failed to start Apify run",
          details: startData,
        });
      }

      return res.status(200).json({
        status: "RUNNING",
        runId: startData?.data?.id,
        datasetId: startData?.data?.defaultDatasetId,
      });
    }

    if (runId) {
      const runResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${token}`
      );

      const runData = await runResponse.json();

      if (!runResponse.ok) {
        return res.status(runResponse.status).json(runData);
      }

      const status = runData?.data?.status;
      const datasetId = runData?.data?.defaultDatasetId;

      if (status !== "SUCCEEDED") {
        return res.status(200).json({
          status,
          runId,
          datasetId,
        });
      }

      const itemsResponse = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?clean=true&token=${token}`
      );

      const items = await itemsResponse.json();

      let normalized = Array.isArray(items) ? items.map(normalizeAd) : [];

      if (landingDomain) {
        const domain = String(landingDomain).toLowerCase().trim();
        normalized = normalized.filter((ad) =>
          String(ad.landingPage || "").toLowerCase().includes(domain)
        );
      }

      return res.status(200).json({
        status: "SUCCEEDED",
        items: normalized,
      });
    }

    return res.status(400).json({
      error: "Provide keyword, competitorNames, or runId",
    });
  } catch (err: any) {
    console.error("ADS API ERROR:", err);

    return res.status(500).json({
      error: "Server crashed",
      details: err?.message || String(err),
    });
  }
}
