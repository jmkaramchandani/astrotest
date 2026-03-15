import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Users, Target, TrendingUp, Search, Settings, LogOut, 
  Facebook, Instagram, Youtube, Play, ArrowUpRight, ArrowDownRight, 
  Sparkles, Globe, BarChart3, Radio, MessageSquare, Plus, Trash2, 
  Upload, CheckCircle2, AlertCircle, ExternalLink, Filter,
  ChevronDown, ChevronUp, Calendar, Zap, Video, Layout, Layers, ChevronRight
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { 
  spyAds, analyzeAdCreative, generateHooks, getTrendRadar, askStrategyAdvisor, generateCompetingAd, getViralAdRadar, generateGrowthPlan, getMarketOpportunityMap, predictAdSuccess, generateBetterAd, getDailyContentRadar, generateContentScript, discoverCompetitors, scanMarketOpportunity, getMarketPulse 
} from '../services/geminiService';
import { UserProfile, Competitor, Campaign, AdSpyResult, HookGeneration, TrendResult, MarketSummary, CompetingAd, ViralAd, ViralRadarSummary, GrowthPlan, MarketOpportunityMap, AdPrediction, ImprovedAd, DailyContentRadar, ContentScript, CompetitorDiscoveryResponse, DiscoveredCompetitor, MarketOpportunityScannerResult, MarketPulseResult } from '../types';

const COLORS = ['#1F3A8A', '#D4AF37', '#10b981', '#f43f5e'];

