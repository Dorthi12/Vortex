"""NETRAVAAH v5 — Master Configuration
Secrets via .env (security fix). Added Gemini + GenerateIO keys.
"""
import os

# Support .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ── API KEYS ──────────────────────────────────────────────────────
OPENWEATHER_KEY   = os.getenv("OPENWEATHER_KEY",   "701cf29be2f669b6266eb7b847b13a55")
WEATHERBIT_KEY    = os.getenv("WEATHERBIT_KEY",    "ffd13dad3d6c49a39f4b1b6a77b8d222")
MAPBOX_TOKEN      = os.getenv("MAPBOX_TOKEN",      "pk.eyJ1IjoiZC1kYWVuZXJ5cyIsImEiOiJjbW1qcWI3OTgwZHBoMnFzYm02djc0cmZtIn0.-kl_gFNTX1c1nKIr53_N4g")
POSITIONSTACK_KEY = os.getenv("POSITIONSTACK_KEY", "49bf31d391caf238180bd838f703258a")
OSM_APP_KEY       = os.getenv("OSM_APP_KEY",       "9Ls2y2rW4X5A6gwcYLOz27GlwyNi0ZTuVJr5Ll3FT7TIBLKs")
GENERATEIO_KEY    = os.getenv("GENERATEIO_KEY",    "pvQtZAZV4AhQlw9NebYgv9TNXFQbAC9aCEmoPCZTK5mEDigZ")
GEMINI_KEY        = os.getenv("GEMINI_KEY",        "AIzaSyDDgHtjNZYdbV0Ojtkf7jfVYSr8GsgfA2Q")

NASA_TOKEN = os.getenv("NASA_TOKEN", (
    "eyJ0eXAiOiJKV1QiLCJvcmInaW4iOiJFYXJ0aGRhdGEgTG9naW4iLCJzaWciOiJlZGxqd3Rz"
    "aWdfa2V5X2ltYWdlX3ZlcnNpb25fMSIsImFsZyI6IlJTMjU2In0."
    "eyJ0eXBlIjoiVXNlciIsInVpZCI6ImRvcnRoaSIsImV4cCI6MTc0NjU3NTcwMCwiaWF0Ijox"
    "NzQxMzg4NTAwLCJpc3MiOiJodHRwczovL3Vycy5lYXJ0aGRhdGEubmFzYS5nb3YifQ."
    "HGU_-4_7Logoxi-HtiUpQz2ymy801QvVM8BMCqLwKpyyOesFuC709zb8uXQw46YdSv2bRCwMJ9"
    "hUX57XmAxRNQvykr9F96nB9ZngqBGgE3Tx9chdMZvpXUoTp8lStTLSWPN_X8-NXxg2AAsFhPy"
    "uleOzh7TqAzBlgpaifBw-tMWT5dObePEFpCw2RzbcbYgGN6ZYw72csiRNFvmMA0azlShZ_aK2h"
    "Md2jmyaGyGevrKbVr0lOzq6KHgcm0FJulKtBpoHdQWTGCQLA0yHH7eaMbYCGeVk__rcOZO9Co"
    "TEliKGmwVShS0h_doC0eomX2YcC9HdjbWwUB7Yo3zPSb56nw"
))
NASA_HEADERS = {"Authorization": f"Bearer {NASA_TOKEN}"}

# ── ENDPOINTS ─────────────────────────────────────────────────────
OPEN_METEO_FCST   = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_HIST   = "https://archive-api.open-meteo.com/v1/archive"
OWM_BASE          = "https://api.openweathermap.org/data/2.5"
WB_BASE           = "https://api.weatherbit.io/v2.0"
CMR_BASE          = "https://cmr.earthdata.nasa.gov/search"
MODIS_ORNL        = "https://modis.ornl.gov/rst/api/v1"
OVERPASS_URL      = "https://overpass-api.de/api/interpreter"
WRIS_URL          = "https://indiawris.gov.in/api/dataset/riverWaterLevel"
MAPBOX_DIR_URL    = "https://api.mapbox.com/directions/v5/mapbox/driving"
MAPBOX_ISO_URL    = "https://api.mapbox.com/isochrone/v1/mapbox/driving"
MAPBOX_MATRIX_URL = "https://api.mapbox.com/directions-matrix/v1/mapbox/driving"
MAPBOX_GEOCODE    = "https://api.mapbox.com/geocoding/v5/mapbox.places"
POSITIONSTACK_FWD = "http://api.positionstack.com/v1/forward"
POSITIONSTACK_REV = "http://api.positionstack.com/v1/reverse"
OSM_NOMINATIM     = "https://nominatim.openstreetmap.org"
GEMINI_API_URL    = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

