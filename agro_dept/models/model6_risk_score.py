"""
=============================================================================
MODEL 6 — AGRICULTURE RISK SCORE  [Governance API Integration]
Algorithm : Random Forest + XGBoost Meta-Ensemble
Training  : governance_master_dataset (ALL cols: stress, flood, drought, 
            disease_incidence, pest_incidence, smallholder_pct, insurance_pct)
Live      : Open-Meteo + WeatherBit + OpenWeatherMap + Governance API
=============================================================================
"""
import os,sys,warnings,requests
from datetime import datetime
import numpy as np,pandas as pd
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier,GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split,StratifiedKFold,cross_val_score
from sklearn.metrics import accuracy_score,f1_score,classification_report,confusion_matrix,roc_auc_score
from sklearn.calibration import CalibratedClassifierCV
import joblib

sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from master_data_loader import smart_load

try:
    from xgboost import XGBClassifier; XGB_AVAILABLE=True
except ImportError:
    XGB_AVAILABLE=False

warnings.filterwarnings("ignore"); np.random.seed(42)
OPEN_METEO_URL="https://api.open-meteo.com/v1/forecast"
WEATHERBIT_URL="https://api.weatherbit.io/v2.0/current"
OPENWEATHER_URL="https://api.openweathermap.org/data/2.5/weather"
WEATHERBIT_KEY="ffd13dad3d6c49a39f4b1b6a77b8d222"
OPENWEATHER_KEY="701cf29be2f669b6266eb7b847b13a55"
OUTPUT_DIR="/mnt/user-data/outputs"
os.makedirs(f"{OUTPUT_DIR}/saved_models",exist_ok=True)

RISK_CLASSES={0:"Low",1:"Moderate",2:"High",3:"Critical"}
RISK_COLORS={"Low":"#22c55e","Moderate":"#eab308","High":"#f97316","Critical":"#ef4444"}

# Features: sub-model outputs + governance API cols (direct)
FEAT_COLS=[
    # Sub-model outputs
    "yield_tonne_ha","stress_score_raw","soil_moisture","evapotranspiration",
    # Weather
    "mean_temp","humidity","annual_rainfall","wind_speed","vpd","rainfall_anomaly","temp_anomaly",
    # Governance API direct
    "drought_index","flood_risk","pest_incidence","disease_incidence",
    "smallholder_pct","insurance_pct","irrigation_pct","market_access","credit_access","msp_coverage",
    "fertilizer_kg_ha","population_density","ndvi","production_efficiency",
]
INDIA_COORDS={"chittoor":(13.21,79.10),"delhi":(28.67,77.21),"patna":(25.61,85.14),
              "lucknow":(26.85,80.95),"jaipur":(26.91,75.79),"hyderabad":(17.38,78.49),
              "mumbai":(19.07,72.88),"kolkata":(22.57,88.36),"amritsar":(31.63,74.87),"nagpur":(21.15,79.09)}

ADVISORY={
    "Low":{"headline":"✅ NORMAL — No immediate action","action":"Standard monitoring.","insurance":"Normal PMFBY coverage.","extension":"Weekly bulletin distribution."},
    "Moderate":{"headline":"📋 MODERATE RISK — Precautionary measures advised","action":"Deploy extension officers. Issue crop advisory.","insurance":"Alert PMFBY agencies. Review claim thresholds.","extension":"Activate KVK. Conduct farmer meetings."},
    "High":{"headline":"⚠️ HIGH RISK — Immediate district advisory required","action":"Issue district advisory. Activate irrigation support. Alert banks.","insurance":"Pre-position claim teams. Notify block officers.","extension":"Daily field monitoring. Mobile agri-clinics. SMS alerts."},
    "Critical":{"headline":"🚨 CRITICAL — Government intervention NOW","action":"Declare crop stress zone. Activate NDRF. Emergency cabinet meeting.","insurance":"Fast-track PMFBY claims. Ex-gratia payments. Survey teams.","extension":"All staff on field duty. Media briefing. Control room active."},
}


