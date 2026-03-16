import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Search,
  Target,
  Radio,
  BarChart3,
  Sparkles,
  TrendingUp,
  MessageSquare,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { auth } from '../firebase';
import { UserProfile } from '../types';

type TabId =
  | 'overview'
  | 'adspy'
  | 'competitors'
  | 'analyzer'
  | 'campaigns'
  | 'hooks'
  | 'trends'
  | 'advisor';

type SearchMode = 'keyword' | 'competitor' | 'landing';

const sidebarItems: { id: TabId; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'adspy', label: 'Global Ad Spy', icon: Search },
  { id: 'competitors', label: 'Competitor Tracker', icon: Target },
  { id: 'analyzer', label: 'AI Ad Analyzer', icon: Radio },
  { id: 'campaigns', label: 'Campaign Tracker', icon: BarChart3 },
  { id: 'hooks', label: 'Hook Generator', icon: Sparkles },
  { id: 'trends', label: 'Trend Radar', icon: TrendingUp },
  { id: 'advisor', label: 'Strategy AI', icon: MessageSquare },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function firstSentence(text: string) {
  if (!text) return '';
  const s = text.split(/[.!?\n]/).find((x) => x.trim().length > 10);
  return (s || text).trim();
}

function detectFunnelAngle(ad: any) {
  const text = `${ad?.title || ''} ${ad?.body || ''} ${ad?.landingPage || ''}`.toLowerCase();

  if (text.includes('quiz') || text.includes('find out') || text.includes('discover')) {
    return 'Quiz Funnel';
  }
  if (text.includes('webinar') || text.includes('masterclass') || text.includes('live training')) {
    return 'Webinar Funnel';
  }
  if (text.includes('download') || text.includes('pdf') || text.includes('guide') || text.includes('ebook')) {
    return 'Lead Magnet Funnel';
  }
  if (
    text.includes('book now') ||
    text.includes('consult') ||
    text.includes('consultation') ||
    text.includes('call now') ||
    text.includes('apply now')
  ) {
    return 'Consult Funnel';
  }
  if (
    text.includes('shop now') ||
    text.includes('buy now') ||
    text.includes('order now') ||
    text.includes('get yours')
  ) {
    return 'Direct Offer Funnel';
  }

  return 'Unknown Funnel';
}

function buildAngleFromText(text: string) {
  const lower = text.toLowerCase();

  if (
    lower.includes('birth') ||
    lower.includes('destiny') ||
    lower.includes('future') ||
    lower.includes('number')
  ) {
    return 'Identity / Destiny';
  }
  if (
    lower.includes('money') ||
    lower.includes('wealth') ||
    lower.includes('career') ||
    lower.includes('success')
  ) {
    return 'Wealth / Career';
  }
  if (
    lower.includes('love') ||
    lower.includes('relationship') ||
    lower.includes('marriage') ||
    lower.includes('partner')
  ) {
    return 'Love / Relationship';
  }
  if (
    lower.includes('healing') ||
    lower.includes('energy') ||
    lower.includes('chakra') ||
    lower.includes('spiritual')
  ) {
    return 'Healing / Spiritual';
  }
  if (
    lower.includes('color') ||
    lower.includes('wear') ||
    lower.includes('remedy') ||
    lower.includes('ritual')
  ) {
    return 'Remedy / Ritual';
  }

  return 'General Curiosity';
}

function cleanTitle(text: string) {
  if (!text) return 'Untitled Ad';
  return text.length > 140 ? `${text.slice(0, 140)}...` : text;
}

