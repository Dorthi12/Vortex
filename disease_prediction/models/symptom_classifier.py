"""
Model 1 — Community Symptom Detection & Disease Classification
Pipeline: Community Post → Text Preprocessing → Symptom Extraction → Disease Classification
Models: RandomForest + TF-IDF (primary) | Gemini Vision (image fallback)
"""

import re
import json
import pickle
import logging
import base64
import requests
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Optional, Union
from dataclasses import dataclass, asdict

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score
import joblib

import sys
sys.path.append(str(Path(__file__).parent.parent))
from config.settings import (
    GEMINI_API_KEY, GEMINI_API_URL, DISEASE_CLASSES,
    SYMPTOM_KEYWORDS, SYMPTOM_MODEL_PATH, VECTORIZER_PATH, GOVERNANCE_DATASET
)

logger = logging.getLogger(__name__)


# ─── DATA CLASSES ─────────────────────────────────────────────────────────────
@dataclass
class SymptomReport:
    district: str
    symptoms_text: str
    district_lat: Optional[float] = None
    district_lon: Optional[float] = None
    image_base64: Optional[str] = None
    image_mime: str = "image/jpeg"

@dataclass
class DiseaseResult:
    predicted_disease: str
    confidence: float
    district: str
    top_predictions: list
    source: str  # "nlp_model" | "gemini_vision" | "gemini_text_fallback"
    symptoms_extracted: list
    risk_level: str = "UNKNOWN"


# ─── TEXT PREPROCESSING ───────────────────────────────────────────────────────
class SymptomTextPreprocessor:
    """Cleans and normalizes citizen symptom posts in Hindi/English"""

    SYMPTOM_SYNONYMS = {
        "bukhar": "fever", "tapman": "fever", "bukhaar": "fever",
        "khasi": "cough", "khansi": "cough",
        "sar dard": "headache", "sardard": "headache",
        "ulti": "vomiting", "ubkaaee": "vomiting",
        "dast": "diarrhea", "loose motion": "diarrhea",
        "chkkar": "dizziness", "chakkar": "dizziness",
        "skin rash": "skin_rash", "daane": "skin_rash",
        "haath pair dard": "body pain", "body ache": "body_pain",
        "bhookh nahi": "loss_of_appetite", "appetite loss": "loss_of_appetite",
        "pet dard": "stomach_pain", "stomach ache": "stomach_pain",
        "sans lene mein takleef": "breathlessness",
        "thakaan": "fatigue", "weakness": "fatigue",
        "pagalpan": "confusion", "high temperature": "high_fever",
        "yellow eyes": "yellowish_skin", "yellow skin": "yellowish_skin",
        "peeli aankhen": "yellowish_skin",
    }

    STOP_WORDS = {
        "i", "have", "am", "feeling", "experiencing", "suffering",
        "from", "with", "and", "also", "the", "a", "an", "is", "my",
        "mujhe", "hai", "ho", "raha", "kar", "se", "ko", "ka", "ki",
        "days", "since", "past", "last", "week", "ago", "day"
    }

    def preprocess(self, text: str) -> tuple[str, list]:
        """Returns cleaned text and list of extracted symptoms"""
        text = text.lower().strip()

        # Apply synonym mapping
        for synonym, standard in self.SYMPTOM_SYNONYMS.items():
            text = text.replace(synonym, standard)

        # Tokenize and remove stopwords
        tokens = re.findall(r'\b[a-z_]+\b', text)
        tokens = [t for t in tokens if t not in self.STOP_WORDS and len(t) > 2]

        # Extract known symptoms
        extracted = []
        text_joined = " ".join(tokens)
        for symptom in SYMPTOM_KEYWORDS:
            if symptom.replace("_", " ") in text_joined or symptom in text_joined:
                extracted.append(symptom)

        return text_joined, extracted


