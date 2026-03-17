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
  PlayCircle,
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

  if (text.includes('quiz') || text.includes('find out') || text.includes('discover')) return 'Quiz Funnel';
  if (text.includes('webinar') || text.includes('masterclass') || text.includes('live training')) return 'Webinar Funnel';
  if (text.includes('download') || text.includes('pdf') || text.includes('guide') || text.includes('ebook')) return 'Lead Magnet Funnel';
  if (
    text.includes('book now') ||
    text.includes('consult') ||
    text.includes('consultation') ||
    text.includes('call now') ||
    text.includes('apply now')
  ) return 'Consult Funnel';
  if (
    text.includes('shop now') ||
    text.includes('buy now') ||
    text.includes('order now') ||
    text.includes('get yours')
  ) return 'Direct Offer Funnel';

  return 'Unknown Funnel';
}

function detectHookType(text: string) {
  const lower = text.toLowerCase();

  if (
    lower.includes('why') ||
    lower.includes('what if') ||
    lower.includes('discover') ||
    lower.includes('hidden')
  ) return 'Curiosity Hook';

  if (
    lower.includes('stuck') ||
    lower.includes('blocked') ||
    lower.includes('drained') ||
    lower.includes('struggle') ||
    lower.includes('problem')
  ) return 'Pain Hook';

  if (
    lower.includes('success') ||
    lower.includes('wealth') ||
    lower.includes('love') ||
    lower.includes('confidence') ||
    lower.includes('future')
  ) return 'Desire Hook';

  if (
    lower.includes('personalized') ||
    lower.includes('report') ||
    lower.includes('reading') ||
    lower.includes('guide')
  ) return 'Personalization Hook';

  return 'General Hook';
}

function buildAngleFromText(text: string) {
  const lower = text.toLowerCase();

  if (
    lower.includes('birth') ||
    lower.includes('destiny') ||
    lower.includes('future') ||
    lower.includes('number')
  ) return 'Identity / Destiny';

  if (
    lower.includes('money') ||
    lower.includes('wealth') ||
    lower.includes('career') ||
    lower.includes('success')
  ) return 'Wealth / Career';

  if (
    lower.includes('love') ||
    lower.includes('relationship') ||
    lower.includes('marriage') ||
    lower.includes('partner')
  ) return 'Love / Relationship';

  if (
    lower.includes('healing') ||
    lower.includes('energy') ||
    lower.includes('chakra') ||
    lower.includes('spiritual')
  ) return 'Healing / Spiritual';

  if (
    lower.includes('color') ||
    lower.includes('wear') ||
    lower.includes('remedy') ||
    lower.includes('ritual')
  ) return 'Remedy / Ritual';

  return 'General Curiosity';
}

