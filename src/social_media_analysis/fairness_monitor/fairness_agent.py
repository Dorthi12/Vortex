"""
fairness_agent.py
=================
Agentic AI that investigates bias in the priority model.

Agent uses tools to:
1. Fetch bias statistics
2. Compare language and rural/urban scores
3. Check resolution rates
4. Identify root causes
5. Generate specific fixes for government

Uses Groq API (free, fast).
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
# Tools
# --------------------------------------------------

def get_language_bias_stats(days: int = 30) -> dict:
    """Get priority score comparison between Hindi and English complaints."""
    from bias_detector import detect_language_bias
    return detect_language_bias(days)


def get_rural_urban_bias_stats(days: int = 30) -> dict:
    """Get priority score comparison between rural and urban complaints."""
    from bias_detector import detect_rural_urban_bias
    return detect_rural_urban_bias(days)


def get_resolution_by_language(days: int = 30) -> dict:
    """Get resolution rates broken down by complaint language."""
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()

    complaints = list(_db["social_signals"].find(
        {"nlp_processed": True, "processed_at": {"$gte": since}, "text": {"$exists": True}},
        {"text": 1, "resolution_status": 1, "priority_score": 1, "_id": 0}
    ))

    groups = {"hindi": {"total": 0, "resolved": 0, "priorities": []},
              "english": {"total": 0, "resolved": 0, "priorities": []},
              "mixed":   {"total": 0, "resolved": 0, "priorities": []}}

    resolved_statuses = ["RESOLVED_CONFIRMED", "RESOLVED_AUTO", "RESOLVED_TIMEOUT"]

    for c in complaints:
        text = c.get("text", "")
        deva = sum(1 for ch in text if "\u0900" <= ch <= "\u097F")
        ratio= deva / max(len(text.strip()), 1)
        lang = "hindi" if ratio > 0.3 else "mixed" if ratio > 0.05 else "english"

        if lang in groups:
            groups[lang]["total"] += 1
            if c.get("resolution_status") in resolved_statuses:
                groups[lang]["resolved"] += 1
            if c.get("priority_score"):
                groups[lang]["priorities"].append(c["priority_score"])

    result = {}
    for lang, data in groups.items():
        total   = data["total"]
        pris    = data["priorities"]
        result[lang] = {
            "total":           total,
            "resolved":        data["resolved"],
            "resolution_rate": round(data["resolved"] / total * 100, 2) if total > 0 else 0,
            "avg_priority":    round(sum(pris) / len(pris), 4) if pris else 0,
        }

    return {"period_days": days, "by_language": result}


def get_resolution_by_area_type(days: int = 30) -> dict:
    """Get resolution rates for rural vs urban areas."""
    from resolution_tracker import get_resolution_by_state
    states = get_resolution_by_state(days)
    return {"period_days": days, "by_state": states[:15]}


def get_issue_bias_by_language(issue: str, days: int = 30) -> dict:
    """Check if a specific issue type is biased by language."""
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()

    complaints = list(_db["social_signals"].find(
        {
            "nlp_processed": True,
            "processed_at":  {"$gte": since},
            "final_issue":   {"$regex": issue, "$options": "i"},
            "text":          {"$exists": True},
        },
        {"text": 1, "priority_score": 1, "confidence": 1, "_id": 0}
    ))

    groups = {"hindi": [], "english": [], "mixed": []}
    for c in complaints:
        text  = c.get("text", "")
        deva  = sum(1 for ch in text if "\u0900" <= ch <= "\u097F")
        ratio = deva / max(len(text.strip()), 1)
        lang  = "hindi" if ratio > 0.3 else "mixed" if ratio > 0.05 else "english"
        if lang in groups:
            groups[lang].append(c.get("priority_score", 0))

    result = {}
    for lang, scores in groups.items():
        result[lang] = {
            "count":        len(scores),
            "avg_priority": round(sum(scores) / len(scores), 4) if scores else 0,
        }

    return {"issue": issue, "period_days": days, "by_language": result}


def get_citizen_feedback_stats(days: int = 30) -> dict:
    """Get citizen feedback statistics including stars and resolution confirmation."""
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()

    feedbacks = list(_db["complaint_feedback"].find(
        {"feedback_type": "citizen", "submitted_at": {"$gte": since}},
        {"_id": 0, "resolved": 1, "stars": 1, "days_to_fix": 1, "language": 1, "state": 1}
    ))

    if not feedbacks:
        return {"total": 0, "message": "No citizen feedback collected yet"}

    total     = len(feedbacks)
    resolved  = sum(1 for f in feedbacks if f.get("resolved"))
    stars     = [f["stars"] for f in feedbacks if f.get("stars")]
    days_list = [f["days_to_fix"] for f in feedbacks if f.get("days_to_fix")]

    by_lang = {}
    for f in feedbacks:
        lang = f.get("language", "unknown")
        if lang not in by_lang:
            by_lang[lang] = {"total": 0, "resolved": 0, "stars": []}
        by_lang[lang]["total"] += 1
        if f.get("resolved"):
            by_lang[lang]["resolved"] += 1
        if f.get("stars"):
            by_lang[lang]["stars"].append(f["stars"])

    lang_stats = {}
    for lang, data in by_lang.items():
        t = data["total"]
        s = data["stars"]
        lang_stats[lang] = {
            "total":           t,
            "resolution_rate": round(data["resolved"] / t * 100, 2) if t > 0 else 0,
            "avg_stars":       round(sum(s) / len(s), 2) if s else 0,
        }

    return {
        "total":           total,
        "resolved":        resolved,
        "resolution_rate": round(resolved / total * 100, 2),
        "avg_stars":       round(sum(stars) / len(stars), 2) if stars else 0,
        "avg_days_to_fix": round(sum(days_list) / len(days_list), 1) if days_list else 0,
        "by_language":     lang_stats,
        "period_days":     days,
    }


# --------------------------------------------------
# Tool definitions
# --------------------------------------------------

TOOLS = [
    {
        "type": "function",
        "function": {
            "name":        "get_language_bias_stats",
            "description": "Get statistical comparison of priority scores between Hindi, English and Mixed language complaints. Use this first to check language bias.",
            "parameters": {
                "type": "object",
                "properties": {
                    "days": {"type": "integer", "description": "Analysis period in days, default 30"}
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name":        "get_rural_urban_bias_stats",
            "description": "Get statistical comparison of priority scores between rural and urban area complaints. Use this to check geographic bias.",
            "parameters": {
                "type": "object",
                "properties": {
                    "days": {"type": "integer", "description": "Analysis period in days, default 30"}
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name":        "get_resolution_by_language",
            "description": "Get complaint resolution rates broken down by language. Checks if Hindi complaints get resolved less often.",
            "parameters": {
                "type": "object",
                "properties": {
                    "days": {"type": "integer", "description": "Analysis period, default 30"}
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name":        "get_resolution_by_area_type",
            "description": "Get resolution rates by state to detect rural urban operational bias.",
            "parameters": {
                "type": "object",
                "properties": {
                    "days": {"type": "integer", "description": "Analysis period, default 30"}
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name":        "get_issue_bias_by_language",
            "description": "Check if a specific civic issue is scored differently based on complaint language.",
            "parameters": {
                "type": "object",
                "properties": {
                    "issue": {"type": "string", "description": "Issue type e.g. Water Supply, Electricity"},
                    "days":  {"type": "integer", "description": "Analysis period, default 30"},
                },
                "required": ["issue"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name":        "get_citizen_feedback_stats",
            "description": "Get citizen feedback statistics including resolution confirmation rates and satisfaction scores by language.",
            "parameters": {
                "type": "object",
                "properties": {
                    "days": {"type": "integer", "description": "Analysis period, default 30"}
                },
            },
        },
    },
]

TOOL_MAP = {
    "get_language_bias_stats":    get_language_bias_stats,
    "get_rural_urban_bias_stats": get_rural_urban_bias_stats,
    "get_resolution_by_language": get_resolution_by_language,
    "get_resolution_by_area_type":get_resolution_by_area_type,
    "get_issue_bias_by_language": get_issue_bias_by_language,
    "get_citizen_feedback_stats": get_citizen_feedback_stats,
}


def execute_tool(name: str, arguments: dict) -> str:
    func = TOOL_MAP.get(name)
    if not func:
        return json.dumps({"error": f"Unknown tool: {name}"})
    try:
        result = func(**arguments)
        return json.dumps(result, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


# --------------------------------------------------
# Agentic Investigation
# --------------------------------------------------

SYSTEM_PROMPT = """You are an AI fairness auditor for a civic complaint management system in India.

