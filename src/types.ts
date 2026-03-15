export type UserRole = 'admin' | 'member';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt: string;
}

export interface Competitor {
  id?: string;
  name: string;
  website: string;
  instagram: string;
  youtube: string;
  adLibraryLink: string;
  addedAt: string;
}

export interface Campaign {
  id?: string;
  name: string;
  platform: string;
  budget: number;
  ctr: number;
  cpc: number;
  conversionRate: number;
  revenue: number;
  timestamp: string;
}

export interface AdSpyResult {
  headline: string;
  copySummary: string;
  hookType: string;
  ctaType: string;
  funnelType: string;
  audienceIntent: string;
  landingPage: string;
  platform: string;
  adType: string;
  performanceScore: number;
  engagementScore: number;
  funnelScore: number;
  analysis: {
    hookStrategy: string;
    audienceTarget: string;
    offerType: string;
    funnelStrategy: string;
    conversionDrivers: string;
    weakness: string;
    opportunityForJaya: string;
  };
}

export interface HookGeneration {
  hooks: string[];
  angles: string[];
  webinarTitles: string[];
  headlines: string[];
}

export interface MarketSummary {
  totalAds: number;
  topFunnel: string;
  commonHook: string;
  topCompetitor: string;
  marketOverview: string;
  funnelPatterns: string[];
  hookTrends: string[];
  recommendedStrategy: string;
}

export interface AdSpyResponse {
  ads: AdSpyResult[];
  summary: MarketSummary;
}

export interface TrendResult {
  term: string;
  rising: boolean;
  ideas: string[];
}

export interface ViralAd {
  headline: string;
  copySummary: string;
  hookType: string;
  emotionalTrigger: string;
  funnelType: string;
  platform: string;
  country: string;
  viralityScore: number;
  tag: 'Viral' | 'Trending' | 'Emerging' | 'High Conversion';
  analysis: {
    whyItWorks: string;
    audiencePsychology: string;
    offerStructure: string;
    hookPattern: string;
    conversionTriggers: string;
  };
}

export interface ViralRadarSummary {
  totalViralAds: number;
  topHookPattern: string;
  topFunnelType: string;
  mostAggressiveCompetitor: string;
  recommendedAdIdea: string;
}

export interface ViralRadarResponse {
  ads: ViralAd[];
  summary: ViralRadarSummary;
}

export interface GrowthPlan {
  marketOpportunity: string;
  contentToRecord: string[];
  adsToRun: {
    hook: string;
    cta: string;
    funnelType: string;
  }[];
  offerStrategy: string;
  funnelStructure: string;
  weeklyActionPlan: {
    day: string;
    action: string;
  }[];
}

export interface MarketOpportunity {
  country: string;
  demand: 'High' | 'Medium' | 'Low' | 'Growing';
  competition: 'High' | 'Medium' | 'Low';
  opportunityScore: number;
}

export interface MarketOpportunityMap {
  heatMap: MarketOpportunity[];
  overallOpportunityScore: number;
  marketInsight: string;
  entryStrategy: string;
  budgetRecommendations: {
    region: string;
    budget: string;
  }[];
  localHooks: {
    region: string;
    hooks: string[];
  }[];
}

export interface MarketPulseOpportunity {
  title: string;
  description: string;
  potential: 'High' | 'Medium' | 'Low';
  type: 'Ad' | 'Content' | 'Product' | 'Hook';
}

export interface MarketPulseResult {
  trendingSearchTopics: string[];
  trendingAds: {
    headline: string;
    hook: string;
    platform: string;
  }[];
  trendingHooks: string[];
  contentOpportunities: string[];
  topWeeklyOpportunities: MarketPulseOpportunity[];
}

export interface MarketOpportunityScannerResult {
  opportunityScore: number;
  marketDemand: string;
  competitorSaturation: string;
  contentTrends: string[];
  adCompetition: string;
  productOpportunity: string;
  recommendations: {
    productToLaunch: string;
    adAngle: string;
    funnelModel: string;
  };
}

export interface DiscoveredCompetitor {
  name: string;
  category: string;
  country: string;
  positioning: string;
  offerType: string;
  platforms: string[];
  website: string;
  instagram: string;
  youtube: string;
  aiSummary: {
    selling: string;
    audience: string;
    adStyle: string;
    contentAngle: string;
    funnelType: string;
  };
  marketBucket: 'premium' | 'mid-range' | 'mass market' | 'education-focused' | 'consultation-focused' | 'certification-focused';
}

export interface CompetitorDiscoveryResponse {
  competitors: DiscoveredCompetitor[];
  opportunityAnalysis: {
    overdone: string;
    marketGaps: string;
    standoutStrategy: string;
    underServedOffer: string;
  };
}

export interface DailyContentIdea {
  hook: string;
  concept: string;
  talkingPoints: string[];
  cta: string;
}

export interface DailyContentRadar {
  ideas: DailyContentIdea[];
  weeklyPlan: {
    day: string;
    type: string;
  }[];
}

export interface ContentScript {
  script: string;
}

export interface AdPrediction {
  successScore: number;
  hookStrength: string;
  emotionalTrigger: string;
  audienceAlignment: string;
  offerClarity: string;
  ctaStrength: string;
  funnelCompatibility: string;
  suggestions: {
    strongerHook: string;
    improvedHeadline: string;
    betterCTA: string;
    refinedAdScript: string;
  };
}

export interface ImprovedAd {
  improvedHook: string;
  reelScript: string;
  suggestedHeadline: string;
  optimizedCTA: string;
}

export interface CompetingAd {
  improvedHook: string;
  improvedHeadline: string;
  reelScript: string;
  ctaSuggestion: string;
}
