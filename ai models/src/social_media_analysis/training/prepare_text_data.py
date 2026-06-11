"""
prepare_text_data.py
====================
Prepares training data for the BERT text model by:
1. Cleaning and mapping Kaggle grievance dataset
2. Generating synthetic Hindi+English civic complaints
3. Combining both into training_data.csv

Run from social_media_analysis/ folder:
    python training/prepare_text_data.py
"""

import pandas as pd
import re
import os
import random
from collections import Counter

OUTPUT_PATH = "data/training_data.csv"

# -------------------------------------------------
# Issue Categories (same as analysis.py)
# -------------------------------------------------

ISSUE_CATEGORIES = [
    "Water Supply",
    "Road Damage",
    "Electricity",
    "Street Lights",
    "Drainage and Sewage",
    "Flooding",
    "Garbage Collection",
    "Public Toilets",
    "Healthcare",
    "Education",
    "Public Safety",
    "Public Transport",
    "Air Pollution",
    "Water Pollution",
    "Corruption",
    "Government Schemes",
    "Agriculture",
    "Other",
]

ISSUE_TO_IDX = {cat: i for i, cat in enumerate(ISSUE_CATEGORIES)}

SENTIMENT_MAP = {
    "negative": 0,
    "neutral":  1,
    "positive": 2,
}

# -------------------------------------------------
# Step 1 - Kaggle Dataset Label Mapping
# -------------------------------------------------

KAGGLE_LABEL_MAP = {
    "Electricity":          "Electricity",
    "Sanitation":           "Garbage Collection",
    "Public Safety":        "Public Safety",
    "Public Healthcare":    "Healthcare",
    "Public Infrastructure":"Road Damage",
    "Violence":             None,
    "Economics":            None,
}

# Keywords to refine Public Infrastructure mapping
INFRASTRUCTURE_KEYWORDS = {
    "road|pothole|crack|broken road|tarmac|highway|footpath|pavement": "Road Damage",
    "water|pipeline|tap|supply|drinking": "Water Supply",
    "street light|lamp|lighting|light post": "Street Lights",
    "drain|sewer|sewage|gutter|nala": "Drainage and Sewage",
    "bus|auto|transport|metro|train|station": "Public Transport",
    "toilet|sanitation facility|lavatory": "Public Toilets",
    "school|college|education|teacher|classroom": "Education",
}


def clean_text(text: str) -> str:
    """Remove Title:, Grievance:, Introduction: prefixes and clean whitespace."""
    text = re.sub(r"^(Title|Grievance|Introduction|Sub-Heading|Describe the incident|Detail the issue|Reason for grievance)\s*:\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\n+", " ", text)
    text = re.sub(r"\s+", " ", text)
    text = text.strip()
    # Truncate to 512 chars for BERT
    return text[:512]


def map_infrastructure(text: str) -> str:
    """Map Public Infrastructure to specific category based on keywords."""
    text_lower = text.lower()
    for pattern, category in INFRASTRUCTURE_KEYWORDS.items():
        if re.search(pattern, text_lower):
            return category
    return "Road Damage"


def load_kaggle_data(csv_path: str) -> pd.DataFrame:
    """Load and clean Kaggle grievance dataset."""
    print(f"Loading Kaggle dataset from {csv_path}...")
    df = pd.read_csv(csv_path)

    print(f"  Total rows: {len(df)}")
    print(f"  Original labels: {df['label'].value_counts().to_dict()}")

    rows = []
    for _, row in df.iterrows():
        original_label = row["label"].strip()
        mapped_label   = KAGGLE_LABEL_MAP.get(original_label)

        if mapped_label is None:
            continue

        text = clean_text(str(row["text"]))
        if not text or len(text) < 20:
            continue

        if original_label == "Public Infrastructure":
            mapped_label = map_infrastructure(text)

        rows.append({
            "text":      text,
            "issue":     ISSUE_TO_IDX[mapped_label],
            "issue_name":mapped_label,
            "sentiment": 0,
        })

    result = pd.DataFrame(rows)
    print(f"  Usable rows after mapping: {len(result)}")
    print(f"  Mapped distribution: {result['issue_name'].value_counts().to_dict()}")
    return result


# -------------------------------------------------
# Step 2 - Synthetic Data Generation
# -------------------------------------------------

