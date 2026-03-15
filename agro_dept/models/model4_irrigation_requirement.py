"""
=============================================================================
MODEL 4 — IRRIGATION REQUIREMENT  [Governance API Integration]
Algorithm : HistGradientBoosting + FAO-56 Penman-Monteith physics layer
Training  : governance_master_dataset (drought_index, rainfall_anomaly cols)
Live      : Open-Meteo + WeatherBit + Governance API district features
=============================================================================
"""
import os,sys,warnings,requests
import numpy as np,pandas as pd
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.ensemble import HistGradientBoostingRegressor,GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error,mean_squared_error,r2_score
import joblib

sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from master_data_loader import smart_load

warnings.filterwarnings("ignore"); np.random.seed(42)
OPEN_METEO_URL="https://api.open-meteo.com/v1/forecast"
WEATHERBIT_URL="https://api.weatherbit.io/v2.0/current"
WEATHERBIT_KEY="ffd13dad3d6c49a39f4b1b6a77b8d222"
OUTPUT_DIR="/mnt/user-data/outputs"
os.makedirs(f"{OUTPUT_DIR}/saved_models",exist_ok=True)

CROP_LIST=["Rice","Wheat","Maize","Sugarcane","Cotton","Soybean","Groundnut","Mustard","Pulses","Vegetables"]
INDIA_COORDS={"chittoor":(13.21,79.10),"delhi":(28.67,77.21),"patna":(25.61,85.14),
              "lucknow":(26.85,80.95),"jaipur":(26.91,75.79),"hyderabad":(17.38,78.49),
              "mumbai":(19.07,72.88),"kolkata":(22.57,88.36),"amritsar":(31.63,74.87)}

FEAT_COLS=["mean_temp","humidity","wind_speed","soil_moisture","annual_rainfall",
           "evapotranspiration","ndvi","crop_idx","season_idx","area_ha","elevation",
           "drought_index","rainfall_anomaly","production_efficiency"]
TARGET="irrigation_mm_day"


def fao56_et0(T,RH,u2_kmh,Rs,elev=100):
    u2=u2_kmh/3.6; es=0.6108*np.exp(17.27*T/(T+237.3)); ea=es*RH/100
    delta=4098*es/(T+237.3)**2; P=101.3*((293-0.0065*elev)/293)**5.26; gamma=0.000665*P
    Rns=0.77*Rs; Rnl=4.903e-9*((T+273.16)**4)*(0.34-0.14*max(ea,0.01)**0.5)*(1.35*Rs/20-0.35)
    et0=(0.408*(delta*(Rns-Rnl))+gamma*(900/(T+273))*u2*(es-ea))/(delta+gamma*(1+0.34*u2))
    return max(0.0,round(float(et0),4))


def compute_kc(crop,days):
    P={"Rice":(30,90,30,1.05,1.20,0.75),"Wheat":(25,80,30,0.40,1.15,0.40),
       "Maize":(20,80,30,0.40,1.20,0.60),"Sugarcane":(35,245,60,0.40,1.25,0.75),
       "Cotton":(30,120,45,0.45,1.15,0.65),"Soybean":(20,70,30,0.40,1.15,0.50),
       "Groundnut":(25,80,25,0.45,1.05,0.55),"Mustard":(20,75,25,0.35,1.05,0.35),
       "Pulses":(20,65,25,0.40,1.05,0.35),"Vegetables":(15,55,20,0.60,1.05,0.80)}
    Ld,Lm,Le,kci,kcm,kce=P.get(crop,P["Rice"])
    if days<=Ld: return kci+(kcm-kci)*days/max(1,Ld)
    elif days<=Ld+Lm: return kcm
    elif days<=Ld+Lm+Le: return kcm+(kce-kcm)*(days-Ld-Lm)/max(1,Le)
    return kce


def fetch_weather(lat,lon):
    try:
        r=requests.get(OPEN_METEO_URL,timeout=10,params={
            "latitude":lat,"longitude":lon,
            "hourly":"temperature_2m,relative_humidity_2m,wind_speed_10m,soil_moisture_0_to_1cm,evapotranspiration,shortwave_radiation",
            "daily":"precipitation_sum,et0_fao_evapotranspiration,shortwave_radiation_sum,temperature_2m_max,temperature_2m_min",
            "current":"temperature_2m,relative_humidity_2m,wind_speed_10m",
            "forecast_days":7,"timezone":"Asia/Kolkata"})
        d=r.json(); h=d.get("hourly",{}); dy=d.get("daily",{}); c=d.get("current",{})
        avg=lambda k: float(np.nanmean(h.get(k,[0])[:24]))
        sm=lambda k: float(np.nansum(dy.get(k,[0])))
        return {"temp":c.get("temperature_2m",avg("temperature_2m")),"humidity":avg("relative_humidity_2m"),
                "wind":avg("wind_speed_10m"),"rain_today":float(dy.get("precipitation_sum",[0])[0]),
                "rain_7d":sm("precipitation_sum"),"et0":float(dy.get("et0_fao_evapotranspiration",[0.3])[0]),
                "radiation":float(dy.get("shortwave_radiation_sum",[15])[0]),"soil_m":avg("soil_moisture_0_to_1cm")*100,
                "source":"open-meteo"}
    except:
        try:
            r=requests.get(WEATHERBIT_URL,timeout=8,params={"lat":lat,"lon":lon,"key":WEATHERBIT_KEY,"units":"M"})
            obs=r.json()["data"][0]; t=float(obs.get("temp",28)); rh=float(obs.get("rh",65))
            ws=float(obs.get("wind_spd",2))*3.6; rad=float(obs.get("solar_rad",15))
            return {"temp":t,"humidity":rh,"wind":ws,"rain_today":0,"rain_7d":10,"et0":fao56_et0(t,rh,ws,rad),"radiation":rad,"soil_m":28,"source":"weatherbit"}
        except:
            return {"temp":28,"humidity":65,"wind":12,"rain_today":0,"rain_7d":35,"et0":0.28,"radiation":18,"soil_m":28,"source":"default"}