def fetch_all_weather(lat,lon):
    result={"temp":28,"humidity":65,"wind":12,"rain_7d":35,"vpd":1.5,"soil_m":28,"sources":[]}
    try:
        r=requests.get(OPEN_METEO_URL,timeout=10,params={
            "latitude":lat,"longitude":lon,
            "hourly":"temperature_2m,relative_humidity_2m,precipitation,soil_moisture_0_to_1cm,vapour_pressure_deficit,wind_speed_10m",
            "daily":"precipitation_sum,temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration",
            "current":"temperature_2m,relative_humidity_2m,wind_speed_10m",
            "forecast_days":7,"timezone":"Asia/Kolkata"})
        d=r.json(); h=d.get("hourly",{}); dy=d.get("daily",{}); c=d.get("current",{})
        avg=lambda k: float(np.nanmean(h.get(k,[0])[:168]))
        sm=lambda k: float(np.nansum(dy.get(k,[0])))
        result.update({"temp":c.get("temperature_2m",avg("temperature_2m")),"humidity":avg("relative_humidity_2m"),
                        "wind":avg("wind_speed_10m"),"rain_7d":sm("precipitation_sum"),
                        "vpd":avg("vapour_pressure_deficit"),"soil_m":avg("soil_moisture_0_to_1cm")*100,
                        "et0_7d":sm("et0_fao_evapotranspiration")})
        result["sources"].append("open-meteo")
    except: pass
    try:
        r=requests.get(WEATHERBIT_URL,timeout=8,params={"lat":lat,"lon":lon,"key":WEATHERBIT_KEY,"units":"M"})
        obs=r.json()["data"][0]
        result.update({"wb_aqi":float(obs.get("aqi",50)),"wb_cloud":float(obs.get("clouds",50)),"wb_uvi":float(obs.get("uv",5))})
        result["sources"].append("weatherbit")
    except: pass
    try:
        r=requests.get(OPENWEATHER_URL,timeout=8,params={"lat":lat,"lon":lon,"appid":OPENWEATHER_KEY,"units":"metric"})
        d=r.json()
        result.update({"ow_feels_like":float(d["main"].get("feels_like",result["temp"])),"ow_pressure":float(d["main"].get("pressure",1013))})
        result["sources"].append("openweather")
    except: pass
    print(f"[INFO] Weather: {result['sources']}")
    return result


def load_and_prepare(n_fallback=18000):
    df,gds=smart_load(n_fallback=n_fallback)
    # Derive risk label from governance API risk columns
    if "risk_label" not in df.columns:
        risk=pd.Series(np.zeros(len(df)))
        if "yield_tonne_ha" in df.columns: risk+=np.maximum(0,(3.5-df["yield_tonne_ha"])/3.5*25)
        if "stress_score_raw" in df.columns: risk+=df["stress_score_raw"]*0.20
        if "drought_index" in df.columns: risk+=df["drought_index"]*20
        if "flood_risk" in df.columns: risk+=df["flood_risk"]*15
        if "disease_incidence" in df.columns: risk+=df["disease_incidence"]*0.3
        if "pest_incidence" in df.columns: risk+=df["pest_incidence"]*0.2
        if "rainfall_anomaly" in df.columns: risk+=np.maximum(0,-df["rainfall_anomaly"]*0.05)
        if "smallholder_pct" in df.columns: risk+=df["smallholder_pct"]*0.05
        if "insurance_pct" in df.columns: risk-=df["insurance_pct"]*0.1
        if "irrigation_pct" in df.columns: risk-=df["irrigation_pct"]*0.05
        risk=risk.clip(0,100)+np.random.normal(0,5,len(df))
        df["risk_label"]=pd.cut(risk.clip(0,100),bins=[-np.inf,25,50,75,np.inf],labels=[0,1,2,3]).astype(int)

    avail=[c for c in FEAT_COLS if c in df.columns]
    df_model=df[avail+["risk_label"]].dropna()
    print(f"[INFO] Model 6: {len(df_model):,} rows × {len(avail)} feats")
    print(f"[INFO] Governance cols used: {[c for c in ['drought_index','flood_risk','pest_incidence','disease_incidence','smallholder_pct','insurance_pct','msp_coverage','credit_access'] if c in avail]}")
    print(df_model["risk_label"].map(RISK_CLASSES).value_counts())
    return df_model,avail,gds


