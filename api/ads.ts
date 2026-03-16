export default async function handler(req, res) {
  const {
    keyword,
    runId,
    country = 'GLOBAL',
    activeOnly = 'true',
    mode = 'keyword',
    competitorNames = '',
    landingDomain = '',
  } = req.query;

  const token = process.env.APIFY_API_TOKEN;

  if (!token) {
    return res.status(500).json({
      error: 'Missing APIFY_API_TOKEN in environment variables',
    });
  }

  function buildAdLibraryUrl(searchTerm, selectedCountry, onlyActive) {
    const params = new URLSearchParams({
      active_status: onlyActive ? 'active' : 'all',
      ad_type: 'all',
      q: searchTerm,
      search_type: 'keyword_unordered',
    });

    if (selectedCountry && selectedCountry !== 'GLOBAL') {
      params.set('country', selectedCountry);
    }

    return `https://www.facebook.com/ads/library/?${params.toString()}`;
  }

  function normalizeAd(item) {
    const title =
      item?.snapshot?.title ||
      item?.snapshot?.body?.text ||
      item?.snapshot?.caption ||
      item?.adText ||
      item?.headline ||
      item?.title ||
      'Untitled Ad';

    const body =
      item?.snapshot?.body?.text ||
      item?.snapshot?.caption ||
      item?.adText ||
      item?.primaryText ||
      '';

    const format =
      item?.snapshot?.displayFormat ||
      item?.displayFormat ||
      item?.mediaType ||
      item?.format ||
      'Unknown';

    const pageName =
      item?.pageName ||
      item?.aboutPageInfo?.name ||
      item?.snapshot?.pageName ||
      item?.page_name ||
      'Unknown advertiser';

    const platformsRaw =
      item?.publisherPlatform ||
      item?.publisherPlatforms ||
      item?.platforms ||
      item?.snapshot?.publisherPlatforms ||
      [];

    const platforms = Array.isArray(platformsRaw)
      ? platformsRaw
      : typeof platformsRaw === 'string'
      ? [platformsRaw]
      : [];

    const imageUrl =
      item?.snapshot?.images?.[0]?.url ||
      item?.imageUrl ||
      item?.snapshot?.imageUrl ||
      '';

    const videoUrl =
      item?.snapshot?.videos?.[0]?.url ||
      item?.videoUrl ||
      item?.snapshot?.videoUrl ||
      '';

    const adSnapshotUrl =
      item?.adSnapshotUrl ||
      item?.snapshot?.adSnapshotUrl ||
      item?.url ||
      '';

    const landingPage =
      item?.landingPage ||
      item?.landingPageUrl ||
      item?.destinationUrl ||
      item?.snapshot?.linkUrl ||
      '';

    const startDate =
      item?.startDateFormatted ||
      item?.snapshot?.startDateFormatted ||
      item?.startDate ||
      '';

    const endDate =
      item?.endDateFormatted ||
      item?.snapshot?.endDateFormatted ||
      item?.endDate ||
      '';

    const active =
      item?.isActive === true ||
      item?.snapshot?.isActive === true ||
      false;

    return {
      title,
      body,
      format,
      pageName,
      platforms,
      imageUrl,
      videoUrl,
      adSnapshotUrl,
      landingPage,
      startDate,
      endDate,
      active,
      raw: item,
    };
  }

  try {
    // STEP 1: Start a new run
    if (keyword && !runId || (mode === 'competitor' && competitorNames && !runId)) {
      const selectedCountry = String(country || 'GLOBAL').toUpperCase();
      const onlyActive = String(activeOnly) === 'true';

      let startUrls = [];

      if (mode === 'competitor') {
        const names = String(competitorNames)
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean);

        if (!names.length) {
          return res.status(400).json({
            error: 'Provide competitorNames when mode=competitor',
          });
        }

        startUrls = names.map((name) => ({
          url: buildAdLibraryUrl(name, selectedCountry, onlyActive),
        }));
      } else {
        if (!keyword) {
          return res.status(400).json({
            error: 'Provide keyword when mode=keyword or mode=landing',
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
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
        return res.status(startResponse.status).json(startData);
      }

      return res.status(200).json({
        status: 'RUNNING',
        runId: startData?.data?.id,
        datasetId: startData?.data?.defaultDatasetId,
      });
    }

    // STEP 2: Poll run status / fetch results
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

      if (status !== 'SUCCEEDED') {
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
          String(ad.landingPage || '').toLowerCase().includes(domain)
        );
      }

      return res.status(200).json({
        status: 'SUCCEEDED',
        items: normalized,
      });
    }

    return res.status(400).json({
      error: 'Provide keyword, competitorNames, or runId',
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to process ad search',
      details: String(error),
    });
  }
}