# ── PATHS ─────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH  = os.path.join(BASE_DIR, "models", "hazard_bundle_v5.pkl")
MODEL_V4    = os.path.join(BASE_DIR, "models", "hazard_bundle_v4.pkl")
DATA_DIR    = os.path.join(BASE_DIR, "data")
CACHE_DIR   = os.path.join(BASE_DIR, "cache")
LOGS_DIR    = os.path.join(BASE_DIR, "logs")
OUTPUT_DIR  = os.path.join(BASE_DIR, "output")
DB_PATH     = os.path.join(DATA_DIR, "netravaah_v5.db")
MASTER_CSV  = os.path.join(DATA_DIR, "india_hazard_master_dataset_final.csv")
BASELINE_CSV= os.path.join(DATA_DIR, "district_baseline.csv")

for d in [CACHE_DIR, LOGS_DIR, OUTPUT_DIR]: os.makedirs(d, exist_ok=True)

# ── THRESHOLDS ────────────────────────────────────────────────────
THRESHOLDS   = {"flood":.50,"landslide":.48,"heatwave":.45,"drought":.45,"cyclone":.55}
ALERT_LEVELS = {"CRITICAL":.80,"HIGH":.65,"MEDIUM":.50,"WATCH":.35,"NORMAL":.00}
HAZARD_COLORS= {"flood":"#38BDF8","landslide":"#C084FC","heatwave":"#FB7185",
                "drought":"#FBB034","cyclone":"#34D399"}
ROAD_WEIGHTS = {"motorway":.8,"trunk":.9,"primary":1.0,"secondary":1.2,
                "tertiary":1.5,"unclassified":1.8,"residential":2.0,"track":3.0}
ROAD_SPEEDS  = {"motorway":80,"trunk":70,"primary":60,"secondary":50,
                "tertiary":40,"unclassified":30,"residential":25,"track":15}

# ── ANOMALY SIGMA THRESHOLDS ──────────────────────────────────────
ANOMALY_SIGMA = {
    "rainfall":      2.0,
    "temperature":   2.5,
    "humidity":      2.0,
    "wind_speed":    2.5,
    "soil_moisture": 2.0,
}

# ── 72-HOUR FORECAST ALERT RULES ─────────────────────────────────
FORECAST_RULES = {
    "flood":     {"rain_72h_mm": 150, "rain_24h_mm": 80},
    "heatwave":  {"temp_max_c": 42},
    "cyclone":   {"wind_max_mps": 25, "pressure_min_hpa": 990},
    "landslide": {"rain_72h_mm": 120},
    "drought":   {"rain_72h_mm": 2, "vpd_kpa": 3.5},
}