def load_and_prepare(n_fallback=12000):
    df,gds=smart_load(n_fallback=n_fallback)
    # Derive irrigation target if missing
    if TARGET not in df.columns:
        T=df["mean_temp"] if "mean_temp" in df.columns else pd.Series(np.full(len(df),28.0))
        RH=df["humidity"] if "humidity" in df.columns else pd.Series(np.full(len(df),65.0))
        rain=df["annual_rainfall"] if "annual_rainfall" in df.columns else pd.Series(np.full(len(df),700.0))
        di=df["drought_index"] if "drought_index" in df.columns else pd.Series(np.full(len(df),0.3))
        et0=0.0023*(T+17.8)*4.5; etc=et0*1.1; eff_rain=rain/365*0.7
        df[TARGET]=np.maximum(0,etc*(1+di*0.3)-eff_rain)
    avail=[c for c in FEAT_COLS if c in df.columns]
    df_model=df[avail+[TARGET]].dropna()
    print(f"[INFO] Model 4: {len(df_model):,} rows × {len(avail)} feats")
    print(f"[INFO] API extras: {[c for c in ['drought_index','rainfall_anomaly','production_efficiency'] if c in avail]}")
    return df_model,avail,gds


def train(df,feat_cols):
    X=df[feat_cols].values; y=df[TARGET].values
    X_tr,X_te,y_tr,y_te=train_test_split(X,y,test_size=0.2,random_state=42)
    scaler=StandardScaler(); X_tr=scaler.fit_transform(X_tr); X_te=scaler.transform(X_te)
    hgb=HistGradientBoostingRegressor(max_iter=300,learning_rate=0.05,max_depth=8,
                                       l2_regularization=0.5,random_state=42,validation_fraction=0.1,n_iter_no_change=20)
    hgb.fit(X_tr,y_tr)
    gbr=GradientBoostingRegressor(n_estimators=200,max_depth=6,learning_rate=0.05,subsample=0.8,random_state=42)
    gbr.fit(X_tr,y_tr); y_pred=hgb.predict(X_te)
    print(f"\n{'='*55}\n  MODEL 4 — Irrigation | Governance API Data\n{'='*55}")
    print(f"  R²: {r2_score(y_te,y_pred):.4f}  MAE: {mean_absolute_error(y_te,y_pred):.4f}  RMSE: {mean_squared_error(y_te,y_pred)**0.5:.4f}")
    return hgb,gbr,scaler,y_te,y_pred