SYNTHETIC_DATA = {
    "Water Supply": [
        "Paani ki supply 3 din se band hai hamare area mein",
        "Water pipeline burst on main road, no supply since morning",
        "Drinking water not available in our colony for 2 days",
        "Nal mein paani nahi aa raha pichle kafi dino se",
        "Water tanker not coming to our area despite complaints",
        "Pipeline leakage on street causing water wastage",
        "No drinking water supply in Sector 14 for 3 days",
        "Jal board ne paani band kar diya bina notice ke",
        "Water pressure very low in our building",
        "Underground water tank broken, supply disrupted",
        "Dirty water coming from taps, not fit for drinking",
        "Municipal water supply irregular and insufficient",
        "Water supply hours reduced without any notice",
        "Bore well not working in our locality",
        "Paani ka pressure bilkul nahi hai ground floor pe bhi",
        "Water supply disrupted due to pipeline work not completed",
        "No water for cooking and drinking since last night",
        "Water supply pipe damaged by construction work nearby",
        "Community tap not functioning for past one week",
        "Request for new water connection not processed for months",
    ],
    "Road Damage": [
        "Sadak bilkul toot gayi hai hamare mohalle mein",
        "Big pothole on main road causing accidents",
        "Road full of potholes after monsoon, very dangerous",
        "Broken road near school, children are at risk",
        "Highway has deep cracks and potholes causing vehicle damage",
        "Road repair work started but never completed",
        "Footpath completely broken, pedestrians walking on road",
        "Speed breaker missing on school zone road",
        "Road drainage blocked causing waterlogging on streets",
        "Heavy vehicles damaged the road surface completely",
        "Divider broken on main road causing accidents",
        "Road marking faded, causing confusion for drivers",
        "Bridge has cracks, needs urgent inspection",
        "Gaadi ka tyre phut gaya pothole ki wajah se",
        "Sadak par bade bade gaddhe hain jisme cycle bhi girta hai",
        "Road not repaired after digging for pipeline work",
        "Accident happened due to bad road condition near signal",
        "Road near hospital is completely broken",
        "Construction debris on road causing blockage",
        "Road not built properly after monsoon repair",
    ],
    "Street Lights": [
        "Street lights not working in our area since 2 weeks",
        "Bijli ke khambhe ka bulb kharab hai puri gali mein andhera",
        "No street lighting on main road at night",
        "Street light pole fallen on road, dangerous situation",
        "Half the street lights not working in our colony",
        "Dark roads at night making it unsafe for women",
        "Street light near park not working for months",
        "Complained multiple times about street light but no action",
        "New street lights installed but never switched on",
        "Solar street light battery dead, needs replacement",
        "Street light timing wrong, switches off at 10 PM",
        "Light pole wire hanging loosely, electric hazard",
        "Entire street dark at night due to faulty lights",
        "Street light near school broken, children unsafe",
        "No lights on highway stretch causing accidents at night",
        "Lamp post damaged by vehicle, not repaired yet",
        "Street lights flickering causing inconvenience",
        "Motion sensor street lights not working properly",
        "Raat ko poori colony mein andhera rehta hai",
        "Street light bill paid but lights still not working",
    ],
    "Drainage and Sewage": [
        "Sewer line choked hai poori colony ki",
        "Drain blocked causing sewage overflow on streets",
        "Sewage water coming out on road due to blocked drain",
        "Nala choked hai, ganda paani sadak pe aa raha hai",
        "Drainage system not cleaned, overflowing in rainy season",
        "Manholes open without cover, dangerous for pedestrians",
        "Sewage smell unbearable in our area",
        "Storm water drain not cleared before monsoon",
        "Drainage pipe broken, sewage leaking underground",
        "Open drain near residential area causing health issues",
        "Nale ki safai nahi hui, barish mein paani bharega",
        "Gutter overflow causing dirty water to enter houses",
        "Manhole cover missing on main road",
        "Drainage construction incomplete, sewage backing up",
        "Blocked drainage causing flooding every time it rains",
        "Sewage treatment plant not working, raw sewage in river",
        "Drain cleaning machine requested but not sent",
        "Choked drain near market causing unhygienic conditions",
        "Underground drainage pipe collapsed on road",
        "Sewage water mixing with drinking water supply",
    ],
    "Flooding": [
        "Barish mein poora mohalla doob jata hai",
        "Waterlogging near underpass, vehicles stuck",
        "Heavy rain caused flooding in our residential area",
        "Street flooded knee deep after just one hour of rain",
        "Flood water entered our homes, huge damage",
        "Drainage system failed, entire area submerged",
        "Low lying area floods every monsoon, no solution",
        "Baarish ke baad sadak par ghutne bhar paani",
        "Flood relief not reaching our area",
        "Road submerged due to overflowing drain",
        "School flooded, children unable to attend",
        "Cars submerged in flood water near apartment",
        "Electricity cut during flooding, dangerous situation",
        "Flood alert ignored by authorities, damage done",
        "Waterlogging in market area destroying businesses",
        "Bridge flooded, locality cut off from main city",
        "Emergency pump not deployed during flooding",
        "Colony flooded for 3 days, no help from municipal",
        "Crops destroyed due to flooding in agricultural land",
        "Barish ka paani nikaas nahi hota hamare area se",
    ],
    "Garbage Collection": [
        "Kachra gaadi 2 hafte se nahi aayi",
        "Garbage not collected for days, stinking badly",
        "Waste overflowing from dustbin near market",
        "Garbage dumped on empty plot by locality residents",
        "No dustbin in our area, garbage thrown on road",
        "Kachra uthane wala nahi aaya pichle hafte se",
        "Municipal garbage van not coming to our street",
        "Waste collection schedule not followed by workers",
        "Large garbage dump near school causing health issues",
        "Plastic waste burning in open area causing pollution",
        "Dead animals not removed from street for days",
        "Garbage collectors demanding bribe for collection",
        "Construction waste dumped on public road",
        "Waste segregation bins not provided in our area",
        "Night soil collection stopped without notice",
        "Garbage piling up outside hospital",
        "Market area stinking due to no waste collection",
        "Kachra nahi utha toh macchar aur bimari hogi",
        "Overflowing dustbin near bus stop",
        "Waste processing plant not operational",
    ],
    "Public Toilets": [
        "Public toilet in our area completely broken",
        "Sarkari shauchalaay mein paani nahi hai",
        "Community toilet not cleaned for weeks",
        "No toilet facility near bus stop",
        "Public toilet locked all the time, useless",
        "Women's toilet in park not maintained",
        "Toilet facility in market area very unhygienic",
        "No public toilet in 2 km radius of our locality",
        "Toilet constructed under scheme but never opened",
        "Public washroom near railway station in terrible condition",
        "Toilet caretaker not present, facility misused",
        "Bio toilet installed but not functional",
        "School toilet not working, children suffering",
        "Sulabh toilet charges too high for daily workers",
        "Public toilet near temple broken since months",
        "No handwashing facility in public toilet",
        "Toilet for disabled persons not accessible",
        "Community toilet used as storage room",
        "Night cleaning of public toilet not done",
        "Toilet in government hospital in very bad condition",
    ],
    "Education": [
        "Sarkari school mein teacher nahi aate regularly",
        "Government school has no proper classroom",
        "Mid day meal not provided in school",
        "School building in dangerous condition, needs repair",
        "No qualified teachers in government school",
        "School library has no books",
        "Students sitting on floor due to no benches",
        "School toilet not working, girls not attending",
        "Scholarship money not received by students",
        "Admission denied unfairly to poor students",
        "School closed frequently without notice",
        "No electricity in school, students suffer in heat",
        "Anganwadi not functioning in our village",
        "Teacher absent for weeks, no substitute arranged",
        "School fees increased without government permission",
        "No computer lab in government school",
        "Sports facility in school completely broken",
        "School boundary wall broken, unsafe for children",
        "Noon meal scheme stopped without any reason",
        "Education quality very poor in government school",
    ],
    "Public Transport": [
        "Bus service stopped on our route without notice",
        "Sarkari bus nahi chalti hamare area mein",
        "Auto drivers charging double the meter fare",
        "Bus stop has no shelter, passengers suffer in rain",
        "Bus frequency very low, waiting for 1 hour",
        "Broken seats in government bus",
        "Metro station lift not working for months",
        "Bus driver rash driving causing accidents",
        "No bus connectivity to hospital from our area",
        "Last bus timing too early, workers stranded",
        "E-rickshaw operators violating traffic rules",
        "Bus stop encroached by vendors",
        "Route changed without informing passengers",
        "Bus passes not issued on time to students",
        "Auto stand relocated without public notice",
        "Night bus service discontinued",
        "Bus conductor misbehaving with passengers",
        "No bus service to villages in rainy season",
        "Broken footboard on government bus",
        "Bus timing app showing wrong information",
    ],
    "Air Pollution": [
        "Factory ke dhuye se saans lena mushkil ho gaya",
        "Air quality very bad in our area due to nearby factory",
        "Stubble burning causing severe air pollution",
        "Construction dust making it difficult to breathe",
        "Smog level very high, children falling sick",
        "Industrial emissions causing air pollution",
        "Garbage burning at dump site polluting air",
        "Brick kiln operating without pollution control",
        "AQI very high, schools should be closed",
        "Diesel generator running 24 hours near homes",
        "Chemical smell from factory unbearable",
        "Dust from road construction not controlled",
        "Pollution from vehicles near school area",
        "PM2.5 levels very high in our locality",
        "No action taken against polluting factories",
        "Hawa mein zeher ghol rahe hain yeh factory wale",
        "Eyes burning due to air pollution in area",
        "Respiratory problems increasing in colony",
        "Smoke from open waste burning affecting residents",
        "No green cover in area, pollution increasing",
    ],
    "Water Pollution": [
        "Nadi mein factory ka ganda paani chhoda ja raha hai",
        "River water polluted by industrial waste",
        "Sewage directly discharged into local water body",
        "Chemical effluent from factory polluting groundwater",
        "Fish dying in river due to pollution",
        "Drinking water source contaminated",
        "Industrial dye waste dumped in canal",
        "Pond near village polluted, cattle falling sick",
        "Chemical smell from tap water",
        "Water test shows dangerous contamination levels",
        "Borewell water turned yellow and smells bad",
        "Open defecation near water source contaminating it",
        "Plastic waste choking local river",
        "Oil spill in water body not cleaned",
        "Pesticide runoff contaminating drinking water",
        "Water body encroached by construction",
        "Algae bloom in lake due to sewage discharge",
        "Dead fish floating in pond near factory",
        "Hospital waste dumped near river",
        "Groundwater level dropping due to overextraction",
    ],
    "Corruption": [
        "Bribe maanga gaya ration card banane ke liye",
        "Government official demanding money for basic services",
        "Ration card application stuck, asked for bribe",
        "Contractor using inferior material in road construction",
        "Scheme money not reaching beneficiaries",
        "False muster roll in MNREGA scheme",
        "Land records tampered by revenue officials",
        "Paise diye toh kaam hota hai warna nahi",
        "Certificate not given without paying unofficial fees",
        "Inspector taking bribe to clear building plan",
        "Ghost beneficiaries in government scheme",
        "PDS dealer selling ration in open market",
        "Road tender given to relative of official",
        "Payment of pension delayed, middleman demanding cut",
        "BPL card given to rich families",
        "Election duty officials taking bribes",
        "Property tax receipts inflated by officials",
        "Scholarship money siphoned by school management",
        "Water connection given only after bribe",
        "Police demanding money to register FIR",
    ],
    "Government Schemes": [
        "PM Awas Yojana ka paisa nahi mila",
        "Ayushman card not issued despite eligibility",
        "MNREGA wages not paid for 3 months",
        "Ujjwala gas connection not provided",
        "Jan Dhan account not opened despite applying",
        "Old age pension stopped without reason",
        "Widow pension not received for months",
        "Soil health card scheme not implemented in village",
        "PM Kisan installment not credited",
        "Scholarship application rejected without reason",
        "Disability certificate not issued",
        "Government scheme benefits given to ineligible people",
        "Ration card not linked to Aadhar despite application",
        "Housing scheme allotment process not transparent",
        "Swachh Bharat toilet money not received",
        "Free electricity scheme not implemented",
        "Antyodaya card not issued to poorest families",
        "Maternity benefit not paid on time",
        "Crop insurance claim rejected without reason",
        "Sarkari yojana ka laabh nahi mil raha",
    ],
    "Agriculture": [
        "Fasal kharab ho gayi aur muavza nahi mila",
        "Irrigation canal not repaired before sowing season",
        "Fertilizer not available at government price",
        "Crop insurance claim pending since 6 months",
        "Mandi not paying fair price for produce",
        "Cold storage not available for vegetables",
        "Pest attack destroyed crops, no government help",
        "Soil testing facility not available in block",
        "Seeds from government store of poor quality",
        "Agricultural loan not sanctioned despite eligibility",
        "Tractor subsidy scheme money not released",
        "Flood damaged crops, compensation not given",
        "Water for irrigation not released from canal",
        "Agricultural extension worker not visiting village",
        "Minimum support price not implemented at local mandi",
        "Hailstorm destroyed crops, no survey done",
        "Farm equipment repair facility not available",
        "Organic farming certification delayed",
        "Kisan mela information not provided to farmers",
        "Drip irrigation subsidy application pending for months",
    ],
    "Other": [
        "Municipal office not responding to complaints",
        "Government helpline number not working",
        "Complaint registered but no action taken",
        "Online grievance portal not working",
        "Unable to reach concerned department",
        "No response from local ward office",
        "Complaint filed multiple times, no resolution",
        "Government employee misbehaving with citizens",
        "RTI application not responded to in time",
        "Public hearing not conducted as required",
        "Sarkari daftar mein koi sunwai nahi hoti",
        "No information board in government office",
        "Long queues in government office, no token system",
        "Document verification taking too long",
        "Helpdesk staff unhelpful and rude",
        "Government notice incomprehensible to common people",
        "Public works department not responding",
        "Emergency response team not available",
        "No local representative accessible to citizens",
        "Application process complicated and confusing",
    ],
}