Your job is to detect bias in how the AI priority model scores citizen complaints.

Investigate these two types of bias:
1. Language Bias: Are Hindi complaints scored unfairly lower than English complaints?
2. Rural-Urban Bias: Are rural area complaints prioritized less than urban complaints?

Use the available tools to gather statistical evidence.
Compare scores, resolution rates and citizen satisfaction across groups.
Identify ROOT CAUSES of any bias found.
Suggest SPECIFIC FIXES the engineering team can implement.

After investigating provide your final report as JSON:
{
  "bias_detected": true/false,
  "overall_severity": "High/Medium/Low/None",
  "language_bias": {
    "detected": true/false,
    "severity": "High/Medium/Low",
    "finding": "specific finding with numbers",
    "root_cause": "why this bias exists in the model",
    "fix": "specific technical fix",
    "affected_complaints_pct": 0.0
  },
  "rural_urban_bias": {
    "detected": true/false,
    "severity": "High/Medium/Low",
    "finding": "specific finding with numbers",
    "root_cause": "why this bias exists",
    "fix": "specific technical fix",
    "affected_complaints_pct": 0.0
  },
  "citizen_impact": "how bias affects citizens",
  "immediate_fixes": ["fix 1", "fix 2"],
  "long_term_recommendations": ["recommendation 1", "recommendation 2"],
  "confidence": "HIGH/MEDIUM/LOW",
  "data_quality_note": "any notes on data limitations"
}

