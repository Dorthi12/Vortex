import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citations?: Array<{ title: string; link: string; snippet: string }>;
}

export interface AdvisoryReport {
  id: string;
  timestamp: string;
  farmProfile: {
    owner: string;
    location: string;
    size: number;
    crop: string;
  };
  soilReport: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    organicCarbon: number;
    ph: number;
    moisture: number;
    grade: string;
  };
  weatherContext: {
    temp: number;
    humidity: number;
    rainfall: number;
    forecast: string;
  };
  recommendations: {
    crop: string;
    yieldForecast: number;
    fertilizerPlan: { urea: number; dap: number; mop: number; organics: string };
    irrigationPlan: { cycle: string; risk: string };
    marketOutlook: { current: number; forecast: number; trend: string };
    subsidies: string[];
  };
}

interface AgricultureState {
  // Global totals (Hero/Advisories)
  totalFarmersServed: number;
  activeAdvisories: number;
  monitoringCoverageHa: number;
  subsidiesIdentified: number;
  diseaseAlertsGenerated: number;
  yieldPredictionsPerformed: number;

  // Overview dashboard map and charts
  activeMapState: string; // 'MH', 'KA', 'UP', etc.
  riskDistribution: { low: number; medium: number; high: number };

  // Page 1: Crop Recommendation Inputs & Outputs
  recN: number;
  recP: number;
  recK: number;
  recTemp: number;
  recHumidity: number;
  recPh: number;
  recRainfall: number;
  recommendationResult: {
    crop: string;
    confidence: number;
    alternatives: string[];
    profitability: 'High' | 'Medium' | 'Low';
    waterReq: 'Low' | 'Moderate' | 'High';
    growingSeason: string;
    explanation: string;
  } | null;

  // Page 2: Yield Prediction Inputs & Outputs
  yieldState: string;
  yieldDistrict: string;
  yieldCrop: string;
  yieldSeason: string;
  yieldArea: number;
  yieldRainfall: number;
  yieldPh: number;
  yieldTemp: number;
  yieldHumidity: number;
  yieldResult: {
    predictedYield: number; // in Tons
    confidence: number;
    historicalComparison: number; // % vs last year
    stateAverage: number;
    nationalAverage: number;
  } | null;

  // Page 3: Soil Health Intelligence
  soilN: number;
  soilP: number;
  soilK: number;
  soilOC: number;
  soilPh: number;
  soilMoisture: number;
  soilHealthScore: number;
  soilGrade: string;
  soilBreakdown: { n: string; p: string; k: string; oc: string };

  // Page 4: Fertilizer Advisor
  fertCrop: string;
  fertSoilType: string;
  fertN: number;
  fertP: number;
  fertK: number;
  fertResult: {
    urea: number;
    dap: number;
    mop: number;
    organicAlternatives: string[];
    costEstimate: number;
    envImpact: 'Low Leaching Risk' | 'Medium Retention' | 'High Runoff Potential';
  } | null;

  // Page 5: Irrigation Forecast
  irriCrop: string;
  irriStage: string;
  irriMoisture: number;
  irriWeather: string;
  irriResult: {
    waterRequired: number; // liters/sqm
    nextDate: string;
    waterStressRisk: 'None' | 'Mild' | 'Critical';
  } | null;

  // Page 6: Market Intelligence
  marketCrop: string;
  marketState: string;
  marketMandi: string;
  marketResult: {
    currentPrice: number; // INR/quintal
    forecast7d: number;
    forecast30d: number;
    trend: 'Bullish' | 'Bearish' | 'Stable';
  } | null;

  // Page 7-10: Image Detection Upload States
  diseaseFile: string | null; // Data URI for display
  diseaseResult: { diseaseName: string; confidence: number; severity: 'Mild' | 'Moderate' | 'Severe'; treatment: string } | null;
  pestFile: string | null;
  pestResult: { pestName: string; risk: 'Low' | 'Medium' | 'High'; action: string; treatment: string } | null;
  nutrientFile: string | null;
  nutrientResult: { deficiency: string; severity: 'Mild' | 'Severe'; recommendations: string } | null;
  stageFile: string | null;
  stageResult: { stage: string; daysRemaining: number; actions: string } | null;

