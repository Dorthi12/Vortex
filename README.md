# NETRAVAAH (Vortex)

AI-Powered State Governance, Emergency Command Center, and Citizen Services Platform.

## 📁 Repository Directory Structure Blueprint

Below is the official directory layout for the NETRAVAAH platform. All new directories, modules, components, and services must align with this hierarchy:

```
NETRAVAAH/
│
├── frontend/                     # Next.js Front-end Application
│   ├── public/                   # Public static assets
│   ├── src/
│   │   ├── app/                  # Next.js App Router Pages & Layouts
│   │   │   ├── auth/             # Login, OTP verification, register flows
│   │   │   ├── welcome/          # Welcome portal router
│   │   │   ├── citizen/          # Citizen Portal Routes
│   │   │   │   ├── dashboard/    # Citizen dashboard landing
│   │   │   │   ├── complaints/   # Grievance registration & tracking
│   │   │   │   ├── policies/     # Citizen policy chat & search
│   │   │   │   ├── schemes/      # Government scheme finder
│   │   │   │   ├── alerts/       # Public hazards, weather, & health alerts
│   │   │   │   ├── recommendations/
│   │   │   │   ├── ai-assistant/ # Citizen AI copilot
│   │   │   │   ├── emergency/    # SOS, contacts, & shelter locator
│   │   │   │   ├── bookmarks/
│   │   │   │   ├── notifications/
│   │   │   │   └── profile/
│   │   │   │
│   │   │   ├── government/       # Government Portal Routes
│   │   │   │   ├── dashboard/    # Main operations dashboard
│   │   │   │   ├── complaints/   # Grievance dispatch & resolution
│   │   │   │   ├── policies/     # Draft policy intelligence
│   │   │   │   ├── departments/  # Department performance & allocation
│   │   │   │   ├── resources/    # Inventory & emergency allocation
│   │   │   │   ├── governance/   # Council activities & votings
│   │   │   │   ├── analytics/    # Deep forecasting analytics
│   │   │   │   ├── reports/      # Official reporting & PDF exports
│   │   │   │   ├── audit/        # Operations logs & blockchain trail
│   │   │   │   ├── monitoring/   # SLA and pipeline monitoring
│   │   │   │   ├── leadership/   # Executive leadership overview
│   │   │   │   └── users/        # RBAC user manager
│   │   │   │
│   │   │   ├── command-center/   # Real-time monitoring room
│   │   │   ├── governance-council/# Decisive legislative console
│   │   │   ├── policy-intelligence/# Drafts, compliance, & guidelines
│   │   │   ├── simulations/      # Micro & macro level simulators
│   │   │   ├── digital-twin/     # GIS 3D digital representation
│   │   │   ├── emergency-operations/# Disaster mitigation console
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   │
│   │   ├── components/           # Shared UI components
│   │   ├── layouts/              # Core layout wrappers (Navbar, Sidebar)
│   │   ├── maps/                 # Mapbox & GIS spatial modules
│   │   ├── charts/               # Recharts & analytical visualization
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/             # API connection and fetching
│   │   ├── store/                # Zustand / state management
│   │   ├── lib/                  # Library configurations
│   │   ├── types/                # Typescript typings
│   │   ├── constants/            # Common constants & options
│   │   ├── utils/                # Helper utilities
│   │   └── styles/               # Global CSS styles
│   │
│   └── tests/                    # Frontend test suite
│
├── backend/                      # Central backend API gateway
│   ├── api/
│   ├── auth/
│   ├── users/
│   ├── roles/
│   ├── permissions/
│   ├── complaints/
│   ├── policies/
│   ├── departments/
│   ├── resources/
│   ├── reports/
│   ├── analytics/
│   ├── notifications/
│   ├── workflows/
│   ├── audits/
│   ├── monitoring/
│   ├── gis/
│   ├── websocket/
│   ├── scheduler/
│   ├── middleware/
│   ├── config/
│   ├── services/
│   └── tests/
│
├── citizen_services/             # Microservices for citizen interactions
│   ├── complaints/
│   ├── feedback/
│   ├── recommendations/
│   ├── schemes/
│   ├── alerts/
│   ├── emergency_contacts/
│   ├── subscriptions/
│   ├── bookmarks/
│   ├── profile/
│   └── engagement/
│
├── government_operations/        # Microservices for administration
│   ├── district_admin/
│   ├── state_admin/
│   ├── national_admin/
│   ├── ministries/
│   ├── departments/
│   ├── policy_management/
│   ├── complaint_management/
│   ├── resource_management/
│   ├── budget_management/
│   ├── leadership_panel/
│   ├── mission_tracking/
│   └── performance_tracking/
│
├── ai_engine/                    # Machine learning and AI models
│   ├── domains/
│   │   ├── agriculture/          # Agriculture AI models & pipelines
│   │   │   ├── datasets/
│   │   │   ├── training/
│   │   │   ├── inference/
│   │   │   ├── pipelines/
│   │   │   ├── evaluation/
│   │   │   ├── services/
│   │   │   ├── rules/
│   │   │   ├── tests/
│   │   │   └── models/
│   │   │       ├── crop_yield/
│   │   │       ├── crop_recommendation/
│   │   │       ├── disease_detection/
│   │   │       ├── stress_detection/
│   │   │       ├── fertilizer_advisor/
│   │   │       ├── pest_prediction/
│   │   │       ├── irrigation_planner/
│   │   │       ├── subsidy_advisor/
│   │   │       └── market_intelligence/
│   │   │
│   │   ├── health/               # Epidemic outbreak & load forecasting
│   │   │   ├── datasets/
│   │   │   ├── training/
│   │   │   ├── inference/
│   │   │   ├── services/
│   │   │   └── models/
│   │   │       ├── disease_prediction/
│   │   │       ├── outbreak_forecasting/
│   │   │       ├── hotspot_detection/
│   │   │       ├── hospital_load/
│   │   │       ├── medicine_demand/
│   │   │       ├── vaccination_planning/
│   │   │       ├── ambulance_optimizer/
│   │   │       └── health_risk_index/
│   │   │
│   │   ├── hazard/               # Natural disaster early warnings
│   │   │   ├── datasets/
│   │   │   ├── training/
│   │   │   ├── inference/
│   │   │   ├── services/
│   │   │   └── models/
│   │   │       ├── flood_prediction/
│   │   │       ├── cyclone_prediction/
│   │   │       ├── heatwave_prediction/
│   │   │       ├── landslide_prediction/
│   │   │       ├── risk_scoring/
│   │   │       ├── evacuation_planner/
│   │   │       ├── relief_allocator/
│   │   │       └── damage_assessment/
│   │   │
│   │   ├── infrastructure/       # Bridge, road, and utility failures
│   │   │   ├── datasets/
│   │   │   ├── training/
│   │   │   ├── inference/
│   │   │   ├── services/
│   │   │   └── models/
│   │   │       ├── bridge_risk/
│   │   │       ├── road_risk/
│   │   │       ├── dam_risk/
│   │   │       ├── grid_risk/
│   │   │       ├── maintenance_scheduler/
│   │   │       ├── utility_failure/
│   │   │       └── budget_optimizer/
│   │   │
│   │   ├── economy/
│   │   │   └── models/
│   │   │       ├── employment_forecast/
│   │   │       ├── inflation_monitoring/
│   │   │       ├── revenue_forecast/
│   │   │       ├── economic_health_index/
│   │   │       └── industry_growth_forecast/
│   │   │
│   │   ├── education/
│   │   │   └── models/
│   │   │       ├── dropout_prediction/
│   │   │       ├── school_performance/
│   │   │       ├── teacher_allocation/
│   │   │       └── scholarship_advisor/
│   │   │
│   │   ├── transport/
│   │   │   └── models/
│   │   │       ├── traffic_prediction/
│   │   │       ├── accident_hotspots/
│   │   │       ├── route_optimization/
│   │   │       └── transit_planning/
│   │   │
│   │   ├── environment/
│   │   │   └── models/
│   │   │       ├── air_quality/
│   │   │       ├── water_quality/
│   │   │       ├── deforestation_detection/
│   │   │       ├── waste_management/
│   │   │       └── climate_risk/
│   │   │
│   │   ├── energy/
│   │   │   └── models/
│   │   │       ├── demand_forecast/
│   │   │       ├── renewable_forecast/
│   │   │       ├── grid_stability/
│   │   │       └── carbon_monitoring/
│   │   │
│   │   └── law_order/
│   │       └── models/
│   │           ├── crime_hotspots/
│   │           ├── patrol_allocation/
│   │           ├── emergency_prioritization/
│   │           └── crowd_monitoring/
│   │
│   ├── agents/
│   │   ├── agriculture_agent.py
│   │   ├── health_agent.py
│   │   ├── hazard_agent.py
│   │   ├── infrastructure_agent.py
│   │   ├── economy_agent.py
│   │   ├── education_agent.py
│   │   ├── transport_agent.py
│   │   ├── environment_agent.py
│   │   ├── energy_agent.py
│   │   ├── law_order_agent.py
│   │   └── social_agent.py
│   │
│   ├── governance_council/
│   ├── policy_agent/
│   ├── rag/
│   ├── memory/
│   ├── explainability/
│   ├── trust_reasoning/
│   ├── forecasting/
│   ├── optimization/
│   ├── feature_store/
│   ├── model_registry/
│   ├── data_governance/
│   ├── model_monitoring/
│   └── shared/
│
├── governance_layer/             # Decisive engines and executive approvals
│   ├── governance_council/
│   ├── vote_engine/
│   ├── consensus_engine/
│   ├── risk_aggregator/
│   ├── recommendation_engine/
│   ├── prioritization_engine/
│   ├── executive_agent/
│   ├── strategy_agent/
│   └── human_approval/
│
├── policy_intelligence/          # Policy analytics & circulars engine
│   ├── policies/
│   ├── schemes/
│   ├── circulars/
│   ├── regulations/
│   ├── guidelines/
│   ├── sops/
│   ├── retrieval/
│   ├── ranking/
│   ├── citations/
│   └── policy_analytics/
│
├── knowledge_base/               # Primary repository for documentation
│   ├── policies/
│   ├── schemes/
│   ├── guidelines/
│   ├── research/
│   ├── circulars/
│   ├── reports/
│   ├── regulations/
│   └── archives/
│
├── knowledge_graph/              # Relational Graph (Neo4j / NetworkX)
│   ├── citizens/
│   ├── complaints/
│   ├── departments/
│   ├── policies/
│   ├── resources/
│   ├── infrastructure/
│   ├── districts/
│   ├── states/
│   └── relationships/
│
├── resource_optimization/        # Fleet and inventory optimization
│   ├── inventory/
│   ├── allocation/
│   ├── routing/
│   ├── forecasting/
│   ├── scheduling/
│   ├── optimization/
│   └── simulations/
│
├── simulation_engine/            # Multi-sector simulation runner
│   ├── flood/
│   ├── cyclone/
│   ├── drought/
│   ├── disease/
│   ├── migration/
│   ├── climate/
│   ├── economic/
│   ├── budget/
│   ├── infrastructure/
│   ├── resource/
│   └── population/
│
├── digital_twin/                 # City & State Twin visualization logic
│   ├── district_twin/
│   ├── state_twin/
│   ├── national_twin/
│   ├── population_models/
│   ├── resource_models/
│   ├── infrastructure_models/
│   ├── environmental_models/
│   ├── economic_models/
│   └── simulation_connector/
│
├── command_center/               # Operations command monitors
│   ├── alerts/
│   ├── incidents/
│   ├── monitoring/
│   ├── weather/
│   ├── health/
│   ├── hazards/
│   ├── infrastructure/
│   ├── resources/
│   ├── maps/
│   └── analytics/
│
├── emergency_operations/         # SOS and field team communications
│   ├── incident_management/
│   ├── command_posts/
│   ├── shelters/
│   ├── evacuation/
│   ├── field_teams/
│   ├── coordination/
│   ├── resource_tracking/
│   └── situation_reports/
│
├── notification_engine/          # SMS, WhatsApp, push alerts engine
│   ├── sms/
│   ├── email/
│   ├── whatsapp/
│   ├── push/
│   ├── ivr/
│   ├── templates/
│   ├── campaigns/
│   ├── subscriptions/
│   └── preferences/
│
├── workflow_engine/              # Automated state workflow execution
│   ├── complaint_workflows/
│   ├── policy_workflows/
│   ├── approval_workflows/
│   ├── emergency_workflows/
│   ├── department_workflows/
│   ├── workflow_builder/
│   └── workflow_monitor/
│
├── trust_engine/                 # Explainable AI and trust reports
│   ├── citizen_explanations/
│   ├── officer_explanations/
│   ├── recommendation_reasoning/
│   ├── policy_reasoning/
│   ├── transparency_reports/
│   └── confidence_reports/
│
├── gis_engine/                   # Spatial query and map layer generator
│   ├── geofencing/
│   ├── routing/
│   ├── heatmaps/
│   ├── population_mapping/
│   ├── infrastructure_mapping/
│   ├── spatial_queries/
│   ├── impact_analysis/
│   ├── satellite_layers/
│   └── map_services/
│
├── data_platform/                # Ingestion and Lakehouse storage
│   ├── ingestion/
│   ├── pipelines/
│   ├── catalog/
│   ├── metadata/
│   ├── lineage/
│   ├── governance/
│   ├── quality/
│   ├── validation/
│   ├── archival/
│   └── lakehouse/
│
├── infrastructure/               # Pub/sub, Redis caching, ES configs
│   ├── kafka/
│   │   ├── producers/
│   │   ├── consumers/
│   │   ├── topics/
│   │   ├── schemas/
│   │   ├── streams/
│   │   ├── retry/
│   │   ├── dlq/
│   │   ├── monitoring/
│   │   └── config/
│   │
│   ├── redis/
│   ├── elasticsearch/
│   ├── object-storage/
│   └── observability/
│
├── database/                     # DB migration scripts and setups
│   ├── postgres/
│   ├── redis/
│   ├── vector_db/
│   ├── graph_db/
│   ├── timeseries/
│   ├── migrations/
│   └── backups/
│
├── security/                     # Encryption keys, RBAC, access controls
│   ├── rbac/
│   ├── abac/
│   ├── encryption/
│   ├── secrets/
│   ├── access_control/
│   ├── compliance/
│   ├── audit/
│   └── threat_detection/
│
├── observability/                # Prometheus/Grafana dashboard setups
│   ├── logs/
│   ├── metrics/
│   ├── traces/
│   ├── dashboards/
│   ├── alerts/
│   ├── model_monitoring/
│   ├── kafka_monitoring/
│   ├── uptime/
│   └── sla_tracking/
│
├── integrations/                 # External third-party integrations
│   ├── weather/
│   ├── satellite/
│   ├── maps/
│   ├── agriculture/
│   ├── healthcare/
│   ├── transport/
│   ├── government_apis/
│   ├── social_media/
│   ├── sms/
│   ├── email/
│   └── whatsapp/
│
├── mobile_apps/                  # React Native / Flutter apps
│   ├── citizen_app/
│   ├── official_app/
│   ├── emergency_app/
│   └── field_agent_app/
│
├── public_api/                   # Public developer gateway & SDK
│   ├── gateway/
│   ├── developer_portal/
│   ├── documentation/
│   ├── sdk/
│   └── api_keys/
│
├── tests/                        # Integration, Performance & Security
│   ├── frontend/
│   ├── backend/
│   ├── ai/
│   ├── kafka/
│   ├── integration/
│   ├── e2e/
│   ├── performance/
│   └── security/
│
├── docs/                         # Platform documentation
│   ├── architecture/
│   ├── product/
│   ├── api/
│   ├── database/
│   ├── kafka/
│   ├── ai/
│   ├── deployment/
│   ├── runbooks/
│   ├── diagrams/
│   └── contracts/
│       ├── api-contracts/
│       ├── kafka-contracts/
│       ├── database-schema/
│       ├── user-roles/
│       ├── permissions/
│       ├── department-codes/
│       ├── complaint-categories/
│       └── policy-categories/
│
├── deployment/                   # Docker-compose, K8s, Terraform
│   ├── docker/
│   ├── kubernetes/
│   ├── terraform/
│   ├── nginx/
│   └── github_actions/
│
├── scripts/                      # Setup, migration and training utilities
│   ├── setup/
│   ├── migrations/
│   ├── training/
│   └── maintenance/
│
├── .github/                      # GitHub Actions workflows
├── .env.example                  # Environment variables template
├── docker-compose.yml            # Core container orchestration
├── README.md                     # This file
└── LICENSE
```

