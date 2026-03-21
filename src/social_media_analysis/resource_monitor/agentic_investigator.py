"""
agentic_investigator.py
=======================
Level 2 Agentic AI that investigates civic resource issues
for any district in India.

Agent decides what data to fetch, calls tools itself,
reasons about findings and generates specific root cause
analysis and long term resolution for government.

Uses Groq API (free, fast).
Model: llama-3.3-70b-versatile
"""

import requests
import json
import os
from datetime import datetime, timedelta
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

_client  = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
_db      = _client["netravaah"]

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "llama-3.3-70b-versatile"

# --------------------------------------------------
# All 18 issue categories
# --------------------------------------------------

ALL_ISSUES = [
    "Water Supply", "Road Damage", "Electricity", "Street Lights",
    "Drainage and Sewage", "Flooding", "Garbage Collection",
    "Public Toilets", "Healthcare", "Education", "Public Safety",
    "Public Transport", "Air Pollution", "Water Pollution",
    "Corruption", "Government Schemes", "Agriculture", "Other",
]

# --------------------------------------------------
# Tools the agent can call
# --------------------------------------------------

def get_citizen_complaints(district: str, state: str, issue: str = None, days: int = 30) -> dict:
    """
    Fetch actual citizen complaint texts for a district.
    Optionally filter by issue type.
    Returns complaint count and actual text samples.
    """
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()
    query = {
        "nlp_processed": True,
        "processed_at":  {"$gte": since},
        "$or": [
            {"locations.name":  {"$regex": district, "$options": "i"}},
            {"locations.state": {"$regex": state,    "$options": "i"}},
        ]
    }
    if issue:
        query["final_issue"] = {"$regex": issue, "$options": "i"}

    complaints = list(_db["social_signals"].find(
        query,
        {"text": 1, "final_issue": 1, "sentiment": 1, "priority_score": 1, "_id": 0}
    ).sort("priority_score", -1).limit(15))

    issue_counts = {}
    for c in complaints:
        fi = c.get("final_issue", "Other")
        issue_counts[fi] = issue_counts.get(fi, 0) + 1

    return {
        "total_complaints":  len(complaints),
        "issue_breakdown":   issue_counts,
        "complaint_samples": [
            {
                "issue":    c.get("final_issue"),
                "text":     c.get("text", "")[:150],
                "sentiment":c.get("sentiment", {}).get("label"),
                "priority": c.get("priority_score"),
            }
            for c in complaints[:8]
        ],
    }


def get_weather_conditions(district: str, state: str) -> dict:
    """
    Get live weather data for a district.
    Includes temperature, rainfall, humidity, soil moisture.
    """
    data = _db["weather_live"].find_one(
        {
            "district": {"$regex": district, "$options": "i"},
            "state":    {"$regex": state,    "$options": "i"},
        },
        {"_id": 0}
    )
    if data:
        return {
            "temperature_celsius": data.get("temperature_celsius"),
            "humidity_percent":    data.get("humidity_percent"),
            "precipitation_mm":    data.get("precipitation_mm"),
            "rainfall_7day_mm":    data.get("rainfall_7day_mm"),
            "soil_moisture":       data.get("soil_moisture"),
            "heat_stress":         data.get("heat_stress"),
            "drought_risk":        data.get("drought_risk"),
            "high_rainfall":       data.get("high_rainfall"),
            "fetched_at":          data.get("fetched_at"),
        }
    return {"error": "No weather data available for this district"}


def get_electricity_status(state: str) -> dict:
    """
    Get electricity installed capacity vs actual generation for a state.
    Shows utilization percentage to detect underperformance.
    """
    live = _db["electricity_generation"].find_one(
        {"state": {"$regex": state, "$options": "i"}},
        {"_id": 0}
    )
    cap = _db["electricity_capacity"].find_one(
        {"state": {"$regex": state, "$options": "i"}},
        {"_id": 0}
    )
    return {
        "installed_capacity_mw": cap.get("total_capacity_mw") if cap else None,
        "renewable_mw":          cap.get("renewable_mw")      if cap else None,
        "region":                cap.get("region")             if cap else None,
        "actual_generation_mu":  live.get("generation_mu")    if live else None,
        "utilization_pct":       live.get("utilization_pct")  if live else None,
        "underutilized":         live.get("underutilized")     if live else None,
        "report_date":           live.get("report_date")       if live else None,
        "data_source":           "live_npp" if live else "capacity_only",
    }


