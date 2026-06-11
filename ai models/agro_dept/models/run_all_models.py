"""
=============================================================================
MASTER RUNNER — All 6 Agricultural AI Models
Governance API: https://notour-toploftily-carrie.ngrok-free.dev

Usage:
    python run_all_models.py                       # All 6 models
    python run_all_models.py --model 1             # Single model
    python run_all_models.py --district patna --crop Wheat
    python run_all_models.py --demo                # Use cached models
    python run_all_models.py --api-only            # Test API connection only

All models automatically:
  1. Try governance_master_dataset API for training data
  2. Fall back to synthetic data with same schema if API unreachable
  3. Pull district-specific features from API for live prediction
  4. Use live weather from Open-Meteo / WeatherBit / OpenWeatherMap
=============================================================================
"""
import os,sys,time,argparse,warnings
import numpy as np
warnings.filterwarnings("ignore")
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR="/mnt/user-data/outputs"
os.makedirs(f"{OUTPUT_DIR}/saved_models",exist_ok=True)


def banner(title):
    print(f"\n{'═'*60}\n  {title}\n{'═'*60}")


def test_api_connection():
    """Test if governance API is reachable."""
    banner("Testing Governance API Connection")
    from master_data_loader import GovernanceMasterDataset, ENDPOINTS
    gds=GovernanceMasterDataset()
    try:
        df=gds.load_sample(use_cache=False)
        print(f"  ✓ API reachable: {len(df):,} rows loaded")
        gds.summary()
        return True
    except Exception as e:
        print(f"  ✗ API unreachable: {e}")
        print(f"  → Will use synthetic fallback data (same schema)")
        return False


def run_model1(district,crop,area_ha=10,fertilizer=150,irrigation=True,
               soil_ph=6.5,soil_type=2,demo=False):
    banner("MODEL 1 — CROP YIELD (Governance API + RF+GB)")
    t0=time.time(); import joblib
    from model1_crop_yield_prediction import load_and_prepare,train,plot_results,predict_live

    mp=f"{OUTPUT_DIR}/saved_models/m1_rf.pkl"
    if demo and os.path.exists(mp):
        rf=joblib.load(mp); gb=joblib.load(f"{OUTPUT_DIR}/saved_models/m1_gb.pkl")
        sc=joblib.load(f"{OUTPUT_DIR}/saved_models/m1_scaler.pkl")
        fc=joblib.load(f"{OUTPUT_DIR}/saved_models/m1_feat_cols.pkl")
        from master_data_loader import smart_load; _,gds=smart_load(); print("[INFO] Demo: loaded cached")
    else:
        df,fc,gds=load_and_prepare(10000); rf,gb,sc,y_te,y_pred=train(df,fc)
        plot_results(y_te,y_pred,rf,fc,df)
        joblib.dump(rf,mp); joblib.dump(gb,f"{OUTPUT_DIR}/saved_models/m1_gb.pkl")
        joblib.dump(sc,f"{OUTPUT_DIR}/saved_models/m1_scaler.pkl"); joblib.dump(fc,f"{OUTPUT_DIR}/saved_models/m1_feat_cols.pkl")

    result=predict_live(district,crop,area_ha,fertilizer,irrigation,soil_ph,soil_type,rf,gb,sc,fc,gds)
    print(f"\n  ✓ YIELD RESULT:"); [print(f"    {k:<28}: {v}") for k,v in result.items()]
    print(f"  Time: {time.time()-t0:.1f}s"); return result


def run_model2(district,crop_idx=0,season_idx=0,ndvi=0.55,demo=False):
    banner("MODEL 2 — CROP STRESS (Governance API + RFC)")
    t0=time.time(); import joblib
    from model2_stress_detection import load_and_prepare,train,plot_results,predict_live

    mp=f"{OUTPUT_DIR}/saved_models/m2_rfc.pkl"
    if demo and os.path.exists(mp):
        model=joblib.load(mp); sc=joblib.load(f"{OUTPUT_DIR}/saved_models/m2_scaler.pkl")
        fc=joblib.load(f"{OUTPUT_DIR}/saved_models/m2_feat_cols.pkl")
        from master_data_loader import smart_load; _,gds=smart_load()
    else:
        df,fc,gds=load_and_prepare(12000); model,sc,y_te,y_pred,rf_raw=train(df,fc)
        plot_results(y_te,y_pred,rf_raw,df,fc)
        joblib.dump(model,mp); joblib.dump(sc,f"{OUTPUT_DIR}/saved_models/m2_scaler.pkl")
        joblib.dump(fc,f"{OUTPUT_DIR}/saved_models/m2_feat_cols.pkl")

    result=predict_live(district,crop_idx,season_idx,ndvi,model,sc,fc,gds)
    print(f"\n  ✓ STRESS RESULT:"); [print(f"    {k:<26}: {v}") for k,v in result.items() if k!="all_probs"]
    print(f"  Time: {time.time()-t0:.1f}s"); return result


