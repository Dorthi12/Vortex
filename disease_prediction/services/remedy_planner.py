"""
services/remedy_planner.py
────────────────────────────────────────────────────────────────
Model 8 — Remedy Recommendation Engine (Gemini AI)
Model 9 — Government Execution Engine

Input:  district, disease, risk_level, environmental_factors, hospital_capacity
Output: citizen_advice, government_actions, execution_plan
"""
from __future__ import annotations

import json
import logging
from typing import Dict, List, Optional

import requests

logger = logging.getLogger(__name__)

GEMINI_API_KEY = "AIzaSyDDgHtjNZYdbV0Ojtkf7jfVYSr8GsgfA2Q"
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/"
    "models/gemini-1.5-flash:generateContent"
)

# ── FALLBACK REMEDY DATABASE (rule-based) ─────────────────────
REMEDY_DB: Dict[str, Dict] = {
    "Malaria": {
        "icd_code": "B50",
        "first_line_treatment": "Artemisinin-based combination therapy (ACT)",
        "citizen_advice": [
            "Take full course of anti-malarial medication — do not stop early",
            "Use insecticide-treated bed nets (ITNs) every night",
            "Apply DEET-based repellent on exposed skin at dusk and dawn",
            "Drain all stagnant water around your home (pots, tyres, rooftops)",
            "Wear full-sleeve clothing from sunset to sunrise",
            "Seek immediate care if fever returns after initial treatment",
        ],
        "government_immediate": [
            "Deploy rapid diagnostic test (RDT) kits to all primary health centres",
            "Mobilise ASHA workers for house-to-house fever survey",
            "Activate indoor residual spraying (IRS) in affected wards",
            "Stock chloroquine, primaquine and ACT at district hospitals",
            "Issue health advisory via SMS and local broadcast",
        ],
        "government_48h": [
            "Conduct larval source management in 2km radius of hotspot",
            "Deploy fogging teams to all identified cluster areas",
            "Set up fever camps at community level",
            "Report to State Malaria Officer via NVBDCP portal",
            "Coordinate with entomology team for vector surveillance",
        ],
        "weekly_review": [
            "Weekly epidemiological report to State Health Directorate",
            "Monitor treatment compliance in identified patients",
            "Update vector density index from surveillance data",
            "Review stock levels at all health facilities",
        ],
    },
    "Dengue": {
        "icd_code": "A90",
        "first_line_treatment": "Supportive care — paracetamol, IV fluids, platelet monitoring",
        "citizen_advice": [
            "Use ONLY paracetamol for fever — avoid aspirin and ibuprofen",
            "Monitor platelet count every 24 hours if admitted",
            "Drink ORS, coconut water or juice frequently to stay hydrated",
            "Destroy Aedes breeding sites: drain coolers, flower pots, bird baths",
            "Use mosquito nets and repellents even during daytime",
            "Go to hospital immediately if you see bleeding, severe abdominal pain, or vomiting",
        ],
        "government_immediate": [
            "Deploy emergency fogging teams to all affected wards",
            "Activate dengue rapid response team at district level",
            "Increase platelet storage at district blood bank",
            "Open dedicated dengue OPD at district hospital",
            "Issue DO's and DON'Ts advisory via all channels",
        ],
        "government_48h": [
            "Map and drain all water bodies within 1km of hotspot",
            "Inspect schools, construction sites and commercial premises",
            "Conduct community-level source reduction drives",
            "Coordinate with municipal body for drain cleaning",
            "Report to Integrated Disease Surveillance Programme (IDSP)",
        ],
        "weekly_review": [
            "IDSP weekly report with epidemiological curve",
            "Vector index (Breteau/House index) from entomology team",
            "Platelet demand forecasting for blood bank",
            "School reopening risk assessment",
        ],
    },
    "Typhoid": {
        "icd_code": "A01",
        "first_line_treatment": "Fluoroquinolones (ciprofloxacin) or azithromycin",
        "citizen_advice": [
            "Complete the full antibiotic course (10–14 days) without interruption",
            "Drink only boiled or bottled water",
            "Avoid street food and raw vegetables during outbreak period",
            "Wash hands thoroughly with soap before eating and after toilet",
            "Get a Widal test or blood culture for confirmation",
            "Vaccinate all household members (Vi polysaccharide vaccine)",
        ],
        "government_immediate": [
            "Test and hyper-chlorinate all water supply lines in affected area",
            "Deploy water quality testing teams to identify contamination source",
            "Close implicated food stalls/restaurants",
            "Stock ciprofloxacin and azithromycin at PHCs",
            "Issue boil-water advisory to affected population",
        ],
        "government_48h": [
            "Sewage and sanitation inspection of affected wards",
            "Food safety inspection of all commercial establishments",
            "Typhoid vaccination camp for 5–40 age group",
            "Contact tracing of school-going children in affected area",
            "FSSAI notice to restaurants with suspected contamination",
        ],
        "weekly_review": [
            "Water quality test results follow-up",
            "Case confirmation from blood culture lab",
            "Antibiotic resistance surveillance",
            "Sanitation infrastructure repair status",
        ],
    },
    "Tuberculosis": {
        "icd_code": "A15",
        "first_line_treatment": "DOTS: 2HRZE/4HR (6 months)",
        "citizen_advice": [
            "Follow DOTS therapy daily — 6 months without any break",
            "Cover mouth with tissue or elbow when coughing or sneezing",
            "Ensure cross-ventilation and sunlight in home",
            "All household contacts must be screened at nearest DOTS centre",
            "Eat protein-rich nutritious diet to boost immunity",
            "Register under Nikshay scheme for nutritional support",
        ],
        "government_immediate": [
            "Activate RNTCP protocol at district level",
            "Deploy mobile X-ray van to affected area",
            "Contact-tracing of all known TB patients in the cluster",
            "Stock rifampicin/isoniazid at all DOTS centres",
            "Link all new patients to Nikshay nutritional support",
        ],
        "government_48h": [
            "Sputum smear microscopy camps in affected wards",
            "Screen all household contacts of confirmed patients",
            "Coordinate with schools for student TB screening",
            "Alert State TB Officer via RNTCP reporting system",
            "Assess need for drug-resistant TB testing (CBNAAT)",
        ],
        "weekly_review": [
            "Treatment adherence monitoring via Nikshay",
            "Sputum conversion rate at 2 months",
            "Contact investigation completion rate",
            "Drug stock adequacy review",
        ],
    },
    "Pneumonia": {
        "icd_code": "J18",
        "first_line_treatment": "Amoxicillin or azithromycin",
        "citizen_advice": [
            "Seek immediate medical care if breathing difficulty or SpO2 < 94%",
            "Complete the full antibiotic course even if feeling better",
            "Use a pulse oximeter to monitor oxygen levels at home",
            "Stay warm and avoid exposure to cold air",
            "Annual flu vaccine and pneumococcal vaccine for elderly",
            "Keep children and elderly away from crowded places during winter",
        ],
        "government_immediate": [
            "Activate cold weather health advisory",
            "Increase oxygen cylinder stock at all health facilities",
            "Open additional respiratory OPD slots",
            "Mobilise ambulances with oxygen support",
            "Priority treatment for elderly (>60), children (<5) and immunocompromised",
        ],
        "government_48h": [
            "Community health workers to identify high-risk households",
            "Blanket distribution at night shelter homes",
            "Pneumococcal vaccination camp for vulnerable groups",
            "ICU bed readiness assessment at district hospital",
            "Telemedicine helpline for respiratory complaints",
        ],
        "weekly_review": [
            "Hospital admission and discharge rates",
            "Oxygen consumption tracking",
            "Pneumonia case-fatality rate monitoring",
            "Weather forecast-based surge planning",
        ],
    },
}