export default function Dashboard({ profile }: { profile: UserProfile | null }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
  // Feature States
  const [spyResults, setSpyResults] = useState<AdSpyResult[]>([]);
  const [spySummary, setSpySummary] = useState<MarketSummary | null>(null);
  const [hookResults, setHookResults] = useState<HookGeneration | null>(null);
  const [trendResults, setTrendResults] = useState<TrendResult[]>([]);
  const [viralAds, setViralAds] = useState<ViralAd[]>([]);
  const [viralSummary, setViralSummary] = useState<ViralRadarSummary | null>(null);
  const [growthPlan, setGrowthPlan] = useState<GrowthPlan | null>(null);
  const [opportunityMap, setOpportunityMap] = useState<MarketOpportunityMap | null>(null);
  const [contentRadar, setContentRadar] = useState<DailyContentRadar | null>(null);
  const [contentScripts, setContentScripts] = useState<Record<number, string>>({});
  const [discoveryResults, setDiscoveryResults] = useState<CompetitorDiscoveryResponse | null>(null);
  const [marketScan, setMarketScan] = useState<MarketOpportunityScannerResult | null>(null);
  const [marketPulse, setMarketPulse] = useState<MarketPulseResult | null>(null);
  const [adPrediction, setAdPrediction] = useState<AdPrediction | null>(null);
  const [improvedAd, setImprovedAd] = useState<ImprovedAd | null>(null);
  const [adAnalysis, setAdAnalysis] = useState<any>(null);
  const [advisorChat, setAdvisorChat] = useState<{q: string, a: string}[]>([]);
  const [competingAds, setCompetingAds] = useState<Record<number, CompetingAd>>({});
  const [generatingVersion, setGeneratingVersion] = useState<number | null>(null);
  
  // Input States
  const [spyKeyword, setSpyKeyword] = useState('');
  const [spyCountry, setSpyCountry] = useState('Global');
  const [spyPlatform, setSpyPlatform] = useState('Facebook');
  const [hookKeyword, setHookKeyword] = useState('');
  const [trendKeyword, setTrendKeyword] = useState('');
  const [advisorQ, setAdvisorQ] = useState('');
  const [viralKeyword, setViralKeyword] = useState('');
  const [viralCountry, setViralCountry] = useState('Global');
  const [viralPlatform, setViralPlatform] = useState('Facebook');
  const [viralTimeRange, setViralTimeRange] = useState('30 days');
  const [growthKeyword, setGrowthKeyword] = useState('');
  const [growthCountry, setGrowthCountry] = useState('Global');
  const [growthPlatform, setGrowthPlatform] = useState('Instagram');
  const [growthBusinessType, setGrowthBusinessType] = useState('course');
  const [oppKeyword, setOppKeyword] = useState('');
  const [oppCountry, setOppCountry] = useState('');
  const [oppPlatform, setOppPlatform] = useState('Facebook');
  const [radarKeyword, setRadarKeyword] = useState('');
  const [radarCountry, setRadarCountry] = useState('Global');
  const [radarPlatform, setRadarPlatform] = useState('Instagram');
  const [discKeyword, setDiscKeyword] = useState('');
  const [discCountry, setDiscCountry] = useState('Global');
  const [discPlatform, setDiscPlatform] = useState('Instagram');
  const [discIndustry, setDiscIndustry] = useState('numerology');
  const [scanKeyword, setScanKeyword] = useState('');
  const [scanCountry, setScanCountry] = useState('Global');
  const [pulseKeyword, setPulseKeyword] = useState('');
  const [pulseCountry, setPulseCountry] = useState('Global');
  const [predHook, setPredHook] = useState('');
  const [predHeadline, setPredHeadline] = useState('');
  const [predAdCopy, setPredAdCopy] = useState('');
  const [predCTA, setPredCTA] = useState('');
  const [predOfferType, setPredOfferType] = useState('course');
  const [predPlatform, setPredPlatform] = useState('Instagram');
  const [spySortBy, setSpySortBy] = useState<'performanceScore' | 'engagementScore' | 'funnelScore'>('performanceScore');
  const [spyAdType, setSpyAdType] = useState('All');
  const [spyOfferType, setSpyOfferType] = useState('All');
  const [spyDateRange, setSpyDateRange] = useState('Last 30 days');
  const [savedAds, setSavedAds] = useState<string[]>([]);
  const [expandedAdIndex, setExpandedAdIndex] = useState<number | null>(null);
  
  // Form States
  const [showCompForm, setShowCompForm] = useState(false);
  const [newComp, setNewComp] = useState({ name: '', website: '', instagram: '', youtube: '', adLibraryLink: '' });
  const [showCampForm, setShowCampForm] = useState(false);
  const [newCamp, setNewCamp] = useState({ name: '', platform: 'Facebook', budget: 0, ctr: 0, cpc: 0, conversionRate: 0, revenue: 0 });

  useEffect(() => {
    const qComp = query(collection(db, 'competitors'), orderBy('addedAt', 'desc'));
    const unsubComp = onSnapshot(qComp, (snap) => {
      setCompetitors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Competitor)));
    });

    const qCamp = query(collection(db, 'campaigns'), orderBy('timestamp', 'desc'));
    const unsubCamp = onSnapshot(qCamp, (snap) => {
      setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() } as Campaign)));
    });

    return () => { unsubComp(); unsubCamp(); };
  }, []);

  const handleLogout = () => auth.signOut();

  // Actions
  const handleSpy = async () => {
    if (!spyKeyword) return;
    setLoading(true);
    const response = await spyAds(spyKeyword, spyCountry, spyPlatform, spyAdType, spyOfferType, spyDateRange);
    setSpyResults(response.ads);
    setSpySummary(response.summary);
    setCompetingAds({}); // Clear previous versions
    setLoading(false);
  };

  const handleCreateMyVersion = async (ad: AdSpyResult, index: number) => {
    setGeneratingVersion(index);
    try {
      const version = await generateCompetingAd(ad);
      setCompetingAds(prev => ({ ...prev, [index]: version }));
    } catch (error) {
      console.error("Error generating competing ad:", error);
    } finally {
      setGeneratingVersion(null);
    }
  };

  useEffect(() => {
    if (spyKeyword && activeTab === 'adspy') {
      const timer = setTimeout(() => {
        handleSpy();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [spyCountry, spyPlatform, spyAdType, spyOfferType, spyDateRange]);

  const handleGenerateHooks = async () => {
    setLoading(true);
    const results = await generateHooks(hookKeyword);
    setHookResults(results);
    setLoading(false);
  };

  const handleViralRadar = async () => {
    if (!viralKeyword) return;
    setLoading(true);
    try {
      const response = await getViralAdRadar(viralKeyword, viralCountry, viralPlatform, viralTimeRange);
      setViralAds(response.ads);
      setViralSummary(response.summary);
      setCompetingAds({});
    } catch (error) {
      console.error("Error fetching viral radar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateGrowthPlan = async () => {
    if (!growthKeyword) return;
    setLoading(true);
    try {
      const context = `
        Viral Ads: ${viralAds.length}, 
        Competitors: ${competitors.length}, 
        Trends: ${trendResults.length},
        Top Hook: ${viralSummary?.topHookPattern || 'N/A'}
      `;
      const plan = await generateGrowthPlan(growthKeyword, growthCountry, growthPlatform, growthBusinessType, context);
      setGrowthPlan(plan);
    } catch (error) {
      console.error("Error generating growth plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOpportunityMap = async () => {
    if (!oppKeyword) return;
    setLoading(true);
    try {
      const map = await getMarketOpportunityMap(oppKeyword, oppCountry, oppPlatform);
      setOpportunityMap(map);
    } catch (error) {
      console.error("Error generating opportunity map:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContentRadar = async () => {
    if (!radarKeyword) return;
    setLoading(true);
    try {
      const radar = await getDailyContentRadar(radarKeyword, radarCountry, radarPlatform);
      setContentRadar(radar);
      setContentScripts({});
    } catch (error) {
      console.error("Error generating content radar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateScript = async (idx: number, idea: any) => {
    setLoading(true);
    try {
      const result = await generateContentScript(idea, radarPlatform);
      setContentScripts(prev => ({ ...prev, [idx]: result.script }));
    } catch (error) {
      console.error("Error generating script:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscoverCompetitors = async () => {
    if (!discKeyword) return;
    setLoading(true);
    try {
      const results = await discoverCompetitors(discKeyword, discCountry, discPlatform, discIndustry);
      setDiscoveryResults(results);
    } catch (error) {
      console.error("Error discovering competitors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanMarketOpportunity = async () => {
    if (!scanKeyword) return;
    setLoading(true);
    try {
      const result = await scanMarketOpportunity(scanKeyword, scanCountry);
      setMarketScan(result);
    } catch (error) {
      console.error("Error scanning market opportunity:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetMarketPulse = async () => {
    if (!pulseKeyword) return;
    setLoading(true);
    try {
      const result = await getMarketPulse(pulseKeyword, pulseCountry);
      setMarketPulse(result);
    } catch (error) {
      console.error("Error getting market pulse:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDiscoveredCompetitor = async (comp: DiscoveredCompetitor) => {
    try {
      await addDoc(collection(db, 'competitors'), {
        name: comp.name,
        category: comp.category,
        country: comp.country,
        positioning: comp.positioning,
        offerType: comp.offerType,
        platforms: comp.platforms,
        website: comp.website,
        instagram: comp.instagram,
        youtube: comp.youtube,
        priority: 'Medium',
        notes: `Discovered via AI Discovery. Bucket: ${comp.marketBucket}`,
        tags: [comp.category, comp.marketBucket],
        createdAt: new Date().toISOString()
      });
      alert(`Saved ${comp.name} to Competitor Tracker!`);
    } catch (error) {
      console.error("Error saving competitor:", error);
    }
  };

  const handlePredictAdSuccess = async () => {
    if (!predHook || !predHeadline) return;
    setLoading(true);
    try {
      const prediction = await predictAdSuccess(predHook, predHeadline, predAdCopy, predCTA, predOfferType, predPlatform);
      setAdPrediction(prediction);
      setImprovedAd(null);
    } catch (error) {
      console.error("Error predicting ad success:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBetterAd = async () => {
    if (!predHook || !predHeadline) return;
    setLoading(true);
    try {
      const improved = await generateBetterAd(predHook, predHeadline, predAdCopy, predCTA, predOfferType, predPlatform);
      setImprovedAd(improved);
    } catch (error) {
      console.error("Error generating better ad:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetTrends = async () => {
    setLoading(true);
    const results = await getTrendRadar(trendKeyword);
    setTrendResults(results);
    setLoading(false);
  };

  const handleAskAdvisor = async () => {
    if (!advisorQ) return;
    setLoading(true);
    const context = `Competitors: ${competitors.length}, Campaigns: ${campaigns.length}. Last campaign revenue: ${campaigns[0]?.revenue || 0}`;
    const answer = await askStrategyAdvisor(advisorQ, context);
    setAdvisorChat([...advisorChat, { q: advisorQ, a: answer }]);
    setAdvisorQ('');
    setLoading(false);
  };

  const handleSaveAd = async (ad: AdSpyResult) => {
    try {
      await addDoc(collection(db, 'saved_ads'), {
        ...ad,
        savedAt: new Date().toISOString(),
        uid: auth.currentUser?.uid
      });
      setSavedAds([...savedAds, ad.headline]);
    } catch (error) {
      console.error("Error saving ad:", error);
    }
  };

  const sortedSpyResults = [...spyResults].sort((a, b) => b[spySortBy] - a[spySortBy]);

  const handleAddCompetitor = async () => {
    await addDoc(collection(db, 'competitors'), { ...newComp, addedAt: new Date().toISOString() });
    setNewComp({ name: '', website: '', instagram: '', youtube: '', adLibraryLink: '' });
    setShowCompForm(false);
  };

  const handleAddCampaign = async () => {
    await addDoc(collection(db, 'campaigns'), { ...newCamp, timestamp: new Date().toISOString() });
    setNewCamp({ name: '', platform: 'Facebook', budget: 0, ctr: 0, cpc: 0, conversionRate: 0, revenue: 0 });
    setShowCampForm(false);
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const analysis = await analyzeAdCreative(reader.result as string);
      setAdAnalysis(analysis);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-royal-blue text-white flex flex-col shadow-2xl z-20">
        <div className="p-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center shadow-lg shadow-gold/20">
              <Sparkles className="w-6 h-6 text-royal-blue" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tighter text-white">ASTRA</h1>
              <p className="text-[10px] tracking-[0.2em] uppercase opacity-50 font-bold">Analytics</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'adspy', icon: Search, label: 'Global Ad Spy' },
            { id: 'competitors', icon: Target, label: 'Competitor Tracker' },
            { id: 'competitor-discovery', icon: Search, label: 'Auto Discovery' },
            { id: 'analyzer', icon: Radio, label: 'AI Ad Analyzer' },
            { id: 'campaigns', icon: BarChart3, label: 'Campaign Tracker' },
            { id: 'hooks', icon: Sparkles, label: 'Hook Generator' },
            { id: 'trends', icon: TrendingUp, label: 'Trend Radar' },
            { id: 'viral-radar', icon: Radio, label: 'Viral Ad Radar' },
            { id: 'content-radar', icon: Calendar, label: 'Daily Content Radar' },
            { id: 'opportunity-scanner', icon: Zap, label: 'Opportunity Scanner' },
            { id: 'market-pulse', icon: Radio, label: 'Market Pulse' },
            { id: 'opportunity-map', icon: Globe, label: 'Market Opportunity' },
            { id: 'growth-engine', icon: Sparkles, label: 'Growth Engine' },
            { id: 'ad-predictor', icon: BarChart3, label: 'Ad Success Predictor' },
            { id: 'advisor', icon: MessageSquare, label: 'Strategy AI' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group ${
                activeTab === item.id 
                  ? 'bg-gold text-white shadow-lg shadow-gold/20' 
                  : 'hover:bg-white/10 text-white/70'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'group-hover:text-white'}`} />
              <span className="text-sm font-bold">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10">
          <div className="flex items-center space-x-3 px-4 py-3 bg-white/5 rounded-2xl mb-4">
            <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-royal-blue font-bold text-xs">
              {profile?.displayName?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{profile?.displayName}</p>
              <p className="text-[10px] opacity-50 truncate uppercase tracking-widest">{profile?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 text-white/60 hover:text-white transition-colors w-full px-4 py-2 text-sm font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-8 py-6 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-xs font-bold text-royal-blue uppercase tracking-widest opacity-60">
              {activeTab.replace(/([A-Z])/g, ' $1').trim()}
            </h2>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {activeTab === 'overview' ? 'Welcome Back, Admin' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>System Live</span>
            </div>
            <button className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:text-royal-blue transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Dashboard Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Competitors', value: competitors.length, icon: Target, color: 'text-royal-blue' },
                    { label: 'Active Campaigns', value: campaigns.length, icon: BarChart3, color: 'text-emerald-600' },
                    { label: 'Avg CTR', value: '2.4%', icon: TrendingUp, color: 'text-gold' },
                    { label: 'Total Revenue', value: `$${campaigns.reduce((a, b) => a + b.revenue, 0).toLocaleString()}`, icon: Globe, color: 'text-royal-blue' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <div className="flex justify-between items-start">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                      </div>
                      <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-4">{stat.label}</h3>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    {/* Recent Competitor Ads */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-900">Top Competitor Ads</h3>
                        <button onClick={() => setActiveTab('adspy')} className="text-xs font-bold text-gold hover:underline">View All</button>
                      </div>
                      <div className="space-y-4">
                        {spyResults.length > 0 ? spyResults.map((ad, i) => (
                          <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center space-x-4">
                            <div className="w-12 h-12 bg-royal-blue rounded-xl flex items-center justify-center text-white font-bold">
                              {ad.platform[0]}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-bold text-slate-900">{ad.title}</h4>
                              <p className="text-xs text-slate-500 line-clamp-1">{ad.copy}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold uppercase tracking-widest bg-gold/10 text-gold px-2 py-1 rounded">
                                {ad.funnelType}
                              </span>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center py-8 text-slate-400">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No ads discovered yet. Use Ad Spy to find some.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Performance Chart */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                      <h3 className="text-lg font-bold text-slate-900 mb-6">Campaign Performance</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={campaigns.slice(0, 5)}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                            <Bar dataKey="revenue" fill="#1F3A8A" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* AI Strategy Widget */}
                  <div className="space-y-8">
                    <div className="bg-royal-blue p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Sparkles className="w-32 h-32" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center space-x-2 mb-6">
                          <div className="p-2 bg-gold rounded-lg">
                            <Sparkles className="w-5 h-5 text-royal-blue" />
                          </div>
                          <h3 className="text-lg font-bold">Astra AI Strategy</h3>
                        </div>
                        <p className="text-sm text-white/70 mb-6">
                          Based on your {competitors.length} tracked competitors and recent campaign data, I recommend focusing on YouTube Shorts for high-intent spiritual audiences.
                        </p>
                        <button 
                          onClick={() => setActiveTab('advisor')}
                          className="w-full py-3 bg-gold text-royal-blue font-bold rounded-xl hover:bg-white transition-all shadow-lg shadow-gold/20"
                        >
                          Ask Strategy AI
                        </button>
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-widest">Trending Now</h3>
                      <div className="space-y-3">
                        {trendResults.slice(0, 3).map((trend, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-700">{trend.term}</span>
                            <div className="flex items-center text-emerald-500 text-xs font-bold">
                              <ArrowUpRight className="w-3 h-3 mr-1" />
                              <span>Rising</span>
                            </div>
                          </div>
                        ))}
                        {trendResults.length === 0 && <p className="text-xs text-slate-400 italic">No trends analyzed yet.</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'adspy' && (
              <motion.div 
                key="adspy"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keyword</label>
                      <input 
                        type="text" 
                        value={spyKeyword}
                        onChange={(e) => setSpyKeyword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-royal-blue/10 outline-none"
                        placeholder="e.g. Numerology"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Country</label>
                      <select 
                        value={spyCountry}
                        onChange={(e) => setSpyCountry(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                      >
                        <option>Global</option>
                        <option>USA</option>
                        <option>India</option>
                        <option>UK</option>
                        <option>Canada</option>
                        <option>Australia</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform</label>
                      <select 
                        value={spyPlatform}
                        onChange={(e) => setSpyPlatform(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                      >
                        <option>Facebook</option>
                        <option>Instagram</option>
                        <option>Google</option>
                        <option>YouTube</option>
                        <option>TikTok</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ad Type</label>
                      <select 
                        value={spyAdType}
                        onChange={(e) => setSpyAdType(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                      >
                        <option>All</option>
                        <option>Video</option>
                        <option>Image</option>
                        <option>Carousel</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Offer Type</label>
                      <select 
                        value={spyOfferType}
                        onChange={(e) => setSpyOfferType(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                      >
                        <option>All</option>
                        <option>Course</option>
                        <option>Consultation</option>
                        <option>Lead Magnet</option>
                        <option>Webinar</option>
                        <option>Membership</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Range</label>
                      <select 
                        value={spyDateRange}
                        onChange={(e) => setSpyDateRange(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                      >
                        <option>Last 7 days</option>
                        <option>Last 30 days</option>
                        <option>Last 90 days</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Sort Results By</label>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                          {[
                            { id: 'performanceScore', label: 'Performance' },
                            { id: 'engagementScore', label: 'Engagement' },
                            { id: 'funnelScore', label: 'Funnel' },
                          ].map((sort) => (
                            <button
                              key={sort.id}
                              onClick={() => setSpySortBy(sort.id as any)}
                              className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                                spySortBy === sort.id 
                                  ? 'bg-white text-royal-blue shadow-sm' 
                                  : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              {sort.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={handleSpy}
                      disabled={loading}
                      className="px-8 py-3 bg-gold text-white font-bold rounded-xl shadow-lg shadow-gold/20 hover:bg-gold-hover transition-all flex items-center justify-center space-x-2"
                    >
                      {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
                      <span>Search Ads</span>
                    </button>
                  </div>
                </div>

                {spySummary && !loading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 overflow-hidden relative"
                  >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full -mr-48 -mt-48 blur-3xl" />
                    <div className="relative z-10">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 bg-royal-blue rounded-2xl flex items-center justify-center shadow-lg shadow-royal-blue/20">
                            <BarChart3 className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-slate-900">Market Intelligence Report</h3>
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Keyword: {spyKeyword} • Global Research Engine</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Live Agency Intelligence</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                        <div className="lg:col-span-2 space-y-8">
                          <div>
                            <div className="flex items-center space-x-2 mb-4">
                              <Globe className="w-4 h-4 text-royal-blue" />
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">1. Market Overview</h4>
                            </div>
                            <p className="text-lg text-slate-700 leading-relaxed font-medium">
                              {spySummary.marketOverview}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                              <div className="flex items-center space-x-2 mb-4">
                                <Filter className="w-4 h-4 text-gold" />
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">3. Funnel Patterns</h4>
                              </div>
                              <div className="space-y-3">
                                {spySummary.funnelPatterns.map((pattern, idx) => (
                                  <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="w-5 h-5 bg-white rounded-lg flex items-center justify-center text-[10px] font-bold text-royal-blue shadow-sm border border-slate-100">
                                      {idx + 1}
                                    </div>
                                    <p className="text-xs font-medium text-slate-700">{pattern}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-4">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">4. Hook Trends</h4>
                              </div>
                              <div className="space-y-3">
                                {spySummary.hookTrends.map((trend, idx) => (
                                  <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="w-5 h-5 bg-white rounded-lg flex items-center justify-center text-[10px] font-bold text-emerald-600 shadow-sm border border-slate-100">
                                      <Sparkles className="w-3 h-3" />
                                    </div>
                                    <p className="text-xs font-medium text-slate-700">{trend}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 h-full">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Market Vitals</h4>
                            <div className="space-y-6">
                              {[
                                { label: 'Total Ads Found', value: spySummary.totalAds.toLocaleString(), icon: Search, color: 'text-royal-blue' },
                                { label: 'Primary Funnel', value: spySummary.topFunnel, icon: Filter, color: 'text-gold' },
                                { label: 'Winning Hook', value: spySummary.commonHook, icon: MessageSquare, color: 'text-emerald-500' },
                                { label: 'Market Leader', value: spySummary.topCompetitor, icon: Target, color: 'text-rose-500' },
                              ].map((stat, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm border border-slate-100 ${stat.color}`}>
                                      <stat.icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                                  </div>
                                  <span className="text-xs font-bold text-slate-900">{stat.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 bg-royal-blue rounded-[32px] text-white relative overflow-hidden shadow-2xl shadow-royal-blue/20">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                        <div className="relative z-10">
                          <div className="flex items-center space-x-2 mb-6">
                            <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-white/60">5. Recommended Agency Strategy</h4>
                          </div>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="flex-1">
                              <p className="text-xl font-medium leading-relaxed italic">
                                "{spySummary.recommendedStrategy}"
                              </p>
                            </div>
                            <button className="px-10 py-4 bg-gold text-white font-bold rounded-2xl shadow-xl shadow-black/20 hover:bg-gold-hover transition-all whitespace-nowrap flex items-center space-x-2">
                              <span>Deploy Strategy</span>
                              <ArrowUpRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-12 flex items-center space-x-2">
                        <div className="h-[1px] flex-1 bg-slate-100" />
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest px-4">2. Top Performing Ad Examples</span>
                        <div className="h-[1px] flex-1 bg-slate-100" />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedSpyResults.map((ad, i) => (
                    <div key={i} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300">
                      <div className="h-48 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute top-4 left-4 flex flex-col space-y-2 z-10">
                          <div className="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-bold text-royal-blue uppercase tracking-widest">
                            {ad.platform}
                          </div>
                          <div className="px-3 py-1 bg-slate-900/80 backdrop-blur rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
                            {ad.adType}
                          </div>
                        </div>
                        <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500/90 backdrop-blur rounded-full text-[10px] font-bold text-white uppercase tracking-widest z-10">
                          Score: {ad.performanceScore}
                        </div>
                        <img 
                          src={`https://picsum.photos/seed/${ad.headline}/400/300`} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        <h4 className="font-bold text-slate-900 mb-2 line-clamp-1">{ad.headline}</h4>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2 italic">"{ad.copySummary}"</p>
                        
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hook Type</p>
                            <p className="text-[10px] font-bold text-royal-blue truncate">{ad.hookType}</p>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">CTA Type</p>
                            <p className="text-[10px] font-bold text-gold truncate">{ad.ctaType}</p>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Funnel</p>
                            <p className="text-[10px] font-bold text-slate-700 truncate">{ad.funnelType}</p>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Intent</p>
                            <p className="text-[10px] font-bold text-emerald-600 truncate">{ad.audienceIntent}</p>
                          </div>
                        </div>

                        <div className="mt-auto space-y-2">
                          <div className="flex space-x-2">
                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-royal-blue" style={{ width: `${ad.performanceScore}%` }} />
                            </div>
                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gold" style={{ width: `${ad.engagementScore}%` }} />
                            </div>
                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${ad.funnelScore}%` }} />
                            </div>
                          </div>
                          <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest px-1">
                            <span>Perf</span>
                            <span>Eng</span>
                            <span>Funnel</span>
                          </div>
                        </div>

                        <div className="mt-6 space-y-2">
                          <button 
                            onClick={() => setExpandedAdIndex(expandedAdIndex === i ? null : i)}
                            className="w-full py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center hover:bg-slate-100 transition-colors"
                          >
                            <span>AI Marketing Breakdown</span>
                            {expandedAdIndex === i ? <ChevronUp className="w-3 h-3 ml-2" /> : <ChevronDown className="w-3 h-3 ml-2" />}
                          </button>

                          <AnimatePresence>
                            {expandedAdIndex === i && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-4 space-y-4 border-t border-slate-100 mt-4">
                                  {[
                                    { label: 'Hook Strategy', value: ad.analysis.hookStrategy },
                                    { label: 'Audience Target', value: ad.analysis.audienceTarget },
                                    { label: 'Offer Type', value: ad.analysis.offerType },
                                    { label: 'Funnel Strategy', value: ad.analysis.funnelStrategy },
                                    { label: 'Conversion Drivers', value: ad.analysis.conversionDrivers },
                                    { label: 'Weakness', value: ad.analysis.weakness },
                                    { label: 'Opportunity for Jaya', value: ad.analysis.opportunityForJaya, highlight: true },
                                  ].map((item, idx) => (
                                    <div key={idx} className={`p-3 rounded-xl ${item.highlight ? 'bg-gold/5 border border-gold/10' : 'bg-slate-50'}`}>
                                      <p className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${item.highlight ? 'text-gold' : 'text-slate-400'}`}>
                                        {item.label}
                                      </p>
                                      <p className="text-[11px] text-slate-700 leading-relaxed">
                                        {item.value}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="flex space-x-2 pt-2">
                            <a href={ad.landingPage} target="_blank" rel="noreferrer" className="flex-1 py-2 bg-slate-100 text-slate-600 text-center rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors flex items-center justify-center">
                              <ExternalLink className="w-3 h-3 mr-2" />
                              LP
                            </a>
                            <button 
                              onClick={() => handleSaveAd(ad)}
                              disabled={savedAds.includes(ad.headline)}
                              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                savedAds.includes(ad.headline)
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                                  : 'bg-royal-blue text-white hover:bg-royal-blue/90'
                              }`}
                            >
                              {savedAds.includes(ad.headline) ? 'Saved' : 'Save Ad'}
                            </button>
                          </div>

                          <button 
                            onClick={() => handleCreateMyVersion(ad, i)}
                            disabled={generatingVersion === i}
                            className="w-full mt-2 py-3 bg-gold text-white font-bold rounded-xl shadow-lg shadow-gold/20 hover:bg-gold-hover transition-all flex items-center justify-center space-x-2"
                          >
                            {generatingVersion === i ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                            <span>Create My Version</span>
                          </button>

                          <AnimatePresence>
                            {competingAds[i] && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-4 bg-royal-blue rounded-2xl text-white relative overflow-hidden"
                              >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-xl" />
                                <div className="relative z-10 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/60">Jaya's Improved Version</span>
                                    <button onClick={() => {
                                      const newCompeting = { ...competingAds };
                                      delete newCompeting[i];
                                      setCompetingAds(newCompeting);
                                    }} className="text-white/40 hover:text-white transition-colors">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <div>
                                      <p className="text-[7px] font-bold uppercase tracking-widest text-gold mb-1">Improved Hook</p>
                                      <p className="text-[10px] font-medium italic">"{competingAds[i].improvedHook}"</p>
                                    </div>
                                    <div>
                                      <p className="text-[7px] font-bold uppercase tracking-widest text-gold mb-1">Improved Headline</p>
                                      <p className="text-[10px] font-bold">{competingAds[i].improvedHeadline}</p>
                                    </div>
                                    <div>
                                      <p className="text-[7px] font-bold uppercase tracking-widest text-gold mb-1">Reel Script</p>
                                      <div className="text-[9px] text-white/80 whitespace-pre-wrap bg-white/5 p-2 rounded-lg border border-white/10 max-h-32 overflow-y-auto">
                                        {competingAds[i].reelScript}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-[7px] font-bold uppercase tracking-widest text-gold mb-1">CTA Suggestion</p>
                                      <p className="text-[10px] font-bold text-emerald-400">{competingAds[i].ctaSuggestion}</p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {spyResults.length === 0 && !loading && (
                  <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                    <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">No Ads Discovered</h3>
                    <p className="text-slate-400 text-sm">Enter a keyword to spy on global competitor ads.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'competitors' && (
              <motion.div 
                key="competitors"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-900">Tracked Competitors</h3>
                  <button 
                    onClick={() => setShowCompForm(true)}
                    className="px-6 py-2 bg-gold text-white font-bold rounded-xl shadow-lg shadow-gold/20 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Competitor</span>
                  </button>
                </div>

                {showCompForm && (
                  <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 animate-in fade-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</label>
                        <input 
                          type="text" 
                          value={newComp.name}
                          onChange={(e) => setNewComp({...newComp, name: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Website</label>
                        <input 
                          type="text" 
                          value={newComp.website}
                          onChange={(e) => setNewComp({...newComp, website: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ad Library Link</label>
                        <input 
                          type="text" 
                          value={newComp.adLibraryLink}
                          onChange={(e) => setNewComp({...newComp, adLibraryLink: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-4">
                      <button onClick={() => setShowCompForm(false)} className="px-6 py-2 text-slate-400 font-bold">Cancel</button>
                      <button onClick={handleAddCompetitor} className="px-8 py-2 bg-royal-blue text-white font-bold rounded-xl">Save Competitor</button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {competitors.map((comp) => (
                    <div key={comp.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative group">
                      <button 
                        onClick={() => deleteDoc(doc(db, 'competitors', comp.id!))}
                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-royal-blue font-bold text-lg">
                          {comp.name[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{comp.name}</h4>
                          <p className="text-xs text-slate-400 truncate max-w-[150px]">{comp.website}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <a href={comp.adLibraryLink} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                          <span className="text-xs font-bold text-slate-600">Ad Library</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                        <div className="flex space-x-2">
                          <a href={comp.instagram} target="_blank" rel="noreferrer" className="flex-1 p-2 bg-pink-50 text-pink-600 rounded-lg text-center text-[10px] font-bold">Instagram</a>
                          <a href={comp.youtube} target="_blank" rel="noreferrer" className="flex-1 p-2 bg-red-50 text-red-600 rounded-lg text-center text-[10px] font-bold">YouTube</a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'analyzer' && (
              <motion.div 
                key="analyzer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="bg-white p-12 rounded-[40px] shadow-sm border border-slate-100 text-center">
                  <div className="w-20 h-20 bg-gold/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Upload className="w-10 h-10 text-gold" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">AI Ad Creative Analyzer</h3>
                  <p className="text-slate-500 mb-8">Upload an ad image to analyze its psychological triggers and conversion potential.</p>
                  
                  <label className="inline-block px-12 py-4 bg-royal-blue text-white font-bold rounded-2xl cursor-pointer shadow-xl shadow-royal-blue/20 hover:scale-105 transition-transform">
                    <span>Select Ad Creative</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                </div>

                {loading && (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gold font-bold animate-pulse">Astra AI is analyzing pixels...</p>
                  </div>
                )}

                {adAnalysis && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                  >
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Emotional Hook</h4>
                        <p className="text-slate-700 font-medium">{adAnalysis.hook}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Marketing Angle</h4>
                        <p className="text-slate-700 font-medium">{adAnalysis.angle}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Audience Targeting</h4>
                        <p className="text-slate-700 font-medium">{adAnalysis.targeting}</p>
                      </div>
                    </div>
                    <div className="bg-royal-blue p-8 rounded-3xl shadow-xl text-white space-y-6">
                      <div>
                        <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Conversion Potential</h4>
                        <p className="text-lg font-bold">{adAnalysis.potential}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">AI Suggestions</h4>
                        <div className="space-y-3">
                          {adAnalysis.suggestions.map((s: string, i: number) => (
                            <div key={i} className="flex items-start space-x-3 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                              <p className="text-white/80">{s}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'campaigns' && (
              <motion.div 
                key="campaigns"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-900">Campaign Performance</h3>
                  <button 
                    onClick={() => setShowCampForm(true)}
                    className="px-6 py-2 bg-gold text-white font-bold rounded-xl shadow-lg shadow-gold/20 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Campaign</span>
                  </button>
                </div>

                {showCampForm && (
                  <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</label>
                        <input type="text" value={newCamp.name} onChange={(e) => setNewCamp({...newCamp, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform</label>
                        <select value={newCamp.platform} onChange={(e) => setNewCamp({...newCamp, platform: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none">
                          <option>Facebook</option>
                          <option>Instagram</option>
                          <option>Google</option>
                          <option>YouTube</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Budget</label>
                        <input type="number" value={newCamp.budget} onChange={(e) => setNewCamp({...newCamp, budget: Number(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue</label>
                        <input type="number" value={newCamp.revenue} onChange={(e) => setNewCamp({...newCamp, revenue: Number(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-4">
                      <button onClick={() => setShowCampForm(false)} className="px-6 py-2 text-slate-400 font-bold">Cancel</button>
                      <button onClick={handleAddCampaign} className="px-8 py-2 bg-royal-blue text-white font-bold rounded-xl">Track Campaign</button>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Campaign</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Budget</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ROAS</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {campaigns.map((camp) => (
                        <tr key={camp.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-4 font-bold text-slate-700">{camp.name}</td>
                          <td className="px-8 py-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-royal-blue/5 text-royal-blue rounded">
                              {camp.platform}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-slate-600 font-medium">${camp.budget}</td>
                          <td className="px-8 py-4 text-slate-600 font-medium">${camp.revenue}</td>
                          <td className="px-8 py-4">
                            <span className={`font-bold ${camp.revenue / camp.budget >= 3 ? 'text-emerald-600' : 'text-slate-900'}`}>
                              {(camp.revenue / (camp.budget || 1)).toFixed(1)}x
                            </span>
                          </td>
                          <td className="px-8 py-4">
                            <button onClick={() => deleteDoc(doc(db, 'campaigns', camp.id!))} className="text-slate-300 hover:text-rose-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'hooks' && (
              <motion.div 
                key="hooks"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4">
                  <input 
                    type="text" 
                    value={hookKeyword}
                    onChange={(e) => setHookKeyword(e.target.value)}
                    className="flex-1 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-royal-blue/10"
                    placeholder="Enter keyword (e.g. Vastu for Office)"
                  />
                  <button 
                    onClick={handleGenerateHooks}
                    disabled={loading}
                    className="px-8 py-4 bg-gold text-white font-bold rounded-2xl shadow-lg shadow-gold/20 hover:scale-105 transition-transform disabled:opacity-50"
                  >
                    Generate Assets
                  </button>
                </div>

                {hookResults && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                      <h4 className="text-sm font-bold text-royal-blue uppercase tracking-widest mb-6 flex items-center">
                        <Sparkles className="w-4 h-4 mr-2" />
                        10 Viral Ad Hooks
                      </h4>
                      <div className="space-y-3">
                        {hookResults.hooks.map((h, i) => (
                          <div key={i} className="p-3 bg-slate-50 rounded-xl text-sm text-slate-700 border border-slate-100">
                            {h}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-8">
                      <div className="bg-royal-blue p-8 rounded-3xl shadow-xl text-white">
                        <h4 className="text-sm font-bold text-gold uppercase tracking-widest mb-6">Marketing Angles</h4>
                        <div className="space-y-4">
                          {hookResults.angles.map((a, i) => (
                            <div key={i} className="flex items-start space-x-3 text-sm">
                              <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-bold">{i+1}</div>
                              <p className="text-white/80">{a}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Headlines & Titles</h4>
                        <div className="space-y-4">
                          {hookResults.webinarTitles.map((t, i) => (
                            <div key={i} className="p-3 border-l-4 border-gold bg-slate-50 rounded-r-xl text-sm font-bold text-slate-700">
                              {t}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'trends' && (
              <motion.div 
                key="trends"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4">
                  <input 
                    type="text" 
                    value={trendKeyword}
                    onChange={(e) => setTrendKeyword(e.target.value)}
                    className="flex-1 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                    placeholder="Search market trends..."
                  />
                  <button onClick={handleGetTrends} className="px-8 py-4 bg-royal-blue text-white font-bold rounded-2xl">Analyze Trends</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trendResults.map((trend, i) => (
                    <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-bold text-slate-900">{trend.term}</h4>
                        {trend.rising && <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded uppercase tracking-widest">Rising</span>}
                      </div>
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Content Ideas</p>
                        {trend.ideas.map((idea, j) => (
                          <div key={j} className="flex items-center space-x-2 text-sm text-slate-600">
                            <TrendingUp className="w-3 h-3 text-gold" />
                            <span>{idea}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'viral-radar' && (
              <motion.div 
                key="viral-radar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                {/* Filters */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keyword</label>
                      <input 
                        type="text" 
                        value={viralKeyword}
                        onChange={(e) => setViralKeyword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                        placeholder="e.g. Numerology"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Country</label>
                      <select 
                        value={viralCountry}
                        onChange={(e) => setViralCountry(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                      >
                        <option>Global</option>
                        <option>India</option>
                        <option>USA</option>
                        <option>UK</option>
                        <option>Canada</option>
                        <option>Australia</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform</label>
                      <select 
                        value={viralPlatform}
                        onChange={(e) => setViralPlatform(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                      >
                        <option>Facebook</option>
                        <option>Instagram</option>
                        <option>YouTube</option>
                        <option>Google</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time Range</label>
                      <select 
                        value={viralTimeRange}
                        onChange={(e) => setViralTimeRange(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                      >
                        <option>7 days</option>
                        <option>30 days</option>
                        <option>90 days</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={handleViralRadar}
                      disabled={loading}
                      className="px-10 py-3 bg-royal-blue text-white font-bold rounded-xl shadow-lg shadow-royal-blue/20 hover:scale-105 transition-transform flex items-center space-x-2"
                    >
                      {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Radio className="w-5 h-5" />}
                      <span>Launch Viral Radar</span>
                    </button>
                  </div>
                </div>

                {viralSummary && !loading && (
                  <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="relative z-10">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        {[
                          { label: 'Viral Ads Detected', value: viralSummary.totalViralAds, icon: Radio, color: 'text-royal-blue' },
                          { label: 'Top Hook Pattern', value: viralSummary.topHookPattern, icon: Sparkles, color: 'text-gold' },
                          { label: 'Top Funnel Type', value: viralSummary.topFunnelType, icon: Filter, color: 'text-emerald-500' },
                          { label: 'Aggressive Competitor', value: viralSummary.mostAggressiveCompetitor, icon: Target, color: 'text-rose-500' },
                        ].map((stat, idx) => (
                          <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center space-x-3 mb-2">
                              <stat.icon className={`w-4 h-4 ${stat.color}`} />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                            </div>
                            <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="p-6 bg-royal-blue rounded-3xl text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Sparkles className="w-4 h-4 text-gold" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Recommended Ad Idea for Jaya</span>
                            </div>
                            <p className="text-lg font-medium leading-relaxed italic">
                              "{viralSummary.recommendedAdIdea}"
                            </p>
                          </div>
                          <button className="px-8 py-3 bg-gold text-white font-bold rounded-xl shadow-lg shadow-gold/20 hover:bg-gold-hover transition-all whitespace-nowrap">
                            Apply Strategy
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {viralAds.map((ad, i) => (
                    <div key={i} className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300">
                      <div className="h-48 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute top-4 left-4 flex flex-col space-y-2 z-10">
                          <div className="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-bold text-royal-blue uppercase tracking-widest">
                            {ad.platform}
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest ${
                            ad.tag === 'Viral' ? 'bg-rose-500' : 
                            ad.tag === 'Trending' ? 'bg-gold' : 
                            ad.tag === 'Emerging' ? 'bg-emerald-500' : 'bg-royal-blue'
                          }`}>
                            {ad.tag}
                          </div>
                        </div>
                        <div className="absolute top-4 right-4 px-3 py-1 bg-slate-900/80 backdrop-blur rounded-full text-[10px] font-bold text-white uppercase tracking-widest z-10">
                          Score: {ad.viralityScore}
                        </div>
                        <img 
                          src={`https://picsum.photos/seed/${ad.headline}/400/300`} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        <h4 className="font-bold text-slate-900 mb-2 line-clamp-1">{ad.headline}</h4>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2 italic">"{ad.copySummary}"</p>
                        
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hook Type</p>
                            <p className="text-[10px] font-bold text-royal-blue truncate">{ad.hookType}</p>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Trigger</p>
                            <p className="text-[10px] font-bold text-rose-500 truncate">{ad.emotionalTrigger}</p>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Funnel</p>
                            <p className="text-[10px] font-bold text-slate-700 truncate">{ad.funnelType}</p>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Country</p>
                            <p className="text-[10px] font-bold text-emerald-600 truncate">{ad.country}</p>
                          </div>
                        </div>

                        <div className="mt-auto space-y-4">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                            <h5 className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                              <Sparkles className="w-3 h-3 mr-1 text-gold" />
                              AI Breakdown
                            </h5>
                            <div className="space-y-2">
                              <div>
                                <p className="text-[7px] font-bold text-royal-blue uppercase tracking-widest">Why it works</p>
                                <p className="text-[9px] text-slate-600 line-clamp-2">{ad.analysis.whyItWorks}</p>
                              </div>
                              <div>
                                <p className="text-[7px] font-bold text-royal-blue uppercase tracking-widest">Psychology</p>
                                <p className="text-[9px] text-slate-600 line-clamp-2">{ad.analysis.audiencePsychology}</p>
                              </div>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleCreateMyVersion(ad, i)}
                            disabled={generatingVersion === i}
                            className="w-full py-3 bg-gold text-white font-bold rounded-xl shadow-lg shadow-gold/20 hover:bg-gold-hover transition-all flex items-center justify-center space-x-2"
                          >
                            {generatingVersion === i ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                            <span>Create My Version</span>
                          </button>

                          <AnimatePresence>
                            {competingAds[i] && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-4 bg-royal-blue rounded-2xl text-white relative overflow-hidden"
                              >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-xl" />
                                <div className="relative z-10 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/60">Jaya's Improved Version</span>
                                    <button onClick={() => {
                                      const newCompeting = { ...competingAds };
                                      delete newCompeting[i];
                                      setCompetingAds(newCompeting);
                                    }} className="text-white/40 hover:text-white transition-colors">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <div>
                                      <p className="text-[7px] font-bold uppercase tracking-widest text-gold mb-1">Improved Hook</p>
                                      <p className="text-[10px] font-medium italic">"{competingAds[i].improvedHook}"</p>
                                    </div>
                                    <div>
                                      <p className="text-[7px] font-bold uppercase tracking-widest text-gold mb-1">Improved Headline</p>
                                      <p className="text-[10px] font-bold">{competingAds[i].improvedHeadline}</p>
                                    </div>
                                    <div>
                                      <p className="text-[7px] font-bold uppercase tracking-widest text-gold mb-1">Reel Script</p>
                                      <div className="text-[9px] text-white/80 whitespace-pre-wrap bg-white/5 p-2 rounded-lg border border-white/10 max-h-32 overflow-y-auto">
                                        {competingAds[i].reelScript}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-[7px] font-bold uppercase tracking-widest text-gold mb-1">CTA Suggestion</p>
                                      <p className="text-[10px] font-bold text-emerald-400">{competingAds[i].ctaSuggestion}</p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {viralAds.length === 0 && !loading && (
                  <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                    <Radio className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">Radar Inactive</h3>
                    <p className="text-slate-400 text-sm">Enter a keyword to detect viral ad patterns in your market.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'ad-predictor' && (
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hook / Opening Line</label>
                        <textarea 
                          value={predHook}
                          onChange={(e) => setPredHook(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none min-h-[80px]"
                          placeholder="Enter your ad hook..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Headline</label>
                        <input 
                          type="text" 
                          value={predHeadline}
                          onChange={(e) => setPredHeadline(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                          placeholder="Enter ad headline..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ad Copy</label>
                        <textarea 
                          value={predAdCopy}
                          onChange={(e) => setPredAdCopy(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none min-h-[120px]"
                          placeholder="Enter full ad copy..."
                        />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Call To Action</label>
                        <input 
                          type="text" 
                          value={predCTA}
                          onChange={(e) => setPredCTA(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                          placeholder="e.g. Sign Up Now"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Offer Type</label>
                          <select 
                            value={predOfferType}
                            onChange={(e) => setPredOfferType(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                          >
                            <option value="course">Online Course</option>
                            <option value="consultation">Consultation</option>
                            <option value="lead magnet">Lead Magnet</option>
                            <option value="webinar">Webinar</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform</label>
                          <select 
                            value={predPlatform}
                            onChange={(e) => setPredPlatform(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                          >
                            <option>Instagram</option>
                            <option>Facebook</option>
                            <option>YouTube</option>
                            <option>Google</option>
                          </select>
                        </div>
                      </div>
                      <div className="pt-6">
                        <button 
                          onClick={handlePredictAdSuccess}
                          disabled={loading || !predHook || !predHeadline}
                          className="w-full py-4 bg-royal-blue text-white font-bold rounded-xl shadow-lg shadow-royal-blue/20 hover:scale-[1.02] transition-transform flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-5 h-5" />}
                          <span>Predict Ad Success</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {adPrediction && !loading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                  >
                    {/* Prediction Results */}
                    <div className="lg:col-span-2 space-y-8">
                      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-8">
                          <h3 className="text-xl font-bold text-slate-900">Ad Performance Analysis</h3>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Predicted Success</p>
                            <p className={`text-4xl font-bold ${adPrediction.successScore > 70 ? 'text-emerald-600' : adPrediction.successScore > 40 ? 'text-gold' : 'text-rose-600'}`}>
                              {adPrediction.successScore}%
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Hook Strength</h4>
                            <p className="text-sm text-slate-700 leading-relaxed">{adPrediction.hookStrength}</p>
                          </div>
                          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Emotional Trigger</h4>
                            <p className="text-sm text-slate-700 font-bold text-royal-blue">{adPrediction.emotionalTrigger}</p>
                          </div>
                          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Audience Alignment</h4>
                            <p className="text-sm text-slate-700 leading-relaxed">{adPrediction.audienceAlignment}</p>
                          </div>
                          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Offer Clarity</h4>
                            <p className="text-sm text-slate-700 leading-relaxed">{adPrediction.offerClarity}</p>
                          </div>
                          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">CTA Strength</h4>
                            <p className="text-sm text-slate-700 leading-relaxed">{adPrediction.ctaStrength}</p>
                          </div>
                          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Funnel Compatibility</h4>
                            <p className="text-sm text-slate-700 leading-relaxed">{adPrediction.funnelCompatibility}</p>
                          </div>
                        </div>
                      </div>

                      {/* Improvement Suggestions */}
                      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-slate-900">Improvement Suggestions</h3>
                          <button 
                            onClick={handleGenerateBetterAd}
                            className="px-6 py-2 bg-gold text-white text-xs font-bold rounded-full shadow-lg shadow-gold/20 hover:scale-105 transition-transform"
                          >
                            Generate Better Version
                          </button>
                        </div>
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-gold uppercase tracking-widest">Stronger Hook</h4>
                            <p className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600 italic">"{adPrediction.suggestions.strongerHook}"</p>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-gold uppercase tracking-widest">Improved Headline</h4>
                            <p className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600 font-bold">"{adPrediction.suggestions.improvedHeadline}"</p>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-gold uppercase tracking-widest">Better CTA</h4>
                            <p className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600">{adPrediction.suggestions.betterCTA}</p>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-gold uppercase tracking-widest">Refined Ad Script</h4>
                            <p className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600 whitespace-pre-wrap">{adPrediction.suggestions.refinedAdScript}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Creator Mode: Better Version */}
                    <div className="space-y-8">
                      {improvedAd ? (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-royal-blue p-8 rounded-[40px] shadow-xl text-white space-y-8"
                        >
                          <div className="flex items-center space-x-3">
                            <Sparkles className="w-6 h-6 text-gold" />
                            <h3 className="text-xl font-bold">Astra Optimized Version</h3>
                          </div>

                          <div className="space-y-6">
                            <div>
                              <label className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-2 block">Optimized Hook</label>
                              <p className="text-lg font-bold italic">"{improvedAd.improvedHook}"</p>
                            </div>
                            
                            <div>
                              <label className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-2 block">30-45s Reel Script</label>
                              <div className="p-4 bg-white/5 rounded-2xl text-xs text-white/80 leading-relaxed whitespace-pre-wrap border border-white/10">
                                {improvedAd.reelScript}
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-2 block">Winning Headline</label>
                              <p className="font-bold text-gold">"{improvedAd.suggestedHeadline}"</p>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-2 block">Optimized CTA</label>
                              <div className="px-4 py-2 bg-gold text-white text-center font-bold rounded-xl">
                                {improvedAd.optimizedCTA}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="bg-slate-50 p-8 rounded-[40px] border border-dashed border-slate-200 text-center h-full flex flex-col justify-center items-center">
                          <Sparkles className="w-10 h-10 text-slate-200 mb-4" />
                          <p className="text-slate-400 text-sm font-medium">Click "Generate Better Version" to see Astra's optimized ad creative.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {!adPrediction && !loading && (
                  <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                    <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">Predictor Ready</h3>
                    <p className="text-slate-400 text-sm">Enter your ad details to predict its success score.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'competitor-discovery' && (
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keyword</label>
                      <input 
                        type="text" 
                        value={discKeyword}
                        onChange={(e) => setDiscKeyword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                        placeholder="e.g. Numerology"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Country</label>
                      <input 
                        type="text" 
                        value={discCountry}
                        onChange={(e) => setDiscCountry(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                        placeholder="e.g. India"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform</label>
                      <select 
                        value={discPlatform}
                        onChange={(e) => setDiscPlatform(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                      >
                        <option>Instagram</option>
                        <option>Facebook</option>
                        <option>YouTube</option>
                        <option>Google</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Industry Category</label>
                      <select 
                        value={discIndustry}
                        onChange={(e) => setDiscIndustry(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                      >
                        <option value="numerology">Numerology</option>
                        <option value="astrology">Astrology</option>
                        <option value="vastu">Vastu</option>
                        <option value="spiritual coaching">Spiritual Coaching</option>
                        <option value="online courses">Online Courses</option>
                        <option value="consultations">Consultations</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={handleDiscoverCompetitors}
                      disabled={loading || !discKeyword}
                      className="px-10 py-3 bg-royal-blue text-white font-bold rounded-xl shadow-lg shadow-royal-blue/20 hover:scale-105 transition-transform flex items-center space-x-2 disabled:opacity-50"
                    >
                      {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
                      <span>Discover Competitors</span>
                    </button>
                  </div>
                </div>

                {discoveryResults && !loading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12"
                  >
                    {/* Market Position Map */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {['premium', 'mid-range', 'mass market', 'education-focused', 'consultation-focused', 'certification-focused'].map(bucket => (
                        <div key={bucket} className="bg-white p-4 rounded-2xl border border-slate-100 text-center shadow-sm">
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">{bucket.replace('-', ' ')}</p>
                          <p className="text-xl font-bold text-royal-blue">
                            {discoveryResults.competitors.filter(c => c.marketBucket === bucket).length}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Discovered Competitors */}
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-royal-blue">Discovered Competitors</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {discoveryResults.competitors.map((comp, idx) => (
                          <div key={idx} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xl font-bold text-slate-900">{comp.name}</h4>
                                <p className="text-xs text-gold font-bold uppercase tracking-widest mt-1">{comp.category} • {comp.country}</p>
                              </div>
                              <button 
                                onClick={() => handleSaveDiscoveredCompetitor(comp)}
                                className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors"
                                title="Save to Tracker"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div className="p-3 bg-slate-50 rounded-xl">
                                <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Positioning</p>
                                <p className="font-bold text-slate-700">{comp.positioning}</p>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-xl">
                                <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Offer Type</p>
                                <p className="font-bold text-slate-700">{comp.offerType}</p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <label className="text-[10px] font-bold text-royal-blue uppercase tracking-widest block">AI Competitor Summary</label>
                              <div className="grid grid-cols-1 gap-2">
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-slate-400">Selling:</span>
                                  <span className="font-bold text-slate-700">{comp.aiSummary.selling}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-slate-400">Audience:</span>
                                  <span className="font-bold text-slate-700">{comp.aiSummary.audience}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-slate-400">Ad Style:</span>
                                  <span className="font-bold text-slate-700">{comp.aiSummary.adStyle}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-slate-400">Funnel:</span>
                                  <span className="font-bold text-slate-700">{comp.aiSummary.funnelType}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 pt-4 border-t border-slate-50">
                              <div className="flex space-x-2">
                                {comp.platforms.includes('Instagram') && <Instagram className="w-4 h-4 text-slate-400" />}
                                {comp.platforms.includes('YouTube') && <Youtube className="w-4 h-4 text-slate-400" />}
                                {comp.platforms.includes('Facebook') && <Facebook className="w-4 h-4 text-slate-400" />}
                              </div>
                              <div className="flex-1 text-[10px] text-slate-400 truncate italic">
                                {comp.website}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Opportunity Analysis */}
                    <div className="bg-royal-blue p-10 rounded-[50px] shadow-2xl text-white">
                      <div className="flex items-center space-x-3 mb-8">
                        <div className="w-12 h-12 bg-gold rounded-2xl flex items-center justify-center shadow-lg shadow-gold/20">
                          <TrendingUp className="w-6 h-6 text-royal-blue" />
                        </div>
                        <h3 className="text-2xl font-bold">Market Opportunity Analysis</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-xs font-bold text-gold uppercase tracking-widest mb-2">What Competitors are Overdoing</h4>
                            <p className="text-sm text-white/80 leading-relaxed">{discoveryResults.opportunityAnalysis.overdone}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gold uppercase tracking-widest mb-2">Market Gaps</h4>
                            <p className="text-sm text-white/80 leading-relaxed">{discoveryResults.opportunityAnalysis.marketGaps}</p>
                          </div>
                        </div>
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-xs font-bold text-gold uppercase tracking-widest mb-2">How Jaya Can Stand Out</h4>
                            <p className="text-sm text-white/80 leading-relaxed font-bold">{discoveryResults.opportunityAnalysis.standoutStrategy}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gold uppercase tracking-widest mb-2">Under-served Offer Type</h4>
                            <p className="text-sm text-white/80 leading-relaxed">{discoveryResults.opportunityAnalysis.underServedOffer}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {!discoveryResults && !loading && (
                  <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                    <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">Discovery Engine Ready</h3>
                    <p className="text-slate-400 text-sm">Enter a niche and country to discover your top competitors.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'content-radar' && (
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keyword</label>
                      <input 
                        type="text" 
                        value={radarKeyword}
                        onChange={(e) => setRadarKeyword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                        placeholder="e.g. Numerology"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Country</label>
                      <input 
                        type="text" 
                        value={radarCountry}
                        onChange={(e) => setRadarCountry(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                        placeholder="e.g. India"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform Focus</label>
                      <select 
                        value={radarPlatform}
                        onChange={(e) => setRadarPlatform(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                      >
                        <option>Instagram</option>
                        <option>YouTube</option>
                        <option>Facebook</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={handleGenerateContentRadar}
                      disabled={loading || !radarKeyword}
                      className="px-10 py-3 bg-royal-blue text-white font-bold rounded-xl shadow-lg shadow-royal-blue/20 hover:scale-105 transition-transform flex items-center space-x-2 disabled:opacity-50"
                    >
                      {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Calendar className="w-5 h-5" />}
                      <span>Generate Daily Radar</span>
                    </button>
                  </div>
                </div>

                {contentRadar && !loading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                  >
                    {/* Content Ideas */}
                    <div className="lg:col-span-2 space-y-8">
                      <h3 className="text-2xl font-bold text-royal-blue">Today's Content Ideas</h3>
                      <div className="space-y-6">
                        {contentRadar.ideas.map((idea, idx) => (
                          <div key={idx} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Idea {idx + 1}</span>
                                <h4 className="text-lg font-bold text-slate-900 leading-tight">"{idea.hook}"</h4>
                              </div>
                              <button 
                                onClick={() => handleGenerateScript(idx, idea)}
                                className="px-6 py-2 bg-gold text-white text-xs font-bold rounded-full shadow-lg shadow-gold/20 hover:scale-105 transition-transform whitespace-nowrap"
                              >
                                Generate Script
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Video Concept</label>
                                  <p className="text-sm text-slate-600 leading-relaxed">{idea.concept}</p>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">CTA Suggestion</label>
                                  <p className="text-sm font-bold text-royal-blue">{idea.cta}</p>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Talking Points</label>
                                <ul className="space-y-2">
                                  {idea.talkingPoints.map((point, pIdx) => (
                                    <li key={pIdx} className="flex items-start space-x-2 text-xs text-slate-600">
                                      <div className="w-1.5 h-1.5 bg-gold rounded-full mt-1.5 flex-shrink-0" />
                                      <span>{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {contentScripts[idx] && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-6 p-6 bg-slate-50 rounded-3xl border border-slate-100"
                              >
                                <label className="text-[10px] font-bold text-royal-blue uppercase tracking-widest block mb-3">Generated Script</label>
                                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap italic">
                                  {contentScripts[idx]}
                                </p>
                              </motion.div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Weekly Calendar */}
                    <div className="space-y-8">
                      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                        <h3 className="text-xl font-bold text-royal-blue mb-6">Content Calendar</h3>
                        <div className="space-y-4">
                          {contentRadar.weeklyPlan.map((plan, idx) => (
                            <div key={idx} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center shadow-sm border border-slate-50">
                                <span className="text-[8px] font-bold text-slate-400 uppercase">{plan.day.substring(0, 3)}</span>
                                <span className="text-xs font-bold text-royal-blue">{idx + 1}</span>
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">{plan.day}</h4>
                                <p className="text-[10px] text-slate-500">{plan.type}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-royal-blue p-8 rounded-[40px] shadow-xl text-white">
                        <h4 className="text-lg font-bold mb-4 flex items-center space-x-2">
                          <Sparkles className="w-5 h-5 text-gold" />
                          <span>Strategy Tip</span>
                        </h4>
                        <p className="text-sm text-white/80 leading-relaxed">
                          Consistency is key. Use these daily ideas to maintain a high-authority presence. Mix educational content with myth-busting to maximize engagement.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {!contentRadar && !loading && (
                  <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                    <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">Radar Inactive</h3>
                    <p className="text-slate-400 text-sm">Enter a keyword to generate your daily content strategy.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'market-pulse' && (
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keyword</label>
                      <input 
                        type="text" 
                        value={pulseKeyword}
                        onChange={(e) => setPulseKeyword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                        placeholder="e.g. Numerology"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Country</label>
                      <input 
                        type="text" 
                        value={pulseCountry}
                        onChange={(e) => setPulseCountry(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                        placeholder="e.g. Global"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={handleGetMarketPulse}
                      disabled={loading || !pulseKeyword}
                      className="px-10 py-3 bg-royal-blue text-white font-bold rounded-xl shadow-lg shadow-royal-blue/20 hover:scale-105 transition-transform flex items-center space-x-2 disabled:opacity-50"
                    >
                      {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Radio className="w-5 h-5" />}
                      <span>Scan Market Pulse</span>
                    </button>
                  </div>
                </div>

                {marketPulse && !loading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12"
                  >
                    {/* Top 10 Weekly Opportunities */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center shadow-lg shadow-gold/20">
                          <Zap className="w-6 h-6 text-royal-blue" />
                        </div>
                        <h3 className="text-2xl font-bold text-royal-blue">Top 10 Weekly Opportunities</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {marketPulse.topWeeklyOpportunities.map((opp, idx) => (
                          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-start space-x-4">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0">
                              <span className="text-royal-blue font-bold text-sm">{idx + 1}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-slate-900">{opp.title}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                                  opp.potential === 'High' ? 'bg-emerald-50 text-emerald-600' : 
                                  opp.potential === 'Medium' ? 'bg-gold/10 text-gold' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  {opp.potential} Potential
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed mb-2">{opp.description}</p>
                              <span className="text-[10px] font-bold text-royal-blue/60 uppercase tracking-widest px-2 py-1 bg-royal-blue/5 rounded-lg">
                                {opp.type}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Trending Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Search Topics & Hooks */}
                      <div className="space-y-8">
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center space-x-2">
                            <Search className="w-5 h-5 text-gold" />
                            <span>Trending Search Topics</span>
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {marketPulse.trendingSearchTopics.map((topic, idx) => (
                              <span key={idx} className="px-4 py-2 bg-slate-50 rounded-xl text-sm font-medium text-slate-600 border border-slate-100">
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center space-x-2">
                            <Sparkles className="w-5 h-5 text-gold" />
                            <span>Trending Hooks</span>
                          </h3>
                          <div className="space-y-3">
                            {marketPulse.trendingHooks.map((hook, idx) => (
                              <div key={idx} className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-700 italic border border-slate-100">
                                "{hook}"
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Ads & Content Opportunities */}
                      <div className="space-y-8">
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center space-x-2">
                            <Video className="w-5 h-5 text-gold" />
                            <span>Trending Ads</span>
                          </h3>
                          <div className="space-y-4">
                            {marketPulse.trendingAds.map((ad, idx) => (
                              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-[10px] font-bold text-royal-blue uppercase tracking-widest">{ad.platform}</span>
                                </div>
                                <h4 className="font-bold text-slate-900 text-sm mb-1">{ad.headline}</h4>
                                <p className="text-xs text-slate-500 italic">"{ad.hook}"</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center space-x-2">
                            <Globe className="w-5 h-5 text-gold" />
                            <span>Content Opportunities</span>
                          </h3>
                          <div className="grid grid-cols-1 gap-3">
                            {marketPulse.contentOpportunities.map((opp, idx) => (
                              <div key={idx} className="flex items-center space-x-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-sm font-medium text-slate-700">{opp}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {!marketPulse && !loading && (
                  <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                    <Radio className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">Pulse Radar Ready</h3>
                    <p className="text-slate-400 text-sm">Scan the latest market trends and weekly opportunities.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'opportunity-scanner' && (
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keyword</label>
                      <input 
                        type="text" 
                        value={scanKeyword}
                        onChange={(e) => setScanKeyword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                        placeholder="e.g. Numerology"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Country</label>
                      <input 
                        type="text" 
                        value={scanCountry}
                        onChange={(e) => setScanCountry(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                        placeholder="e.g. USA"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={handleScanMarketOpportunity}
                      disabled={loading || !scanKeyword}
                      className="px-10 py-3 bg-royal-blue text-white font-bold rounded-xl shadow-lg shadow-royal-blue/20 hover:scale-105 transition-transform flex items-center space-x-2 disabled:opacity-50"
                    >
                      {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-5 h-5" />}
                      <span>Scan Market Opportunity</span>
                    </button>
                  </div>
                </div>

                {marketScan && !loading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-1 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Opportunity Score</p>
                        <div className="relative w-40 h-40 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="80"
                              cy="80"
                              r="70"
                              stroke="currentColor"
                              strokeWidth="12"
                              fill="transparent"
                              className="text-slate-100"
                            />
                            <circle
                              cx="80"
                              cy="80"
                              r="70"
                              stroke="currentColor"
                              strokeWidth="12"
                              fill="transparent"
                              strokeDasharray={440}
                              strokeDashoffset={440 - (440 * marketScan.opportunityScore) / 100}
                              strokeLinecap="round"
                              className={`${marketScan.opportunityScore > 70 ? 'text-emerald-500' : marketScan.opportunityScore > 40 ? 'text-gold' : 'text-rose-500'}`}
                            />
                          </svg>
                          <span className="absolute text-4xl font-bold text-slate-900">{marketScan.opportunityScore}</span>
                        </div>
                        <p className="mt-4 text-sm font-medium text-slate-500">
                          {marketScan.opportunityScore > 70 ? 'High Potential Market' : marketScan.opportunityScore > 40 ? 'Moderate Potential' : 'Low Potential / Saturated'}
                        </p>
                      </div>

                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                          <h4 className="text-[10px] font-bold text-royal-blue uppercase tracking-widest mb-3">Market Demand</h4>
                          <p className="text-sm text-slate-600 leading-relaxed">{marketScan.marketDemand}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                          <h4 className="text-[10px] font-bold text-royal-blue uppercase tracking-widest mb-3">Competitor Saturation</h4>
                          <p className="text-sm text-slate-600 leading-relaxed">{marketScan.competitorSaturation}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                          <h4 className="text-[10px] font-bold text-royal-blue uppercase tracking-widest mb-3">Ad Competition</h4>
                          <p className="text-sm text-slate-600 leading-relaxed">{marketScan.adCompetition}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                          <h4 className="text-[10px] font-bold text-royal-blue uppercase tracking-widest mb-3">Product Opportunity</h4>
                          <p className="text-sm text-slate-600 leading-relaxed">{marketScan.productOpportunity}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                      <h3 className="text-xl font-bold text-royal-blue mb-6">Content Trends</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {marketScan.contentTrends.map((trend, idx) => (
                          <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center space-x-3">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                              <TrendingUp className="w-4 h-4 text-gold" />
                            </div>
                            <span className="text-sm font-medium text-slate-700">{trend}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-royal-blue p-10 rounded-[50px] shadow-2xl text-white">
                      <div className="flex items-center space-x-3 mb-8">
                        <div className="w-12 h-12 bg-gold rounded-2xl flex items-center justify-center shadow-lg shadow-gold/20">
                          <Sparkles className="w-6 h-6 text-royal-blue" />
                        </div>
                        <h3 className="text-2xl font-bold">Strategic Recommendations</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-gold uppercase tracking-widest">Product to Launch</h4>
                          <p className="text-lg font-bold">{marketScan.recommendations.productToLaunch}</p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-gold uppercase tracking-widest">Ad Angle</h4>
                          <p className="text-lg font-bold">{marketScan.recommendations.adAngle}</p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-gold uppercase tracking-widest">Best Funnel Model</h4>
                          <p className="text-lg font-bold">{marketScan.recommendations.funnelModel}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {!marketScan && !loading && (
                  <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                    <Zap className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">Scanner Ready</h3>
                    <p className="text-slate-400 text-sm">Enter a keyword and country to scan for market opportunities.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'opportunity-map' && (
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keyword</label>
                      <input 
                        type="text" 
                        value={oppKeyword}
                        onChange={(e) => setOppKeyword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                        placeholder="e.g. Vastu"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Country (Optional)</label>
                      <input 
                        type="text" 
                        value={oppCountry}
                        onChange={(e) => setOppCountry(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                        placeholder="e.g. UAE"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform Focus</label>
                      <select 
                        value={oppPlatform}
                        onChange={(e) => setOppPlatform(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                      >
                        <option>Facebook</option>
                        <option>Instagram</option>
                        <option>YouTube</option>
                        <option>Google</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={handleGenerateOpportunityMap}
                      disabled={loading || !oppKeyword}
                      className="px-10 py-3 bg-royal-blue text-white font-bold rounded-xl shadow-lg shadow-royal-blue/20 hover:scale-105 transition-transform flex items-center space-x-2 disabled:opacity-50"
                    >
                      {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Globe className="w-5 h-5" />}
                      <span>Generate Opportunity Map</span>
                    </button>
                  </div>
                </div>

                {opportunityMap && !loading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                  >
                    {/* Heat Map & Score */}
                    <div className="lg:col-span-2 space-y-8">
                      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-8">
                          <h3 className="text-xl font-bold text-slate-900">1. Market Heat Map</h3>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opportunity Score</p>
                              <p className="text-3xl font-bold text-gold">{opportunityMap.overallOpportunityScore}/100</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          {opportunityMap.heatMap.map((opp, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-royal-blue font-bold shadow-sm">
                                  {opp.country.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900">{opp.country}</h4>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                                      opp.demand === 'High' ? 'bg-emerald-50 text-emerald-600' : 
                                      opp.demand === 'Growing' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                                    }`}>Demand: {opp.demand}</span>
                                    <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                                      opp.competition === 'Low' ? 'bg-emerald-50 text-emerald-600' : 
                                      opp.competition === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
                                    }`}>Comp: {opp.competition}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden mb-1">
                                  <div 
                                    className="h-full bg-gold transition-all duration-1000" 
                                    style={{ width: `${opp.opportunityScore}%` }}
                                  />
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{opp.opportunityScore}% Opportunity</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">3. Market Insight</h3>
                        <p className="text-slate-600 leading-relaxed italic">"{opportunityMap.marketInsight}"</p>
                      </div>

                      <div className="bg-royal-blue p-8 rounded-[40px] shadow-xl text-white">
                        <div className="flex items-center space-x-3 mb-6">
                          <Target className="w-6 h-6 text-gold" />
                          <h3 className="text-xl font-bold">4. Recommended Entry Strategy</h3>
                        </div>
                        <p className="text-white/80 leading-relaxed">{opportunityMap.entryStrategy}</p>
                      </div>
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-8">
                      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">5. Ad Budget Recommendation</h3>
                        <div className="space-y-4">
                          {opportunityMap.budgetRecommendations.map((rec, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                              <span className="text-sm font-bold text-slate-700">{rec.region}</span>
                              <span className="text-sm font-bold text-emerald-600">{rec.budget}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">6. Local Hook Suggestions</h3>
                        <div className="space-y-6">
                          {opportunityMap.localHooks.map((group, idx) => (
                            <div key={idx} className="space-y-3">
                              <h4 className="text-[10px] font-bold text-gold uppercase tracking-widest">{group.region}</h4>
                              <div className="space-y-2">
                                {group.hooks.map((hook, hIdx) => (
                                  <div key={hIdx} className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100 italic">
                                    "{hook}"
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {opportunityMap === null && !loading && (
                  <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                    <Globe className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">Map Inactive</h3>
                    <p className="text-slate-400 text-sm">Enter a keyword to map global market opportunities.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'growth-engine' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Growth Engine</h2>
                <p className="text-slate-500">AI Marketing Command Center & Execution Planner</p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <Calendar className="w-4 h-4" />
                <span>Week of {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Keyword</label>
                  <input
                    type="text"
                    value={growthKeyword}
                    onChange={(e) => setGrowthKeyword(e.target.value)}
                    placeholder="e.g. Numerology"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Target Country</label>
                  <select
                    value={growthCountry}
                    onChange={(e) => setGrowthCountry(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option>Global</option>
                    <option>India</option>
                    <option>USA</option>
                    <option>UK</option>
                    <option>Canada</option>
                    <option>Australia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Platform Focus</label>
                  <select
                    value={growthPlatform}
                    onChange={(e) => setGrowthPlatform(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option>Instagram</option>
                    <option>YouTube</option>
                    <option>Facebook</option>
                    <option>Google</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Business Type</label>
                  <select
                    value={growthBusinessType}
                    onChange={(e) => setGrowthBusinessType(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="course">Online Course</option>
                    <option value="consulting">Consulting/Coaching</option>
                    <option value="digital product">Digital Product</option>
                    <option value="membership">Membership</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleGenerateGrowthPlan}
                disabled={loading || !growthKeyword}
                className="mt-6 w-full bg-[#C9A227] hover:bg-[#B08D21] text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Generate Weekly Growth Plan</span>
                  </>
                )}
              </button>
            </div>

            {growthPlan && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Left Column: Market & Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Market Opportunity */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Target className="w-5 h-5 text-[#1F3A8A]" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">1. Market Opportunity</h3>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{growthPlan.marketOpportunity}</p>
                  </div>

                  {/* Content to Record */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <Video className="w-5 h-5 text-emerald-600" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">2. Content to Record (Viral Hooks)</h3>
                    </div>
                    <div className="space-y-3">
                      {growthPlan.contentToRecord.map((content, idx) => (
                        <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex-shrink-0 w-6 h-6 bg-white rounded-full border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400">
                            {idx + 1}
                          </div>
                          <p className="text-slate-700 font-medium">{content}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ads to Run */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="p-2 bg-amber-50 rounded-lg">
                        <Layout className="w-5 h-5 text-amber-600" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">3. Ads to Launch</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {growthPlan.adsToRun.map((ad, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                          <div className="text-xs font-bold text-[#C9A227] uppercase tracking-wider">Ad Concept {idx + 1}</div>
                          <div className="text-sm font-semibold text-slate-900 leading-tight">"{ad.hook}"</div>
                          <div className="pt-2 border-t border-slate-200">
                            <div className="text-[10px] text-slate-400 uppercase font-bold">CTA</div>
                            <div className="text-xs font-medium text-slate-600">{ad.cta}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Funnel</div>
                            <div className="text-xs font-medium text-slate-600">{ad.funnelType}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Strategy & Action Plan */}
                <div className="space-y-6">
                  {/* Offer & Funnel */}
                  <div className="bg-[#1F3A8A] p-6 rounded-2xl shadow-lg text-white">
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <Layers className="w-5 h-5 text-[#C9A227]" />
                      </div>
                      <h3 className="text-lg font-bold">Strategy Architecture</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">4. Offer Strategy</div>
                        <p className="text-sm text-white/90 leading-relaxed">{growthPlan.offerStrategy}</p>
                      </div>
                      
                      <div className="pt-4 border-t border-white/10">
                        <div className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">5. Funnel Structure</div>
                        <div className="flex flex-wrap items-center gap-2">
                          {growthPlan.funnelStructure.split('→').map((step, idx, arr) => (
                            <React.Fragment key={idx}>
                              <span className="px-2 py-1 bg-white/10 rounded text-xs font-medium">{step.trim()}</span>
                              {idx < arr.length - 1 && <ChevronRight className="w-3 h-3 text-blue-300" />}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Action Plan */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">6. 7-Day Execution Plan</h3>
                    </div>
                    <div className="space-y-4">
                      {growthPlan.weeklyActionPlan.map((day, idx) => (
                        <div key={idx} className="relative pl-6 pb-4 border-l-2 border-slate-100 last:border-0 last:pb-0">
                          <div className="absolute left-[-9px] top-0 w-4 h-4 bg-white border-2 border-[#C9A227] rounded-full"></div>
                          <div className="text-xs font-bold text-[#C9A227] uppercase mb-1">{day.day}</div>
                          <p className="text-sm text-slate-600 leading-snug">{day.action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'advisor' && (
              <motion.div 
                key="advisor"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col"
              >
                <div className="flex-1 overflow-y-auto space-y-6 p-4">
                  <div className="bg-slate-100 p-6 rounded-3xl rounded-bl-none max-w-[80%]">
                    <p className="text-sm text-slate-700">
                      Hello Admin. I am your Astra Strategy AI. I have analyzed your {competitors.length} competitors and current campaign performance. What marketing strategy questions do you have today?
                    </p>
                  </div>
                  {advisorChat.map((chat, i) => (
                    <div key={i} className="space-y-6">
                      <div className="flex justify-end">
                        <div className="bg-gold p-6 rounded-3xl rounded-br-none max-w-[80%] text-white shadow-lg shadow-gold/20">
                          <p className="text-sm font-bold">{chat.q}</p>
                        </div>
                      </div>
                      <div className="bg-royal-blue p-6 rounded-3xl rounded-bl-none max-w-[80%] text-white shadow-xl shadow-royal-blue/20">
                        <p className="text-sm leading-relaxed">{chat.a}</p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex items-center space-x-2 text-gold animate-pulse">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">Astra is thinking...</span>
                    </div>
                  )}
                </div>

                <div className="mt-8 p-4 bg-white border border-slate-100 rounded-[32px] shadow-xl flex items-center space-x-4">
                  <input 
                    type="text" 
                    value={advisorQ}
                    onChange={(e) => setAdvisorQ(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAskAdvisor()}
                    className="flex-1 px-6 py-4 outline-none text-slate-700"
                    placeholder="Ask about your next marketing move..."
                  />
                  <button 
                    onClick={handleAskAdvisor}
                    disabled={loading}
                    className="p-4 bg-gold text-white rounded-2xl hover:scale-105 transition-transform"
                  >
                    <ArrowUpRight className="w-6 h-6" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
