import { AdSpyResult, HookGeneration, TrendResult, AdSpyResponse, CompetingAd, ViralRadarResponse, GrowthPlan, MarketOpportunityMap, AdPrediction, ImprovedAd, DailyContentRadar, ContentScript, CompetitorDiscoveryResponse, MarketOpportunityScannerResult, MarketPulseResult } from "../types";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getMarketPulse(
  keyword: string,
  country: string
): Promise<MarketPulseResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as a Real-time Marketing Intelligence Analyst. 
    Scan and analyze the "Market Pulse" for "${keyword}" in ${country}.
    
    Return a JSON object with:
    1. "trendingSearchTopics": Array of 5-8 trending search terms.
    2. "trendingAds": Array of 3-5 trending ad concepts with "headline", "hook", and "platform".
    3. "trendingHooks": Array of 5-8 trending hooks/angles.
    4. "contentOpportunities": Array of 5-8 content ideas that are currently underserved.
    5. "topWeeklyOpportunities": Array of exactly 10 objects with "title", "description", "potential" (High/Medium/Low), and "type" (Ad/Content/Product/Hook).
    
    Ensure the data is hyper-relevant to the spiritual/coaching/numerology niche.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          trendingSearchTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
          trendingAds: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                hook: { type: Type.STRING },
                platform: { type: Type.STRING }
              },
              required: ['headline', 'hook', 'platform']
            }
          },
          trendingHooks: { type: Type.ARRAY, items: { type: Type.STRING } },
          contentOpportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
          topWeeklyOpportunities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                potential: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                type: { type: Type.STRING, enum: ['Ad', 'Content', 'Product', 'Hook'] }
              },
              required: ['title', 'description', 'potential', 'type']
            }
          }
        },
        required: ['trendingSearchTopics', 'trendingAds', 'trendingHooks', 'contentOpportunities', 'topWeeklyOpportunities']
      }
    }
  });
  return JSON.parse(response.text || '{}');
}

export async function scanMarketOpportunity(
  keyword: string,
  country: string
): Promise<MarketOpportunityScannerResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as a Market Intelligence Expert. 
    Analyze the market opportunity for "${keyword}" in ${country}.
    
    Return a JSON object with:
    1. "opportunityScore": A number from 1 to 100.
    2. "marketDemand": A summary of the current demand.
    3. "competitorSaturation": A summary of how saturated the market is.
    4. "contentTrends": An array of 3-5 current content trends.
    5. "adCompetition": A summary of the advertising competition level.
    6. "productOpportunity": A summary of the product opportunities.
    7. "recommendations": An object with "productToLaunch", "adAngle", and "funnelModel".
    
    Ensure the analysis is professional, data-driven, and actionable for a spiritual/coaching business.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          opportunityScore: { type: Type.NUMBER },
          marketDemand: { type: Type.STRING },
          competitorSaturation: { type: Type.STRING },
          contentTrends: { type: Type.ARRAY, items: { type: Type.STRING } },
          adCompetition: { type: Type.STRING },
          productOpportunity: { type: Type.STRING },
          recommendations: {
            type: Type.OBJECT,
            properties: {
              productToLaunch: { type: Type.STRING },
              adAngle: { type: Type.STRING },
              funnelModel: { type: Type.STRING }
            },
            required: ['productToLaunch', 'adAngle', 'funnelModel']
          }
        },
        required: ['opportunityScore', 'marketDemand', 'competitorSaturation', 'contentTrends', 'adCompetition', 'productOpportunity', 'recommendations']
      }
    }
  });
  return JSON.parse(response.text || '{}');
}

