"""
=============================================================================
MODEL 1 — CROP YIELD PREDICTION  [Governance API Integration]
Algorithm : Random Forest + Gradient Boosting Stack
Training  : governance_master_dataset API (primary) / synthetic fallback
Live      : Open-Meteo + Governance API district features
=============================================================================
"""
import os, sys, warnings, requests
from datetime import datetime
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, mean_absolute_percentage_error
import joblib

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from master_data_loader import smart_load

warnings.filterwarnings("ignore")
np.random.seed(42)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
OUTPUT_DIR     = "/mnt/user-data/outputs"
os.makedirs(f"{OUTPUT_DIR}/saved_models", exist_ok=True)

INDIA_COORDS = {
    "chittoor":(13.21,79.10),"delhi":(28.67,77.21),"patna":(25.61,85.14),
    "lucknow":(26.85,80.95),"jaipur":(26.91,75.79),"hyderabad":(17.38,78.49),
    "mumbai":(19.07,72.88),"kolkata":(22.57,88.36),"amritsar":(31.63,74.87),
    "nagpur":(21.15,79.09),
}

CROP_LIST = ["Rice","Wheat","Maize","Sugarcane","Cotton","Soybean",
             "Groundnut","Mustard","Pulses","Vegetables","Sorghum","Barley"]

FEAT_COLS_BASE = [
    "year","annual_rainfall","mean_temp","temp_stress_deg","soil_moisture",
    "ndvi","fertilizer_kg_ha","irrigation","soil_ph","soil_type_idx",
    "crop_idx","state_idx","season_idx",
]
FEAT_COLS_API_EXTRA = [
    "rainfall_anomaly","drought_index","population_density",
    "irrigation_pct","production_efficiency","pest_incidence","flood_risk",
]
TARGET = "yield_tonne_ha"


def fetch_live_weather(lat, lon):
    try:
        r = requests.get(OPEN_METEO_URL, timeout=10, params={
            "latitude":lat,"longitude":lon,
            "hourly":"temperature_2m,relative_humidity_2m,precipitation,soil_moisture_0_to_1cm",
            "daily":"precipitation_sum,temperature_2m_max,temperature_2m_min",
            "current":"temperature_2m,relative_humidity_2m,wind_speed_10m",
            "forecast_days":7,"timezone":"Asia/Kolkata",
        })
        d=r.json(); h=d.get("hourly",{}); dy=d.get("daily",{}); c=d.get("current",{})
        avg=lambda k: float(np.nanmean(h.get(k,[0])[:168]))
        sm=lambda k: float(np.nansum(dy.get(k,[0])))
        return {"temp":c.get("temperature_2m",avg("temperature_2m")),
                "humidity":avg("relative_humidity_2m"),
                "rain_7d":sm("precipitation_sum"),
                "soil_m":avg("soil_moisture_0_to_1cm")*100}
    except:
        return {"temp":28,"humidity":65,"rain_7d":40,"soil_m":28}


def load_and_prepare(n_fallback=10000):
    df, gds = smart_load(n_fallback=n_fallback)

    # Determine which feature cols are available
    feat_cols = [c for c in FEAT_COLS_BASE + FEAT_COLS_API_EXTRA if c in df.columns]

    if TARGET not in df.columns:
        if "production_efficiency" in df.columns:
            df[TARGET] = df["production_efficiency"] * 3.5
            print(f"[INFO] Using production_efficiency as yield proxy")
        else:
            raise ValueError("No yield target in dataset")

    df_model = df[feat_cols + [TARGET]].dropna()
    print(f"[INFO] Model 1 training set: {len(df_model):,} rows × {len(feat_cols)} features")
    print(f"[INFO] API-sourced extra cols: {[c for c in FEAT_COLS_API_EXTRA if c in feat_cols]}")
    return df_model, feat_cols, gds


def train(df, feat_cols):
    X = df[feat_cols].values
    y = df[TARGET].values
    # Remove extreme outliers
    q1,q3 = np.percentile(y,[1,99]); mask=(y>=q1)&(y<=q3)
    X,y = X[mask],y[mask]

    X_tr,X_te,y_tr,y_te = train_test_split(X,y,test_size=0.2,random_state=42)
    scaler = StandardScaler()
    X_tr = scaler.fit_transform(X_tr); X_te = scaler.transform(X_te)

    rf = RandomForestRegressor(n_estimators=300,max_depth=18,max_features="sqrt",
                                n_jobs=-1,random_state=42,oob_score=True)
    rf.fit(X_tr,y_tr)
    gb = GradientBoostingRegressor(n_estimators=200,learning_rate=0.05,
                                    max_depth=5,subsample=0.8,random_state=42)
    gb.fit(np.hstack([X_tr,rf.predict(X_tr).reshape(-1,1)]),y_tr)
    y_pred = gb.predict(np.hstack([X_te,rf.predict(X_te).reshape(-1,1)]))

    print(f"\n{'='*55}")
    print(f"  MODEL 1 — Training on Governance API Data")
    print(f"{'='*55}")
    print(f"  OOB R²  : {rf.oob_score_:.4f}")
    print(f"  Test R² : {r2_score(y_te,y_pred):.4f}  MAE: {mean_absolute_error(y_te,y_pred):.4f}  MAPE: {mean_absolute_percentage_error(y_te,y_pred)*100:.2f}%")
    cv = cross_val_score(rf,X_tr,y_tr,cv=KFold(5,shuffle=True,random_state=42),scoring="r2",n_jobs=-1)
    print(f"  CV R²   : {cv.mean():.4f} ± {cv.std():.4f}")
    print(f"{'='*55}")
    return rf,gb,scaler,y_te,y_pred


