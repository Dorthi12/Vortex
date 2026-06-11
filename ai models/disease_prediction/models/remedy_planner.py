"""
Model 8 — Remedy Recommendation Engine
Model 9 — Government Execution Planner
Uses Gemini API for dynamic, context-aware recommendation generation
"""

import json
import logging
import re
import requests
from datetime import datetime

from .settings import GEMINI_API_KEY, GEMINI_API_URL

logger = logging.getLogger(__name__)


# ─── DATA CLASSES ─────────────────────────────────────────────────────────────
@dataclass
class RemedyInput:
    district: str
    disease: str
    risk_level: str
    outbreak_probability: float
    active_cases: int
    population: int
    hospital_overload_risk: float
    environmental_factors: list = field(default_factory=list)
    season: str = "Summer"

@dataclass
class CitizenAdvisory:
    disease: str
    risk_level: str
    do_list: list
    dont_list: list
    symptoms_to_watch: list
    when_to_seek_help: list
    prevention_tips: list
    helpline: str = "104 (Health Helpline)"

@dataclass
class GovernmentAdvisory:
    disease: str
    risk_level: str
    immediate_actions: list    # next 24-48 hours
    short_term_actions: list   # next 1-2 weeks
    resource_requirements: dict
    coordination_agencies: list
    monitoring_kpis: list

@dataclass
class ExecutionPlan:
    district: str
    disease: str
    risk_level: str
    citizen_advisory: CitizenAdvisory
    government_advisory: GovernmentAdvisory
    generated_at: datetime = field(default_factory=datetime.now)
    generated_by: str = "gemini_1.5_flash"


# ─── STATIC FALLBACK RECOMMENDATIONS ─────────────────────────────────────────
STATIC_REMEDIES = {
    "Dengue": {
        "citizen_do": [
            "Use mosquito repellent (DEET/Picaridin) at all times",
            "Sleep under mosquito nets, especially during day",
            "Wear full-sleeve clothing",
            "Drink plenty of fluids and ORS",
            "Rest and monitor platelet count",
        ],
        "citizen_dont": [
            "Do NOT take aspirin or ibuprofen (risk of bleeding)",
            "Do NOT allow stagnant water to accumulate",
            "Do NOT ignore high fever > 2 days",
        ],
        "symptoms_watch": ["Sudden high fever", "Severe headache", "Rash", "Bleeding gums"],
        "when_seek_help": ["Fever > 103°F for 2+ days", "Bleeding", "Severe abdominal pain"],
        "prevention": ["Drain all stagnant water", "Use mosquito nets", "Fogging in high-density areas"],
        "gov_immediate": [
            "Deploy fogging teams to all hotspot clusters",
            "Inspect and drain stagnant water in 50 sites per district",
            "Activate rapid response teams",
            "Distribute ORS and paracetamol packs",
        ],
        "gov_short_term": [
            "Awareness campaign in schools and public spaces",
            "Weekly surveillance reports to state HQ",
            "Coordinate with NVBDCP for vector control",
        ],
        "resources": {"fogging_machines": 10, "ors_packs": 5000, "rapid_test_kits": 500},
        "agencies": ["NVBDCP", "District Malaria Officer", "PHC Network", "ASHA Workers"],
    },
    "Malaria": {
        "citizen_do": [
            "Complete the full course of antimalarial medication",
            "Use bed nets treated with insecticide",
            "Seek blood test if fever with chills",
            "Use indoor residual spraying (IRS)",
        ],
        "citizen_dont": [
            "Do NOT stop medication early even if feeling better",
            "Do NOT self-medicate without diagnosis",
        ],
        "symptoms_watch": ["Cyclical fever", "Chills", "Severe headache", "Anemia signs"],
        "when_seek_help": ["Fever > 3 days", "Confusion", "Difficulty breathing"],
        "prevention": ["Drain waterlogged areas", "IRS in endemic zones", "Bed net distribution"],
        "gov_immediate": [
            "Deploy malaria rapid diagnosis tests to all PHCs",
            "Aerial or ground spraying in high-risk areas",
            "Track migrant worker movement",
        ],
        "gov_short_term": [
            "LLIN distribution in hotspot zones",
            "Strengthen lab capacity for blood smear testing",
        ],
        "resources": {"rdts": 2000, "antimalarials": 1000, "irs_teams": 5},
        "agencies": ["NVBDCP", "District Malaria Officer", "State Health Department"],
    },
    "Typhoid": {
        "citizen_do": [
            "Drink only boiled/purified water",
            "Eat freshly cooked hot food only",
            "Complete full antibiotic course as prescribed",
            "Maintain strict hand hygiene",
        ],
        "citizen_dont": [
            "Do NOT drink untreated water",
            "Do NOT consume raw vegetables/salads from roadside",
        ],
        "symptoms_watch": ["Continuous fever for 1+ week", "Rose-colored rash", "Abdominal pain"],
        "when_seek_help": ["Fever > 5 days", "Confusion", "Severe abdominal pain"],
        "prevention": ["Water chlorination", "Food safety awareness", "Typhoid vaccination"],
        "gov_immediate": [
            "Test municipal water supply for contamination",
            "Deploy water quality teams",
            "Issue boil-water advisory",
        ],
        "gov_short_term": [
            "Mass typhoid vaccination campaign",
            "Inspect food establishments",
        ],
        "resources": {"water_test_kits": 200, "vaccines": 10000, "antibiotics": 2000},
        "agencies": ["PHED", "Municipal Corporation", "Food Safety Authority"],
    },
    "Tuberculosis": {
        "citizen_do": [
            "Complete full DOTS (6-9 months) treatment",
            "Cover mouth when coughing/sneezing",
            "Ensure good ventilation in living spaces",
            "Get family members tested",
        ],
        "citizen_dont": [
            "Do NOT stop TB medication without doctor's advice",
            "Do NOT spit in public",
        ],
        "symptoms_watch": ["Cough > 2 weeks", "Blood in sputum", "Night sweats", "Weight loss"],
        "when_seek_help": ["Cough > 2 weeks", "Blood in sputum"],
        "prevention": ["BCG vaccination", "DOTS adherence", "Contact tracing"],
        "gov_immediate": [
            "Screen all household contacts of confirmed TB cases",
            "Activate DOTS center capacity",
        ],
        "gov_short_term": [
            "Contact tracing and testing",
            "Nutritional support for TB patients",
        ],
        "resources": {"tb_test_kits": 500, "dots_medications": 300},
        "agencies": ["RNTCP", "District TB Officer", "ASHA Workers"],
    },
}

