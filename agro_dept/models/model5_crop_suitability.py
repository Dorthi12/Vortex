"""
=============================================================================
MODEL 5 — CROP SUITABILITY  [Governance API Integration]
Algorithm : XGBoost Classifier (+ sklearn fallback)
Training  : governance_master_dataset soil + climate + production cols
Live      : Open-Meteo + OpenWeatherMap + Governance API
=============================================================================
"""
import os,sys,warnings,requests
import numpy as np,pandas as pd
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split,StratifiedKFold,cross_val_score
from sklearn.metrics import accuracy_score,f1_score,classification_report
import joblib

sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from master_data_loader import smart_load

try:
    from xgboost import XGBClassifier; XGB_AVAILABLE=True
except ImportError:
    from sklearn.ensemble import GradientBoostingClassifier; XGB_AVAILABLE=False
    print("[WARN] XGBoost not installed. Using GBClassifier.")

warnings.filterwarnings("ignore"); np.random.seed(42)
OPEN_METEO_URL="https://api.open-meteo.com/v1/forecast"
OPENWEATHER_URL="https://api.openweathermap.org/data/2.5/weather"
OPENWEATHER_KEY="701cf29be2f669b6266eb7b847b13a55"
OUTPUT_DIR="/mnt/user-data/outputs"
os.makedirs(f"{OUTPUT_DIR}/saved_models",exist_ok=True)

CROPS=["Rice","Wheat","Maize","Sugarcane","Cotton","Soybean","Groundnut","Mustard","Pulses","Vegetables","Sorghum","Barley"]
INDIA_COORDS={"chittoor":(13.21,79.10),"delhi":(28.67,77.21),"patna":(25.61,85.14),
              "lucknow":(26.85,80.95),"jaipur":(26.91,75.79),"hyderabad":(17.38,78.49),
              "mumbai":(19.07,72.88),"kolkata":(22.57,88.36),"amritsar":(31.63,74.87)}

PROFILES={"Rice":{"temp":(20,35),"rain":(900,2500),"ph":(5.5,7.0),"soils":[7,3,6,2]},
           "Wheat":{"temp":(10,25),"rain":(400,900),"ph":(6.0,7.5),"soils":[1,2,3,7]},
           "Maize":{"temp":(18,32),"rain":(600,1200),"ph":(5.8,7.0),"soils":[2,1,3]},
           "Sugarcane":{"temp":(20,35),"rain":(1200,2500),"ph":(6.0,7.5),"soils":[2,3,7,5]},
           "Cotton":{"temp":(21,37),"rain":(500,1000),"ph":(6.0,8.0),"soils":[5,2,3]},
           "Soybean":{"temp":(20,30),"rain":(600,1200),"ph":(6.0,7.0),"soils":[2,1,3]},
           "Groundnut":{"temp":(22,35),"rain":(500,1200),"ph":(5.5,7.0),"soils":[0,1,6,2]},
           "Mustard":{"temp":(10,25),"rain":(300,750),"ph":(6.0,7.5),"soils":[2,1,7]},
           "Pulses":{"temp":(15,30),"rain":(400,900),"ph":(6.0,7.5),"soils":[2,1,5,7]},
           "Vegetables":{"temp":(15,30),"rain":(600,1500),"ph":(5.8,7.2),"soils":[2,1,3,7]},
           "Sorghum":{"temp":(25,40),"rain":(400,900),"ph":(5.5,8.0),"soils":[2,4,5,6,1]},
           "Barley":{"temp":(8,24),"rain":(300,800),"ph":(6.0,8.0),"soils":[2,1,3,7]}}

FEAT_COLS=["mean_temp","annual_rainfall","humidity","soil_ph","soil_type_idx",
           "elevation","fertilizer_kg_ha","ndvi","crop_idx",
           # API extras
           "rainfall_anomaly","drought_index","population_density",
           "production_efficiency","irrigation_pct","temp_anomaly"]


def suitability_score(crop,temp,rain,ph,soil_idx):
    p=PROFILES.get(crop,PROFILES["Rice"]); score=100.0
    t1,t2=p["temp"]; r1,r2=p["rain"]; p1,p2=p["ph"]
    if temp<t1: score-=min(40,(t1-temp)*4)
    if temp>t2: score-=min(40,(temp-t2)*4)
    if rain<r1: score-=min(35,(r1-rain)/25)
    if rain>r2: score-=min(25,(rain-r2)/40)
    if ph<p1: score-=min(20,(p1-ph)*8)
    if ph>p2: score-=min(20,(ph-p2)*8)
    if soil_idx in p["soils"]: score+=5
    else: score-=10
    return max(0,min(100,score))