function getCTA(ad: any) {
  const text = `${ad?.title || ''} ${ad?.body || ''} ${ad?.landingPage || ''}`.toLowerCase();

  if (text.includes('book')) return 'Book Now';
  if (text.includes('download')) return 'Download';
  if (text.includes('learn more')) return 'Learn More';
  if (text.includes('shop')) return 'Shop Now';
  if (text.includes('watch')) return 'Watch More';
  if (text.includes('apply')) return 'Apply Now';
  if (text.includes('discover')) return 'Discover';
  return 'Learn More';
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
        setAdError(
          startData?.error ||
            startData?.details ||
            JSON.stringify(startData) ||
            'Failed to start ad search.'
        );
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
          setAdError(
            pollData?.error ||
              pollData?.details ||
              JSON.stringify(pollData) ||
              'Failed while checking ad run.'
          );
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
    } catch (e: any) {
      setAdError(e?.message || 'Something went wrong while searching ads.');
      console.error('Ad search error:', e);
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
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
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
    return Array.from(urls).slice(0, 12);
  }, [adResults]);

  const bestAngles = useMemo(() => {
    const counts = new Map<string, number>();
    adResults.forEach((ad) => {
      const angle = buildAngleFromText(`${ad?.title || ''} ${ad?.body || ''}`);
      counts.set(angle, (counts.get(angle) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [adResults]);

  const hookTypes = useMemo(() => {
    const counts = new Map<string, number>();
    adResults.forEach((ad) => {
      const type = detectHookType(`${ad?.title || ''} ${ad?.body || ''}`);
      counts.set(type, (counts.get(type) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [adResults]);

  const competitorPages = useMemo(() => {
    const counts = new Map<string, number>();
    adResults.forEach((ad) => {
      const page = ad?.pageName || 'Unknown advertiser';
      counts.set(page, (counts.get(page) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12);
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
      `${baseKeyword} as a practical shortcut`,
      `${baseKeyword} for love, wealth, and confidence`,
      `${baseKeyword} as a personalized report funnel`,
    ];

    const generatedCtas = [
      'Discover your result now',
      'See your personalized insight',
      'Unlock your reading today',
      'Find your next step now',
      'Get the answer instantly',
    ];

    const generatedScripts = [
      `Hook: ${hooks[0] || generatedHooks[0]}\nBody: Call out the hidden struggle, introduce the insight, and promise a transformation.\nCTA: ${generatedCtas[0]}`,
      `Hook: ${hooks[1] || generatedHooks[1]}\nBody: Use curiosity, identity, and a practical promise.\nCTA: ${generatedCtas[1]}`,
      `Hook: ${hooks[2] || generatedHooks[2]}\nBody: Use a specific niche pain point and position your offer as the missing answer.\nCTA: ${generatedCtas[2]}`,
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

          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            System Live
          </span>
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
              {topHooks.slice(0, 5).map(([hook, count], idx) => (
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

      {adResults.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
          {adResults.map((ad, index) => {
            const cta = getCTA(ad);
            const hookType = detectHookType(`${ad?.title || ''} ${ad?.body || ''}`);

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                            ad?.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {ad?.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <h3 className="mt-3 font-semibold text-slate-900">{ad?.pageName || 'Unknown advertiser'}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {Array.isArray(ad?.platforms) && ad.platforms.length
                          ? ad.platforms.join(', ')
                          : 'Unknown platforms'}
                      </p>
                    </div>

                    <div className="text-right text-xs text-slate-500">
                      {ad?.startDate ? <div>Start: {ad.startDate}</div> : null}
                      {ad?.endDate ? <div className="mt-1">End: {ad.endDate}</div> : null}
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-sm font-medium text-slate-900">{cleanTitle(ad?.title || '')}</p>

                  {!!ad?.body && (
                    <p className="text-sm text-slate-700 mt-3 whitespace-pre-wrap">
                      {ad.body}
                    </p>
                  )}

                  <div className="mt-4 rounded-xl bg-slate-50 overflow-hidden border border-slate-200">
                    {ad?.imageUrl ? (
                      <img
                        src={ad.imageUrl}
                        alt={ad.title || 'Ad creative'}
                        className="w-full h-64 object-cover"
                      />
                    ) : ad?.videoUrl ? (
                      <div className="relative">
                        <video
                          src={ad.videoUrl}
                          controls
                          className="w-full h-64 object-cover bg-black"
                        />
                        <div className="absolute top-3 right-3 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 flex items-center gap-1">
                          <PlayCircle className="w-3.5 h-3.5" />
                          Video
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                        No creative preview available
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Format</p>
                      <p className="font-medium text-slate-900">{ad?.format || 'Unknown'}</p>
                    </div>

                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">CTA</p>
                      <p className="font-medium text-slate-900">{cta}</p>
                    </div>

                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Hook Type</p>
                      <p className="font-medium text-slate-900">{hookType}</p>
                    </div>

                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Funnel</p>
                      <p className="font-medium text-slate-900">{detectFunnelAngle(ad)}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3 flex-wrap">
                    {ad?.landingPage && (
                      <a
                        href={ad.landingPage}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:opacity-90"
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
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 text-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open Ad Snapshot
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderHooks = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Hook Generator</h2>
        <p className="text-slate-600 mt-2">
          These are reusable hook patterns based on the live competitor ads you scraped.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topHooks.length ? (
          topHooks.map(([hook, count], idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">{hook}</p>
              <p className="text-xs text-slate-500 mt-2">Seen {count} time(s)</p>
              <p className="text-xs text-slate-400 mt-2">{detectHookType(hook)}</p>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            Search ads first to generate hooks.
          </div>
        )}
      </div>
    </div>
  );

  const renderTrends = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Trend Radar</h2>
        <p className="text-slate-600 mt-2">
          Market pattern summary from the ads currently scraped.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900">Top Formats</h3>
          <div className="mt-4 space-y-3">
            {topFormats.length ? topFormats.map(([format, count], idx) => (
              <div key={idx} className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span>{format}</span>
                <span>{count}</span>
              </div>
            )) : 'Search ads first'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900">Hook Types</h3>
          <div className="mt-4 space-y-3">
            {hookTypes.length ? hookTypes.map(([type, count], idx) => (
              <div key={idx} className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span>{type}</span>
                <span>{count}</span>
              </div>
            )) : 'Search ads first'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900">Top Angles</h3>
          <div className="mt-4 space-y-3">
            {bestAngles.length ? bestAngles.map(([angle, count], idx) => (
              <div key={idx} className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span>{angle}</span>
                <span>{count}</span>
              </div>
            )) : 'Search ads first'}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdvisor = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Strategy AI</h2>
        <p className="text-slate-600 mt-2">
          Turn market patterns into hooks, angles, CTAs, and scripts you can test.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleGenerateIdeas}
          disabled={!adResults.length}
          className="rounded-xl bg-[#D4AF37] hover:opacity-90 text-white px-5 py-3 font-semibold disabled:opacity-50"
        >
          Generate Strategy Ideas
        </button>
      </div>

      {(aiIdeas.hooks.length > 0 || aiIdeas.angles.length > 0 || aiIdeas.scripts.length > 0) ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900">Hooks</h3>
              <div className="mt-4 space-y-3">
                {aiIdeas.hooks.map((hook, idx) => (
                  <div key={idx} className="rounded-xl bg-slate-50 px-4 py-3 text-sm">{hook}</div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900">Angles + CTAs</h3>
              <div className="mt-4 space-y-3">
                {aiIdeas.angles.map((angle, idx) => (
                  <div key={idx} className="rounded-xl bg-slate-50 px-4 py-3 text-sm">{angle}</div>
                ))}
                <div className="pt-2 border-t border-slate-200" />
                {aiIdeas.ctas.map((cta, idx) => (
                  <div key={idx} className="rounded-xl bg-slate-50 px-4 py-3 text-sm">{cta}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900">Scripts You Can Run</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiIdeas.scripts.map((script, idx) => (
                <div key={idx} className="rounded-xl bg-slate-50 px-4 py-4 text-sm whitespace-pre-wrap">
                  {script}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          Search ads first, then generate strategy ideas.
        </div>
      )}
    </div>
  );

  const renderCompetitors = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Competitor Tracker</h2>
        <p className="text-slate-600 mt-2">
          These are the advertiser pages found in your current search.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {competitorPages.length ? competitorPages.map(([page, count], idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="font-semibold text-slate-900">{page}</p>
            <p className="text-sm text-slate-500 mt-2">{count} ad(s)</p>
          </div>
        )) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            Search ads first to list competitors.
          </div>
        )}
      </div>
    </div>
  );

  const renderAnalyzer = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">AI Ad Analyzer</h2>
        <p className="text-slate-600 mt-2">
          Quick interpretation of what the market is doing.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900">What is working now</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li>• Top format: {topFormats[0]?.[0] || '—'}</li>
            <li>• Top funnel: {topFunnels[0]?.[0] || '—'}</li>
            <li>• Top angle: {bestAngles[0]?.[0] || '—'}</li>
            <li>• Top hook type: {hookTypes[0]?.[0] || '—'}</li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900">Suggested move</h3>
          <p className="mt-4 text-sm text-slate-700">
            Use the strongest repeated hook, pair it with the top funnel style, and test it with a
            landing page that promises a personalized result.
          </p>
        </div>
      </div>
    </div>
  );

  const renderCampaigns = () => (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">Campaign Tracker</h2>
      <p className="text-slate-600 mt-2">
        Next step: connect your own ad account metrics like CTR, CPL, CPA, and ROAS.
      </p>
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
                <p className="font-semibold truncate">{profile?.displayName || 'User'}</p>
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
              {activeTab === 'overview' ? 'Welcome back' : 'Marketing intelligence workspace'}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-4 py-2 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            System Live
          </div>
        </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'adspy' && renderAdSpy()}
        {activeTab === 'competitors' && renderCompetitors()}
        {activeTab === 'analyzer' && renderAnalyzer()}
        {activeTab === 'campaigns' && renderCampaigns()}
        {activeTab === 'hooks' && renderHooks()}
        {activeTab === 'trends' && renderTrends()}
        {activeTab === 'advisor' && renderAdvisor()}
      </main>
    </div>
  );
}