DEFAULT_REMEDY = {
    "citizen_do": ["Seek medical attention", "Rest and hydrate", "Wear masks if respiratory symptoms"],
    "citizen_dont": ["Do NOT self-medicate", "Avoid public gatherings if symptomatic"],
    "symptoms_watch": ["High fever", "Worsening symptoms", "Difficulty breathing"],
    "when_seek_help": ["Fever > 3 days", "Severe symptoms"],
    "prevention": ["Maintain hygiene", "Drink clean water"],
    "gov_immediate": ["Deploy surveillance teams", "Increase monitoring"],
    "gov_short_term": ["Awareness campaign", "Coordinate with PHC network"],
    "resources": {"health_teams": 5},
    "agencies": ["District Health Officer", "PHC Network"],
}


class RemedyRecommendationEngine:
    """
    Generates disease-specific recommendations for citizens and government.
    Uses Gemini for dynamic, context-aware generation; falls back to static rules.
    """

    def _call_gemini(self, prompt: str) -> Optional[dict]:
        """Call Gemini API and parse JSON response"""
        url = f"{GEMINI_API_URL}/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 1500,
            }
        }
        try:
            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
            text = re.sub(r"```json\n?|```", "", text).strip()
            return json.loads(text)
        except Exception as e:
            logger.warning(f"Gemini API error: {e}")
            return None

    def _get_static_remedy(self, disease: str) -> dict:
        return STATIC_REMEDIES.get(disease, DEFAULT_REMEDY)

    def generate_citizen_advisory(
        self, inp: RemedyInput
    ) -> CitizenAdvisory:
        """Generate citizen-facing health advisory"""

        prompt = f"""You are India's public health advisory system.

Generate a citizen health advisory for:
- District: {inp.district}
- Disease: {inp.disease}  
- Risk Level: {inp.risk_level}
- Active Cases: {inp.active_cases}
- Season: {inp.season}

Respond ONLY in JSON (no markdown):
{{
  "do_list": ["action1", "action2", "action3", "action4", "action5"],
  "dont_list": ["avoid1", "avoid2", "avoid3"],
  "symptoms_to_watch": ["symptom1", "symptom2", "symptom3"],
  "when_to_seek_help": ["condition1", "condition2"],
  "prevention_tips": ["tip1", "tip2", "tip3"]
}}

Be specific to {inp.disease} in Indian context. Include local disease-specific advice."""

        result = self._call_gemini(prompt)
        static = self._get_static_remedy(inp.disease)

        if result:
            return CitizenAdvisory(
                disease=inp.disease,
                risk_level=inp.risk_level,
                do_list=result.get("do_list", static["citizen_do"]),
                dont_list=result.get("dont_list", static["citizen_dont"]),
                symptoms_to_watch=result.get("symptoms_to_watch", static["symptoms_watch"]),
                when_to_seek_help=result.get("when_to_seek_help", static["when_seek_help"]),
                prevention_tips=result.get("prevention_tips", static["prevention"]),
            )
        else:
            # Static fallback
            return CitizenAdvisory(
                disease=inp.disease,
                risk_level=inp.risk_level,
                do_list=static["citizen_do"],
                dont_list=static["citizen_dont"],
                symptoms_to_watch=static["symptoms_watch"],
                when_to_seek_help=static["when_seek_help"],
                prevention_tips=static["prevention"],
            )

    def generate_government_advisory(
        self, inp: RemedyInput
    ) -> GovernmentAdvisory:
        """Generate government action advisory"""

        prompt = f"""You are India's government health action planning system.

Create a government action plan for:
- District: {inp.district}
- Disease: {inp.disease}
- Risk Level: {inp.risk_level}
- Outbreak Probability: {inp.outbreak_probability:.0%}
- Active Cases: {inp.active_cases}
- Hospital Overload Risk: {inp.hospital_overload_risk:.0%}
- Environmental Factors: {', '.join(inp.environmental_factors) if inp.environmental_factors else 'Standard'}

Respond ONLY in JSON:
{{
  "immediate_actions": ["action1 (within 24hrs)", "action2", "action3", "action4"],
  "short_term_actions": ["action1 (week 1-2)", "action2", "action3"],
  "resource_requirements": {{"item1": quantity1, "item2": quantity2}},
  "coordination_agencies": ["agency1", "agency2"],
  "monitoring_kpis": ["kpi1: target", "kpi2: target"]
}}

Be specific with quantities and timelines for {inp.district} district."""

        result = self._call_gemini(prompt)
        static = self._get_static_remedy(inp.disease)

        if result:
            return GovernmentAdvisory(
                disease=inp.disease,
                risk_level=inp.risk_level,
                immediate_actions=result.get("immediate_actions", static["gov_immediate"]),
                short_term_actions=result.get("short_term_actions", static["gov_short_term"]),
                resource_requirements=result.get("resource_requirements", static.get("resources", {})),
                coordination_agencies=result.get("coordination_agencies", static["agencies"]),
                monitoring_kpis=result.get("monitoring_kpis", []),
            )
        else:
            return GovernmentAdvisory(
                disease=inp.disease,
                risk_level=inp.risk_level,
                immediate_actions=static["gov_immediate"],
                short_term_actions=static["gov_short_term"],
                resource_requirements=static.get("resources", {}),
                coordination_agencies=static["agencies"],
                monitoring_kpis=[],
            )


