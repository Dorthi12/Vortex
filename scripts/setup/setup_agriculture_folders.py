import os

ROOT_DIR = "c:\\Users\\d12ra\\Vortex\\ai_models\\agriculture"

# Define directory structures
DIRS = [
    "common/schemas",
    "common/validators",
    "common/kafka",
    "common/monitoring",
    "common/explainability",
    "common/model_registry",
    "common/feature_store",
    "common/utils",
    
    "api_contracts",

    "crop_recommendation/artifacts",
    "crop_recommendation/inference",
    "crop_recommendation/training_reference",
    "crop_recommendation/tests",
    "crop_recommendation/metadata",

    "crop_yield_prediction/artifacts",
    "crop_yield_prediction/inference",
    "crop_yield_prediction/training_reference",
    "crop_yield_prediction/tests",
    "crop_yield_prediction/metadata",

    "fertilizer_recommendation/rules",
    "fertilizer_recommendation/engine",
    "fertilizer_recommendation/tests",
    "fertilizer_recommendation/metadata",

    "soil_health_scoring/artifacts",
    "soil_health_scoring/inference",
    "soil_health_scoring/training_reference",
    "soil_health_scoring/tests",
    "soil_health_scoring/metadata",

    "mandi_price_forecasting/artifacts",
    "mandi_price_forecasting/inference",
    "mandi_price_forecasting/training_reference",
    "mandi_price_forecasting/tests",
    "mandi_price_forecasting/metadata",

    "rainfall_prediction/artifacts",
    "rainfall_prediction/inference",
    "rainfall_prediction/training_reference",
    "rainfall_prediction/tests",
    "rainfall_prediction/metadata",

    "harvest_window_prediction/artifacts",
    "harvest_window_prediction/inference",
    "harvest_window_prediction/training_reference",
    "harvest_window_prediction/tests",
    "harvest_window_prediction/metadata",

    "irrigation_forecasting/artifacts",
    "irrigation_forecasting/inference",
    "irrigation_forecasting/training_reference",
    "irrigation_forecasting/tests",
    "irrigation_forecasting/metadata",

    "disease_detection/artifacts",
    "disease_detection/inference",
    "disease_detection/image_processing",
    "disease_detection/tests",
    "disease_detection/metadata",

    "pest_detection/artifacts",
    "pest_detection/inference",
    "pest_detection/image_processing",
    "pest_detection/tests",
    "pest_detection/metadata",

    "nutrient_deficiency_detection/artifacts",
    "nutrient_deficiency_detection/inference",
    "nutrient_deficiency_detection/image_processing",
    "nutrient_deficiency_detection/tests",
    "nutrient_deficiency_detection/metadata",

    "crop_growth_stage_detection/artifacts",
    "crop_growth_stage_detection/inference",
    "crop_growth_stage_detection/image_processing",
    "crop_growth_stage_detection/tests",
    "crop_growth_stage_detection/metadata",

    "subsidy_recommendation/rules",
    "subsidy_recommendation/engine",
    "subsidy_recommendation/knowledge_base",
    "subsidy_recommendation/tests",
    "subsidy_recommendation/metadata",

    "agricultural_risk_engine/scoring",
    "agricultural_risk_engine/engine",
    "agricultural_risk_engine/tests",
    "agricultural_risk_engine/metadata",

    "farmer_credit_risk/artifacts",
    "farmer_credit_risk/inference",
    "farmer_credit_risk/training_reference",
    "farmer_credit_risk/tests",
    "farmer_credit_risk/metadata",

    "rag_assistant/embeddings",
    "rag_assistant/vector_store",
    "rag_assistant/retriever",
    "rag_assistant/prompts",
    "rag_assistant/pipelines",
    "rag_assistant/tests",
    "rag_assistant/metadata",

    "multilingual_farmer_agent/stt",
    "multilingual_farmer_agent/tts",
    "multilingual_farmer_agent/translation",
    "multilingual_farmer_agent/orchestration",
    "multilingual_farmer_agent/prompts",
    "multilingual_farmer_agent/tests",
    "multilingual_farmer_agent/metadata",

    "agriculture_advisory_agent/planners",
    "agriculture_advisory_agent/tools",
    "agriculture_advisory_agent/orchestrator",
    "agriculture_advisory_agent/prompts",
    "agriculture_advisory_agent/tests",
    "agriculture_advisory_agent/metadata",

    "agriculture_dashboard_intelligence/analytics",
    "agriculture_dashboard_intelligence/aggregations",
    "agriculture_dashboard_intelligence/forecasting",
    "agriculture_dashboard_intelligence/insights",
    "agriculture_dashboard_intelligence/reports"
]

def make_dirs():
    for d in DIRS:
        path = os.path.join(ROOT_DIR, d)
        os.makedirs(path, exist_ok=True)
        # Create empty __init__.py files in code folders
        if not d.endswith("artifacts") and not d.endswith("metadata") and not d.endswith("rules") and not d.endswith("knowledge_base"):
            init_file = os.path.join(path, "__init__.py")
            if not os.path.exists(init_file):
                with open(init_file, "w") as f:
                    pass
    
    # Create top level __init__.py files
    for parent in ["", "common", "api_contracts"]:
        path = os.path.join(ROOT_DIR, parent, "__init__.py")
        if not os.path.exists(path):
            with open(path, "w") as f:
                pass

if __name__ == "__main__":
    make_dirs()
    print("Folders created successfully.")