  // Page 11: Subsidy Advisor
  subsidyState: string;
  subsidyCategory: string;
  subsidyLandholding: number;
  subsidyCrop: string;
  eligibleSchemes: Array<{
    name: string;
    amount: number;
    status: 'Eligible' | 'Highly Recommended' | 'Requires Verification';
    docs: string[];
  }>;

  // Page 12: Risk Engine
  riskWeather: number;
  riskDisease: number;
  riskPest: number;
  riskMarket: number;
  riskYield: number;

  // Page 13: Farmer Assistant (RAG Chat)
  assistantMessages: ChatMessage[];
  voiceRecording: boolean;

  // Page 14: Agriculture Advisory Agent
  advisoryReport: AdvisoryReport | null;

  // Page 16: Reports
  selectedReportFormat: 'PDF' | 'Excel';
  recentReports: Array<{ id: string; name: string; date: string; size: string; type: string }>;

  // Page 17: Weather Intelligence
  weatherTemp: number;
  weatherHumidity: number;
  weatherPrecip: number;
  weatherWindSpeed: number;
  weatherResult: {
    forecast: string;
    evaporationIndex: 'Low' | 'Medium' | 'High';
    frostRisk: 'None' | 'Low' | 'High';
    advice: string;
  } | null;

  // Page 18: Harvest Window Prediction
  harvestCrop: string;
  harvestPlantingDate: string;
  harvestHeatUnits: number;
  harvestSoilTemp: number;
  harvestResult: {
    estimatedStart: string;
    estimatedEnd: string;
    cropMaturityPct: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    advice: string;
  } | null;

  // Page 19: Farmer Credit Risk
  creditAnnualRevenue: number;
  creditLandholding: number;
  creditFicoScore: number;
  creditCurrentDebt: number;
  creditResult: {
    riskRating: 'Low Risk' | 'Medium Risk' | 'High Risk';
    maxLoanCap: number; // in INR
    subsidyEligible: boolean;
    interestRate: number; // %
    creditVerdict: string;
  } | null;

  // Page 20: Settings
  preferredLanguage: 'English' | 'Hindi' | 'Tamil' | 'Telugu' | 'Marathi' | 'Bengali';
  notificationPreferences: { sms: boolean; push: boolean; email: boolean };
  preferredRegion: string;
  accessibilityFontSize: 'Standard' | 'Large' | 'Extra Large';

  // Setters & Actions
  setField: <K extends keyof AgricultureState>(key: K, value: AgricultureState[K]) => void;
  runCropRecommendation: () => void;
  runYieldPrediction: () => void;
  runSoilHealthAnalysis: () => void;
  runFertilizerAdvisor: () => void;
  runIrrigationForecast: () => void;
  runMarketIntelligence: () => void;
  runSubsidyAdvisor: () => void;
  generateAdvisoryReport: (profile: { owner: string; size: number; crop: string }) => void;
  sendAssistantMessage: (text: string) => void;
  clearDetection: (module: 'disease' | 'pest' | 'nutrient' | 'stage') => void;
  simulateDetection: (module: 'disease' | 'pest' | 'nutrient' | 'stage', fileUri: string) => void;
  runWeatherIntelligence: () => void;
  runHarvestWindowPrediction: () => void;
  runFarmerCreditRisk: () => void;
}