# ─── MODEL TRAINING ───────────────────────────────────────────────────────────
class SymptomClassifierTrainer:
    """Trains disease classifier from governance dataset"""

    def __init__(self):
        self.preprocessor = SymptomTextPreprocessor()
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=5000,
            min_df=2,
            sublinear_tf=True
        )
        self.label_encoder = LabelEncoder()
        self.model = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            random_state=42,
            n_jobs=-1,
            class_weight='balanced'
        )

    def _build_symptom_disease_corpus(self) -> pd.DataFrame:
        """Build training corpus from governance dataset"""

        # Core symptom-disease mapping (curated medical knowledge)
        corpus = []
        symptom_disease_map = {
            "Malaria": [
                "high fever chills body pain headache sweating vomiting",
                "fever chills nausea muscle pain shivering",
                "periodic fever cold sweating joint pain",
                "high fever vomiting body ache weakness fatigue",
                "chills fever sweating malaise loss_of_appetite",
            ],
            "Dengue": [
                "high fever severe headache joint pain rash vomiting",
                "fever body pain skin rash behind eyes pain",
                "high temperature muscle pain rash platelet low",
                "fever dengue rash hemorrhagic body pain nausea",
                "sudden fever severe headache pain behind eyes rash fatigue",
            ],
            "Typhoid": [
                "prolonged fever stomach pain weakness diarrhea headache",
                "fever loss appetite stomach pain rose spots fatigue",
                "high fever abdominal pain diarrhea weakness malaise",
                "typhoid fever headache stomach pain loss of appetite",
                "continuous fever constipation headache weakness",
            ],
            "Tuberculosis": [
                "persistent cough blood sputum fever night sweats weight loss",
                "cough three weeks fever chills weight loss fatigue",
                "chest pain cough breathlessness fever night sweats",
                "TB cough blood fatigue weight loss appetite loss",
                "prolonged cough fever chills loss weight chest pain",
            ],
            "Pneumonia": [
                "fever cough breathlessness chest pain fatigue chills",
                "high fever productive cough difficulty breathing",
                "chest pain breathing difficulty fever cough mucus",
                "pneumonia fever breathlessness chills sweating cough",
                "severe cough fever chest pain breathing difficulty fatigue",
            ],
            "Jaundice": [
                "yellow skin yellow eyes dark urine fatigue vomiting",
                "yellowish skin jaundice liver pain nausea",
                "yellow eyes skin dark urine loss appetite vomiting",
                "jaundice fatigue stomach pain yellowish skin",
                "yellow eyes abdominal pain fatigue dark urine nausea",
            ],
            "Hepatitis A": [
                "yellow skin fatigue nausea dark urine fever vomiting",
                "jaundice fever nausea abdominal pain liver",
                "hepatitis fever vomiting yellow skin fatigue",
                "dark urine yellow eyes fatigue abdominal pain fever",
                "loss appetite nausea vomiting fever yellow skin",
            ],
            "Hepatitis B": [
                "jaundice fatigue abdominal pain joint pain dark urine",
                "yellow skin dark urine nausea fatigue loss appetite",
                "chronic hepatitis fatigue joint pain liver pain",
                "hepatitis B jaundice fatigue dark urine vomiting",
                "liver disease fatigue abdominal pain yellow skin",
            ],
            "Dengue": [
                "dengue fever platelet rash muscle pain nausea",
                "high fever severe body pain rash bleeding",
                "dengue hemorrhagic fever vomiting rash",
            ],
            "Chicken pox": [
                "itchy blisters rash fever skin spots chickenpox",
                "rash fever blisters skin eruption itching",
                "chickenpox fever blisters all over body itching",
                "varicella rash fever itching blister skin",
                "red spots blisters fever itching fatigue",
            ],
            "Diabetes": [
                "frequent urination excessive thirst fatigue blurred vision weight loss",
                "polyuria polydipsia fatigue weight loss",
                "diabetes thirst urination blurred vision fatigue",
                "high blood sugar fatigue thirst urination",
                "increased urination thirst weakness fatigue",
            ],
            "Hypertension": [
                "headache dizziness chest pain nosebleed shortness breath",
                "high blood pressure headache dizziness blurred vision",
                "hypertension headache chest pain shortness breath",
                "blood pressure headache dizziness palpitations",
                "BP high headache dizziness nosebleed",
            ],
            "Bronchial Asthma": [
                "wheezing breathlessness chest tightness cough",
                "asthma breathlessness cough wheezing chest tightness",
                "difficulty breathing wheezing cough chest pressure",
                "breathlessness wheezing cough night symptoms",
                "asthma attack breathlessness cough wheezing",
            ],
            "Common Cold": [
                "runny nose sneezing cough sore throat mild fever",
                "cold sneezing runny nose cough sore throat",
                "nasal congestion sneezing mild fever sore throat",
                "common cold runny nose sneezing headache fatigue",
                "sore throat cough runny nose sneezing mild fever",
            ],
            "Gastroenteritis": [
                "diarrhea vomiting stomach pain nausea dehydration",
                "loose motions vomiting stomach pain fever",
                "food poisoning diarrhea vomiting nausea stomach cramps",
                "gastro diarrhea vomiting dehydration weakness",
                "stomach infection diarrhea nausea vomiting pain",
            ],
            "Malaria": [
                "malaria fever chills shivering sweating body pain",
                "plasmodium fever rigors sweating anemia",
            ],
            "Heart attack": [
                "chest pain left arm pain sweating breathlessness nausea",
                "severe chest pain pressure breathlessness sweating",
                "heart attack chest pain jaw pain arm pain",
                "crushing chest pain breathlessness sweating vomiting",
                "chest tightness radiating arm pain sweating",
            ],
            "Urinary tract infection": [
                "burning urination frequent urination pelvic pain",
                "UTI burning urination dark urine lower abdominal pain",
                "painful urination frequent urge urination fever",
                "urinary infection burning pain frequent urination",
                "dysuria frequency urgency lower abdominal pain",
            ],
            "Migraine": [
                "severe headache nausea vomiting light sensitivity",
                "throbbing headache one side nausea photophobia",
                "migraine severe headache visual disturbances",
                "pulsating headache nausea vomiting aura",
                "intense headache sensitivity light sound nausea",
            ],
            "Fungal infection": [
                "itching skin rash circular patches ringworm",
                "fungal rash skin itching scaly patches",
                "tinea ringworm itching red patches skin",
                "athlete foot itching fungal infection skin rash",
                "skin fungal itching scaling redness",
            ],
            "Drug Reaction": [
                "skin rash after medication itching hives fever",
                "allergic reaction rash hives swelling medication",
                "drug allergy skin rash itching swelling",
                "medication side effect rash fever chills",
                "drug rash itching hives swelling reaction",
            ],
            "Impetigo": [
                "skin sores red blisters crusty lesions face arms",
                "impetigo contagious skin sores blisters",
                "bacterial skin infection red sores crusty",
                "skin blisters golden crust sores face",
                "contagious skin infection sores blisters honey crust",
            ],
            "Acne": [
                "pimples blackheads whiteheads oily skin face",
                "acne pimples skin inflammation breakout",
                "facial acne blackheads whiteheads inflammation",
                "pimples cysts face back chest oily skin",
                "acne breakout pimples blackheads whiteheads",
            ],
            "Psoriasis": [
                "scaly skin patches red plaques itching silver scales",
                "psoriasis scaling skin red patches joints",
                "thick scaly patches red skin autoimmune",
                "skin plaques scaling itching psoriasis",
                "silvery scales red patches skin psoriasis flare",
            ],
            "Hypothyroidism": [
                "fatigue weight gain cold sensitivity dry skin constipation",
                "hypothyroid fatigue weight gain hair loss",
                "thyroid underactive fatigue cold weight gain",
                "slow metabolism fatigue weight gain constipation",
                "hypothyroidism weakness fatigue weight gain cold",
            ],
            "Hyperthyroidism": [
                "weight loss rapid heartbeat sweating anxiety tremor",
                "hyperthyroid weight loss heat sensitivity trembling",
                "overactive thyroid palpitations weight loss sweating",
                "thyroid rapid heartbeat weight loss anxiety",
                "hyperthyroidism tremor palpitations heat intolerance",
            ],
            "Varicose veins": [
                "swollen twisted veins legs pain aching standing",
                "varicose veins leg swelling pain heaviness",
                "twisted veins legs burning aching cramps",
                "leg vein swelling pain aching heaviness",
                "varicose veins spider veins leg pain swelling",
            ],
            "AIDS": [
                "recurrent infections fever night sweats weight loss fatigue",
                "HIV AIDS opportunistic infections fatigue weight loss",
                "immune deficiency fever weight loss night sweats",
                "AIDS fatigue weight loss fever infections",
                "immunodeficiency recurrent infections fatigue weight loss",
            ],
        }

        for disease, examples in symptom_disease_map.items():
            for example in examples:
                corpus.append({"symptoms_text": example, "disease": disease})

        # Also load from governance dataset if available
        try:
            df = pd.read_csv(GOVERNANCE_DATASET)
            if 'predicted_disease' in df.columns:
                for _, row in df.head(5000).iterrows():
                    if pd.notna(row.get('predicted_disease')):
                        # Create synthetic symptom text from disease name
                        disease = str(row['predicted_disease']).strip()
                        if disease in symptom_disease_map:
                            text = symptom_disease_map[disease][0]
                            corpus.append({"symptoms_text": text, "disease": disease})
        except Exception as e:
            logger.warning(f"Could not load governance dataset: {e}")

        return pd.DataFrame(corpus)

    def train(self) -> dict:
        """Train and save the model"""
        logger.info("Building training corpus...")
        df = self._build_symptom_disease_corpus()

        X = df["symptoms_text"].tolist()
        y = df["disease"].tolist()

        # Encode labels
        y_encoded = self.label_encoder.fit_transform(y)

        # Vectorize
        X_vec = self.vectorizer.fit_transform(X)

        # Split
        X_train, X_test, y_train, y_test = train_test_split(
            X_vec, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
        )

        # Train
        logger.info("Training RandomForest classifier...")
        self.model.fit(X_train, y_train)

        # Evaluate
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        logger.info(f"Model accuracy: {accuracy:.4f}")

        # Save models
        Path(SYMPTOM_MODEL_PATH).parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, SYMPTOM_MODEL_PATH)
        joblib.dump(self.vectorizer, VECTORIZER_PATH)
        joblib.dump(self.label_encoder, SYMPTOM_MODEL_PATH.replace('.pkl', '_labels.pkl'))

        return {
            "accuracy": accuracy,
            "n_classes": len(self.label_encoder.classes_),
            "n_samples": len(X),
            "model_path": SYMPTOM_MODEL_PATH
        }


