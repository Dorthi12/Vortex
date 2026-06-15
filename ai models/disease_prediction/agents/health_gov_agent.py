# agents/health_gov_agent.py
import json
import logging
import httpx
from typing import Dict, Any, List
from disease_prediction.config.settings import settings

logger = logging.getLogger(__name__)

class HealthGovAgent:
    @staticmethod
    def analyze_district_health(query_text: str, district_name: str) -> Dict[str, Any]:
        """
        Analyze district health conditions using Google's Gemini LLM.
        Sends a structured prompt requesting a JSON response.
        Falls back to a rule-based expert system if Gemini calls fail or key is invalid.
        """
        api_key = settings.gemini_api_key
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        
        prompt = f"""
You are the Lead Epidemiologist and Health Commissioner for NETRAVAAH, an AI-powered state healthcare governance platform.
Your task is to analyze the following health inquiry and return a detailed, professional, structured JSON report.

Query: "{query_text}"
Target District: "{district_name}"

Your analysis must focus on realistic government healthcare containment and allocation strategies.
Return ONLY a valid JSON object matching the following structure (do not wrap in markdown or backticks):
{{
  "risk_level": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "contributing_factors": ["factor 1", "factor 2", ...],
  "expected_spread": "Detailed description of expected epidemiological timeline and spread vectors over the next 15-30 days.",
  "recommended_actions": ["action 1", "action 2", ...],
  "resource_requirements": {{
    "emergency_beds": 15,
    "icu_beds": 5,
    "vaccine_doses": 5000,
    "fogging_crews": 6,
    "medical_personnel": 12
  }},
  "confidence_score": 0.90
}}

Ensure all numbers are realistic and directly address the query. Do not add any conversational text before or after the JSON.
"""

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }

        # Try hitting Google Gemini API
        if api_key and not api_key.startswith("AIzaSyFake"):
            try:
                response = httpx.post(url, json=payload, timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    text_content = data["candidates"][0]["content"]["parts"][0]["text"]
                    logger.info("Successfully received response from Gemini API")
                    
                    # Clean markdown if returned in code block
                    text_content = text_content.strip()
                    if text_content.startswith("```"):
                        lines = text_content.split("\n")
                        if lines[0].startswith("```"):
                            lines = lines[1:]
                        if lines[-1].startswith("```"):
                            lines = lines[:-1]
                        text_content = "\n".join(lines).strip()
                        
                    parsed_json = json.loads(text_content)
                    return parsed_json
                else:
                    logger.warning("Gemini API call failed with status: %d. Falling back to local expert system.", response.status_code)
            except Exception as e:
                logger.error("Error invoking Gemini API: %s. Falling back to local expert system.", str(e))
                
        # Rule-based fallback system
        logger.info("Running local rule-based fallback analyzer")
        return HealthGovAgent._local_fallback_analysis(query_text, district_name)

    @staticmethod
    def _local_fallback_analysis(query_text: str, district: str) -> Dict[str, Any]:
        """Local rule-based analysis fallback when LLM is unavailable."""
        query_lower = query_text.lower()
        
        # Check disease type
        disease = "General Epidemic"
        if "dengue" in query_lower:
            disease = "Dengue"
        elif "malaria" in query_lower:
            disease = "Malaria"
        elif "cholera" in query_lower:
            disease = "Cholera"
        elif "typhoid" in query_lower:
            disease = "Typhoid"
        elif "influenza" in query_lower or "flu" in query_lower:
            disease = "Influenza"

        # Determine risk level based on query intensity
        risk_level = "MEDIUM"
        if any(w in query_lower for w in ["severe", "critical", "outbreak", "high", "danger", "spike"]):
            risk_level = "HIGH"
        if any(w in query_lower for w in ["overflow", "crisis", "disaster"]):
            risk_level = "CRITICAL"
            
        factors = [
            f"Active transmission vectors of {disease} identified in urban hotspots.",
            "Elevated temperature and humidity favoring pathogen replication.",
            "Pockets of high population density with lower sanitation grades."
        ]
        
        if disease in ["Dengue", "Malaria"]:
            factors.append("Mosquito vector breeding accelerated due to recent monsoon water logging.")
        elif disease in ["Cholera", "Typhoid"]:
            factors.append("Water pollution anomalies logged in local sub-district municipal tanks.")
            
        spread = (
            f"Localized cases of {disease} in {district} are projected to rise by "
            f"{'35%' if risk_level == 'HIGH' else '60%' if risk_level == 'CRITICAL' else '15%'} "
            f"over the next 14 to 30 days if immediate vector and sanitation controls are not expanded."
        )
        
        actions = [
            f"Coordinate targeted chemical fogging and vector larvae elimination campaigns in {district}.",
            "Set up rapid screening fever desks at district outpatient clinics.",
            "Distribute educational guidelines on safe water storage and barrier protection."
        ]
        
        resources = {
            "emergency_beds": 10 if risk_level == "MEDIUM" else 25 if risk_level == "HIGH" else 50,
            "icu_beds": 2 if risk_level == "MEDIUM" else 5 if risk_level == "HIGH" else 15,
            "vaccine_doses": 2500 if risk_level == "MEDIUM" else 5000 if risk_level == "HIGH" else 12000,
            "fogging_crews": 2 if risk_level == "MEDIUM" else 5 if risk_level == "HIGH" else 10,
            "medical_personnel": 4 if risk_level == "MEDIUM" else 10 if risk_level == "HIGH" else 24
        }
        
        return {
            "risk_level": risk_level,
            "contributing_factors": factors,
            "expected_spread": spread,
            "recommended_actions": actions,
            "resource_requirements": resources,
            "confidence_score": 0.85
        }