export async function discoverCompetitors(
  keyword: string,
  country: string,
  platform: string,
  industry: string
): Promise<CompetitorDiscoveryResponse> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as a Global Marketing Intelligence Analyst. 
    Discover at least 10 likely competitors for "${keyword}" in ${country} on ${platform} within the ${industry} industry.
    
    Return a JSON object with:
    1. "competitors": An array of at least 10 objects, each with:
       - "name": Competitor name.
       - "category": e.g., "Numerology", "Vastu".
       - "country": Country of operation.
       - "positioning": e.g., "Luxury Spiritual Guide", "Mass Market Education".
       - "offerType": e.g., "Courses", "1-on-1 Consultations".
       - "platforms": Array of platforms they are active on.
       - "website": A placeholder URL.
       - "instagram": A placeholder handle.
       - "youtube": A placeholder channel name.
       - "aiSummary": Object with "selling", "audience", "adStyle", "contentAngle", "funnelType".
       - "marketBucket": One of: "premium", "mid-range", "mass market", "education-focused", "consultation-focused", "certification-focused".
    2. "opportunityAnalysis": Object with "overdone", "marketGaps", "standoutStrategy", "underServedOffer".
    
    Ensure the data is realistic for the spiritual/coaching niche.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          competitors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                country: { type: Type.STRING },
                positioning: { type: Type.STRING },
                offerType: { type: Type.STRING },
                platforms: { type: Type.ARRAY, items: { type: Type.STRING } },
                website: { type: Type.STRING },
                instagram: { type: Type.STRING },
                youtube: { type: Type.STRING },
                aiSummary: {
                  type: Type.OBJECT,
                  properties: {
                    selling: { type: Type.STRING },
                    audience: { type: Type.STRING },
                    adStyle: { type: Type.STRING },
                    contentAngle: { type: Type.STRING },
                    funnelType: { type: Type.STRING }
                  },
                  required: ['selling', 'audience', 'adStyle', 'contentAngle', 'funnelType']
                },
                marketBucket: { type: Type.STRING, enum: ["premium", "mid-range", "mass market", "education-focused", "consultation-focused", "certification-focused"] }
              },
              required: ['name', 'category', 'country', 'positioning', 'offerType', 'platforms', 'website', 'instagram', 'youtube', 'aiSummary', 'marketBucket']
            }
          },
          opportunityAnalysis: {
            type: Type.OBJECT,
            properties: {
              overdone: { type: Type.STRING },
              marketGaps: { type: Type.STRING },
              standoutStrategy: { type: Type.STRING },
              underServedOffer: { type: Type.STRING }
            },
            required: ['overdone', 'marketGaps', 'standoutStrategy', 'underServedOffer']
          }
        },
        required: ['competitors', 'opportunityAnalysis']
      }
    }
  });
  return JSON.parse(response.text || '{}');
}

export async function getDailyContentRadar(
  keyword: string,
  country: string,
  platform: string
): Promise<DailyContentRadar> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as a Viral Content Strategist for a premium spiritual/coaching brand. 
    Generate a "Daily Content Radar" for "${keyword}" in ${country} for ${platform}.
    
    Return a JSON object with:
    1. "ideas": An array of 5 objects, each with "hook", "concept", "talkingPoints" (array of 3), and "cta".
    2. "weeklyPlan": An array of 7 objects with "day" (Monday-Sunday) and "type" (e.g., "Educational Reel", "Myth Busting", "Case Study").
    
    Ensure the content is viral, authoritative, and tailored for Jaya Karamchandani's audience.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ideas: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                hook: { type: Type.STRING },
                concept: { type: Type.STRING },
                talkingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                cta: { type: Type.STRING }
              },
              required: ['hook', 'concept', 'talkingPoints', 'cta']
            }
          },
          weeklyPlan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.STRING },
                type: { type: Type.STRING }
              },
              required: ['day', 'type']
            }
          }
        },
        required: ['ideas', 'weeklyPlan']
      }
    }
  });
  return JSON.parse(response.text || '{}');
}