class GovernmentExecutionPlanner:
    """
    Model 9: Converts recommendations → actionable government execution plan.
    Produces prioritized, timestamped action sequences.
    """

    def __init__(self):
        self.remedy_engine = RemedyRecommendationEngine()

    def create_execution_plan(self, inp: RemedyInput) -> ExecutionPlan:
        """Full execution plan combining citizen + government advisories"""

        citizen_adv = self.remedy_engine.generate_citizen_advisory(inp)
        gov_adv = self.remedy_engine.generate_government_advisory(inp)

        return ExecutionPlan(
            district=inp.district,
            disease=inp.disease,
            risk_level=inp.risk_level,
            citizen_advisory=citizen_adv,
            government_advisory=gov_adv,
        )

    def generate_action_timeline(self, plan: ExecutionPlan) -> dict:
        """Generate a structured timeline for government execution"""

        return {
            "district": plan.district,
            "disease": plan.disease,
            "risk_level": plan.risk_level,
            "timeline": {
                "T+0h (Immediate)": plan.government_advisory.immediate_actions[:2],
                "T+24h": plan.government_advisory.immediate_actions[2:],
                "T+48h_to_1week": plan.government_advisory.short_term_actions[:2],
                "T+1week_to_2weeks": plan.government_advisory.short_term_actions[2:],
            },
            "resources_needed": plan.government_advisory.resource_requirements,
            "agencies": plan.government_advisory.coordination_agencies,
            "citizen_sms_advisory": (
                f"⚠️ {plan.disease} Alert in {plan.district}. "
                f"{plan.citizen_advisory.do_list[0] if plan.citizen_advisory.do_list else 'Stay alert'}. "
                f"Call 104 for help."
            ),
            "monitoring_kpis": plan.government_advisory.monitoring_kpis,
        }


# ─── TEST ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    planner = GovernmentExecutionPlanner()
    inp = RemedyInput(
        district="Lucknow",
        disease="Dengue",
        risk_level="HIGH",
        outbreak_probability=0.76,
        active_cases=84,
        population=4_589_838,
        hospital_overload_risk=0.75,
        environmental_factors=["High rainfall", "Stagnant water areas"],
        season="Monsoon"
    )

    plan = planner.create_execution_plan(inp)
    print(f"\n=== EXECUTION PLAN: {plan.district} | {plan.disease} | {plan.risk_level} ===")
    print(f"\nCitizen Advisory:")
    for item in plan.citizen_advisory.do_list:
        print(f"  ✓ {item}")
    print(f"\nGovernment Immediate Actions:")
    for item in plan.government_advisory.immediate_actions:
        print(f"  → {item}")
    print(f"\nResources: {plan.government_advisory.resource_requirements}")

    timeline = planner.generate_action_timeline(plan)
    print(f"\nSMS: {timeline['citizen_sms_advisory']}")