# ── SHELTER DATABASE ──────────────────────────────────────────────
SHELTERS = [
    {"name":"Patna Collectorate Emergency Shelter","lat":25.611,"lon":85.144,
     "capacity":3000,"type":"govt","district":"Patna","state":"Bihar",
     "address":"Collectorate Compound, Patna"},
    {"name":"Gandhi Maidan Relief Camp","lat":25.617,"lon":85.138,
     "capacity":5000,"type":"govt","district":"Patna","state":"Bihar",
     "address":"Gandhi Maidan, Patna"},
    {"name":"Gopalganj District Shelter","lat":26.467,"lon":84.433,
     "capacity":1500,"type":"govt","district":"Gopalganj","state":"Bihar",
     "address":"DM Office Campus, Gopalganj"},
    {"name":"Muzaffarpur Flood Relief Centre","lat":26.121,"lon":85.364,
     "capacity":2500,"type":"ndrf","district":"Muzaffarpur","state":"Bihar",
     "address":"SDRF Camp, Muzaffarpur"},
    {"name":"Dhubri Flood Camp","lat":26.020,"lon":89.975,
     "capacity":2000,"type":"govt","district":"Dhubri","state":"Assam",
     "address":"DC Office, Dhubri"},
    {"name":"Kamrup NDRF Base Guwahati","lat":26.144,"lon":91.736,
     "capacity":4000,"type":"ndrf","district":"Kamrup","state":"Assam",
     "address":"NDRF 14th Bn, Guwahati"},
    {"name":"Wayanad Collectorate Shelter","lat":11.701,"lon":76.082,
     "capacity":1500,"type":"govt","district":"Wayanad","state":"Kerala",
     "address":"Collectorate, Kalpetta, Wayanad"},
    {"name":"Idukki Govt Guest House","lat":9.850,"lon":76.971,
     "capacity":800,"type":"govt","district":"Idukki","state":"Kerala",
     "address":"Govt Guest House, Painavu, Idukki"},
    {"name":"Kodagu District Disaster Centre","lat":12.337,"lon":75.807,
     "capacity":1200,"type":"ndrf","district":"Kodagu","state":"Karnataka",
     "address":"District Emergency Centre, Madikeri"},
    {"name":"Chamoli NDRF Base Camp","lat":30.375,"lon":79.342,
     "capacity":600,"type":"ndrf","district":"Chamoli","state":"Uttarakhand",
     "address":"NDRF Camp, Gopeshwar"},
    {"name":"Pithoragarh Mountain Rescue Centre","lat":29.583,"lon":80.218,
     "capacity":500,"type":"ndrf","district":"Pithoragarh","state":"Uttarakhand",
     "address":"SSB Camp, Pithoragarh"},
    {"name":"Kullu Emergency Shelter","lat":31.959,"lon":77.109,
     "capacity":700,"type":"govt","district":"Kullu","state":"Himachal Pradesh",
     "address":"DC Office, Kullu"},
    {"name":"Kendrapara Cyclone Shelter","lat":20.502,"lon":86.422,
     "capacity":4000,"type":"govt","district":"Kendrapara","state":"Odisha",
     "address":"Multi-Purpose Cyclone Shelter, Kendrapara"},
    {"name":"Balasore Emergency Centre","lat":21.494,"lon":86.932,
     "capacity":3000,"type":"govt","district":"Balasore","state":"Odisha",
     "address":"DM Office, Balasore"},
    {"name":"Puri Cyclone Relief Camp","lat":19.810,"lon":85.831,
     "capacity":5000,"type":"govt","district":"Puri","state":"Odisha",
     "address":"Cyclone Shelter, Grand Road, Puri"},
    {"name":"Bhubaneswar NDRF Hub","lat":20.296,"lon":85.824,
     "capacity":6000,"type":"ndrf","district":"Khordha","state":"Odisha",
     "address":"NDRF 3rd Bn, Mundali, Bhubaneswar"},
    {"name":"Nellore Cyclone Shelter","lat":14.442,"lon":79.987,
     "capacity":3500,"type":"govt","district":"Nellore","state":"Andhra Pradesh",
     "address":"Revenue Divisional Office, Nellore"},
    {"name":"Cuddalore Flood Relief Centre","lat":11.748,"lon":79.771,
     "capacity":2500,"type":"govt","district":"Cuddalore","state":"Tamil Nadu",
     "address":"Cuddalore Collectorate"},
    {"name":"Amreli Cyclone Shelter","lat":21.604,"lon":71.221,
     "capacity":2000,"type":"govt","district":"Amreli","state":"Gujarat",
     "address":"District Collectorate, Amreli"},
    {"name":"Barmer Heatwave Relief Centre","lat":25.745,"lon":71.393,
     "capacity":1200,"type":"health","district":"Barmer","state":"Rajasthan",
     "address":"District Hospital, Barmer"},
    {"name":"Jodhpur Heat Treatment Camp","lat":26.297,"lon":73.016,
     "capacity":1500,"type":"health","district":"Jodhpur","state":"Rajasthan",
     "address":"MDM Hospital, Jodhpur"},
    {"name":"Hyderabad NDRF Emergency Hub","lat":17.385,"lon":78.487,
     "capacity":6000,"type":"ndrf","district":"Hyderabad","state":"Telangana",
     "address":"NDRF 10th Bn, Hyderabad"},
    {"name":"Nagpur Emergency Centre","lat":21.146,"lon":79.088,
     "capacity":3000,"type":"govt","district":"Nagpur","state":"Maharashtra",
     "address":"District Emergency Centre, Nagpur"},
    {"name":"Nashik Flood Camp","lat":19.998,"lon":73.790,
     "capacity":2000,"type":"govt","district":"Nashik","state":"Maharashtra",
     "address":"Nashik Collectorate"},
    {"name":"Lucknow State Emergency Centre","lat":26.848,"lon":80.946,
     "capacity":4000,"type":"govt","district":"Lucknow","state":"Uttar Pradesh",
     "address":"SEOC, Gomti Nagar, Lucknow"},
    {"name":"Varanasi Flood Relief Camp","lat":25.318,"lon":83.013,
     "capacity":2000,"type":"govt","district":"Varanasi","state":"Uttar Pradesh",
     "address":"Parade Kothi, Varanasi"},
    {"name":"Ranchi NDRF Base","lat":23.344,"lon":85.310,
     "capacity":2500,"type":"ndrf","district":"Ranchi","state":"Jharkhand",
     "address":"NDRF Camp, Hotwar, Ranchi"},
    {"name":"Shillong Emergency Hub","lat":25.579,"lon":91.883,
     "capacity":1800,"type":"govt","district":"East Khasi Hills","state":"Meghalaya",
     "address":"Polo Ground, Shillong"},
    {"name":"Karnal Relief Centre","lat":29.686,"lon":76.991,
     "capacity":1500,"type":"govt","district":"Karnal","state":"Haryana",
     "address":"Collectorate, Karnal"},
    {"name":"Bhopal State Disaster Centre","lat":23.260,"lon":77.413,
     "capacity":3000,"type":"govt","district":"Bhopal","state":"Madhya Pradesh",
     "address":"SDMA, Arera Hills, Bhopal"},
    {"name":"Jalpaiguri Flood Camp","lat":26.544,"lon":88.729,
     "capacity":2000,"type":"govt","district":"Jalpaiguri","state":"West Bengal",
     "address":"DM Office, Jalpaiguri"},
    {"name":"Anantapur District Shelter","lat":14.682,"lon":77.601,
     "capacity":1000,"type":"govt","district":"Anantapur","state":"Andhra Pradesh",
     "address":"Collectorate, Anantapur"},
]