export async function generateContentScript(
  idea: any,
  platform: string
): Promise<ContentScript> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as a Viral Scriptwriter. 
    Write a 30-60 second high-energy script for ${platform} based on this idea:
    Hook: ${idea.hook}
    Concept: ${idea.concept}
    Talking Points: ${idea.talkingPoints.join(', ')}
    
    The script should be engaging, professional, and include visual cues (e.g., [Point to screen], [Close up]).
    Return a JSON object with a single property "script".`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          script: { type: Type.STRING }
        },
        required: ['script']
      }
    }
  });
  return JSON.parse(response.text || '{}');
}

export async function predictAdSuccess(
  hook: string,
  headline: string,
  adCopy: string,
  cta: string,
  offerType: string,
  platform: string
): Promise<AdPrediction> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as a world-class Direct Response Marketing Expert and Copywriter. 
    Evaluate the following ad idea for ${platform} promoting a ${offerType}:
    
    Hook: ${hook}
    Headline: ${headline}
    Ad Copy: ${adCopy}
    CTA: ${cta}
    
    Return a JSON object with:
    1. "successScore": A 0-100 score.
    2. "hookStrength": Analysis of the hook.
    3. "emotionalTrigger": Primary emotional driver identified.
    4. "audienceAlignment": Evaluation of audience fit.
    5. "offerClarity": How clear and compelling the offer is.
    6. "ctaStrength": Analysis of the CTA.
    7. "funnelCompatibility": Assessment of funnel fit.
    8. "suggestions": An object with "strongerHook", "improvedHeadline", "betterCTA", and "refinedAdScript".
    
    Be critical and provide high-level strategic feedback.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          successScore: { type: Type.NUMBER },
          hookStrength: { type: Type.STRING },
          emotionalTrigger: { type: Type.STRING },
          audienceAlignment: { type: Type.STRING },
          offerClarity: { type: Type.STRING },
          ctaStrength: { type: Type.STRING },
          funnelCompatibility: { type: Type.STRING },
          suggestions: {
            type: Type.OBJECT,
            properties: {
              strongerHook: { type: Type.STRING },
              improvedHeadline: { type: Type.STRING },
              betterCTA: { type: Type.STRING },
              refinedAdScript: { type: Type.STRING }
            },
            required: ['strongerHook', 'improvedHeadline', 'betterCTA', 'refinedAdScript']
          }
        },
        required: ['successScore', 'hookStrength', 'emotionalTrigger', 'audienceAlignment', 'offerClarity', 'ctaStrength', 'funnelCompatibility', 'suggestions']
      }
    }
  });
  return JSON.parse(response.text || '{}');
}

export async function generateBetterAd(
  hook: string,
  headline: string,
  adCopy: string,
  cta: string,
  offerType: string,
  platform: string
): Promise<ImprovedAd> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as a world-class Direct Response Marketing Expert. 
    Take this ad idea and generate a significantly "Better Version" optimized for high conversion on ${platform} for a ${offerType}:
    
    Original Hook: ${hook}
    Original Headline: ${headline}
    Original Ad Copy: ${adCopy}
    Original CTA: ${cta}
    
    Return a JSON object with:
    1. "improvedHook": A high-impact opening line.
    2. "reelScript": A 30-45 second high-energy script for a video/reel.
    3. "suggestedHeadline": A winning headline.
    4. "optimizedCTA": A clear, compelling call to action.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          improvedHook: { type: Type.STRING },
          reelScript: { type: Type.STRING },
          suggestedHeadline: { type: Type.STRING },
          optimizedCTA: { type: Type.STRING }
        },
        required: ['improvedHook', 'reelScript', 'suggestedHeadline', 'optimizedCTA']
      }
    }
  });
  return JSON.parse(response.text || '{}');
}

export async function getMarketOpportunityMap(
  keyword: string,
  country: string,
  platform: string
): Promise<MarketOpportunityMap> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as a Global Marketing Intelligence Analyst. 
    Analyze the global market opportunity for "${keyword}" on ${platform}${country ? ` with a focus on ${country}` : ''}.
    
    Return a JSON object with:
    1. "heatMap": An array of 5-8 countries with "country", "demand" (High/Medium/Low/Growing), "competition" (High/Medium/Low), and "opportunityScore" (0-100).
    2. "overallOpportunityScore": A single 0-100 score for the market.
    3. "marketInsight": A strategic explanation of why these regions are promising.
    4. "entryStrategy": A recommended step-by-step entry strategy.
    5. "budgetRecommendations": An array of objects with "region" and "budget" (e.g., "$15/day").
    6. "localHooks": An array of objects with "region" and "hooks" (array of 2-3 localized hooks).
    
    Ensure the insights are tailored for a premium spiritual/coaching brand.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          heatMap: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                country: { type: Type.STRING },
                demand: { type: Type.STRING, enum: ['High', 'Medium', 'Low', 'Growing'] },
                competition: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                opportunityScore: { type: Type.NUMBER }
              },
              required: ['country', 'demand', 'competition', 'opportunityScore']
            }
          },
          overallOpportunityScore: { type: Type.NUMBER },
          marketInsight: { type: Type.STRING },
          entryStrategy: { type: Type.STRING },
          budgetRecommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                region: { type: Type.STRING },
                budget: { type: Type.STRING }
              },
              required: ['region', 'budget']
            }
          },
          localHooks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                region: { type: Type.STRING },
                hooks: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['region', 'hooks']
            }
          }
        },
        required: ['heatMap', 'overallOpportunityScore', 'marketInsight', 'entryStrategy', 'budgetRecommendations', 'localHooks']
      }
    }
  });
  return JSON.parse(response.text || '{}');
}

export async function generateGrowthPlan(
  keyword: string,
  country: string,
  platform: string,
  businessType: string,
  context: string
): Promise<GrowthPlan> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as a Chief Marketing Officer and Growth Strategist for an elite agency. 
    Generate a comprehensive Weekly Growth Plan for a "${businessType}" business focusing on "${keyword}" in ${country} using ${platform}.
    
    Context from recent research: ${context}
    
    Return a JSON object with:
    1. "marketOpportunity": A professional summary of current market demand and gaps.
    2. "contentToRecord": An array of 5 specific viral reel/video ideas with hooks.
    3. "adsToRun": An array of 3 ad recommendations, each with hook, cta, and funnelType.
    4. "offerStrategy": Recommendation on what offer type to promote (webinar, lead magnet, consultation, course).
    5. "funnelStructure": The recommended funnel flow (e.g. Reel -> Lead Magnet -> Webinar -> Course).
    6. "weeklyActionPlan": An array of 7 objects, each with "day" (Day 1, Day 2, etc.) and "action" (specific task).
    
    The tone should be authoritative, strategic, and premium.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          marketOpportunity: { type: Type.STRING },
          contentToRecord: { type: Type.ARRAY, items: { type: Type.STRING } },
          adsToRun: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                hook: { type: Type.STRING },
                cta: { type: Type.STRING },
                funnelType: { type: Type.STRING }
              },
              required: ['hook', 'cta', 'funnelType']
            }
          },
          offerStrategy: { type: Type.STRING },
          funnelStructure: { type: Type.STRING },
          weeklyActionPlan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.STRING },
                action: { type: Type.STRING }
              },
              required: ['day', 'action']
            }
          }
        },
        required: ['marketOpportunity', 'contentToRecord', 'adsToRun', 'offerStrategy', 'funnelStructure', 'weeklyActionPlan']
      }
    }
  });
  return JSON.parse(response.text || '{}');
}

export async function getViralAdRadar(
  keyword: string,
  country: string,
  platform: string,
  timeRange: string
): Promise<ViralRadarResponse> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as a Viral Marketing Intelligence Radar for an elite agency. 
    Detect high-performing and trending ad patterns for "${keyword}" in ${country} on ${platform} over the last ${timeRange}.
    
    Return a JSON object with:
    1. "ads": An array of 6 viral ad examples. Each must include:
       - headline: Compelling ad headline.
       - copySummary: Brief summary of the ad copy.
       - hookType: Type of hook used (e.g., Curiosity, Fear, Benefit).
       - emotionalTrigger: The core emotion being triggered.
       - funnelType: The funnel structure.
       - platform: ${platform}.
       - country: ${country}.
       - viralityScore: A score from 0-100.
       - tag: One of 'Viral', 'Trending', 'Emerging', 'High Conversion'.
       - analysis: An object with whyItWorks, audiencePsychology, offerStructure, hookPattern, conversionTriggers.
    2. "summary": A ViralRadarSummary object with:
       - totalViralAds: Number of viral ads detected.
       - topHookPattern: The most successful hook pattern.
       - topFunnelType: The most effective funnel type.
       - mostAggressiveCompetitor: Name of the most active competitor.
       - recommendedAdIdea: A specific, actionable ad idea for Jaya Karamchandani this week.
    
    Ensure the data is highly strategic and tailored for a luxury spiritual/coaching brand.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ads: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                copySummary: { type: Type.STRING },
                hookType: { type: Type.STRING },
                emotionalTrigger: { type: Type.STRING },
                funnelType: { type: Type.STRING },
                platform: { type: Type.STRING },
                country: { type: Type.STRING },
                viralityScore: { type: Type.NUMBER },
                tag: { type: Type.STRING, enum: ['Viral', 'Trending', 'Emerging', 'High Conversion'] },
                analysis: {
                  type: Type.OBJECT,
                  properties: {
                    whyItWorks: { type: Type.STRING },
                    audiencePsychology: { type: Type.STRING },
                    offerStructure: { type: Type.STRING },
                    hookPattern: { type: Type.STRING },
                    conversionTriggers: { type: Type.STRING }
                  },
                  required: ['whyItWorks', 'audiencePsychology', 'offerStructure', 'hookPattern', 'conversionTriggers']
                }
              },
              required: ['headline', 'copySummary', 'hookType', 'emotionalTrigger', 'funnelType', 'platform', 'country', 'viralityScore', 'tag', 'analysis']
            }
          },
          summary: {
            type: Type.OBJECT,
            properties: {
              totalViralAds: { type: Type.NUMBER },
              topHookPattern: { type: Type.STRING },
              topFunnelType: { type: Type.STRING },
              mostAggressiveCompetitor: { type: Type.STRING },
              recommendedAdIdea: { type: Type.STRING }
            },
            required: ['totalViralAds', 'topHookPattern', 'topFunnelType', 'mostAggressiveCompetitor', 'recommendedAdIdea']
          }
        },
        required: ['ads', 'summary']
      }
    }
  });
  return JSON.parse(response.text || '{"ads": [], "summary": {}}');
}

export async function generateCompetingAd(ad: AdSpyResult | any): Promise<CompetingAd> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a world-class direct response copywriter. 
    Analyze this competitor ad and create a superior version for Jaya Karamchandani (Numerology, Astrology, Vastu expert).
    
    Competitor Ad Details:
    Headline: ${ad.headline}
    Copy Summary: ${ad.copySummary}
    Hook Type: ${ad.hookType}
    Funnel: ${ad.funnelType}
    
    Generate:
    1. Improved Hook: A more powerful psychological hook that grabs attention immediately.
    2. Improved Headline: A high-converting headline that promises a specific result.
    3. Reel Script: A short (30-60 sec) script for an Instagram Reel or TikTok. Include visual cues and spoken lines.
    4. CTA Suggestion: A clear, compelling call to action.
    
    Return the result as a JSON object.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          improvedHook: { type: Type.STRING },
          improvedHeadline: { type: Type.STRING },
          reelScript: { type: Type.STRING },
          ctaSuggestion: { type: Type.STRING }
        },
        required: ['improvedHook', 'improvedHeadline', 'reelScript', 'ctaSuggestion']
      }
    }
  });
  return JSON.parse(response.text || '{}');
}

export async function spyAds(
  keyword: string, 
  country: string, 
  platform: string,
  adType: string = 'All',
  offerType: string = 'All',
  dateRange: string = 'Last 30 days'
): Promise<AdSpyResponse> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as a Global Ad Spy tool. Search for active ads for "${keyword}" in ${country} on ${platform}. 
    Filters: Ad Type: ${adType}, Offer Type: ${offerType}, Date Range: ${dateRange}.
    
    Return a JSON object with two properties:
    1. "ads": A JSON array of 10 simulated ad results. 
       Each result must include: headline, copySummary, hookType, ctaType, funnelType, audienceIntent, landingPage, platform, adType, performanceScore (0-100), engagementScore (0-100), funnelScore (0-100).
       Additionally, provide a detailed "analysis" object for each ad with:
       - hookStrategy: Explain the psychological hook used.
       - audienceTarget: Identify likely target audience.
       - offerType: Classify the offer (lead magnet, webinar, course, consultation, etc).
       - funnelStrategy: Explain the funnel structure.
       - conversionDrivers: Explain what makes the ad likely to convert.
       - weakness: Suggest what could be improved.
       - opportunityForJaya: Recommend how Jaya Karamchandani could create a stronger competing ad.
    2. "summary": A Market Intelligence Summary object with:
       - totalAds: A realistic number of total ads found in the market for this keyword (e.g. 150-2000).
       - topFunnel: The most dominant funnel type found.
       - commonHook: The most common psychological hook pattern observed.
       - topCompetitor: The name of the most dominant competitor in this space.
       - marketOverview: A professional agency-grade overview of the current market state for this keyword.
       - funnelPatterns: An array of the top 3 funnel structures being used.
       - hookTrends: An array of the top 3 hook trends currently working.
       - recommendedStrategy: A comprehensive marketing strategy recommendation for Jaya Karamchandani to dominate this market.
    
    Sort the ads by performanceScore in descending order.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ads: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                copySummary: { type: Type.STRING },
                hookType: { type: Type.STRING },
                ctaType: { type: Type.STRING },
                funnelType: { type: Type.STRING },
                audienceIntent: { type: Type.STRING },
                landingPage: { type: Type.STRING },
                platform: { type: Type.STRING },
                adType: { type: Type.STRING },
                performanceScore: { type: Type.NUMBER },
                engagementScore: { type: Type.NUMBER },
                funnelScore: { type: Type.NUMBER },
                analysis: {
                  type: Type.OBJECT,
                  properties: {
                    hookStrategy: { type: Type.STRING },
                    audienceTarget: { type: Type.STRING },
                    offerType: { type: Type.STRING },
                    funnelStrategy: { type: Type.STRING },
                    conversionDrivers: { type: Type.STRING },
                    weakness: { type: Type.STRING },
                    opportunityForJaya: { type: Type.STRING }
                  },
                  required: [
                    'hookStrategy', 'audienceTarget', 'offerType', 'funnelStrategy', 
                    'conversionDrivers', 'weakness', 'opportunityForJaya'
                  ]
                }
              },
              required: [
                'headline', 'copySummary', 'hookType', 'ctaType', 'funnelType', 
                'audienceIntent', 'landingPage', 'platform', 'adType',
                'performanceScore', 'engagementScore', 'funnelScore', 'analysis'
              ]
            }
          },
          summary: {
            type: Type.OBJECT,
            properties: {
              totalAds: { type: Type.NUMBER },
              topFunnel: { type: Type.STRING },
              commonHook: { type: Type.STRING },
              topCompetitor: { type: Type.STRING },
              marketOverview: { type: Type.STRING },
              funnelPatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
              hookTrends: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendedStrategy: { type: Type.STRING }
            },
            required: [
              'totalAds', 'topFunnel', 'commonHook', 'topCompetitor', 
              'marketOverview', 'funnelPatterns', 'hookTrends', 'recommendedStrategy'
            ]
          }
        },
        required: ['ads', 'summary']
      }
    }
  });
  return JSON.parse(response.text || '{"ads": [], "summary": {}}');
}

export async function analyzeAdCreative(imageData: string): Promise<any> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      { text: "Analyze this ad creative. Identify the emotional hook, marketing angle, audience targeting, and conversion potential. Provide 3 suggestions to improve performance." },
      { inlineData: { mimeType: "image/jpeg", data: imageData.split(',')[1] } }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hook: { type: Type.STRING },
          angle: { type: Type.STRING },
          targeting: { type: Type.STRING },
          potential: { type: Type.STRING },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['hook', 'angle', 'targeting', 'potential', 'suggestions']
      }
    }
  });
  return JSON.parse(response.text || '{}');
}

export async function generateHooks(keyword: string): Promise<HookGeneration> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate marketing assets for "${keyword}". Return JSON with: 10 hooks, 5 marketing angles, 3 webinar titles, 3 landing page headlines.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hooks: { type: Type.ARRAY, items: { type: Type.STRING } },
          angles: { type: Type.ARRAY, items: { type: Type.STRING } },
          webinarTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
          headlines: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['hooks', 'angles', 'webinarTitles', 'headlines']
      }
    }
  });
  return JSON.parse(response.text || '{}');
}

export async function getTrendRadar(keyword: string): Promise<TrendResult[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Identify 5 trending topics related to "${keyword}" across Google, YouTube, and Social Media. Return JSON array with: term, rising (boolean), ideas (array of strings).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            term: { type: Type.STRING },
            rising: { type: Type.BOOLEAN },
            ideas: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['term', 'rising', 'ideas']
        }
      }
    }
  });
  return JSON.parse(response.text || '[]');
}

export async function askStrategyAdvisor(question: string, dataContext: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are the Astra Analytics Strategy AI Advisor. 
    Context: ${dataContext}
    Question: ${question}
    Provide a professional, data-driven marketing recommendation.`,
  });
  return response.text || "I'm sorry, I couldn't generate a recommendation at this time.";
}