def fetch_live_climate(lat,lon):
    result={}
    try:
        r=requests.get(OPENWEATHER_URL,timeout=8,params={"lat":lat,"lon":lon,"appid":OPENWEATHER_KEY,"units":"metric"})
        d=r.json()
        result.update({"temp_cur":d["main"]["temp"],"humidity":d["main"]["humidity"],
                        "wind":d["wind"]["speed"]*3.6})
    except: result.update({"temp_cur":28,"humidity":65,"wind":12})
    try:
        r=requests.get(OPEN_METEO_URL,timeout=10,params={
            "latitude":lat,"longitude":lon,
            "daily":"precipitation_sum,temperature_2m_max,temperature_2m_min,shortwave_radiation_sum",
            "forecast_days":16,"timezone":"Asia/Kolkata"})
        d=r.json()["daily"]
        result.update({"rain_16d":float(np.nansum(d.get("precipitation_sum",[0]))),
                        "mean_temp":float(np.nanmean(d.get("temperature_2m_max",[28]))),
                        "radiation":float(np.nanmean(d.get("shortwave_radiation_sum",[18])))})
        result["annual_rain_est"]=result["rain_16d"]*(365/16)
    except: result.update({"rain_16d":40,"mean_temp":28,"radiation":18,"annual_rain_est":900})
    return result


def load_and_prepare(n_fallback=15000):
    df,gds=smart_load(n_fallback=n_fallback)
    # Label = best crop for each row based on governance data + physics
    if "crop_idx" in df.columns and "crop" in df.columns:
        # Use existing crop from governance data as label for rows where it matches suitability
        labels=[]
        for _,row in df.iterrows():
            temp=row.get("mean_temp",28); rain=row.get("annual_rainfall",700)
            ph=row.get("soil_ph",6.5); soil=int(row.get("soil_type_idx",2))
            di=row.get("drought_index",0.2); ra=row.get("rainfall_anomaly",0)
            # Adjust rain for anomaly
            adj_rain=max(100,rain+ra)
            scores={c:suitability_score(c,temp,adj_rain,ph,soil) for c in CROPS}
            labels.append(CROPS.index(max(scores,key=scores.get)))
        df["suit_label"]=labels
    avail=[c for c in FEAT_COLS if c in df.columns]
    df_model=df[avail+["suit_label"]].dropna()
    print(f"[INFO] Model 5: {len(df_model):,} rows × {len(avail)} feats")
    print(f"[INFO] API extras: {[c for c in ['rainfall_anomaly','drought_index','population_density','production_efficiency','irrigation_pct','temp_anomaly'] if c in avail]}")
    print(df_model["suit_label"].map(lambda x: CROPS[x]).value_counts())
    return df_model,avail,gds


def train(df,feat_cols):
    X=df[feat_cols].values; y=df["suit_label"].values
    X_tr,X_te,y_tr,y_te=train_test_split(X,y,test_size=0.2,stratify=y,random_state=42)
    scaler=StandardScaler(); X_tr=scaler.fit_transform(X_tr); X_te=scaler.transform(X_te)
    if XGB_AVAILABLE:
        model=XGBClassifier(n_estimators=400,max_depth=8,learning_rate=0.05,subsample=0.8,
                             colsample_bytree=0.8,reg_alpha=0.1,reg_lambda=1.0,
                             use_label_encoder=False,eval_metric="mlogloss",random_state=42,n_jobs=-1)
    else:
        model=GradientBoostingClassifier(n_estimators=300,max_depth=6,learning_rate=0.05,random_state=42)
    model.fit(X_tr,y_tr); y_pred=model.predict(X_te)
    print(f"\n{'='*55}\n  MODEL 5 — Crop Suitability | Governance API Data\n{'='*55}")
    print(f"  {'XGBoost' if XGB_AVAILABLE else 'GBClassifier'}: Acc={accuracy_score(y_te,y_pred):.4f}  F1={f1_score(y_te,y_pred,average='weighted'):.4f}")
    cv=cross_val_score(model,X_tr,y_tr,cv=StratifiedKFold(5),scoring="f1_weighted",n_jobs=-1)
    print(f"  CV F1: {cv.mean():.4f} ± {cv.std():.4f}")
    print(classification_report(y_te,y_pred,target_names=CROPS,zero_division=0))
    return model,scaler,y_te,y_pred