def train(df,feat_cols):
    X=df[feat_cols].values; y=df["risk_label"].values
    X_tr,X_te,y_tr,y_te=train_test_split(X,y,test_size=0.2,stratify=y,random_state=42)
    scaler=StandardScaler(); X_tr=scaler.fit_transform(X_tr); X_te=scaler.transform(X_te)
    rf=RandomForestClassifier(n_estimators=400,max_depth=18,class_weight="balanced",
                               max_features="sqrt",n_jobs=-1,random_state=42,oob_score=True)
    rf.fit(X_tr,y_tr)
    rf_p_tr=rf.predict_proba(X_tr); rf_p_te=rf.predict_proba(X_te)
    X_meta_tr=np.hstack([X_tr,rf_p_tr]); X_meta_te=np.hstack([X_te,rf_p_te])
    if XGB_AVAILABLE:
        meta=XGBClassifier(n_estimators=300,max_depth=6,learning_rate=0.05,subsample=0.8,
                            colsample_bytree=0.8,use_label_encoder=False,eval_metric="mlogloss",
                            random_state=42,n_jobs=-1)
    else:
        meta=GradientBoostingClassifier(n_estimators=200,max_depth=5,learning_rate=0.05,random_state=42)
    meta.fit(X_meta_tr,y_tr); y_pred=meta.predict(X_meta_te); proba=meta.predict_proba(X_meta_te)
    print(f"\n{'='*60}\n  MODEL 6 — Risk Score | Governance API Data\n{'='*60}")
    print(f"  OOB Acc: {rf.oob_score_:.4f}  Test Acc: {accuracy_score(y_te,y_pred):.4f}  F1: {f1_score(y_te,y_pred,average='weighted'):.4f}")
    try: print(f"  ROC-AUC: {roc_auc_score(y_te,proba,multi_class='ovr',average='weighted'):.4f}")
    except: pass
    print(classification_report(y_te,y_pred,target_names=list(RISK_CLASSES.values())))
    cv=cross_val_score(rf,X_tr,y_tr,cv=StratifiedKFold(5),scoring="f1_weighted",n_jobs=-1)
    print(f"  CV F1: {cv.mean():.4f} ± {cv.std():.4f}")
    return rf,meta,scaler,y_te,y_pred,proba