export default function Dashboard({ profile }: { profile: UserProfile | null }) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const [adKeyword, setAdKeyword] = useState('');
  const [adCountry, setAdCountry] = useState('GLOBAL');
  const [activeOnly, setActiveOnly] = useState(true);
  const [searchMode, setSearchMode] = useState<SearchMode>('keyword');
  const [competitorNames, setCompetitorNames] = useState('');
  const [landingDomain, setLandingDomain] = useState('');

  const [adResults, setAdResults] = useState<any[]>([]);
  const [adLoading, setAdLoading] = useState(false);
  const [adError, setAdError] = useState('');
  const [adStatus, setAdStatus] = useState('');
  const [adRunId, setAdRunId] = useState('');

  const [aiIdeas, setAiIdeas] = useState<{
    hooks: string[];
    angles: string[];
    ctas: string[];
    scripts: string[];
  }>({
    hooks: [],
    angles: [],
    ctas: [],
    scripts: [],
  });

  const handleLogout = async () => {
    await auth.signOut();
  };

  const handleFindCompetitorAds = async () => {
    setAdLoading(true);
    setAdError('');
    setAdStatus('');
    setAdResults([]);
    setAiIdeas({ hooks: [], angles: [], ctas: [], scripts: [] });
    setAdRunId('');

    try {
      const params = new URLSearchParams();

      params.set('country', adCountry);
      params.set('activeOnly', String(activeOnly));
      params.set('mode', searchMode);

      if (searchMode === 'keyword') {
        if (!adKeyword.trim()) {
          setAdError('Please enter a keyword.');
          setAdLoading(false);
          return;
        }
        params.set('keyword', adKeyword.trim());
      }

      if (searchMode === 'competitor') {
        if (!competitorNames.trim()) {
          setAdError('Please enter one or more competitor names.');
          setAdLoading(false);
          return;
        }
        params.set('competitorNames', competitorNames.trim());
      }

      if (searchMode === 'landing') {
        if (!adKeyword.trim()) {
          setAdError('Please enter a keyword first.');
          setAdLoading(false);
          return;
        }
        if (!landingDomain.trim()) {
          setAdError('Please enter a landing page domain.');
          setAdLoading(false);
          return;
        }
        params.set('keyword', adKeyword.trim());
        params.set('landingDomain', landingDomain.trim());
      }

      const startRes = await fetch(`/api/ads?${params.toString()}`);
      const startData = await startRes.json();

      if (!startRes.ok || !startData.runId) {
        setAdError(startData.error || 'Failed to start ad search.');
        setAdLoading(false);
        return;
      }

      setAdRunId(startData.runId);
      setAdStatus('Scraping ads...');

      let done = false;
      let tries = 0;

      while (!done && tries < 45) {
        await sleep(4000);

        const pollRes = await fetch(`/api/ads?runId=${encodeURIComponent(startData.runId)}`);
        const pollData = await pollRes.json();

        if (!pollRes.ok) {
          setAdError(pollData.error || 'Failed while checking ad run.');
          setAdLoading(false);
          return;
        }

        if (pollData.status === 'SUCCEEDED') {
          const items = Array.isArray(pollData.items) ? pollData.items : [];
          setAdResults(items);
          setAdStatus(`Found ${items.length} ads`);
          done = true;
          break;
        }

        if (
          pollData.status === 'FAILED' ||
          pollData.status === 'ABORTED' ||
          pollData.status === 'TIMED-OUT'
        ) {
          setAdError(`Search failed: ${pollData.status}`);
          setAdLoading(false);
          return;
        }

        setAdStatus(`Status: ${pollData.status || 'RUNNING'}...`);
        tries += 1;
      }

      if (!done) {
        setAdError('Search took too long. Please try again.');
      }
    } catch (e) {
      setAdError('Something went wrong while searching ads.');
    } finally {
      setAdLoading(false);
    }
  };

  const topHooks = useMemo(() => {
    const counts = new Map<string, number>();

    adResults.forEach((ad) => {
      const hook = firstSentence(ad?.body || ad?.title || '');
      if (hook) counts.set(hook, (counts.get(hook) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [adResults]);

  const topFormats = useMemo(() => {
    const counts = new Map<string, number>();

    adResults.forEach((ad) => {
      const key = String(ad?.format || 'Unknown').toUpperCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [adResults]);

  const topFunnels = useMemo(() => {
    const counts = new Map<string, number>();

    adResults.forEach((ad) => {
      const funnel = detectFunnelAngle(ad);
      counts.set(funnel, (counts.get(funnel) || 0) + 1);
    });

    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [adResults]);

  const landingPages = useMemo(() => {
    const urls = new Set<string>();
    adResults.forEach((ad) => {
      if (ad?.landingPage) urls.add(ad.landingPage);
    });
    return Array.from(urls).slice(0, 10);
  }, [adResults]);

  const bestAngles = useMemo(() => {
    const counts = new Map<string, number>();

    adResults.forEach((ad) => {
      const angle = buildAngleFromText(`${ad?.title || ''} ${ad?.body || ''}`);
      counts.set(angle, (counts.get(angle) || 0) + 1);
    });

    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [adResults]);

  const handleGenerateIdeas = () => {
    const baseKeyword =
      searchMode === 'keyword'
        ? adKeyword.trim()
        : searchMode === 'landing'
        ? adKeyword.trim()
        : competitorNames.split(',')[0]?.trim() || 'your niche';

    const hooks = topHooks.slice(0, 5).map(([hook]) => hook);

    const generatedHooks = [
      `What your ${baseKeyword} pattern is secretly saying about your future`,
      `The hidden reason most people struggle before they understand ${baseKeyword}`,
      `One simple shift in ${baseKeyword} can change your next chapter`,
      `Why your current path feels blocked — and what ${baseKeyword} reveals`,
      `The truth about ${baseKeyword} that most people discover too late`,
    ];

    const generatedAngles = [
      `${baseKeyword} as identity decoding`,
      `${baseKeyword} as a practical life shortcut`,
      `${baseKeyword} for love, wealth, and confidence`,
    ];

    const generatedCtas = [
      'Discover your result now',
      'See your personalized insight',
      'Unlock your reading today',
      'Find your next step now',
      'Get the answer instantly',
    ];

    const generatedScripts = [
      `Hook: ${hooks[0] || generatedHooks[0]}\nBody: Show the pain point, reveal the hidden pattern, and promise a practical next step.\nCTA: ${generatedCtas[0]}`,
      `Hook: ${hooks[1] || generatedHooks[1]}\nBody: Use curiosity + transformation + urgency.\nCTA: ${generatedCtas[1]}`,
    ];

    setAiIdeas({
      hooks: hooks.length ? hooks.concat(generatedHooks).slice(0, 5) : generatedHooks,
      angles: generatedAngles,
      ctas: generatedCtas,
      scripts: generatedScripts,
    });
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Competitor Ads Found', value: adResults.length },
          { label: 'Top Hook Patterns', value: topHooks.length },
          { label: 'Formats Detected', value: topFormats.length },
          { label: 'System Status', value: 'Live' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Welcome Back</h2>
        <p className="text-slate-600 mt-2">
          Use <strong>Global Ad Spy</strong> to search live competitor ads by keyword, country,
          competitor names, or landing page domain.
        </p>
      </div>
    </div>
  );

  const renderAdSpy = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Competitor Ad Finder</h2>
            <p className="text-sm text-slate-500 mt-1">
              Search by keyword, country, competitor name, or landing page domain.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1">
              <CheckCircle2 className="w-4 h-4" />
              System Live
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <input
            value={adKeyword}
            onChange={(e) => setAdKeyword(e.target.value)}
            placeholder="Keyword: astrology, tarot, psychic, spiritual"
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={adCountry}
            onChange={(e) => setAdCountry(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="GLOBAL">Global</option>
            <option value="IN">India</option>
            <option value="US">United States</option>
            <option value="UK">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="AE">UAE</option>
          </select>

          <select
            value={searchMode}
            onChange={(e) => setSearchMode(e.target.value as SearchMode)}
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="keyword">Keyword</option>
            <option value="competitor">Competitor names</option>
            <option value="landing">Landing page domain</option>
          </select>

          <select
            value={activeOnly ? 'active' : 'all'}
            onChange={(e) => setActiveOnly(e.target.value === 'active')}
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active only</option>
            <option value="all">Active + inactive</option>
          </select>
        </div>

        {searchMode === 'competitor' && (
          <input
            value={competitorNames}
            onChange={(e) => setCompetitorNames(e.target.value)}
            placeholder="Competitor names, comma separated"
            className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        {searchMode === 'landing' && (
          <input
            value={landingDomain}
            onChange={(e) => setLandingDomain(e.target.value)}
            placeholder="Landing page domain, e.g. example.com"
            className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        <div className="mt-4 flex gap-3 flex-wrap">
          <button
            onClick={handleFindCompetitorAds}
            disabled={adLoading}
            className="rounded-xl bg-[#1F3A8A] hover:opacity-90 text-white px-5 py-3 font-semibold disabled:opacity-50"
          >
            {adLoading ? 'Searching...' : 'Search Ads'}
          </button>

          <button
            onClick={handleGenerateIdeas}
            disabled={!adResults.length}
            className="rounded-xl bg-[#D4AF37] hover:opacity-90 text-white px-5 py-3 font-semibold disabled:opacity-50"
          >
            Generate AI Ideas
          </button>
        </div>

        {!!adStatus && (
          <div className="mt-4 text-sm text-slate-600">
            <strong>Status:</strong> {adStatus}
            {adRunId ? <span className="ml-2 text-slate-400">Run ID: {adRunId}</span> : null}
          </div>
        )}

        {!!adError && (
          <div className="mt-4 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <span>{adError}</span>
          </div>
        )}
      </div>

      {(topHooks.length > 0 || topFormats.length > 0 || topFunnels.length > 0) && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Best Hook Patterns</h3>
            <div className="mt-4 space-y-3">
              {topHooks.map(([hook, count], idx) => (
                <div key={idx} className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">{hook}</p>
                  <p className="text-xs text-slate-500 mt-1">Seen {count} time(s)</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Format Breakdown</h3>
            <div className="mt-4 space-y-3">
              {topFormats.map(([format, count], idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">{format}</p>
                  <p className="text-sm text-slate-500">{count}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Funnel Angles</h3>
            <div className="mt-4 space-y-3">
              {topFunnels.map(([funnel, count], idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">{funnel}</p>
                  <p className="text-sm text-slate-500">{count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(landingPages.length > 0 || bestAngles.length > 0) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Landing Page Links</h3>
            <div className="mt-4 space-y-3">
              {landingPages.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl bg-slate-50 px-4 py-3 text-sm text-blue-600 hover:text-blue-700"
                >
                  {url}
                </a>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Top Market Angles</h3>
            <div className="mt-4 space-y-3">
              {bestAngles.map(([angle, count], idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">{angle}</p>
                  <p className="text-sm text-slate-500">{count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(aiIdeas.hooks.length > 0 || aiIdeas.angles.length > 0 || aiIdeas.scripts.length > 0) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">AI-Generated Hooks You Can Run</h3>
            <div className="mt-4 space-y-3">
              {aiIdeas.hooks.map((hook, idx) => (
                <div key={idx} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-900">
                  {hook}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">AI Ad Angles + CTAs</h3>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Angles</p>
                <div className="space-y-2">
                  {aiIdeas.angles.map((angle, idx) => (
                    <div key={idx} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-900">
                      {angle}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">CTAs</p>
                <div className="space-y-2">
                  {aiIdeas.ctas.map((cta, idx) => (
                    <div key={idx} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-900">
                      {cta}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">AI Ad Scripts You Can Run</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiIdeas.scripts.map((script, idx) => (
                <div key={idx} className="rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-900 whitespace-pre-wrap">
                  {script}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {adResults.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {adResults.map((ad, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{cleanTitle(ad?.title || '')}</h3>
                  <p className="text-sm text-slate-500 mt-1">{ad?.pageName || 'Unknown advertiser'}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    ad?.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {ad?.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {ad?.imageUrl ? (
                <img
                  src={ad.imageUrl}
                  alt={ad.title || 'Ad'}
                  className="mt-4 w-full h-52 object-cover rounded-xl border border-slate-200"
                />
              ) : ad?.videoUrl ? (
                <video
                  src={ad.videoUrl}
                  controls
                  className="mt-4 w-full h-52 object-cover rounded-xl border border-slate-200"
                />
              ) : null}

              {!!ad?.body && (
                <p className="mt-4 text-sm text-slate-700 whitespace-pre-wrap">
                  {ad.body}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <p className="text-slate-500">Format</p>
                  <p className="font-medium text-slate-900">{ad?.format || 'Unknown'}</p>
                </div>

                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <p className="text-slate-500">Platforms</p>
                  <p className="font-medium text-slate-900">
                    {Array.isArray(ad?.platforms) && ad.platforms.length
                      ? ad.platforms.join(', ')
                      : 'Unknown'}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <p className="text-slate-500">Start</p>
                  <p className="font-medium text-slate-900">{ad?.startDate || '—'}</p>
                </div>

                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <p className="text-slate-500">End</p>
                  <p className="font-medium text-slate-900">{ad?.endDate || '—'}</p>
                </div>

                <div className="rounded-xl bg-slate-50 px-3 py-2 col-span-2">
                  <p className="text-slate-500">Funnel Angle</p>
                  <p className="font-medium text-slate-900">{detectFunnelAngle(ad)}</p>
                </div>
              </div>

              {ad?.landingPage && (
                <a
                  href={ad.landingPage}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium mr-4"
                >
                  <Globe className="w-4 h-4" />
                  Open Landing Page
                </a>
              )}

              {ad?.adSnapshotUrl && (
                <a
                  href={ad.adSnapshotUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Ad Snapshot
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPlaceholder = (title: string, text: string) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <p className="text-slate-600 mt-2">{text}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="w-[290px] bg-[#0F2F7A] text-white flex flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <div className="text-2xl font-bold tracking-tight">ASTRA</div>
          <div className="text-white/70 -mt-1">Analytics</div>
        </div>

        <nav className="flex-1 px-4 py-5 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  active ? 'bg-[#D4AF37] text-white shadow-lg shadow-[#D4AF37]/20' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="rounded-2xl bg-white/8 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37] text-[#0F2F7A] font-bold flex items-center justify-center">
                {profile?.displayName?.[0] || 'A'}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{profile?.displayName || 'Admin User'}</p>
                <p className="text-sm text-white/70 truncate">{profile?.role || 'admin'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-white/90 hover:bg-white/10"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {activeTab === 'overview'
                ? 'Dashboard'
                : sidebarItems.find((x) => x.id === activeTab)?.label || 'Dashboard'}
            </h1>
            <p className="text-slate-500 mt-1">
              {activeTab === 'overview'
                ? 'Welcome back, admin'
                : 'Marketing intelligence workspace'}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-4 py-2 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            System Live
          </div>
        </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'adspy' && renderAdSpy()}
        {activeTab === 'competitors' &&
          renderPlaceholder('Competitor Tracker', 'Track saved competitors and compare their ad angles in the next build.')}
        {activeTab === 'analyzer' &&
          renderPlaceholder('AI Ad Analyzer', 'Use scraped competitor ads to analyze hooks, formats, and conversion style.')}
        {activeTab === 'campaigns' &&
          renderPlaceholder('Campaign Tracker', 'Connect your own ad account next for CPL, CTR, CPA, and ROAS.')}
        {activeTab === 'hooks' &&
          renderPlaceholder('Hook Generator', 'Generate hook ideas from the market patterns already found in Global Ad Spy.')}
        {activeTab === 'trends' &&
          renderPlaceholder('Trend Radar', 'See recurring themes across astrology, tarot, psychic, and spiritual markets.')}
        {activeTab === 'advisor' &&
          renderPlaceholder('Strategy AI', 'Use the market intelligence to create your next offer, ad, and funnel direction.')}
      </main>
    </div>
  );
}