# Sentiment assignments per category (most civic complaints are negative)
CATEGORY_SENTIMENTS = {
    "Water Supply":        0,
    "Road Damage":         0,
    "Electricity":         0,
    "Street Lights":       0,
    "Drainage and Sewage": 0,
    "Flooding":            0,
    "Garbage Collection":  0,
    "Public Toilets":      0,
    "Healthcare":          0,
    "Education":           0,
    "Public Safety":       0,
    "Public Transport":    0,
    "Air Pollution":       0,
    "Water Pollution":     0,
    "Corruption":          0,
    "Government Schemes":  0,
    "Agriculture":         0,
    "Other":               1,
}


def generate_synthetic_data() -> pd.DataFrame:
    """Generate synthetic Hindi+English civic complaint data."""
    print("Generating synthetic training data...")
    rows = []

    for category, texts in SYNTHETIC_DATA.items():
        sentiment = CATEGORY_SENTIMENTS.get(category, 0)
        for text in texts:
            rows.append({
                "text":      text,
                "issue":     ISSUE_TO_IDX[category],
                "issue_name":category,
                "sentiment": sentiment,
            })

    df = pd.DataFrame(rows)
    print(f"  Generated {len(df)} synthetic rows")
    print(f"  Distribution: {df['issue_name'].value_counts().to_dict()}")
    return df