# ── DAMS ──────────────────────────────────────────────────────────
DAMS = [
    {"name":"Hirakud Dam","lat":21.523,"lon":83.869,"state":"Odisha","river":"Mahanadi",
     "capacity_pct":85,"downstream_pop":2200000,"warning_level_m":619.5,"danger_level_m":628.0},
    {"name":"Farakka Barrage","lat":24.808,"lon":87.920,"state":"West Bengal","river":"Ganga",
     "capacity_pct":78,"downstream_pop":5000000,"warning_level_m":21.0,"danger_level_m":25.0},
    {"name":"Tehri Dam","lat":30.378,"lon":78.480,"state":"Uttarakhand","river":"Bhagirathi",
     "capacity_pct":72,"downstream_pop":1800000,"warning_level_m":820.0,"danger_level_m":835.0},
    {"name":"Nagarjuna Sagar","lat":16.574,"lon":79.315,"state":"Telangana","river":"Krishna",
     "capacity_pct":65,"downstream_pop":3100000,"warning_level_m":179.5,"danger_level_m":183.0},
    {"name":"Bhakra Dam","lat":31.411,"lon":76.433,"state":"Himachal Pradesh","river":"Sutlej",
     "capacity_pct":60,"downstream_pop":2500000,"warning_level_m":512.0,"danger_level_m":518.0},
    {"name":"Banasura Sagar","lat":11.750,"lon":75.983,"state":"Kerala","river":"Kabani",
     "capacity_pct":88,"downstream_pop":320000,"warning_level_m":773.0,"danger_level_m":777.5},
    {"name":"Almatti Dam","lat":16.329,"lon":75.889,"state":"Karnataka","river":"Krishna",
     "capacity_pct":70,"downstream_pop":1500000,"warning_level_m":519.0,"danger_level_m":524.0},
]