DEFAULT_REMEDY = {
    "citizen_advice": [
        "Seek medical care at the nearest PHC/CHC",
        "Stay hydrated and rest",
        "Do not self-medicate without medical advice",
        "Maintain hygiene — wash hands regularly",
        "Isolate if contagious disease is suspected",
    ],
    "government_immediate": [
        "Conduct rapid needs assessment",
        "Deploy health workers to affected area",
        "Activate disease surveillance at district level",
    ],
    "government_48h": [
        "Epidemiological investigation",
        "Laboratory confirmation of diagnosis",
        "Issue public health advisory",
    ],
    "weekly_review": ["Report to state health department", "Monitor case trends"],
}


class RemedyPlanner:
    """
    Remedy recommendation engine.
    Primary: Gemini AI for context-aware, location-specific advice.
    Fallback: Rule-based database when API unavailable.
    """

    def __init__(self, gemini_key: str = GEMINI_API_KEY):
        self.gemini_key = gemini_key

    # ── GEMINI REMEDY GENERATION ──────────────────────────────
    def generate_with_gemini(
        self,
        district: str,
        disease: str,
        risk_level: str,
        weather_context: str,
        hospital_status: str,
        cases: int = 0,
    ) -> Optional[Dict]:
        """Call Gemini API for contextual remedies and action plan."""
        prompt = f"""You are a Senior Public Health Officer for Uttar Pradesh, India.
Generate a precise disease control plan for the following situation:

District: {district}
Disease: {disease}
Risk Level: {risk_level}
Active Cases: {cases}
Weather: {weather_context}
Hospital Status: {hospital_status}

Return ONLY valid JSON with this exact structure (no markdown, no preamble):
{{
  "citizen_advice": ["5 specific, actionable pieces of advice for citizens"],
  "immediate_actions_0_24h": ["3-5 immediate government actions"],
  "actions_24_48h": ["3-5 actions within 48 hours"],
  "weekly_review_points": ["3 weekly monitoring points"],
  "resource_requirements": {{
    "fogging_teams": <integer>,
    "medical_camps": <integer>,
    "awareness_campaigns": <integer>,
    "extra_beds_needed": <integer>
  }},
  "alert_sms": "One sentence public SMS alert under 160 characters",
  "icd_code": "ICD-10 code for {disease}",
  "first_line_treatment": "First line treatment protocol"
}}

Be specific to {disease} in {district}. Account for the weather conditions."""

        try:
            response = requests.post(
                f"{GEMINI_URL}?key={self.gemini_key}",
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            clean = text.replace("```json", "").replace("```", "").strip()
            return json.loads(clean)
        except Exception as exc:
            logger.warning("Gemini API failed: %s — using fallback", exc)
            return None

    # ── GOVERNMENT EXECUTION PLAN ─────────────────────────────
    def build_execution_plan(
        self,
        district: str,
        disease: str,
        risk_level: str,
        risk_score: float,
        remedy_data: Dict,
        hospital_load: Dict,
        forecast: Dict,
    ) -> Dict:
        """
        Model 9 — Convert remedy recommendations into
        a structured government execution plan.
        """
        from datetime import datetime
        now = datetime.utcnow()

        # Escalation matrix
        if risk_level == "CRITICAL":
            escalation = "District Collector + DM + CMO — IMMEDIATE"
            media_advisory = "Press conference within 6 hours"
        elif risk_level == "HIGH":
            escalation = "CMO + Additional CMO — within 4 hours"
            media_advisory = "Press release within 12 hours"
        elif risk_level == "MEDIUM":
            escalation = "District Health Officer — within 24 hours"
            media_advisory = "Social media advisory"
        else:
            escalation = "Block Medical Officer — routine"
            media_advisory = "IEC material distribution"

        return {
            "execution_plan_id": f"EP-{district[:3].upper()}-{now.strftime('%Y%m%d%H%M')}",
            "district": district,
            "disease": disease,
            "risk_level": risk_level,
            "risk_score": risk_score,
            "activated_at": now.isoformat(),
            "incident_commander": f"Chief Medical Officer, {district}",
            "escalation_authority": escalation,
            "media_advisory": media_advisory,

            "phase_1_immediate_0_24h": remedy_data.get(
                "immediate_actions_0_24h",
                remedy_data.get("government_immediate", DEFAULT_REMEDY["government_immediate"]),
            ),
            "phase_2_short_term_24_48h": remedy_data.get(
                "actions_24_48h",
                remedy_data.get("government_48h", DEFAULT_REMEDY["government_48h"]),
            ),
            "phase_3_weekly_review": remedy_data.get(
                "weekly_review_points",
                remedy_data.get("weekly_review", DEFAULT_REMEDY["weekly_review"]),
            ),

            "resource_requirements": remedy_data.get("resource_requirements", {
                "fogging_teams": max(5, int(forecast.get("projected_cases_next_week", 20) / 5)),
                "medical_camps": max(2, int(forecast.get("risk_score", 40) / 20)),
                "awareness_campaigns": 5,
                "extra_beds_needed": hospital_load.get("beds_shortage", 0),
            }),

            "hospital_instructions": {
                "status": hospital_load.get("overload_status", "NORMAL"),
                "action": hospital_load.get("recommendation", "Monitor"),
                "beds_to_arrange": hospital_load.get("beds_shortage", 0),
                "doctors_to_deploy": hospital_load.get("doctor_shortage", 0),
            },

            "public_alert_sms": remedy_data.get(
                "alert_sms",
                f"HEALTH ALERT {district}: {disease} risk is {risk_level}. "
                "Visit nearest PHC if symptomatic. Helpline: 104",
            ),

            "reporting_requirements": [
                "Daily case count to IDSP by 5pm",
                f"Weekly epidemiological report to State Health Directorate",
                "Immediate death notification to CMO",
                "Outbreak closure report when 2x incubation period passes without new cases",
            ],
        }

    # ── MAIN ENTRY POINT ──────────────────────────────────────
    def plan(
        self,
        district: str,
        disease: str,
        risk_level: str,
        risk_score: float,
        weather: Dict,
        hospital_load: Dict,
        forecast: Dict,
        cases: int = 0,
    ) -> Dict:
        """End-to-end remedy + execution plan generation."""
        temp = weather.get("temperature_mean", 28.0)
        hum = weather.get("humidity_mean", 65.0)
        rain = weather.get("precipitation_total", 0.0)
        weather_ctx = f"Temp: {temp:.1f}°C, Humidity: {hum:.0f}%, Rain: {rain:.1f}mm"
        hosp_ctx = (
            f"{hospital_load.get('overload_status', 'NORMAL')} "
            f"({hospital_load.get('load_ratio', 0)}% capacity used)"
        )

        # Try Gemini first
        remedy_data = self.generate_with_gemini(
            district, disease, risk_level, weather_ctx, hosp_ctx, cases
        )

        # Merge with rule-based fallback
        fallback = REMEDY_DB.get(disease, DEFAULT_REMEDY)
        if not remedy_data:
            remedy_data = {
                "citizen_advice": fallback.get("citizen_advice", []),
                "immediate_actions_0_24h": fallback.get("government_immediate", []),
                "actions_24_48h": fallback.get("government_48h", []),
                "weekly_review_points": fallback.get("weekly_review", []),
                "icd_code": fallback.get("icd_code", ""),
                "first_line_treatment": fallback.get("first_line_treatment", ""),
            }
        else:
            # Fill missing fields from rule-base
            remedy_data.setdefault("citizen_advice", fallback.get("citizen_advice", []))
            remedy_data.setdefault("icd_code", fallback.get("icd_code", ""))
            remedy_data.setdefault("first_line_treatment", fallback.get("first_line_treatment", ""))

        execution_plan = self.build_execution_plan(
            district, disease, risk_level, risk_score,
            remedy_data, hospital_load, forecast,
        )

        return {
            "citizen_advice": remedy_data.get("citizen_advice", []),
            "first_line_treatment": remedy_data.get("first_line_treatment", ""),
            "icd_code": remedy_data.get("icd_code", ""),
            "execution_plan": execution_plan,
            "powered_by": "Gemini AI" if remedy_data.get("alert_sms") else "Rule-based fallback",
        }


# Singleton
remedy_planner = RemedyPlanner()