def run_model3(demo_diseases=None):
    banner("MODEL 3 — DISEASE DETECTION (Governance API + Gemini)")
    t0=time.time()
    from model3_disease_detection import get_gemini_remedy,DiseaseFrequencyTracker,get_district_disease_context
    from master_data_loader import smart_load
    _,gds=smart_load(n_fallback=3000)
    tracker=DiseaseFrequencyTracker()
    if demo_diseases is None:
        demo_diseases=[("Tomato___Late_blight","hyderabad"),("Corn___Common_rust","lucknow"),
                        ("Rice___Brown_Spot","patna"),("Wheat___Yellow_Rust","amritsar")]
    results=[]
    for disease,district in demo_diseases:
        gov_ctx=get_district_disease_context(district,gds)
        remedy=get_gemini_remedy(disease,district_context=gov_ctx)
        tracker.record(remedy.get("disease_name",disease),district,gov_ctx)
        alert=tracker.get_alert(remedy.get("disease_name",disease),district)
        print(f"\n  {disease} @ {district}")
        print(f"    Urgency   : {remedy.get('urgency_level')}")
        print(f"    Immediate : {str(remedy.get('immediate_action',''))[:80]}")
        print(f"    Alert     : {alert.upper()}")
        print(f"    Gov context: disease_inc={gov_ctx.get('disease_incidence',0):.1f}% pest_inc={gov_ctx.get('pest_incidence',0):.1f}%")
        results.append({"disease":disease,"district":district,"alert":alert,"gov_ctx":gov_ctx})
    tracker.plot_frequency()
    print(f"\n  Time: {time.time()-t0:.1f}s"); return results


def run_model4(district,crop,days_sowing=45,area_ha=8,elevation_m=120,demo=False):
    banner("MODEL 4 — IRRIGATION (Governance API + HistGBR + FAO-56)")
    t0=time.time(); import joblib
    from model4_irrigation_requirement import load_and_prepare,train,plot_results,predict_live

    mp=f"{OUTPUT_DIR}/saved_models/m4_hgb.pkl"
    if demo and os.path.exists(mp):
        hgb=joblib.load(mp); sc=joblib.load(f"{OUTPUT_DIR}/saved_models/m4_scaler.pkl")
        fc=joblib.load(f"{OUTPUT_DIR}/saved_models/m4_feat_cols.pkl")
        from master_data_loader import smart_load; _,gds=smart_load()
    else:
        df,fc,gds=load_and_prepare(12000); hgb,gbr,sc,y_te,y_pred=train(df,fc)
        plot_results(y_te,y_pred,gbr,df,fc)
        joblib.dump(hgb,mp); joblib.dump(sc,f"{OUTPUT_DIR}/saved_models/m4_scaler.pkl")
        joblib.dump(fc,f"{OUTPUT_DIR}/saved_models/m4_feat_cols.pkl")

    result=predict_live(district,crop,days_sowing,area_ha,elevation_m,hgb,sc,fc,gds)
    print(f"\n  ✓ IRRIGATION RESULT:"); [print(f"    {k:<32}: {v}") for k,v in result.items()]
    print(f"  Time: {time.time()-t0:.1f}s"); return result


def run_model5(district,soil_type_idx=2,ph=6.5,nitrogen=150,organic_matter=1.5,season="Kharif",demo=False):
    banner("MODEL 5 — CROP SUITABILITY (Governance API + XGBoost)")
    t0=time.time(); import joblib
    from model5_crop_suitability import load_and_prepare,train,plot_results,predict_live

    mp=f"{OUTPUT_DIR}/saved_models/m5_xgb.pkl"
    if demo and os.path.exists(mp):
        model=joblib.load(mp); sc=joblib.load(f"{OUTPUT_DIR}/saved_models/m5_scaler.pkl")
        fc=joblib.load(f"{OUTPUT_DIR}/saved_models/m5_feat_cols.pkl")
        from master_data_loader import smart_load; _,gds=smart_load()
    else:
        df,fc,gds=load_and_prepare(15000); model,sc,y_te,y_pred=train(df,fc)
        plot_results(y_te,y_pred,model,df,fc)
        joblib.dump(model,mp); joblib.dump(sc,f"{OUTPUT_DIR}/saved_models/m5_scaler.pkl")
        joblib.dump(fc,f"{OUTPUT_DIR}/saved_models/m5_feat_cols.pkl")

    result=predict_live(district,soil_type_idx,ph,nitrogen,organic_matter,season,model,sc,fc,gds)
    print(f"\n  ✓ SUITABILITY RESULT:")
    for k,v in result.items():
        if k=="top5_ranked": [print(f"      {c:<12} {'█'*int(s/5)} {s:.0f}%") for c,s in v]
        else: print(f"    {k:<28}: {v}")
    print(f"  Time: {time.time()-t0:.1f}s"); return result