def plot_results(y_te,y_pred,proba,rf,meta,df,feat_cols):
    fig=plt.figure(figsize=(22,14)); fig.patch.set_facecolor("#0a0f1e")
    plt.suptitle("MODEL 6 — Agriculture Risk Score | Governance API + RF+XGBoost",color="white",fontsize=15,y=0.98)
    def s(ax,t=""):
        ax.set_facecolor("#0f1e38"); ax.tick_params(colors="white")
        ax.xaxis.label.set_color("white"); ax.yaxis.label.set_color("white")
        ax.title.set_color("white"); [sp.set_edgecolor("#1e3a5f") for sp in ax.spines.values()]
        if t: ax.set_title(t,pad=8)
    rc=list(RISK_CLASSES.values()); colors=[RISK_COLORS[c] for c in rc]

    ax1=fig.add_subplot(3,4,1); cm=confusion_matrix(y_te,y_pred)
    ax1.imshow(cm.astype(float)/cm.sum(axis=1)[:,None]*100,cmap="RdYlGn_r",vmin=0,vmax=100)
    [ax1.set_xticklabels,ax1.set_yticklabels]
    ax1.set_xticks(range(4)); ax1.set_xticklabels(rc,color="white",fontsize=9)
    ax1.set_yticks(range(4)); ax1.set_yticklabels(rc,color="white",fontsize=9)
    for i in range(4):
        for j in range(4):
            v=cm.astype(float)/cm.sum(axis=1)[:,None]*100
            ax1.text(j,i,f"{v[i,j]:.0f}%",ha="center",va="center",color="white",fontsize=8)
    s(ax1,"Confusion Matrix")

    ax2=fig.add_subplot(3,4,2); fi=rf.feature_importances_[:len(feat_cols)]; idx=np.argsort(fi)[-12:]
    ax2.barh([feat_cols[i] for i in idx],fi[idx],color=plt.cm.RdYlGn_r(np.linspace(0.2,0.9,len(idx)))); s(ax2,"Feature Importances"); ax2.set_xlabel("Importance")

    # Governance API cols importance separately
    gov_cols=["drought_index","flood_risk","pest_incidence","disease_incidence","smallholder_pct","insurance_pct","msp_coverage","credit_access"]
    gov_avail=[c for c in gov_cols if c in feat_cols]
    if gov_avail:
        ax3=fig.add_subplot(3,4,3)
        gov_fi=[rf.feature_importances_[feat_cols.index(c)] if c in feat_cols else 0 for c in gov_avail]
        ax3.barh(gov_avail,gov_fi,color="#4ade80"); s(ax3,"Governance API Feature Importance"); ax3.set_xlabel("Importance")

    # Risk distribution
    ax4=fig.add_subplot(3,4,4)
    if "risk_label" in df.columns:
        cnts=df["risk_label"].value_counts().sort_index()
        ax4.bar([RISK_CLASSES.get(i,str(i)) for i in cnts.index],cnts.values,color=[RISK_COLORS[RISK_CLASSES.get(i,"Low")] for i in cnts.index]); s(ax4,"Class Distribution (API Data)")

    # Drought index vs risk
    ax5=fig.add_subplot(3,4,5)
    if "drought_index" in df.columns and "risk_label" in df.columns:
        samp=df.sample(min(3000,len(df)),random_state=42)
        for lbl in range(4):
            mask=samp["risk_label"]==lbl
            ax5.scatter(samp.loc[mask,"drought_index"],samp.loc[mask,"yield_tonne_ha"] if "yield_tonne_ha" in samp.columns else [lbl]*mask.sum(),
                       c=RISK_COLORS[RISK_CLASSES[lbl]],s=8,alpha=0.5,label=RISK_CLASSES[lbl])
        ax5.legend(fontsize=7,facecolor="#0a0f1e",labelcolor="white"); s(ax5,"Drought Index vs Yield (coloured by Risk)"); ax5.set_xlabel("Drought Index"); ax5.set_ylabel("Yield t/ha")

    # Flood risk vs pest incidence
    ax6=fig.add_subplot(3,4,6)
    if "flood_risk" in df.columns and "pest_incidence" in df.columns and "risk_label" in df.columns:
        samp=df.sample(min(3000,len(df)),random_state=42)
        for lbl in range(4):
            mask=samp["risk_label"]==lbl
            ax6.scatter(samp.loc[mask,"flood_risk"],samp.loc[mask,"pest_incidence"],c=RISK_COLORS[RISK_CLASSES[lbl]],s=8,alpha=0.5,label=RISK_CLASSES[lbl])
        ax6.legend(fontsize=7,facecolor="#0a0f1e",labelcolor="white"); s(ax6,"Flood Risk vs Pest Incidence (API)"); ax6.set_xlabel("Flood Risk"); ax6.set_ylabel("Pest Incidence %")

    # Insurance vs smallholder
    ax7=fig.add_subplot(3,4,7)
    if "insurance_pct" in df.columns and "smallholder_pct" in df.columns and "risk_label" in df.columns:
        samp=df.sample(min(3000,len(df)),random_state=42)
        for lbl in range(4):
            mask=samp["risk_label"]==lbl
            ax7.scatter(samp.loc[mask,"smallholder_pct"],samp.loc[mask,"insurance_pct"],c=RISK_COLORS[RISK_CLASSES[lbl]],s=8,alpha=0.5,label=RISK_CLASSES[lbl])
        ax7.legend(fontsize=7,facecolor="#0a0f1e",labelcolor="white"); s(ax7,"Smallholder% vs Insurance% (API)"); ax7.set_xlabel("Smallholder %"); ax7.set_ylabel("Insurance Coverage %")

    # Per-class F1
    ax8=fig.add_subplot(3,4,8)
    from sklearn.metrics import classification_report as cr
    rep=cr(y_te,y_pred,target_names=rc,output_dict=True,zero_division=0)
    f1s=[rep.get(c,{}).get("f1-score",0) for c in rc]
    ax8.bar(rc,f1s,color=colors); ax8.set_ylim(0,1.1); s(ax8,"Per-class F1")
    [ax8.text(i,v+0.02,f"{v:.2f}",ha="center",color="white",fontsize=10) for i,v in enumerate(f1s)]

    # Disease/Credit/MSP subplots
    for pi,(cx,cy,title) in enumerate([("disease_incidence","credit_access","Disease Incidence vs Credit Access (API)"),
                                         ("msp_coverage","production_efficiency","MSP Coverage vs Production Efficiency (API)"),
                                         ("rainfall_anomaly","drought_index","Rainfall Anomaly vs Drought Index (API)"),
                                         ("temp_anomaly","flood_risk","Temp Anomaly vs Flood Risk (API)")]):
        ax=fig.add_subplot(3,4,9+pi)
        if cx in df.columns and cy in df.columns and "risk_label" in df.columns:
            samp=df.sample(min(2000,len(df)),random_state=42)
            ax.scatter(samp[cx],samp[cy],c=samp["risk_label"],cmap="RdYlGn_r",s=4,alpha=0.3,vmin=0,vmax=3)
        s(ax,title); ax.set_xlabel(cx[:15]); ax.set_ylabel(cy[:15])

    plt.tight_layout(rect=[0,0,1,0.97])
    plt.savefig(f"{OUTPUT_DIR}/model6_risk_score.png",dpi=150,bbox_inches="tight",facecolor="#0a0f1e")
    plt.close(); print("[INFO] Plot → model6_risk_score.png")