Return ONLY the JSON."""


def investigate_fairness() -> dict:
    """
    Run agentic fairness investigation.
    Agent fetches data using tools and reasons about bias.
    """
    print("\nFairness Agent starting investigation...")
    print("-" * 50)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role":    "user",
            "content": "Investigate the fairness of our civic complaint priority model. Check for language bias (Hindi vs English) and rural-urban bias. Use all available tools to gather evidence before concluding.",
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
                print(f"  Groq error: {response.status_code}")
                break

            data    = response.json()
            message = data["choices"][0]["message"]
            reason  = data["choices"][0]["finish_reason"]

            messages.append(message)

            if reason == "stop":
                content = message.get("content", "").strip()
                if content:
                    try:
                        if "```json" in content:
                            content = content.split("```json")[1].split("```")[0].strip()
                        elif "```" in content:
                            content = content.split("```")[1].split("```")[0].strip()

                        result = json.loads(content)
                        result["tools_used"]     = tools_used
                        result["iterations"]     = iteration
                        result["investigated_at"]= datetime.utcnow().isoformat()
                        result["agentic"]        = True

                        # Save to MongoDB
                        _db["fairness_reports"].insert_one({**result})
                        _db["fairness_reports"].create_index("investigated_at")

                        print(f"  Investigation complete. Severity: {result.get('overall_severity')}")
                        return result

                    except json.JSONDecodeError as e:
                        print(f"  JSON parse error: {e}")
                        return {"error": "Parse failed", "raw": content[:300], "agentic": False}
                break

            if reason == "tool_calls":
                tool_calls   = message.get("tool_calls", [])
                tool_results = []

                for tc in tool_calls:
                    name = tc["function"]["name"]
                    try:
                        args = json.loads(tc["function"]["arguments"])
                    except Exception:
                        args = {}

                    print(f"  Agent calling: {name}({args})")
                    tools_used.append(name)
                    result = execute_tool(name, args)

                    tool_results.append({
                        "role":         "tool",
                        "tool_call_id": tc["id"],
                        "content":      result,
                    })

                messages.extend(tool_results)

        except Exception as e:
            print(f"  Error: {e}")
            break

    return {"error": "Investigation incomplete", "agentic": False}


def get_latest_fairness_report() -> dict:
    """Get the most recent fairness investigation report."""
    report = _db["fairness_reports"].find_one(
        {},
        {"_id": 0},
        sort=[("investigated_at", -1)]
    )
    return report or {"message": "No fairness reports yet. Run investigation first."}


if __name__ == "__main__":
    result = investigate_fairness()
    import json
    print(json.dumps(result, indent=2, default=str))