def run_model6(district,yield_score,stress_score,irrigation_ir,suit_score,disease_freq,demo=False):
    banner("MODEL 6 — RISK SCORE (Governance API + RF+XGBoost)")
    t0=time.time(); import joblib
    from model6_risk_score import load_and_prepare,train,plot_results,generate_district_risk_map,predict_live

    rf_p=f"{OUTPUT_DIR}/saved_models/m6_rf.pkl"
    if demo and os.path.exists(rf_p):
        rf=joblib.load(rf_p); meta=joblib.load(f"{OUTPUT_DIR}/saved_models/m6_meta.pkl")
        sc=joblib.load(f"{OUTPUT_DIR}/saved_models/m6_scaler.pkl"); fc=joblib.load(f"{OUTPUT_DIR}/saved_models/m6_feat_cols.pkl")
        from master_data_loader import smart_load; _,gds=smart_load()
    else:
        df,fc,gds=load_and_prepare(18000); rf,meta,sc,y_te,y_pred,proba=train(df,fc)
        plot_results(y_te,y_pred,proba,rf,meta,df,fc)
        generate_district_risk_map(rf,meta,sc,fc,gds)
        joblib.dump(rf,rf_p); joblib.dump(meta,f"{OUTPUT_DIR}/saved_models/m6_meta.pkl")
        joblib.dump(sc,f"{OUTPUT_DIR}/saved_models/m6_scaler.pkl"); joblib.dump(fc,f"{OUTPUT_DIR}/saved_models/m6_feat_cols.pkl")

    result=predict_live(district,yield_score,stress_score,irrigation_ir,suit_score,disease_freq,rf,meta,sc,fc,gds)
    print(f"\n  ✓ DISTRICT ADVISORY BULLETIN")
    print(f"  {'='*55}\n  {result['advisory_headline']}")
    print(f"  Risk: {result['risk_level']} ({result['risk_score']:.1f}/100)  Confidence: {result['confidence']*100:.1f}%")
    print(f"\n  Action   : {result['action_required']}")
    print(f"  Insurance: {result['insurance_advisory']}")
    print(f"\n  Component Risks:"); [print(f"    {k:<24}: {v:>5.1f}  {'█'*int(abs(v))}") for k,v in result["component_risks"].items()]
    print(f"\n  Governance API signals:"); [print(f"    {k}: {v}") for k,v in result["governance_api_signals"].items()]
    print(f"  Time: {time.time()-t0:.1f}s"); return result


def main():
    parser=argparse.ArgumentParser(description="Agri Advisory — 6 Models with Governance API")
    parser.add_argument("--model",type=int,default=0,help="0=all, 1-6=specific")
    parser.add_argument("--district",default="chittoor")
    parser.add_argument("--crop",default="Rice")
    parser.add_argument("--demo",action="store_true",help="Use cached models")
    parser.add_argument("--season",default="Kharif")
    parser.add_argument("--api-only",action="store_true",help="Test API only")
    args=parser.parse_args()

    t_start=time.time()
    banner("GOVERNMENT CROP ADVISORY — 6 AI MODELS + GOVERNANCE API")
    print(f"  API    : https://notour-toploftily-carrie.ngrok-free.dev")
    print(f"  Weather: Open-Meteo | WeatherBit | OpenWeatherMap")
    print(f"  Disease: Google Gemini 1.5 Flash")
    print(f"  District: {args.district} | Crop: {args.crop}")

    if args.api_only:
        test_api_connection(); return

    results={}
    if args.model in (0,1): results["m1"]=run_model1(args.district,args.crop,demo=args.demo)
    if args.model in (0,2): results["m2"]=run_model2(args.district,demo=args.demo)
    if args.model in (0,3): results["m3"]=run_model3()
    if args.model in (0,4): results["m4"]=run_model4(args.district,args.crop,demo=args.demo)
    if args.model in (0,5): results["m5"]=run_model5(args.district,season=args.season,demo=args.demo)
    if args.model in (0,6):
        ys=float(results.get("m1",{}).get("predicted_yield",2.5))
        ss=float(results.get("m2",{}).get("stress_score",40))
        ir=float(results.get("m4",{}).get("irrigation_mm_day",5.0))
        su=float(results.get("m5",{}).get("best_score_pct",65))
        df=len(results.get("m3",[]))
        results["m6"]=run_model6(args.district,ys,ss,ir,su,df,demo=args.demo)

    print(f"\n{'═'*60}")
    print(f"  ALL MODELS COMPLETE — Total: {time.time()-t_start:.1f}s")
    print(f"  Plots: {OUTPUT_DIR}/")
    print(f"  Models: {OUTPUT_DIR}/saved_models/")
    print(f"{'═'*60}")


if __name__=="__main__":
    main()
