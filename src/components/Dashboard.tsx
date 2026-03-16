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

type AdRunResponse =
  | {
      status: 'RUNNING' | 'READY' | 'SUCCEEDED' | 'FAILED' | 'ABORTED' | 'TIMED-OUT';
      runId?: string;
      items?: any[];
      error?: string;
    }
  | any;

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

function getAdTitle(ad: any) {
  return (
    ad?.snapshot?.title ||
    ad?.snapshot?.body?.text ||
    ad?.snapshot?.caption ||
    ad?.adText ||
    ad?.headline ||
    ad?.title ||
    'Untitled Ad'
  );
}

function getAdBody(ad: any) {
  return (
    ad?.snapshot?.body?.text ||
    ad?.snapshot?.caption ||
    ad?.adText ||
    ad?.primaryText ||
    ''
  );
}

function getAdFormat(ad: any) {
  return (
    ad?.snapshot?.displayFormat ||
    ad?.displayFormat ||
    ad?.mediaType ||
    ad?.format ||
    'Unknown'
  );
}

function getAdPageName(ad: any) {
  return (
    ad?.pageName ||
    ad?.aboutPageInfo?.name ||
    ad?.snapshot?.pageName ||
    ad?.page_name ||
    'Unknown advertiser'
  );
}

function getAdPlatforms(ad: any): string[] {
  const raw =
    ad?.publisherPlatform ||
    ad?.publisherPlatforms ||
    ad?.platforms ||
    ad?.snapshot?.publisherPlatforms ||
    [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') return [raw];
  return [];
}

function getAdSnapshotUrl(ad: any) {
  return ad?.adSnapshotUrl || ad?.snapshot?.adSnapshotUrl || ad?.url || '';
}

function getAdImageUrl(ad: any) {
  return (
    ad?.snapshot?.images?.[0]?.url ||
    ad?.imageUrl ||
    ad?.snapshot?.imageUrl ||
    ''
  );
}

function getAdVideoUrl(ad: any) {
  return (
    ad?.snapshot?.videos?.[0]?.url ||
    ad?.videoUrl ||
    ad?.snapshot?.videoUrl ||
    ''
  );
}

function getAdStartDate(ad: any) {
  return ad?.startDateFormatted || ad?.snapshot?.startDateFormatted || ad?.startDate || '';
}

function getAdEndDate(ad: any) {
  return ad?.endDateFormatted || ad?.snapshot?.endDateFormatted || ad?.endDate || '';
}

function getHook(text: string) {
  if (!text) return '';
  const firstSentence = text.split(/[.!?\n]/).find((x) => x.trim().length > 10);
  return firstSentence?.trim() || text.trim().slice(0, 120);
}

export default function Dashboard({ profile }: { profile: UserProfile | null }) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(false);

  const [adKeyword, setAdKeyword] = useState('');
  const [adResults, setAdResults] = useState<any[]>([]);
  const [adError, setAdError] = useState('');
  const [adRunId, setAdRunId] = useState('');
  const [adStatus, setAdStatus] = useState('');

  const handleLogout = async () => {
    await auth.signOut();
  };

  const handleFindCompetitorAds = async () => {
    if (!adKeyword.trim()) return;

    setLoading(true);
    setAdError('');
    setAdResults([]);
    setAdRunId('');
    setAdStatus('Starting search...');

    try {
      const startRes = await fetch(`/api/ads?keyword=${encodeURIComponent(adKeyword.trim())}`);
      const startData: AdRunResponse = await startRes.json();

      if (!startRes.ok || !startData?.runId) {
        setAdError((startData as any)?.error || 'Failed to start competitor search.');
        setLoading(false);
        return;
      }

      const runId = startData.runId;
      setAdRunId(runId);
      setAdStatus('Scraping ads...');

      let attempts = 0;
      let finished = false;

      while (!finished && attempts < 45) {
        await sleep(4000);

        const pollRes = await fetch(`/api/ads?runId=${encodeURIComponent(runId)}`);
        const pollData: AdRunResponse = await pollRes.json();

        if (!pollRes.ok) {
          setAdError((pollData as any)?.error || 'Failed while checking run status.');
          setLoading(false);
          return;
        }

        if (pollData.status === 'SUCCEEDED') {
          const items = Array.isArray(pollData.items) ? pollData.items : [];
          setAdResults(items);
          setAdStatus(`Found ${items.length} ads`);
          finished = true;
          break;
        }

        if (
          pollData.status === 'FAILED' ||
          pollData.status === 'ABORTED' ||
          pollData.status === 'TIMED-OUT'
        ) {
          setAdError(`Ad search failed: ${pollData.status}`);
          setLoading(false);
          return;
        }

        setAdStatus(`Status: ${pollData.status || 'RUNNING'}...`);
        attempts += 1;
      }

      if (!finished) {
        setAdError('This search is taking too long. Try a different keyword.');
      }
    } catch (error) {
      setAdError('Something went wrong while fetching competitor ads.');
    } finally {
      setLoading(false);
    }
  };

  const topHooks = useMemo(() => {
    const counts = new Map<string, number>();

    adResults.forEach((ad) => {
      const hook = getHook(getAdBody(ad) || getAdTitle(ad));
      if (hook) counts.set(hook, (counts.get(hook) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [adResults]);

  const topFormats = useMemo(() => {
    const counts = new Map<string, number>();

    adResults.forEach((ad) => {
      const format = getAdFormat(ad);
      counts.set(format, (counts.get(format) || 0) + 1);
    });

    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [adResults]);

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
          Use <strong>Global Ad Spy</strong> to search live competitor ads by keyword and turn them into hooks,
          creative patterns, and strategy ideas.
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
              Search live competitor ads from the Facebook Ad Library pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1">
              <CheckCircle2 className="w-4 h-4" />
              System Live
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-col md:flex-row gap-3">
          <input
            value={adKeyword}
            onChange={(e) => setAdKeyword(e.target.value)}
            placeholder="Try: numerology, astrology, tarot, coaching"
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleFindCompetitorAds}
            disabled={loading}
            className="rounded-xl bg-[#1F3A8A] hover:opacity-90 text-white px-5 py-3 font-semibold disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search Ads'}
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

      {(topHooks.length > 0 || topFormats.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Top Hook Patterns</h3>
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
        </div>
      )}

      {adResults.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {adResults.map((ad, index) => {
            const title = getAdTitle(ad);
            const body = getAdBody(ad);
            const format = getAdFormat(ad);
            const pageName = getAdPageName(ad);
            const platforms = getAdPlatforms(ad);
            const imageUrl = getAdImageUrl(ad);
            const videoUrl = getAdVideoUrl(ad);
            const snapshotUrl = getAdSnapshotUrl(ad);
            const startDate = getAdStartDate(ad);
            const endDate = getAdEndDate(ad);
            const active = ad?.isActive === true || ad?.snapshot?.isActive === true;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{pageName}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={title}
                    className="mt-4 w-full h-52 object-cover rounded-xl border border-slate-200"
                  />
                ) : videoUrl ? (
                  <video
                    src={videoUrl}
                    controls
                    className="mt-4 w-full h-52 object-cover rounded-xl border border-slate-200"
                  />
                ) : null}

                {!!body && (
                  <p className="mt-4 text-sm text-slate-700 whitespace-pre-wrap">
                    {body}
                  </p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-slate-500">Format</p>
                    <p className="font-medium text-slate-900">{format}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-slate-500">Platforms</p>
                    <p className="font-medium text-slate-900">
                      {platforms.length ? platforms.join(', ') : 'Unknown'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-slate-500">Start</p>
                    <p className="font-medium text-slate-900">{startDate || '—'}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-slate-500">End</p>
                    <p className="font-medium text-slate-900">{endDate || '—'}</p>
                  </div>
                </div>

                {snapshotUrl && (
                  <a
                    href={snapshotUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Ad Snapshot
                  </a>
                )}
              </motion.div>
            );
          })}
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
          renderPlaceholder('Competitor Tracker', 'Use Global Ad Spy first, then save or classify competitors in your next build.')}
        {activeTab === 'analyzer' &&
          renderPlaceholder('AI Ad Analyzer', 'Next step: analyze the ads you fetch and turn them into hook patterns, CTA trends, and script ideas.')}
        {activeTab === 'campaigns' &&
          renderPlaceholder('Campaign Tracker', 'Next step: connect your own ad account metrics like CPL, CTR, CPA, and ROAS.')}
        {activeTab === 'hooks' &&
          renderPlaceholder('Hook Generator', 'Next step: generate winning hooks from the live competitor ads already being pulled.')}
        {activeTab === 'trends' &&
          renderPlaceholder('Trend Radar', 'Next step: identify recurring market themes across scraped ads and creatives.')}
        {activeTab === 'advisor' &&
          renderPlaceholder('Strategy AI', 'Next step: ask AI to recommend offers, formats, and scripts from competitor data.')}
      </main>
    </div>
  );
}