def generate_district_risk_map(rf_model,meta_model,scaler,feat_cols,gds=None):
    DEMOS={"Chittoor":(1.8,55,0.5,0.1,8,7,75,25,45,6,30,0.15,50,70,1.0),
           "Delhi":    (3.2,30,0.2,0.05,2,2,60,40,70,8,20,0.10,40,80,0.9),
           "Patna":    (2.8,45,0.4,0.2,8,12,85,20,35,5,25,0.20,55,60,0.8),
           "Lucknow":  (3.0,35,0.3,0.1,3,5,70,35,55,7,22,0.15,48,75,0.9),
           "Jaipur":   (1.5,65,0.7,0.3,4,6,80,15,30,5,18,0.25,35,55,0.7),
           "Hyderabad":(2.5,40,0.4,0.15,6,8,65,30,50,7,28,0.18,52,68,0.85),
           "Mumbai":   (2.2,35,0.2,0.05,2,3,55,45,60,9,20,0.12,58,82,0.95),
           "Kolkata":  (3.5,25,0.2,0.1,1,2,70,40,55,7,30,0.10,60,78,0.95),
           "Amritsar": (4.0,20,0.1,0.05,1,1,65,60,75,8,35,0.08,70,85,1.0),
           "Nagpur":   (2.0,50,0.5,0.2,7,9,75,20,40,6,22,0.22,42,62,0.75)}
    # feat_cols for defaults
    defaults={c:0 for c in feat_cols}
    results=[]
    for dist,(yield_v,stress,drought,flood,dis_inc,pest_inc,smp,ins,irr,ma,cred,msp,pop_d,fert,prod_eff) in DEMOS.items():
        coords=INDIA_COORDS.get(dist.lower(),(20.5,78.9))
        api_feat=gds.to_live_feature_dict(dist) if gds else {}
        w={"temp":api_feat.get("mean_temp",28),"rain":api_feat.get("annual_rainfall",700),
           "hum":api_feat.get("humidity",65),"wind":api_feat.get("wind_speed",12),
           "vpd":api_feat.get("vpd",1.5),"ra":api_feat.get("rainfall_anomaly",0),"ta":api_feat.get("temp_anomaly",0)}
        feat_vals={
            "yield_tonne_ha":api_feat.get("yield_tonne_ha",yield_v),
            "stress_score_raw":api_feat.get("stress_score_raw",stress),
            "soil_moisture":api_feat.get("soil_moisture",28),
            "evapotranspiration":api_feat.get("evapotranspiration",0.18),
            "mean_temp":w["temp"],"humidity":w["hum"],"annual_rainfall":w["rain"],
            "wind_speed":w["wind"],"vpd":w["vpd"],
            "rainfall_anomaly":api_feat.get("rainfall_anomaly",w["ra"]),
            "temp_anomaly":api_feat.get("temp_anomaly",w["ta"]),
            "drought_index":api_feat.get("drought_index",drought),
            "flood_risk":api_feat.get("flood_risk",flood),
            "pest_incidence":api_feat.get("pest_incidence",pest_inc),
            "disease_incidence":api_feat.get("disease_incidence",dis_inc),
            "smallholder_pct":api_feat.get("smallholder_pct",smp),
            "insurance_pct":api_feat.get("insurance_pct",ins),
            "irrigation_pct":api_feat.get("irrigation_pct",irr),
            "market_access":api_feat.get("market_access",ma),
            "credit_access":api_feat.get("credit_access",cred),
            "msp_coverage":api_feat.get("msp_coverage",msp*100),
            "fertilizer_kg_ha":api_feat.get("fertilizer_kg_ha",fert),
            "population_density":api_feat.get("population_density",pop_d*10),
            "ndvi":api_feat.get("ndvi",0.5),
            "production_efficiency":api_feat.get("production_efficiency",prod_eff),
        }
        x=np.array([[feat_vals.get(c,0) for c in feat_cols]])
        x_sc=scaler.transform(x); rf_p=rf_model.predict_proba(x_sc)
        x_m=np.hstack([x_sc,rf_p]); lbl=int(meta_model.predict(x_m)[0])
        prob=meta_model.predict_proba(x_m)[0]; score=sum(i*25*p for i,p in enumerate(prob))
        results.append({"district":dist,"risk":RISK_CLASSES[lbl],"score":score})

    fig,(ax1,ax2)=plt.subplots(1,2,figsize=(18,7)); fig.patch.set_facecolor("#0a0f1e")
    for ax in [ax1,ax2]:
        ax.set_facecolor("#0f1e38"); ax.tick_params(colors="white")
        ax.xaxis.label.set_color("white"); ax.yaxis.label.set_color("white")
        ax.title.set_color("white"); [sp.set_edgecolor("#1e3a5f") for sp in ax.spines.values()]
    idx=np.argsort([r["score"] for r in results])[::-1]
    names=[results[i]["district"] for i in idx]; scores=[results[i]["score"] for i in idx]
    bar_colors=[RISK_COLORS[results[i]["risk"]] for i in idx]
    bars=ax1.barh(names[::-1],scores[::-1],color=bar_colors[::-1])
    ax1.set_xlabel("Risk Score (0-100)"); ax1.set_title("District-wise Risk (Governance API)")
    [ax1.text(s+1,b.get_y()+b.get_height()/2,f"{s:.0f}",va="center",color="white",fontsize=9) for s,b in zip(scores[::-1],bars)]
    risk_counts=pd.Series([r["risk"] for r in results]).value_counts()
    ax2.pie(risk_counts.values,labels=risk_counts.index,colors=[RISK_COLORS[r] for r in risk_counts.index],
            autopct="%1.0f%%",textprops={"color":"white","fontsize":11})
    ax2.set_title("Risk Distribution across Districts",color="white")
    plt.tight_layout()
    plt.savefig(f"{OUTPUT_DIR}/model6_district_risk_map.png",dpi=150,bbox_inches="tight",facecolor="#0a0f1e")
    plt.close(); print("[INFO] District map → model6_district_risk_map.png")
    return results