# -------------------------------------------------
# Step 3 - Combine and Save
# -------------------------------------------------

def prepare_text_data():
    print("")
    print("=" * 55)
    print("NETRAVAAH - Text Data Preparation")
    print("=" * 55)

    all_dfs = []

    # Load Kaggle data if available
    kaggle_path = "data/raw data/fine_tuning_grievances.csv"
    if os.path.exists(kaggle_path):
        kaggle_df = load_kaggle_data(kaggle_path)
        all_dfs.append(kaggle_df)
    else:
        print(f"Kaggle dataset not found at {kaggle_path}")
        print("Place fine_tuning_grievances.csv in data/raw data/")
        print("Proceeding with synthetic data only...")

    # Generate synthetic data
    synthetic_df = generate_synthetic_data()
    all_dfs.append(synthetic_df)

    # Combine
    combined = pd.concat(all_dfs, ignore_index=True)
    combined  = combined.drop_duplicates(subset=["text"])
    combined  = combined.sample(frac=1, random_state=42).reset_index(drop=True)

    # Save only columns needed for training
    output_df = combined[["text", "issue", "sentiment"]].copy()
    os.makedirs("data", exist_ok=True)
    output_df.to_csv(OUTPUT_PATH, index=False)

    print("")
    print("=" * 55)
    print("COMPLETE - Final Summary")
    print("=" * 55)
    print(f"  Total rows       : {len(output_df)}")
    print(f"  Output saved to  : {OUTPUT_PATH}")
    print("")
    print(f"  {'Category':<25} {'Count':>5}")
    print(f"  {'-'*35}")
    for issue_name, count in combined["issue_name"].value_counts().items():
        print(f"  {issue_name:<25} {count:>5}")

    print("")
    print("Next step - run:")
    print("  python training/prepare_dataset.py --mode text")
    print("=" * 55)


if __name__ == "__main__":
    prepare_text_data()