def plot_results(y_te,y_pred,rf,feat_cols,df):
    fig=plt.figure(figsize=(20,12)); fig.patch.set_facecolor("#0a0f1e")
    plt.suptitle("MODEL 1 — Crop Yield Prediction | Governance API + RF+GB Stack",color="white",fontsize=14,y=0.98)
    def s(ax,t=""):
        ax.set_facecolor("#0f1e38"); ax.tick_params(colors="white")
        ax.xaxis.label.set_color("white"); ax.yaxis.label.set_color("white")
        ax.title.set_color("white")
        [sp.set_edgecolor("#1e3a5f") for sp in ax.spines.values()]
        if t: ax.set_title(t,pad=8)

    ax1=fig.add_subplot(3,3,1); ax1.scatter(y_te,y_pred,alpha=0.3,s=8,color="#4ade80")
    lims=[min(y_te.min(),y_pred.min()),max(y_te.max(),y_pred.max())]
    ax1.plot(lims,lims,"r--",lw=1.5); s(ax1,"Actual vs Predicted"); ax1.set_xlabel("Actual t/ha"); ax1.set_ylabel("Predicted t/ha")

    ax2=fig.add_subplot(3,3,2); ax2.hist(y_te-y_pred,bins=50,color="#a78bfa",alpha=0.8); s(ax2,"Residual Distribution"); ax2.set_xlabel("Error t/ha")

    ax3=fig.add_subplot(3,3,3); fi=rf.feature_importances_[:len(feat_cols)]; idx=np.argsort(fi)[-10:]
    ax3.barh([feat_cols[i] for i in idx],fi[idx],color=plt.cm.YlGn(np.linspace(0.4,1.0,10))); s(ax3,"Feature Importance"); ax3.set_xlabel("Importance")

    if "crop" in df.columns and TARGET in df.columns:
        ax4=fig.add_subplot(3,3,4); cy=df.groupby("crop")[TARGET].mean().sort_values()
        ax4.barh(cy.index,cy.values,color=plt.cm.plasma(np.linspace(0.2,0.9,len(cy)))); s(ax4,"Avg Yield by Crop"); ax4.set_xlabel("t/ha")

    if "state" in df.columns and TARGET in df.columns:
        ax5=fig.add_subplot(3,3,5); sy=df.groupby("state")[TARGET].mean().sort_values(ascending=False).head(10)
        ax5.bar(range(len(sy)),sy.values,color=plt.cm.Blues(np.linspace(0.4,1.0,len(sy))))
        ax5.set_xticks(range(len(sy))); ax5.set_xticklabels([x[:8] for x in sy.index],rotation=45,ha="right",color="white",fontsize=7); s(ax5,"Top States")

    if "annual_rainfall" in df.columns and TARGET in df.columns:
        ax6=fig.add_subplot(3,3,6); samp=df.sample(min(2000,len(df)),random_state=42)
        ax6.scatter(samp["annual_rainfall"],samp[TARGET],c=samp.get("ndvi",samp[TARGET]),cmap="YlGn",alpha=0.3,s=5); s(ax6,"Yield vs Rainfall")

    if "drought_index" in df.columns and TARGET in df.columns:
        ax7=fig.add_subplot(3,3,7); samp=df.sample(min(2000,len(df)),random_state=42)
        ax7.scatter(samp["drought_index"],samp[TARGET],alpha=0.3,s=5,color="#f97316"); s(ax7,"Yield vs Drought Index (API)")

    if "rainfall_anomaly" in df.columns and TARGET in df.columns:
        ax8=fig.add_subplot(3,3,8); samp=df.sample(min(2000,len(df)),random_state=42)
        ax8.scatter(samp["rainfall_anomaly"],samp[TARGET],alpha=0.3,s=5,color="#38bdf8"); s(ax8,"Yield vs Rainfall Anomaly (API)")

    ax9=fig.add_subplot(3,3,9)
    lines=[f"Data: Governance API ({len(df):,} rows)",f"Algorithm: RF+GB Stack",
           f"R²:    {r2_score(y_te,y_pred):.4f}",f"MAE:   {mean_absolute_error(y_te,y_pred):.4f} t/ha",
           f"MAPE:  {mean_absolute_percentage_error(y_te,y_pred)*100:.2f}%",f"Features: {len(feat_cols)}"]
    for i,ln in enumerate(lines):
        ax9.text(0.05,0.90-i*0.13,ln,transform=ax9.transAxes,color="#4ade80",fontsize=10,fontfamily="monospace")
    s(ax9,"Model Summary"); ax9.set_xticks([]); ax9.set_yticks([])

    plt.tight_layout(rect=[0,0,1,0.97])
    plt.savefig(f"{OUTPUT_DIR}/model1_yield_prediction.png",dpi=150,bbox_inches="tight",facecolor="#0a0f1e")
    plt.close(); print("[INFO] Plot saved → model1_yield_prediction.png")