def predict_live(district,yield_score,stress_score,irrigation_ir,suit_score,disease_freq,
                 rf_model,meta_model,scaler,feat_cols,gds=None):
    api_feat=gds.to_live_feature_dict(district) if gds else {}
    coords=INDIA_COORDS.get(district.lower(),(20.5,78.9)); w=fetch_all_weather(*coords)
    feat_vals={
        "yield_tonne_ha":api_feat.get("yield_tonne_ha",yield_score),
        "stress_score_raw":api_feat.get("stress_score_raw",stress_score),
        "soil_moisture":api_feat.get("soil_moisture",w["soil_m"]),
        "evapotranspiration":api_feat.get("evapotranspiration",0.18),
        "mean_temp":w["temp"],"humidity":w["humidity"],"annual_rainfall":api_feat.get("annual_rainfall",min(w["rain_7d"]*52,3000)),
        "wind_speed":w["wind"],"vpd":w["vpd"],
        "rainfall_anomaly":api_feat.get("rainfall_anomaly",0),
        "temp_anomaly":api_feat.get("temp_anomaly",0),
        "drought_index":api_feat.get("drought_index",0.2),
        "flood_risk":api_feat.get("flood_risk",0.1),
        "pest_incidence":api_feat.get("pest_incidence",10),
        "disease_incidence":api_feat.get("disease_incidence",disease_freq),
        "smallholder_pct":api_feat.get("smallholder_pct",75),
        "insurance_pct":api_feat.get("insurance_pct",30),
        "irrigation_pct":api_feat.get("irrigation_pct",45),
        "market_access":api_feat.get("market_access",6),
        "credit_access":api_feat.get("credit_access",40),
        "msp_coverage":api_feat.get("msp_coverage",60),
        "fertilizer_kg_ha":api_feat.get("fertilizer_kg_ha",120),
        "population_density":api_feat.get("population_density",400),
        "ndvi":api_feat.get("ndvi",0.5),
        "production_efficiency":api_feat.get("production_efficiency",1.0),
    }
    x=np.array([[feat_vals.get(c,0) for c in feat_cols]])
    x_sc=scaler.transform(x); rf_p=rf_model.predict_proba(x_sc)
    x_m=np.hstack([x_sc,rf_p]); lbl=int(meta_model.predict(x_m)[0])
    proba=meta_model.predict_proba(x_m)[0]; risk_cont=sum(i*25*p for i,p in enumerate(proba))
    risk_level=RISK_CLASSES[lbl]; adv=ADVISORY[risk_level]
    comp={
        "Yield Risk":round(max(0,(3.5-yield_score)/3.5*25),1),
        "Crop Stress":round(stress_score*0.20,1),
        "Drought Index":round(feat_vals["drought_index"]*20,1),
        "Flood Risk":round(feat_vals["flood_risk"]*15,1),
        "Disease Incidence":round(feat_vals["disease_incidence"]*0.3,1),
        "Pest Pressure":round(feat_vals["pest_incidence"]*0.2,1),
        "Socioeconomic Gap":round(feat_vals["smallholder_pct"]*0.05-feat_vals["insurance_pct"]*0.1,1),
    }
    return {"district":district,"timestamp":datetime.now().strftime("%Y-%m-%d %H:%M"),
            "risk_level":risk_level,"risk_score":round(risk_cont,1),"confidence":round(float(proba[lbl]),3),
            "class_probabilities":{RISK_CLASSES[i]:round(float(p),3) for i,p in enumerate(proba)},
            "component_risks":comp,"advisory_headline":adv["headline"],
            "action_required":adv["action"],"insurance_advisory":adv["insurance"],
            "extension_advisory":adv["extension"],
            "governance_api_signals":{"drought_index":feat_vals["drought_index"],"flood_risk":feat_vals["flood_risk"],
                "disease_incidence":feat_vals["disease_incidence"],"pest_incidence":feat_vals["pest_incidence"],
                "smallholder_pct":feat_vals["smallholder_pct"],"insurance_pct":feat_vals["insurance_pct"],
                "msp_coverage":feat_vals["msp_coverage"],"credit_access":feat_vals["credit_access"]},
            "weather_sources":w["sources"],
            "government_schemes":["PMFBY","PMKSY","RKVY","NDRF"] if lbl>=2 else ["PMFBY — standard"]}