export const useAgricultureStore = create<AgricultureState>((set, get) => ({
  // Global stats
  totalFarmersServed: 1424850,
  activeAdvisories: 1240,
  monitoringCoverageHa: 428950,
  subsidiesIdentified: 154800000,
  diseaseAlertsGenerated: 4820,
  yieldPredictionsPerformed: 28450,

  activeMapState: 'MH',
  riskDistribution: { low: 62, medium: 26, high: 12 },

  // Recommendation inputs
  recN: 80,
  recP: 45,
  recK: 40,
  recTemp: 28,
  recHumidity: 70,
  recPh: 6.5,
  recRainfall: 1200,
  recommendationResult: null,

  // Yield inputs
  yieldState: 'Maharashtra',
  yieldDistrict: 'Pune',
  yieldCrop: 'Sugarcane',
  yieldSeason: 'Kharif',
  yieldArea: 10,
  yieldRainfall: 1400,
  yieldPh: 6.8,
  yieldTemp: 29,
  yieldHumidity: 75,
  yieldResult: null,

  // Soil Health inputs
  soilN: 65,
  soilP: 42,
  soilK: 30,
  soilOC: 0.62,
  soilPh: 6.4,
  soilMoisture: 58,
  soilHealthScore: 78,
  soilGrade: 'B+',
  soilBreakdown: { n: 'Normal', p: 'Slight Deficit', k: 'Deficit', oc: 'Optimal' },

  // Fertilizer
  fertCrop: 'Rice (Paddy)',
  fertSoilType: 'Loamy',
  fertN: 25,
  fertP: 18,
  fertK: 12,
  fertResult: null,

  // Irrigation
  irriCrop: 'Sugarcane',
  irriStage: 'Vegetative Phase',
  irriMoisture: 42,
  irriWeather: 'Partly Cloudy, No Rain Forecast',
  irriResult: null,

  // Market
  marketCrop: 'Sugarcane',
  marketState: 'Maharashtra',
  marketMandi: 'Pune APMC',
  marketResult: null,

  // Image Upload Results
  diseaseFile: null,
  diseaseResult: null,
  pestFile: null,
  pestResult: null,
  nutrientFile: null,
  nutrientResult: null,
  stageFile: null,
  stageResult: null,

  // Subsidies
  subsidyState: 'Maharashtra',
  subsidyCategory: 'Small',
  subsidyLandholding: 1.8,
  subsidyCrop: 'Sugarcane',
  eligibleSchemes: [],

  // Risk Scores
  riskWeather: 28,
  riskDisease: 42,
  riskPest: 35,
  riskMarket: 22,
  riskYield: 18,

  // Farmer Assistant
  assistantMessages: [
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Namaskar! I am the Netravaah Agriculture Intelligence RAG Assistant. Ask me anything about crop varieties, soil enhancements, mandi prices, or government schemes.',
      timestamp: '20:30',
      citations: []
    }
  ],
  voiceRecording: false,

  // Advisory Agent
  advisoryReport: null,

  // Reports
  selectedReportFormat: 'PDF',
  recentReports: [
    { id: 'rep-01', name: 'Maharashtra Kharif Harvest Outlook', date: '2026-06-10', size: '2.8 MB', type: 'Seasonal' },
    { id: 'rep-02', name: 'Pune District Soil Telemetry Index', date: '2026-06-08', size: '1.4 MB', type: 'District' },
    { id: 'rep-03', name: 'Western Zone Mandi Price Forecasts', date: '2026-06-05', size: '920 KB', type: 'Market' },
    { id: 'rep-04', name: 'Individual Farm Advisory - Block 4A', date: '2026-06-01', size: '640 KB', type: 'Farmer' }
  ],

  // Weather Intelligence
  weatherTemp: 32,
  weatherHumidity: 65,
  weatherPrecip: 15,
  weatherWindSpeed: 18,
  weatherResult: null,

  // Harvest Window Prediction
  harvestCrop: 'Sugarcane',
  harvestPlantingDate: '2025-10-15',
  harvestHeatUnits: 1420,
  harvestSoilTemp: 24,
  harvestResult: null,

  // Farmer Credit Risk
  creditAnnualRevenue: 450000,
  creditLandholding: 2.2,
  creditFicoScore: 720,
  creditCurrentDebt: 80000,
  creditResult: null,

  // Settings
  preferredLanguage: 'English',
  notificationPreferences: { sms: true, push: true, email: false },
  preferredRegion: 'Maharashtra - Western Zone',
  accessibilityFontSize: 'Standard',

  setField: (key, value) => set({ [key]: value } as any),

  runCropRecommendation: () => {
    const { recN, recP, recK, recTemp, recHumidity, recPh, recRainfall } = get();
    let crop = 'Sugarcane';
    let confidence = 88;
    let alternatives = ['Rice (Paddy)', 'Maize', 'Soybean', 'Wheat', 'Cotton'];
    let profitability: 'High' | 'Medium' | 'Low' = 'High';
    let waterReq: 'Low' | 'Moderate' | 'High' = 'High';
    let growingSeason = 'Perennial (10-12 months)';
    let explanation = `Based on a soil profile with nitrogen (${recN} mg/kg) and potassium (${recK} mg/kg) under a pH level of ${recPh}, the model matches Sugarcane at 88% suitability. High moisture retention is expected.`;

    if (recPh < 5.8) {
      crop = 'Rice (Paddy)';
      confidence = 92;
      waterReq = 'High';
      growingSeason = 'Kharif (Monsoon)';
      profitability = 'Medium';
      explanation = `Acidic soil pH (${recPh}) and heavy moisture retention highly favor Rice cultivation. Suggest applying lime treatment to regulate acidity before sowing.`;
    } else if (recRainfall < 600) {
      crop = 'Cotton';
      confidence = 85;
      waterReq = 'Low';
      growingSeason = 'Kharif';
      profitability = 'High';
      explanation = `Semi-arid climatic profile with rainfall under 600mm is ideal for Cotton. Deep loamy/clay soils will optimize root growth without waterlogging.`;
    } else if (recN < 40) {
      crop = 'Groundnuts';
      confidence = 89;
      waterReq = 'Moderate';
      growingSeason = 'Kharif';
      profitability = 'Medium';
      explanation = `Nitrogen-deficient soil (${recN} mg/kg) is best supplemented with leguminous groundnuts which fix atmospheric nitrogen organically.`;
    }

    set({
      recommendationResult: {
        crop,
        confidence,
        alternatives,
        profitability,
        waterReq,
        growingSeason,
        explanation
      }
    });
  },

  runYieldPrediction: () => {
    const { yieldCrop, yieldArea, yieldRainfall, yieldPh, yieldTemp } = get();
    let baseMultiplier = 3.5;
    if (yieldCrop === 'Sugarcane') baseMultiplier = 75.0;
    else if (yieldCrop === 'Rice (Paddy)') baseMultiplier = 4.2;
    else if (yieldCrop === 'Wheat') baseMultiplier = 3.8;
    else if (yieldCrop === 'Cotton') baseMultiplier = 2.4;

    const phMult = yieldPh >= 6.0 && yieldPh <= 7.2 ? 1.05 : 0.85;
    const rainMult = yieldRainfall >= 1000 && yieldRainfall <= 1600 ? 1.1 : 0.9;
    const tempMult = yieldTemp >= 25 && yieldTemp <= 32 ? 1.05 : 0.9;

    const finalYield = parseFloat((yieldArea * baseMultiplier * phMult * rainMult * tempMult).toFixed(1));
    const confidence = Math.round(80 + Math.random() * 15);
    const histComp = Math.round((phMult * rainMult * tempMult - 1) * 100);

    set({
      yieldResult: {
        predictedYield: finalYield,
        confidence,
        historicalComparison: histComp,
        stateAverage: parseFloat((baseMultiplier * 1.02).toFixed(1)),
        nationalAverage: parseFloat((baseMultiplier * 0.98).toFixed(1))
      }
    });
  },

  runSoilHealthAnalysis: () => {
    const { soilN, soilP, soilK, soilOC, soilPh, soilMoisture } = get();
    const nScore = Math.max(0, 100 - Math.abs(soilN - 80) * 1.2);
    const pScore = Math.max(0, 100 - Math.abs(soilP - 45) * 1.5);
    const kScore = Math.max(0, 100 - Math.abs(soilK - 40) * 1.5);
    const ocScore = soilOC * 100;
    const phScore = Math.max(0, 100 - Math.abs(soilPh - 6.5) * 40);
    const moistScore = Math.max(0, 100 - Math.abs(soilMoisture - 65) * 1.5);

    const rawScore = Math.round((nScore + pScore + kScore + ocScore + phScore + moistScore) / 6);
    const finalScore = Math.min(100, Math.max(20, rawScore));

    let grade = 'C';
    if (finalScore >= 85) grade = 'A+ (Prime)';
    else if (finalScore >= 75) grade = 'B+ (Healthy)';
    else if (finalScore >= 60) grade = 'C (Moderate)';
    else grade = 'D (Deficient)';

    const breakdown = {
      n: soilN > 85 ? 'Surplus' : soilN < 55 ? 'Deficient' : 'Optimal',
      p: soilP > 50 ? 'Surplus' : soilP < 35 ? 'Deficient' : 'Optimal',
      k: soilK > 45 ? 'Surplus' : soilK < 25 ? 'Deficient' : 'Optimal',
      oc: soilOC > 0.7 ? 'High' : soilOC < 0.5 ? 'Deficient' : 'Optimal'
    };

    set({
      soilHealthScore: finalScore,
      soilGrade: grade,
      soilBreakdown: breakdown
    });
  },

  runFertilizerAdvisor: () => {
    const { fertCrop, fertN, fertP, fertK } = get();
    const dap = Math.round(fertP / 0.46);
    const nFromDap = dap * 0.18;
    const urea = Math.max(0, Math.round((fertN - nFromDap) / 0.46));
    const mop = Math.round(fertK / 0.60);

    const cost = Math.round(urea * 6.5 + dap * 27.5 + mop * 18.5);
    let envImpact: 'Low Leaching Risk' | 'Medium Retention' | 'High Runoff Potential' = 'Low Leaching Risk';
    if (urea > 150) envImpact = 'High Runoff Potential';
    else if (urea > 80) envImpact = 'Medium Retention';

    set({
      fertResult: {
        urea,
        dap,
        mop,
        organicAlternatives: ['Vermicompost (5 tons/ha)', 'Neem cake coating', 'Bio-fertilizer (Azotobacter)'],
        costEstimate: cost,
        envImpact
      }
    });
  },

  runIrrigationForecast: () => {
    const { irriCrop, irriStage, irriMoisture } = get();
    let baseReq = 350;
    if (irriStage.includes('Flowering') || irriStage.includes('Initiation')) baseReq = 500;
    else if (irriStage.includes('Harvest') || irriStage.includes('Maturity')) baseReq = 100;

    const moistureReduction = (irriMoisture / 100) * baseReq;
    const finalReq = Math.max(0, Math.round(baseReq - moistureReduction));

    let daysToNext = 3;
    if (irriMoisture > 70) daysToNext = 7;
    else if (irriMoisture < 35) daysToNext = 1;

    const today = new Date();
    today.setDate(today.getDate() + daysToNext);
    const dateString = today.toISOString().split('T')[0];

    let risk: 'None' | 'Mild' | 'Critical' = 'None';
    if (irriMoisture < 30) risk = 'Critical';
    else if (irriMoisture < 45) risk = 'Mild';

    set({
      irriResult: {
        waterRequired: finalReq,
        nextDate: dateString,
        waterStressRisk: risk
      }
    });
  },

  runMarketIntelligence: () => {
    const { marketCrop } = get();
    let currentPrice = 3200;
    let trend: 'Bullish' | 'Bearish' | 'Stable' = 'Bullish';

    if (marketCrop === 'Sugarcane') {
      currentPrice = 5400;
      trend = 'Bullish';
    } else if (marketCrop === 'Rice (Paddy)') {
      currentPrice = 2180;
      trend = 'Stable';
    } else if (marketCrop === 'Wheat') {
      currentPrice = 2275;
      trend = 'Bullish';
    } else if (marketCrop === 'Cotton') {
      currentPrice = 7200;
      trend = 'Bearish';
    } else if (marketCrop === 'Groundnuts') {
      currentPrice = 6400;
      trend = 'Bullish';
    }

    const forecast7d = Math.round(currentPrice * (trend === 'Bullish' ? 1.02 : trend === 'Bearish' ? 0.98 : 1.0));
    const forecast30d = Math.round(currentPrice * (trend === 'Bullish' ? 1.06 : trend === 'Bearish' ? 0.94 : 1.01));

    set({
      marketResult: {
        currentPrice,
        forecast7d,
        forecast30d,
        trend
      }
    });
  },

  runSubsidyAdvisor: () => {
    const { subsidyState, subsidyCategory, subsidyLandholding, subsidyCrop } = get();
    const schemes: Array<{ name: string; amount: number; status: 'Eligible' | 'Highly Recommended' | 'Requires Verification'; docs: string[] }> = [];

    if (subsidyLandholding < 2) {
      schemes.push({
        name: 'PM Kisan Samman Nidhi (Marginal Farmer Benefit)',
        amount: 6000,
        status: 'Highly Recommended',
        docs: ['Aadhaar Card', 'Land Registry Copy', 'Bank Passbook']
      });
    }

    if (subsidyCrop === 'Sugarcane' || subsidyCrop === 'Rice (Paddy)') {
      schemes.push({
        name: `${subsidyState} Micro-Irrigation Drip Subsidy`,
        amount: 45000,
        status: 'Eligible',
        docs: ['Water Source Approval', 'Irrigation Invoice', 'Land Registry Map']
      });
    }

    schemes.push({
      name: 'Sub-Mission on Agricultural Mechanization (SMAM)',
      amount: 15000,
      status: subsidyLandholding < 5 ? 'Highly Recommended' : 'Requires Verification',
      docs: ['Income Certificate', 'Category Certificate (SC/ST/Women if applicable)', 'Tractor Rental Invoice']
    });

    set({ eligibleSchemes: schemes });
  },

  generateAdvisoryReport: (profile) => {
    const { soilN, soilP, soilK, soilOC, soilPh, soilMoisture, yieldResult, fertResult, irriResult, marketResult } = get();
    if (!yieldResult) get().runYieldPrediction();
    if (!fertResult) get().runFertilizerAdvisor();
    if (!irriResult) get().runIrrigationForecast();
    if (!marketResult) get().runMarketIntelligence();

    const currentAdvisory: AdvisoryReport = {
      id: `ADV-${Math.round(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      farmProfile: {
        owner: profile.owner || 'Registered Gov Farmer',
        location: get().yieldDistrict + ', ' + get().yieldState,
        size: profile.size || 2.5,
        crop: profile.crop || 'Sugarcane'
      },
      soilReport: {
        nitrogen: soilN,
        phosphorus: soilP,
        potassium: soilK,
        organicCarbon: soilOC,
        ph: soilPh,
        moisture: soilMoisture,
        grade: get().soilGrade
      },
      weatherContext: {
        temp: get().yieldTemp,
        humidity: get().yieldHumidity,
        rainfall: get().yieldRainfall,
        forecast: 'Moderate showers in next 72 hours, 14mm precipitation expected'
      },
      recommendations: {
        crop: profile.crop || 'Sugarcane',
        yieldForecast: get().yieldResult?.predictedYield || 72.4,
        fertilizerPlan: {
          urea: get().fertResult?.urea || 45,
          dap: get().fertResult?.dap || 35,
          mop: get().fertResult?.mop || 20,
          organics: 'Compost 5 T/Ha, Bio-azotobacter inoculations'
        },
        irrigationPlan: {
          cycle: 'Every 5 days. Next discharge required by: ' + (get().irriResult?.nextDate || '2026-06-16'),
          risk: get().irriResult?.waterStressRisk || 'Low'
        },
        marketOutlook: {
          current: get().marketResult?.currentPrice || 5400,
          forecast: get().marketResult?.forecast7d || 5508,
          trend: get().marketResult?.trend || 'Bullish'
        },
        subsidies: ['PM-KISAN Crop Incentive Scheme', 'State Micro-Irrigation Grant Plan']
      }
    };

    set({ advisoryReport: currentAdvisory });
  },

  sendAssistantMessage: (text) => {
    const { assistantMessages } = get();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    };

    set({ assistantMessages: [...assistantMessages, newMsg] });

    setTimeout(() => {
      let replyText = 'I have analyzed your query based on current national agricultural policies and soil guidelines.';
      let citations: ChatMessage['citations'] = [];

      const lowercase = text.toLowerCase();
      if (lowercase.includes('crop') || lowercase.includes('land')) {
        replyText = 'Based on agricultural extension directives, the optimal crop selection for Maharashtra clay-loam soil during Kharif is Sugarcane or Cotton. A soil pH value of 6.0 to 7.2 guarantees maximum mineral retention.';
        citations = [
          { title: 'MH Extension Sowing Directives 2026', link: 'file:///docs/mh_sowing_2026.pdf', snippet: 'Clayey-loam soils in Western Maharashtra require deep-root crops to prevent saturation...' },
          { title: 'NITI Aayog Crop Rotation Guidelines', link: 'file:///docs/niti_crop_rotation.pdf', snippet: 'Rotating legumes with high-nitrogen feeders maintains soil mineral indices...' }
        ];
      } else if (lowercase.includes('subsidy') || lowercase.includes('scheme')) {
        replyText = 'Under current welfare initiatives, small/marginal landholders (under 2 Hectares) qualify for a 60% credit on drip irrigation systems under the PM Krishi Sinchayee Scheme. Solar pump subsidy offers 75% subvention under PM KUSUM.';
        citations = [
          { title: 'PM Krishi Sinchayee Yojana Guidelines', link: 'file:///docs/pmksy_guidelines.pdf', snippet: 'Farmers operating small holdings qualify for up to 60% direct bank credit...' },
          { title: 'PM KUSUM Solar Pump Scheme Circular', link: 'file:///docs/pm_kusum_solar.pdf', snippet: 'Subvention covers 75% of equipment costs in groundwater-safe zones...' }
        ];
      } else if (lowercase.includes('yield') || lowercase.includes('decreasing')) {
        replyText = 'Decreasing yield trends are typically correlated with Organic Carbon depletion. Standard organic carbon should measure above 0.6%. Suggest broadcasting green manure (Sesbania) or vermicompost to bolster carbon levels.';
        citations = [
          { title: 'National Organic Carbon Survey Report', link: 'file:///docs/organic_carbon_2025.pdf', snippet: 'Target organic carbon indexes of 0.65% are necessary for stable root growth...' }
        ];
      } else if (lowercase.includes('fertilizer') || lowercase.includes('chemical')) {
        replyText = 'To correct N-P-K mineral deficits, you should apply Urea, DAP, and MOP in split schedules. DAP should be placed entirely during sowing (basal dose), while Urea should be split (Day 0, Day 30, and Day 60) to avoid nitrogen leaching.';
        citations = [
          { title: 'ICAR NPK Fertilizer Application Manual', link: 'file:///docs/icar_npk_dosage.pdf', snippet: 'Broadcasting urea in single doses leads to volatilization and high leaching losses...' }
        ];
      }

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        citations
      };

      set({ assistantMessages: [...get().assistantMessages, assistantMsg] });
    }, 1000);
  },

  clearDetection: (module) => {
    if (module === 'disease') set({ diseaseFile: null, diseaseResult: null });
    if (module === 'pest') set({ pestFile: null, pestResult: null });
    if (module === 'nutrient') set({ nutrientFile: null, nutrientResult: null });
    if (module === 'stage') set({ stageFile: null, stageResult: null });
  },

  simulateDetection: (module, fileUri) => {
    if (module === 'disease') {
      set({
        diseaseFile: fileUri,
        diseaseResult: {
          diseaseName: 'Red Rot of Sugarcane (Colletotrichum falcatum)',
          confidence: 94,
          severity: 'Moderate',
          treatment: 'Instantly isolate infected stalks. Spray Carbendazim (0.1%) solution at 15-day intervals. Ensure proper sub-surface drainage to reduce humidity pooling.'
        }
      });
    } else if (module === 'pest') {
      set({
        pestFile: fileUri,
        pestResult: {
          pestName: 'Sugarcane Pyrilla (Pyrilla perpusilla)',
          risk: 'High',
          action: 'Biological agent release or chemical pesticide deployment.',
          treatment: 'Release Epiricania melanoleuca (parasitoid insect) at 4000 cocoons/ha. For chemical suppression, spray Malathion 50 EC at 1.5 liters/ha.'
        }
      });
    } else if (module === 'nutrient') {
      set({
        nutrientFile: fileUri,
        nutrientResult: {
          deficiency: 'Iron (Fe) Deficiency chlorosis',
          severity: 'Severe',
          recommendations: 'Foliar spray of 1% Ferrous Sulfate (FeSO4) combined with citric acid (0.1%) to facilitate cellular uptake. Apply compost to lower alkaline pH levels.'
        }
      });
    } else if (module === 'stage') {
      set({
        stageFile: fileUri,
        stageResult: {
          stage: 'Grand Growth / Elongation Phase',
          daysRemaining: 120,
          actions: 'Highest water demand phase. Ensure drip irrigation runs for 2.5 hours every alternate day. Broadcast final top-dressing of Urea.'
        }
      });
    }
  },

  runWeatherIntelligence: () => {
    const { weatherTemp, weatherHumidity, weatherPrecip, weatherWindSpeed } = get();
    // Compute weather stats
    let forecast = 'Stable Agricultural Window';
    let evap: 'Low' | 'Medium' | 'High' = 'Medium';
    let frost: 'None' | 'Low' | 'High' = 'None';
    let advice = 'Standard water cycle scheduling is recommended. Wind speeds are optimal for spraying.';

    if (weatherTemp > 38) {
      forecast = 'Extreme Heatwave Alert';
      evap = 'High';
      advice = 'High evapotranspiration risk. Increase drip irrigation volume by 20% and avoid spraying in midday.';
    } else if (weatherTemp < 10) {
      forecast = 'Frost Hazard Window';
      frost = 'High';
      advice = 'Ground frost threat. Schedule early morning micro-irrigation to warm up topsoil boundary layers.';
    } else if (weatherPrecip > 60) {
      forecast = 'Heavy Precipitation Cycle';
      evap = 'Low';
      advice = 'Disable all automatic sprinklers. Run storm run-off channels to prevent field waterlogging.';
    }

    set({
      weatherResult: {
        forecast,
        evaporationIndex: evap,
        frostRisk: frost,
        advice
      }
    });
  },

  runHarvestWindowPrediction: () => {
    const { harvestCrop, harvestHeatUnits, harvestSoilTemp } = get();
    let maturity = 65; // %
    let startDays = 45;
    let endDays = 60;
    let risk: 'Low' | 'Medium' | 'High' = 'Low';
    let advice = 'Crop elongation looks stable. Sugarcane sugar accumulating rates match baseline indices.';

    if (harvestHeatUnits > 1800) {
      maturity = 98;
      startDays = 2;
      endDays = 12;
      advice = 'Peak sucrose maturity reached. Plan harvesting schedule immediately to avoid crop weight shrinkage.';
    } else if (harvestSoilTemp > 28) {
      risk = 'Medium';
      advice = 'High soil temperatures accelerating maturity curves. Run water audits to prevent field stress.';
    }

    const today = new Date();
    const startD = new Date(today);
    startD.setDate(startD.getDate() + startDays);
    const endD = new Date(today);
    endD.setDate(endD.getDate() + endDays);

    set({
      harvestResult: {
        estimatedStart: startD.toISOString().split('T')[0],
        estimatedEnd: endD.toISOString().split('T')[0],
        cropMaturityPct: maturity,
        riskLevel: risk,
        advice
      }
    });
  },

  runFarmerCreditRisk: () => {
    const { creditAnnualRevenue, creditLandholding, creditFicoScore, creditCurrentDebt } = get();
    // Credit risk formula
    const debtRatio = creditCurrentDebt / Math.max(1, creditAnnualRevenue);
    let rating: 'Low Risk' | 'Medium Risk' | 'High Risk' = 'Low Risk';
    let maxLoan = 250000;
    let rate = 7.0; // %
    let verdict = 'Highly recommended for interest-subsidized crop loans.';

    if (creditFicoScore < 600 || debtRatio > 0.6) {
      rating = 'High Risk';
      maxLoan = 50000;
      rate = 11.5;
      verdict = 'Elevated credit risk detected. Collateral security required for further agricultural underwriting.';
    } else if (creditFicoScore < 700 || debtRatio > 0.35) {
      rating = 'Medium Risk';
      maxLoan = 120000;
      rate = 8.5;
      verdict = 'Eligible for micro-finance credits. Limit loan thresholds to manage amortization loads.';
    }

    // Larger landholders get higher loan cap
    maxLoan = Math.round(maxLoan * (creditLandholding / 1.5));

    set({
      creditResult: {
        riskRating: rating,
        maxLoanCap: maxLoan,
        subsidyEligible: creditFicoScore >= 680 && creditLandholding <= 5,
        interestRate: rate,
        creditVerdict: verdict
      }
    });
  }
}));