def plot_results(y_te,y_pred,model,df,feat_cols):
    fig=plt.figure(figsize=(20,12)); fig.patch.set_facecolor("#0a0f1e")
    plt.suptitle(f"MODEL 5 — Crop Suitability | Governance API + {'XGBoost' if XGB_AVAILABLE else 'GBClassifier'}",color="white",fontsize=13,y=0.98)
    def s(ax,t=""):
        ax.set_facecolor("#0f1e38"); ax.tick_params(colors="white")
        ax.xaxis.label.set_color("white"); ax.yaxis.label.set_color("white")
        ax.title.set_color("white"); [sp.set_edgecolor("#1e3a5f") for sp in ax.spines.values()]
        if t: ax.set_title(t,pad=8)
    # 1. Suitability scores for sample conditions
    ax1=fig.add_subplot(2,3,1)
    sc_normal={c:suitability_score(c,27,900,6.5,2) for c in CROPS}
    sc_drought={c:suitability_score(c,27,400,6.5,2) for c in CROPS}  # drought adjusted
    x=np.arange(len(CROPS)); w=0.35
    ax1.barh(x+w/2,[sc_normal[c] for c in CROPS],w,color="#22c55e",label="Normal")
    ax1.barh(x-w/2,[sc_drought[c] for c in CROPS],w,color="#f97316",label="Drought")
    ax1.set_yticks(x); ax1.set_yticklabels(CROPS,color="white",fontsize=8)
    ax1.legend(facecolor="#0a0f1e",labelcolor="white"); s(ax1,"Suitability: Normal vs Drought (API drought_index effect)")

    # 2. Confusion matrix
    from sklearn.metrics import confusion_matrix
    ax2=fig.add_subplot(2,3,2); cm=confusion_matrix(y_te,y_pred)[:8,:8]
    ax2.imshow(cm,cmap="Blues"); s(ax2,"Confusion Matrix (top 8)")
    ax2.set_xticks(range(8)); ax2.set_xticklabels(CROPS[:8],rotation=45,ha="right",color="white",fontsize=7)
    ax2.set_yticks(range(8)); ax2.set_yticklabels(CROPS[:8],color="white",fontsize=7)

    # 3. Feature importance
    if XGB_AVAILABLE:
        ax3=fig.add_subplot(2,3,3); fi=model.feature_importances_[:len(feat_cols)]; idx=np.argsort(fi)[-10:]
        ax3.barh([feat_cols[i] for i in idx],fi[idx],color=plt.cm.plasma(np.linspace(0.3,1.0,10))); s(ax3,"Feature Importance"); ax3.set_xlabel("Importance")

    # 4. Drought effect on suitability
    if "drought_index" in df.columns:
        ax4=fig.add_subplot(2,3,4)
        rain_col=df["annual_rainfall"] if "annual_rainfall" in df.columns else pd.Series(np.full(len(df),700.0))
        ph_col=df["soil_ph"] if "soil_ph" in df.columns else pd.Series(np.full(len(df),6.5))
        temp_col=df["mean_temp"] if "mean_temp" in df.columns else pd.Series(np.full(len(df),28.0))
        samp=df.sample(min(2000,len(df)),random_state=42)
        rice_sc=[suitability_score("Rice",t,r,p,2) for t,r,p in zip(samp["mean_temp"] if "mean_temp" in samp.columns else [28]*len(samp),
                                                                       samp["annual_rainfall"] if "annual_rainfall" in samp.columns else [700]*len(samp),
                                                                       samp["soil_ph"] if "soil_ph" in samp.columns else [6.5]*len(samp))]
        ax4.scatter(samp["drought_index"],rice_sc,alpha=0.3,s=5,color="#22c55e"); s(ax4,"Rice Suitability vs Drought Index (API)"); ax4.set_xlabel("Drought Index"); ax4.set_ylabel("Suitability Score")

    # 5. Rainfall anomaly effect
    if "rainfall_anomaly" in df.columns:
        ax5=fig.add_subplot(2,3,5); samp=df.sample(min(2000,len(df)),random_state=42)
        if "suit_label" in samp.columns:
            ax5.scatter(samp["rainfall_anomaly"],samp["suit_label"],c=samp["suit_label"],cmap="tab20",alpha=0.3,s=5); s(ax5,"Label vs Rainfall Anomaly (API)"); ax5.set_xlabel("Rainfall Anomaly (mm)"); ax5.set_ylabel("Best Crop Index")

    # 6. Metrics
    ax6=fig.add_subplot(2,3,6)
    from sklearn.metrics import classification_report as cr
    rep=cr(y_te,y_pred,target_names=CROPS,output_dict=True,zero_division=0)
    f1s=[rep.get(c,{}).get("f1-score",0) for c in CROPS]
    ax6.bar(range(len(CROPS)),f1s,color=plt.cm.tab20(np.linspace(0,1,len(CROPS))))
    ax6.set_xticks(range(len(CROPS))); ax6.set_xticklabels([c[:5] for c in CROPS],rotation=45,ha="right",color="white",fontsize=7)
    ax6.set_ylim(0,1.1); s(ax6,"Per-crop F1")

    plt.tight_layout(rect=[0,0,1,0.97])
    plt.savefig(f"{OUTPUT_DIR}/model5_crop_suitability.png",dpi=150,bbox_inches="tight",facecolor="#0a0f1e")
    plt.close(); print("[INFO] Plot → model5_crop_suitability.png")