if __name__=="__main__":
    print("\n"+"▓"*55+"\n  MODEL 6: RISK SCORE (Governance API)\n"+"▓"*55)
    df,feat_cols,gds=load_and_prepare(18000)
    rf,meta,scaler,y_te,y_pred,proba=train(df,feat_cols)
    plot_results(y_te,y_pred,proba,rf,meta,df,feat_cols)
    generate_district_risk_map(rf,meta,scaler,feat_cols,gds)
    joblib.dump(rf,f"{OUTPUT_DIR}/saved_models/m6_rf.pkl")
    joblib.dump(meta,f"{OUTPUT_DIR}/saved_models/m6_meta.pkl")
    joblib.dump(scaler,f"{OUTPUT_DIR}/saved_models/m6_scaler.pkl")
    joblib.dump(feat_cols,f"{OUTPUT_DIR}/saved_models/m6_feat_cols.pkl")
    print("[INFO] Saved.\n── Live Demo ──")
    r=predict_live("patna",2.1,60,7.5,58,8,rf,meta,scaler,feat_cols,gds)
    print(f"\n  {'='*55}\n  {r['advisory_headline']}\n  Risk: {r['risk_level']} ({r['risk_score']:.1f}/100)\n  {'='*55}")
    print(f"  Action   : {r['action_required']}")
    print(f"\n  Component Risks:"); [print(f"    {k:<22}: {v:>5.1f}  {'█'*int(v)}") for k,v in r["component_risks"].items()]
    print(f"\n  Governance API Signals:"); [print(f"    {k:<22}: {v}") for k,v in r["governance_api_signals"].items()]