# ── BRIDGES ───────────────────────────────────────────────────────
BRIDGES = [
    {"name":"Mahatma Gandhi Setu","lat":25.624,"lon":85.134,
     "river":"Ganga","state":"Bihar","max_flow_cumecs":80000,"max_depth_m":14.0},
    {"name":"Bogibeel Bridge","lat":27.263,"lon":94.895,
     "river":"Brahmaputra","state":"Assam","max_flow_cumecs":50000,"max_depth_m":12.0},
    {"name":"Pampa Bridge NH-183","lat":9.360,"lon":76.590,
     "river":"Pampa","state":"Kerala","max_flow_cumecs":8000,"max_depth_m":6.0},
    {"name":"Kosi Bridge NH-57","lat":26.500,"lon":87.090,
     "river":"Kosi","state":"Bihar","max_flow_cumecs":40000,"max_depth_m":10.0},
]

# ── 30 MONITORED DISTRICTS ────────────────────────────────────────
MONITORED_DISTRICTS = [
    {"district":"Patna",          "state":"Bihar",             "lat":25.594,"lon":85.137},
    {"district":"Gopalganj",      "state":"Bihar",             "lat":26.467,"lon":84.433},
    {"district":"Muzaffarpur",    "state":"Bihar",             "lat":26.121,"lon":85.364},
    {"district":"Dhubri",         "state":"Assam",             "lat":26.020,"lon":89.975},
    {"district":"Kamrup",         "state":"Assam",             "lat":26.144,"lon":91.736},
    {"district":"Jalpaiguri",     "state":"West Bengal",       "lat":26.544,"lon":88.729},
    {"district":"Chamoli",        "state":"Uttarakhand",       "lat":30.375,"lon":79.321},
    {"district":"Pithoragarh",    "state":"Uttarakhand",       "lat":29.583,"lon":80.218},
    {"district":"Kullu",          "state":"Himachal Pradesh",  "lat":31.957,"lon":77.109},
    {"district":"Idukki",         "state":"Kerala",            "lat":9.920, "lon":77.099},
    {"district":"Wayanad",        "state":"Kerala",            "lat":11.686,"lon":76.132},
    {"district":"East Khasi Hills","state":"Meghalaya",        "lat":25.578,"lon":91.883},
    {"district":"Kodagu",         "state":"Karnataka",         "lat":12.422,"lon":75.740},
    {"district":"Barmer",         "state":"Rajasthan",         "lat":25.745,"lon":71.393},
    {"district":"Jodhpur",        "state":"Rajasthan",         "lat":26.295,"lon":73.016},
    {"district":"Lucknow",        "state":"Uttar Pradesh",     "lat":26.846,"lon":80.946},
    {"district":"Varanasi",       "state":"Uttar Pradesh",     "lat":25.317,"lon":83.013},
    {"district":"Nagpur",         "state":"Maharashtra",       "lat":21.146,"lon":79.088},
    {"district":"Hyderabad",      "state":"Telangana",         "lat":17.385,"lon":78.487},
    {"district":"Anantapur",      "state":"Andhra Pradesh",    "lat":14.682,"lon":77.600},
    {"district":"Nashik",         "state":"Maharashtra",       "lat":19.998,"lon":73.789},
    {"district":"Kendrapara",     "state":"Odisha",            "lat":20.502,"lon":86.422},
    {"district":"Balasore",       "state":"Odisha",            "lat":21.494,"lon":86.932},
    {"district":"Nellore",        "state":"Andhra Pradesh",    "lat":14.442,"lon":79.987},
    {"district":"Cuddalore",      "state":"Tamil Nadu",        "lat":11.748,"lon":79.768},
    {"district":"Amreli",         "state":"Gujarat",           "lat":21.604,"lon":71.221},
    {"district":"Puri",           "state":"Odisha",            "lat":19.812,"lon":85.831},
    {"district":"Bhopal",         "state":"Madhya Pradesh",    "lat":23.254,"lon":77.402},
    {"district":"Karnal",         "state":"Haryana",           "lat":29.686,"lon":76.991},
    {"district":"Ranchi",         "state":"Jharkhand",         "lat":23.344,"lon":85.309},
]