def predict_live(district,crop,area_ha,fertilizer_kg,irrigation,soil_ph,soil_type_idx,
                 rf_model,gb_model,scaler,feat_cols,gds=None):
    api_feat = gds.to_live_feature_dict(district) if gds else {}
    coords   = INDIA_COORDS.get(district.lower(),(20.5,78.9))
    w        = fetch_live_weather(*coords)
    rain_ann = api_feat.get("annual_rainfall", min(w["rain_7d"]*52,3000))
    crop_idx = CROP_LIST.index(crop) if crop in CROP_LIST else 0

    feat_vals = {
        "year":datetime.now().year,"annual_rainfall":rain_ann,
        "mean_temp":w["temp"],"temp_stress_deg":max(0,w["temp"]-38)+max(0,10-w["temp"]),
        "soil_moisture":api_feat.get("soil_moisture",w["soil_m"]),
        "ndvi":api_feat.get("ndvi",min(0.9,w["soil_m"]/100*0.5+w["humidity"]/100*0.3+0.2)) if "humidity" in w else 0.5,
        "fertilizer_kg_ha":api_feat.get("fertilizer_kg_ha",fertilizer_kg),
        "irrigation":int(irrigation),"soil_ph":api_feat.get("soil_ph",soil_ph),
        "soil_type_idx":api_feat.get("soil_type_idx",soil_type_idx),
        "crop_idx":crop_idx,"state_idx":0,"season_idx":0,
        "rainfall_anomaly":api_feat.get("rainfall_anomaly",0),
        "drought_index":api_feat.get("drought_index",0.2),
        "population_density":api_feat.get("population_density",300),
        "irrigation_pct":api_feat.get("irrigation_pct",50 if irrigation else 20),
        "production_efficiency":api_feat.get("production_efficiency",1.0),
        "pest_incidence":api_feat.get("pest_incidence",10),
        "flood_risk":api_feat.get("flood_risk",0.1),
    }
    x     = np.array([[feat_vals.get(c,0) for c in feat_cols]])
    x_sc  = scaler.transform(x)
    rfp   = rf_model.predict(x_sc)
    y_pred= gb_model.predict(np.hstack([x_sc,rfp.reshape(-1,1)]))[0]
    std   = np.array([t.predict(x_sc)[0] for t in rf_model.estimators_]).std()
    return {
        "district":district,"crop":crop,
        "predicted_yield":round(max(0,y_pred),3),
        "yield_lower_95":round(max(0,y_pred-1.96*std),3),
        "yield_upper_95":round(y_pred+1.96*std,3),
        "total_production":round(max(0,y_pred)*area_ha,2),
        "forecast_band":"High" if y_pred>3.5 else "Medium" if y_pred>2 else "Low",
        "data_source":"Governance API + Open-Meteo",
        "api_ndvi":round(feat_vals["ndvi"],3),
        "api_drought_idx":round(feat_vals["drought_index"],3),
        "live_temp":w["temp"],"live_rain_7d":w["rain_7d"],
    }


if __name__=="__main__":
    print("\n"+"▓"*55+"\n  MODEL 1: CROP YIELD (Governance API)\n"+"▓"*55)
    df,feat_cols,gds = load_and_prepare(10000)
    rf,gb,scaler,y_te,y_pred = train(df,feat_cols)
    plot_results(y_te,y_pred,rf,feat_cols,df)
    joblib.dump(rf,f"{OUTPUT_DIR}/saved_models/m1_rf.pkl")
    joblib.dump(gb,f"{OUTPUT_DIR}/saved_models/m1_gb.pkl")
    joblib.dump(scaler,f"{OUTPUT_DIR}/saved_models/m1_scaler.pkl")
    joblib.dump(feat_cols,f"{OUTPUT_DIR}/saved_models/m1_feat_cols.pkl")
    print("[INFO] Saved.\n── Live Demo ──")
    r=predict_live("chittoor","Rice",10,150,True,6.5,2,rf,gb,scaler,feat_cols,gds)
    [print(f"  {k:<28}: {v}") for k,v in r.items()]