def plot_results(y_te,y_pred,gbr,df,feat_cols):
    fig=plt.figure(figsize=(18,10)); fig.patch.set_facecolor("#0a0f1e")
    plt.suptitle("MODEL 4 — Irrigation Requirement | Governance API + HistGBR + FAO-56",color="white",fontsize=13,y=0.98)
    def s(ax,t=""):
        ax.set_facecolor("#0f1e38"); ax.tick_params(colors="white")
        ax.xaxis.label.set_color("white"); ax.yaxis.label.set_color("white")
        ax.title.set_color("white"); [sp.set_edgecolor("#1e3a5f") for sp in ax.spines.values()]
        if t: ax.set_title(t,pad=8)
    ax1=fig.add_subplot(2,3,1); ax1.scatter(y_te,y_pred,alpha=0.3,s=8,color="#38bdf8")
    lims=[min(y_te.min(),y_pred.min()),max(y_te.max(),y_pred.max())]
    ax1.plot(lims,lims,"r--",lw=1.5); s(ax1,"Actual vs Predicted"); ax1.set_xlabel("Actual mm/day"); ax1.set_ylabel("Predicted mm/day")
    ax2=fig.add_subplot(2,3,2); ax2.hist(y_te-y_pred,bins=50,color="#38bdf8",alpha=0.8); s(ax2,"Residuals")
    ax3=fig.add_subplot(2,3,3); fi=gbr.feature_importances_[:len(feat_cols)]; idx=np.argsort(fi)[-10:]
    ax3.barh([feat_cols[i] for i in idx],fi[idx],color=plt.cm.Blues(np.linspace(0.3,1.0,10))); s(ax3,"Feature Importance")
    if "drought_index" in df.columns:
        ax4=fig.add_subplot(2,3,4); samp=df.sample(min(2000,len(df)),random_state=42)
        ax4.scatter(samp["drought_index"],samp[TARGET],alpha=0.3,s=5,color="#f97316"); s(ax4,"Drought Index vs IR (API)")
    if "rainfall_anomaly" in df.columns:
        ax5=fig.add_subplot(2,3,5); samp=df.sample(min(2000,len(df)),random_state=42)
        ax5.scatter(samp["rainfall_anomaly"],samp[TARGET],alpha=0.3,s=5,color="#a78bfa"); s(ax5,"Rainfall Anomaly vs IR (API)")
    ax6=fig.add_subplot(2,3,6)
    lines=[f"Data: Governance API ({len(df):,} rows)",f"Algorithm: HistGBR + FAO-56 ET0",
           f"R²:   {r2_score(y_te,y_pred):.4f}",f"MAE:  {mean_absolute_error(y_te,y_pred):.4f} mm/day",
           f"RMSE: {mean_squared_error(y_te,y_pred)**0.5:.4f} mm/day"]
    [ax6.text(0.05,0.88-i*0.15,ln,transform=ax6.transAxes,color="#38bdf8",fontsize=10,fontfamily="monospace") for i,ln in enumerate(lines)]
    s(ax6,"Summary"); ax6.set_xticks([]); ax6.set_yticks([])
    plt.tight_layout(rect=[0,0,1,0.97])
    plt.savefig(f"{OUTPUT_DIR}/model4_irrigation.png",dpi=150,bbox_inches="tight",facecolor="#0a0f1e")
    plt.close(); print("[INFO] Plot → model4_irrigation.png")


def predict_live(district,crop,days_sowing,area_ha,elevation_m,model,scaler,feat_cols,gds=None):
    api_feat=gds.to_live_feature_dict(district) if gds else {}
    coords=INDIA_COORDS.get(district.lower(),(20.5,78.9)); w=fetch_weather(*coords)
    crop_idx=CROP_LIST.index(crop) if crop in CROP_LIST else 0
    et0_live=fao56_et0(w["temp"],w["humidity"],w["wind"],w["radiation"],elevation_m)
    kc_live=compute_kc(crop,days_sowing)
    feat_vals={"mean_temp":w["temp"],"humidity":w["humidity"],"wind_speed":w["wind"],
               "soil_moisture":api_feat.get("soil_moisture",w["soil_m"]),
               "annual_rainfall":api_feat.get("annual_rainfall",min(w["rain_7d"]*52,3000)),
               "evapotranspiration":et0_live,"ndvi":api_feat.get("ndvi",0.5),
               "crop_idx":crop_idx,"season_idx":0,"area_ha":area_ha,"elevation":elevation_m,
               "drought_index":api_feat.get("drought_index",0.2),
               "rainfall_anomaly":api_feat.get("rainfall_anomaly",0),
               "production_efficiency":api_feat.get("production_efficiency",1.0)}
    x=np.array([[feat_vals.get(c,0) for c in feat_cols]])
    x_sc=scaler.transform(x); ir=max(0,float(model.predict(x_sc)[0]))
    alert="Urgent" if ir>8 else "Scheduled" if ir>5 else "Normal" if ir>2 else "None"
    return {"district":district,"crop":crop,"et0_fao56":round(et0_live,3),
            "kc_stage":round(kc_live,3),"irrigation_mm_day":round(ir,3),
            "irrigation_weekly_mm":round(ir*7,2),"irrigation_m3_day":round(ir*area_ha*10,1),
            "alert":alert,"method":"Drip" if ir>5 else "Sprinkler" if ir>2 else "Rainfed",
            "api_drought_index":round(api_feat.get("drought_index",0.2),3),
            "api_rainfall_anomaly":round(api_feat.get("rainfall_anomaly",0),1),
            "weather_source":w["source"],"data_source":"Governance API + Open-Meteo/WeatherBit + FAO-56"}


if __name__=="__main__":
    print("\n"+"▓"*55+"\n  MODEL 4: IRRIGATION (Governance API)\n"+"▓"*55)
    df,feat_cols,gds=load_and_prepare(12000)
    hgb,gbr,scaler,y_te,y_pred=train(df,feat_cols)
    plot_results(y_te,y_pred,gbr,df,feat_cols)
    joblib.dump(hgb,f"{OUTPUT_DIR}/saved_models/m4_hgb.pkl")
    joblib.dump(scaler,f"{OUTPUT_DIR}/saved_models/m4_scaler.pkl")
    joblib.dump(feat_cols,f"{OUTPUT_DIR}/saved_models/m4_feat_cols.pkl")
    print("[INFO] Saved.\n── Live Demo ──")
    r=predict_live("lucknow","Wheat",45,8,120,hgb,scaler,feat_cols,gds)
    [print(f"  {k:<32}: {v}") for k,v in r.items()]