def predict_live(district,soil_type_idx,ph,nitrogen,organic_matter,season,model,scaler,feat_cols,gds=None):
    api_feat=gds.to_live_feature_dict(district) if gds else {}
    coords=INDIA_COORDS.get(district.lower(),(20.5,78.9)); w=fetch_live_climate(*coords)
    SEASONS=["Kharif","Rabi","Zaid","Annual"]; si=SEASONS.index(season) if season in SEASONS else 0
    # Adjust rain with API rainfall_anomaly
    rain=api_feat.get("annual_rainfall",w.get("annual_rain_est",700))
    rain_adj=max(100,rain+api_feat.get("rainfall_anomaly",0))
    di=api_feat.get("drought_index",0.2); temp=w.get("mean_temp",28)

    # Physics scores (drought-adjusted)
    phys={c:suitability_score(c,temp,rain_adj,ph,soil_type_idx) for c in CROPS}
    feat_vals={"mean_temp":temp,"annual_rainfall":rain_adj,"humidity":w.get("humidity",65),
               "soil_ph":ph,"soil_type_idx":soil_type_idx,"elevation":api_feat.get("elevation",150),
               "fertilizer_kg_ha":api_feat.get("fertilizer_kg_ha",nitrogen),
               "ndvi":api_feat.get("ndvi",0.5),"crop_idx":0,
               "rainfall_anomaly":api_feat.get("rainfall_anomaly",0),
               "drought_index":di,"population_density":api_feat.get("population_density",300),
               "production_efficiency":api_feat.get("production_efficiency",1.0),
               "irrigation_pct":api_feat.get("irrigation_pct",40),
               "temp_anomaly":api_feat.get("temp_anomaly",0)}
    x=np.array([[feat_vals.get(c,0) for c in feat_cols]])
    x_sc=scaler.transform(x); proba=model.predict_proba(x_sc)[0]
    ml_scores={CROPS[i]:float(p)*100 for i,p in enumerate(proba)}
    # Blend 60% physics + 40% ML
    final={c:0.6*phys[c]+0.4*ml_scores.get(c,0) for c in CROPS}
    ranked=sorted(final.items(),key=lambda x:x[1],reverse=True)
    CALS={"Kharif":"Sow: Jun-Jul | Harvest: Oct-Nov","Rabi":"Sow: Oct-Nov | Harvest: Feb-Apr","Zaid":"Sow: Feb-Mar | Harvest: May-Jun","Annual":"Year-round cultivation"}
    return {"district":district,"season":season,"best_crop":ranked[0][0],
            "best_score_pct":round(ranked[0][1],1),
            "top5_ranked":[(c,round(s,1)) for c,s in ranked[:5]],
            "planting_calendar":CALS.get(season,"N/A"),
            "api_drought_index":round(di,3),"api_rainfall_anomaly":round(api_feat.get("rainfall_anomaly",0),1),
            "adjusted_rainfall":round(rain_adj,0),"live_temp":round(temp,1),
            "data_source":"Governance API + Open-Meteo + OpenWeather"}


if __name__=="__main__":
    print("\n"+"▓"*55+"\n  MODEL 5: CROP SUITABILITY (Governance API)\n"+"▓"*55)
    df,feat_cols,gds=load_and_prepare(15000)
    model,scaler,y_te,y_pred=train(df,feat_cols)
    plot_results(y_te,y_pred,model,df,feat_cols)
    joblib.dump(model,f"{OUTPUT_DIR}/saved_models/m5_xgb.pkl")
    joblib.dump(scaler,f"{OUTPUT_DIR}/saved_models/m5_scaler.pkl")
    joblib.dump(feat_cols,f"{OUTPUT_DIR}/saved_models/m5_feat_cols.pkl")
    print("[INFO] Saved.\n── Live Demo ──")
    r=predict_live("jaipur",1,7.2,180,0.9,"Rabi",model,scaler,feat_cols,gds)
    for k,v in r.items():
        if k=="top5_ranked": [print(f"    {c:<12} {'█'*int(s/5)} {s:.0f}%") for c,s in v]
        else: print(f"  {k:<28}: {v}")