def get_air_quality(district: str, state: str) -> dict:
    """
    Get live AQI and pollution levels for a district or nearest city.
    """
    data = _db["aqi_data"].find_one(
        {"city": {"$regex": district, "$options": "i"}},
        {"_id": 0}
    )
    if not data:
        data = _db["aqi_data"].find_one(
            {"city": {"$regex": state.split()[0], "$options": "i"}},
            {"_id": 0}
        )
    if data:
        return {
            "city":       data.get("city"),
            "aqi":        data.get("aqi"),
            "category":   data.get("category"),
            "pm25":       data.get("pm25"),
            "pm10":       data.get("pm10"),
            "no2":        data.get("no2"),
            "updated_at": data.get("updated_at"),
        }
    return {"error": "No AQI data available"}


def get_vegetation_health(district: str, state: str) -> dict:
    """
    Get NASA vegetation/crop health index for a district.
    Shows NDVI equivalent and agricultural stress indicators.
    """
    data = _db["ndvi_live"].find_one(
        {
            "district": {"$regex": district, "$options": "i"},
            "state":    {"$regex": state,    "$options": "i"},
        },
        {"_id": 0}
    )
    if data:
        return {
            "ndvi_equivalent":  data.get("ndvi_equivalent"),
            "condition":        data.get("condition"),
            "veg_health_score": data.get("veg_health_score"),
            "precip_avg_mm":    data.get("precip_avg_mm"),
            "soil_wetness":     data.get("soil_wetness"),
            "temp_avg":         data.get("temp_avg"),
            "data_date":        data.get("data_date"),
        }
    return {"error": "No vegetation data available"}


def get_district_geography(district: str, state: str) -> dict:
    """
    Get geographic and demographic data for a district.
    Includes elevation, population density, surface water.
    """
    data = _db["hazard_data"].find_one(
        {
            "district": {"$regex": district, "$options": "i"},
            "state":    {"$regex": state,    "$options": "i"},
        },
        {"_id": 0}
    )
    if data:
        return {
            "elevation_m":              data.get("elevation_mean"),
            "population_density":       data.get("population_density"),
            "surface_water_occurrence": data.get("surface_water_occurrence"),
            "rainfall_anomaly":         data.get("rainfall_anomaly"),
            "lat":                      data.get("lat"),
            "lng":                      data.get("lng"),
        }
    return {"error": "No geographic data available"}


def get_historical_issue_trend(district: str, state: str, issue: str, days: int = 90) -> dict:
    """
    Get complaint trend for a specific issue over past N days.
    Shows if problem is getting worse or better over time.
    """
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()
    pipeline = [
        {
            "$match": {
                "nlp_processed": True,
                "processed_at":  {"$gte": since},
                "final_issue":   {"$regex": issue, "$options": "i"},
                "$or": [
                    {"locations.name":  {"$regex": district, "$options": "i"}},
                    {"locations.state": {"$regex": state,    "$options": "i"}},
                ]
            }
        },
        {
            "$group": {
                "_id":   {"$substr": ["$processed_at", 0, 7]},
                "count": {"$sum": 1},
                "avg_priority": {"$avg": "$priority_score"},
            }
        },
        {"$sort": {"_id": 1}},
    ]
    trend = list(_db["social_signals"].aggregate(pipeline))
    return {
        "issue":       issue,
        "period_days": days,
        "monthly_trend": [
            {
                "month":        t["_id"],
                "complaints":   t["count"],
                "avg_priority": round(t.get("avg_priority") or 0, 3),
            }
            for t in trend
        ],
        "total": sum(t["count"] for t in trend),
        "trend": "increasing" if len(trend) >= 2 and trend[-1]["count"] > trend[0]["count"]
                 else "decreasing" if len(trend) >= 2 and trend[-1]["count"] < trend[0]["count"]
                 else "stable",
    }


# --------------------------------------------------
# Tool definitions for Groq/LLM
# --------------------------------------------------