# ─── INFERENCE ENGINE ─────────────────────────────────────────────────────────
class SymptomDiseaseClassifier:
    """Production inference engine with Gemini fallback"""

    def __init__(self):
        self.preprocessor = SymptomTextPreprocessor()
        self._model = None
        self._vectorizer = None
        self._label_encoder = None
        self._load_or_train()

    def _load_or_train(self):
        """Load saved model or train new one"""
        try:
            self._model = joblib.load(SYMPTOM_MODEL_PATH)
            self._vectorizer = joblib.load(VECTORIZER_PATH)
            self._label_encoder = joblib.load(SYMPTOM_MODEL_PATH.replace('.pkl', '_labels.pkl'))
            logger.info("Loaded pre-trained symptom classifier")
        except FileNotFoundError:
            logger.info("No saved model found. Training new classifier...")
            trainer = SymptomClassifierTrainer()
            trainer.train()
            self._model = trainer.model
            self._vectorizer = trainer.vectorizer
            self._label_encoder = trainer.label_encoder
            logger.info("New classifier trained and saved")

    def _predict_from_text(self, text: str, district: str) -> DiseaseResult:
        """NLP-based prediction pipeline"""
        clean_text, symptoms = self.preprocessor.preprocess(text)

        if not clean_text.strip():
            raise ValueError("No meaningful symptom text found")

        vec = self._vectorizer.transform([clean_text])
        probs = self._model.predict_proba(vec)[0]
        top_indices = np.argsort(probs)[::-1][:5]
        top_predictions = [
            {
                "disease": self._label_encoder.classes_[i],
                "confidence": float(probs[i])
            }
            for i in top_indices
        ]

        predicted = self._label_encoder.classes_[top_indices[0]]
        confidence = float(probs[top_indices[0]])

        return DiseaseResult(
            predicted_disease=predicted,
            confidence=confidence,
            district=district,
            top_predictions=top_predictions,
            source="nlp_model",
            symptoms_extracted=symptoms,
            risk_level=self._get_risk_level(confidence)
        )

    def _predict_from_image(self, image_b64: str, district: str, mime: str = "image/jpeg") -> DiseaseResult:
        """Gemini Vision API for image-based disease detection"""
        prompt = """You are a medical AI assistant helping with disease surveillance in India.
        
Analyze this image and:
1. Identify any visible disease symptoms, skin conditions, rashes, or health indicators
2. Predict the most likely disease from this list: Dengue, Malaria, Typhoid, Tuberculosis, 
   Chicken pox, Impetigo, Fungal infection, Psoriasis, Acne, Drug Reaction, 
   Jaundice, Hepatitis A, Pneumonia, Common Cold, Gastroenteritis, or Other
3. Provide confidence level (0-1)
4. List observed symptoms/signs

Respond ONLY in this JSON format:
{
  "predicted_disease": "Disease Name",
  "confidence": 0.85,
  "observed_signs": ["sign1", "sign2"],
  "top_predictions": [
    {"disease": "Primary Disease", "confidence": 0.85},
    {"disease": "Secondary Disease", "confidence": 0.10}
  ],
  "medical_notes": "Brief clinical observation"
}"""

        payload = {
            "contents": [{
                "parts": [
                    {
                        "inline_data": {
                            "mime_type": mime,
                            "data": image_b64
                        }
                    },
                    {"text": prompt}
                ]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 500,
            }
        }

        url = f"{GEMINI_API_URL}/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()

        result_text = response.json()["candidates"][0]["content"]["parts"][0]["text"]

        # Clean JSON response
        result_text = re.sub(r"```json\n?|```", "", result_text).strip()
        result_data = json.loads(result_text)

        return DiseaseResult(
            predicted_disease=result_data.get("predicted_disease", "Unknown"),
            confidence=float(result_data.get("confidence", 0.5)),
            district=district,
            top_predictions=result_data.get("top_predictions", []),
            source="gemini_vision",
            symptoms_extracted=result_data.get("observed_signs", []),
            risk_level=self._get_risk_level(float(result_data.get("confidence", 0.5)))
        )

    def _gemini_text_fallback(self, text: str, district: str) -> DiseaseResult:
        """Gemini text fallback when local model is uncertain"""
        prompt = f"""You are a medical AI for India disease surveillance.

A citizen from {district} reported: "{text}"

Analyze and predict the disease. Respond ONLY in JSON:
{{
  "predicted_disease": "Disease Name",
  "confidence": 0.80,
  "symptoms_extracted": ["symptom1", "symptom2"],
  "top_predictions": [
    {{"disease": "Primary", "confidence": 0.80}},
    {{"disease": "Secondary", "confidence": 0.15}}
  ]
}}

Possible diseases: Dengue, Malaria, Typhoid, Tuberculosis, Chicken pox, Jaundice, 
Hepatitis A/B, Pneumonia, Common Cold, Gastroenteritis, Diabetes, Hypertension, 
Bronchial Asthma, UTI, Migraine, Fungal infection, or Other."""

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 400}
        }

        url = f"{GEMINI_API_URL}/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        response = requests.post(url, json=payload, timeout=20)
        response.raise_for_status()

        result_text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        result_text = re.sub(r"```json\n?|```", "", result_text).strip()
        result_data = json.loads(result_text)

        return DiseaseResult(
            predicted_disease=result_data.get("predicted_disease", "Unknown"),
            confidence=float(result_data.get("confidence", 0.5)),
            district=district,
            top_predictions=result_data.get("top_predictions", []),
            source="gemini_text_fallback",
            symptoms_extracted=result_data.get("symptoms_extracted", []),
            risk_level=self._get_risk_level(float(result_data.get("confidence", 0.5)))
        )

    def _get_risk_level(self, confidence: float) -> str:
        if confidence >= 0.80:
            return "HIGH_CONFIDENCE"
        elif confidence >= 0.60:
            return "MEDIUM_CONFIDENCE"
        else:
            return "LOW_CONFIDENCE"

    def predict(self, report: SymptomReport) -> DiseaseResult:
        """
        Main prediction entry point.
        - If image provided → Gemini Vision
        - If text provided → NLP model (fallback to Gemini if confidence < 0.5)
        """
        # Case 1: Image-only submission
        if report.image_base64 and not report.symptoms_text.strip():
            logger.info(f"Image-only report from {report.district} → Gemini Vision")
            return self._predict_from_image(
                report.image_base64, report.district, report.image_mime
            )

        # Case 2: Image + text
        if report.image_base64 and report.symptoms_text.strip():
            logger.info(f"Image+text report from {report.district} → Gemini Vision")
            return self._predict_from_image(
                report.image_base64, report.district, report.image_mime
            )

        # Case 3: Text-only → NLP model
        try:
            result = self._predict_from_text(report.symptoms_text, report.district)

            # Fallback to Gemini if confidence is low
            if result.confidence < 0.50:
                logger.info(f"Low confidence ({result.confidence:.2f}) → Gemini fallback")
                try:
                    return self._gemini_text_fallback(report.symptoms_text, report.district)
                except Exception as e:
                    logger.warning(f"Gemini fallback failed: {e}")
                    return result  # Return low-confidence result anyway

            return result

        except Exception as e:
            logger.error(f"NLP prediction failed: {e}")
            # Try Gemini as last resort
            return self._gemini_text_fallback(report.symptoms_text, report.district)


# ─── STANDALONE TRAINING SCRIPT ───────────────────────────────────────────────
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("Training Symptom → Disease Classifier...")
    trainer = SymptomClassifierTrainer()
    results = trainer.train()
    print(f"Training complete: {results}")

    # Quick test
    classifier = SymptomDiseaseClassifier()
    test_report = SymptomReport(
        district="Lucknow",
        symptoms_text="High fever, body pain, headache for 3 days with chills and sweating"
    )
    result = classifier.predict(test_report)
    print(f"\nTest Prediction:")
    print(f"  Disease: {result.predicted_disease}")
    print(f"  Confidence: {result.confidence:.2f}")
    print(f"  Source: {result.source}")
    print(f"  Symptoms: {result.symptoms_extracted}")