TOOLS = [
    {
        "type": "function",
        "function": {
            "name":        "get_citizen_complaints",
            "description": "Fetch actual citizen complaint texts for a district. Returns complaint count, issue breakdown and sample complaint texts. Use this to understand what citizens are actually experiencing.",
            "parameters": {
                "type":       "object",
                "properties": {
                    "district": {"type": "string", "description": "District name"},
                    "state":    {"type": "string", "description": "State name"},
                    "issue":    {"type": "string", "description": "Optional - filter by issue type e.g. Water Supply, Electricity"},
                    "days":     {"type": "integer", "description": "How many days back to look, default 30"},
                },
                "required": ["district", "state"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name":        "get_weather_conditions",
            "description": "Get live weather data including temperature, rainfall, humidity and soil moisture for a district. Use this for water, agriculture and flooding issues.",
            "parameters": {
                "type":       "object",
                "properties": {
                    "district": {"type": "string"},
                    "state":    {"type": "string"},
                },
                "required": ["district", "state"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name":        "get_electricity_status",
            "description": "Get installed electricity capacity vs actual generation for a state. Shows utilization percentage. Use this for electricity and street light issues.",
            "parameters": {
                "type":       "object",
                "properties": {
                    "state": {"type": "string"},
                },
                "required": ["state"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name":        "get_air_quality",
            "description": "Get live AQI and pollution levels for a district. Use this for air pollution and health related issues.",
            "parameters": {
                "type":       "object",
                "properties": {
                    "district": {"type": "string"},
                    "state":    {"type": "string"},
                },
                "required": ["district", "state"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name":        "get_vegetation_health",
            "description": "Get NASA satellite vegetation and crop health data for a district. Use this for agriculture, water and flooding issues.",
            "parameters": {
                "type":       "object",
                "properties": {
                    "district": {"type": "string"},
                    "state":    {"type": "string"},
                },
                "required": ["district", "state"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name":        "get_district_geography",
            "description": "Get geographic data including elevation, population density and surface water for a district. Use this for flooding, water and infrastructure issues.",
            "parameters": {
                "type":       "object",
                "properties": {
                    "district": {"type": "string"},
                    "state":    {"type": "string"},
                },
                "required": ["district", "state"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name":        "get_historical_issue_trend",
            "description": "Get complaint trend for a specific issue over past months. Shows if problem is getting worse or better. Use this to understand if issue is chronic or sudden.",
            "parameters": {
                "type":       "object",
                "properties": {
                    "district": {"type": "string"},
                    "state":    {"type": "string"},
                    "issue":    {"type": "string", "description": "Issue type e.g. Water Supply, Electricity, Flooding"},
                    "days":     {"type": "integer", "description": "Period to analyze, default 90"},
                },
                "required": ["district", "state", "issue"],
            },
        },
    },
]

# Tool executor map
TOOL_MAP = {
    "get_citizen_complaints":    get_citizen_complaints,
    "get_weather_conditions":    get_weather_conditions,
    "get_electricity_status":    get_electricity_status,
    "get_air_quality":           get_air_quality,
    "get_vegetation_health":     get_vegetation_health,
    "get_district_geography":    get_district_geography,
    "get_historical_issue_trend":get_historical_issue_trend,
}


def execute_tool(name: str, arguments: dict) -> str:
    """Execute a tool call and return JSON string result."""
    func = TOOL_MAP.get(name)
    if not func:
        return json.dumps({"error": f"Unknown tool: {name}"})
    try:
        result = func(**arguments)
        return json.dumps(result, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


# --------------------------------------------------
# Agentic Investigation Loop
# --------------------------------------------------

SYSTEM_PROMPT = """You are an expert civic governance analyst for the Indian government.

Your job is to investigate resource and infrastructure issues reported by citizens
in specific districts across India.

When given a district to investigate:
1. Use the available tools to gather evidence - call multiple tools
2. Read actual citizen complaints to understand ground reality
3. Check environmental and infrastructure data
4. Identify the ROOT CAUSE with specific evidence
5. Provide LONG TERM RESOLUTION steps the government can take

You must investigate thoroughly before concluding.
Always check citizen complaints first to understand the human impact.
Then check relevant data sources based on what issues you find.

After gathering enough evidence, provide your final analysis as JSON:
{
  "district": "district name",
  "state": "state name",
  "severity": "Critical/High/Medium/Low",
  "issues_found": ["list of issues detected"],
  "root_cause_analysis": {
    "primary_cause": "specific root cause based on evidence",
    "contributing_factors": ["factor 1", "factor 2"],
    "evidence": ["evidence 1 from data", "evidence 2 from complaints"]
  },
  "long_term_resolution": {
    "policy_actions": ["government policy step 1", "step 2"],
    "infrastructure_changes": ["infrastructure fix 1", "fix 2"],
    "timeline": "estimated time to resolve if actions taken",
    "departments_responsible": ["dept 1", "dept 2"]
  },
  "immediate_actions": ["urgent action 1", "urgent action 2"],
  "citizen_impact": "description of how citizens are being affected",
  "confidence": "HIGH/MEDIUM/LOW",
  "data_sources_used": ["list of tools used"]
}

Return ONLY the JSON in your final response, no other text."""


def investigate_district(district: str, state: str) -> dict:
    """
    Main agentic investigation function.
    Agent calls tools itself to gather evidence then concludes.
    
    Args:
        district: District name e.g. "Karnal"
        state:    State name e.g. "Haryana"
    
    Returns:
        Full investigation report with root cause and resolution
    """
    print(f"\nAgent investigating: {district}, {state}")
    print("-" * 50)

    messages = [
        {
            "role":    "system",
            "content": SYSTEM_PROMPT,
        },
        {
            "role":    "user",
            "content": f"Investigate all civic issues in {district}, {state}. Start by checking citizen complaints, then gather relevant data to identify root causes and provide long term resolutions for the government.",
        }
    ]

    max_iterations = 8
    iteration      = 0
    tools_used     = []

    while iteration < max_iterations:
        iteration += 1
        print(f"  Iteration {iteration}...")

        try:
            response = requests.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type":  "application/json",
                },
                json={
                    "model":       GROQ_MODEL,
                    "messages":    messages,
                    "tools":       TOOLS,
                    "tool_choice": "auto",
                    "max_tokens":  2000,
                    "temperature": 0.1,
                },
                timeout=60,
            )

            if response.status_code != 200:
                print(f"  Groq API error: {response.status_code} {response.text}")
                break

            data    = response.json()
            message = data["choices"][0]["message"]
            reason  = data["choices"][0]["finish_reason"]

            # Add assistant message to history
            messages.append(message)

            # Agent finished — extract final JSON
            if reason == "stop":
                content = message.get("content", "")
                if content:
                    try:
                        # Clean up response if needed
                        content = content.strip()
                        if "```json" in content:
                            content = content.split("```json")[1].split("```")[0].strip()
                        elif "```" in content:
                            content = content.split("```")[1].split("```")[0].strip()

                        result = json.loads(content)
                        result["tools_used"]  = tools_used
                        result["iterations"]  = iteration
                        result["agentic"]     = True
                        result["investigated_at"] = datetime.utcnow().isoformat()

                        print(f"  Investigation complete. Severity: {result.get('severity')}")
                        return result

                    except json.JSONDecodeError as e:
                        print(f"  JSON parse error: {e}")
                        return {
                            "error":          "Could not parse AI response",
                            "raw_response":   content[:500],
                            "agentic":        False,
                            "district":       district,
                            "state":          state,
                        }
                break

            # Agent wants to call tools
            if reason == "tool_calls":
                tool_calls = message.get("tool_calls", [])
                tool_results = []

                for tc in tool_calls:
                    tool_name = tc["function"]["name"]
                    try:
                        arguments = json.loads(tc["function"]["arguments"])
                    except Exception:
                        arguments = {}

                    print(f"  Agent calling: {tool_name}({arguments})")
                    tools_used.append(tool_name)

                    result = execute_tool(tool_name, arguments)

                    tool_results.append({
                        "role":         "tool",
                        "tool_call_id": tc["id"],
                        "content":      result,
                    })

                # Add all tool results to messages
                messages.extend(tool_results)

        except Exception as e:
            print(f"  Error in iteration {iteration}: {e}")
            break

    # Fallback if agent loop fails
    return {
        "error":    "Investigation could not be completed",
        "district": district,
        "state":    state,
        "agentic":  False,
    }


def investigate_and_save(district: str, state: str) -> dict:
    """
    Investigate a district and save the AI report to MongoDB.
    Called by scheduler and API endpoint.
    """
    result = investigate_district(district, state)

    if "error" not in result:
        _db["ai_investigations"].update_one(
            {"district": district, "state": state},
            {
                "$set":  result,
                "$push": {
                    "history": {
                        "investigated_at": result.get("investigated_at"),
                        "severity":        result.get("severity"),
                        "issues_found":    result.get("issues_found"),
                    }
                }
            },
            upsert=True,
        )
        _db["ai_investigations"].create_index([("state", 1), ("district", 1)])
        print(f"  Saved to MongoDB ai_investigations")

    return result


if __name__ == "__main__":
    # Test with one district
    result = investigate_and_save("Karnal", "Haryana")
    print("\nInvestigation Result:")
    print(json.dumps(result, indent=2, default=str))
