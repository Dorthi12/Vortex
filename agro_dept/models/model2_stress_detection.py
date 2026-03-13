"""
=============================================================================
MODEL 2 — CROP STRESS DETECTION  [Governance API Integration]
Algorithm : Random Forest Classifier (calibrated, 6 stress classes)
Training  : governance_master_dataset stress_score + weather cols
Live      : Open-Meteo + API district features
=============================================================================
"""
import os,sys,warnings,requests
import numpy as np,pandas as pd
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split,StratifiedKFold,cross_val_score
from sklearn.metrics import classification_report,confusion_matrix,accuracy_score,f1_score,roc_auc_score
from sklearn.calibration import CalibratedClassifierCV
import joblib

sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from master_data_loader import smart_load

warnings.filterwarnings("ignore"); np.random.seed(42)
OPEN_METEO_URL="https://api.open-meteo.com/v1/forecast"
OUTPUT_DIR="/mnt/user-data/outputs"
os.makedirs(f"{OUTPUT_DIR}/saved_models",exist_ok=True)

STRESS_CLASSES={0:"No Stress",1:"Heat Stress",2:"Drought Stress",
                3:"Waterlogging",4:"Cold Stress",5:"Pest/Disease Risk"}
FEAT_COLS=["mean_temp","humidity","annual_rainfall","soil_moisture","vpd",
           "wind_speed","evapotranspiration","ndvi","crop_idx","season_idx",
           # Governance API extras
           "rainfall_anomaly","drought_index","pest_incidence","disease_incidence",
           "flood_risk","temp_anomaly"]
INDIA_COORDS={"chittoor":(13.21,79.10),"delhi":(28.67,77.21),"patna":(25.61,85.14),
              "lucknow":(26.85,80.95),"jaipur":(26.91,75.79),"hyderabad":(17.38,78.49),
              "mumbai":(19.07,72.88),"kolkata":(22.57,88.36),"amritsar":(31.63,74.87)}


def fetch_live_weather(lat,lon):
    try:
        r=requests.get(OPEN_METEO_URL,timeout=10,params={
            "latitude":lat,"longitude":lon,
            "hourly":"temperature_2m,relative_humidity_2m,precipitation,soil_moisture_0_to_1cm,vapour_pressure_deficit,wind_speed_10m,evapotranspiration",
            "daily":"precipitation_sum,temperature_2m_max,temperature_2m_min",
            "current":"temperature_2m,relative_humidity_2m,wind_speed_10m",
            "forecast_days":7,"timezone":"Asia/Kolkata",
        })
        d=r.json(); h=d.get("hourly",{}); dy=d.get("daily",{}); c=d.get("current",{})
        avg=lambda k: float(np.nanmean(h.get(k,[0])[:168]))
        sm=lambda k: float(np.nansum(dy.get(k,[0])))
        return {"temp":c.get("temperature_2m",avg("temperature_2m")),
                "humidity":avg("relative_humidity_2m"),"rain_7d":sm("precipitation_sum"),
                "soil_m":avg("soil_moisture_0_to_1cm")*100,"vpd":avg("vapour_pressure_deficit"),
                "wind":avg("wind_speed_10m"),"et":avg("evapotranspiration"),
                "max_t":float(np.nanmax(dy.get("temperature_2m_max",[30]))),
                "min_t":float(np.nanmin(dy.get("temperature_2m_min",[15])))}
    except:
        return {"temp":28,"humidity":65,"rain_7d":30,"soil_m":28,"vpd":1.5,"wind":12,"et":0.18,"max_t":35,"min_t":18}


def _label_from_governance(row):
    """Derive stress class from governance_master_dataset columns."""
    scores=[0.0]*6
    t=row.get("mean_temp",28); h=row.get("humidity",65)
    rain=row.get("annual_rainfall",700); sm=row.get("soil_moisture",30)
    vpd=row.get("vpd",1.5); fi=row.get("flood_risk",0)
    di=row.get("drought_index",0.2); pi=row.get("pest_incidence",10)
    dis=row.get("disease_incidence",5); ta=row.get("temp_anomaly",0)

    # Heat
    if t>40: scores[1]+=0.8
    elif t>36+ta: scores[1]+=0.5
    if vpd>4: scores[1]+=0.3
    # Drought
    if di>0.6 and sm<20: scores[2]+=0.9
    elif di>0.4 and rain<400: scores[2]+=0.6
    elif rain<300: scores[2]+=0.4
    # Waterlog
    if fi>0.5 and sm>60: scores[3]+=0.9
    elif fi>0.3 and rain>100: scores[3]+=0.5
    # Cold
    if t<8: scores[4]+=0.9
    elif t<12: scores[4]+=0.5
    # Pest
    if h>82 and 18<t<32: scores[5]+=0.7
    if pi>30: scores[5]+=0.5
    if dis>25: scores[5]+=0.4

    mx=max(scores)
    return 0 if mx<0.25 else int(np.argmax(scores))


def load_and_prepare(n_fallback=12000):
    df,gds=smart_load(n_fallback=n_fallback)
    avail=[c for c in FEAT_COLS if c in df.columns]

    # Label from governance data if stress_score available
    if "stress_score_raw" in df.columns:
        # Use raw score to assign multi-class label
        sc=df["stress_score_raw"]
        # also use individual risk columns for richer labelling
        labels=[]
        for _,row in df.iterrows():
            labels.append(_label_from_governance(row.to_dict()))
        df["stress_label"]=labels
    else:
        # Generate from thresholds if no raw score
        df["stress_label"]=df.apply(lambda r: _label_from_governance(r.to_dict()),axis=1)

    df_model=df[avail+["stress_label"]].dropna()
    print(f"[INFO] Model 2: {len(df_model):,} rows × {len(avail)} features")
    print(f"[INFO] Extra API cols: {[c for c in ['rainfall_anomaly','drought_index','pest_incidence','disease_incidence','flood_risk','temp_anomaly'] if c in avail]}")
    print(df_model["stress_label"].map(STRESS_CLASSES).value_counts())
    return df_model,avail,gds


def train(df,feat_cols):
    X=df[feat_cols].values; y=df["stress_label"].values
    X_tr,X_te,y_tr,y_te=train_test_split(X,y,test_size=0.2,stratify=y,random_state=42)
    scaler=StandardScaler(); X_tr=scaler.fit_transform(X_tr); X_te=scaler.transform(X_te)

    rfc=RandomForestClassifier(n_estimators=400,max_depth=20,class_weight="balanced",
                                max_features="sqrt",n_jobs=-1,random_state=42,oob_score=True)
    rfc.fit(X_tr,y_tr)
    cal=CalibratedClassifierCV(rfc,cv=3,method="isotonic"); cal.fit(X_tr,y_tr)

    y_pred=cal.predict(X_te); y_proba=cal.predict_proba(X_te)
    n_classes=len(np.unique(y))
    print(f"\n{'='*55}\n  MODEL 2 — Stress Detection | Governance API Data\n{'='*55}")
    print(f"  OOB Acc: {rfc.oob_score_:.4f}  Test Acc: {accuracy_score(y_te,y_pred):.4f}  F1: {f1_score(y_te,y_pred,average='weighted'):.4f}")
    if n_classes>1:
        try:
            auc=roc_auc_score(y_te,y_proba,multi_class="ovr",average="weighted")
            print(f"  ROC-AUC: {auc:.4f}")
        except: pass
    print(classification_report(y_te,y_pred,target_names=[STRESS_CLASSES[i] for i in range(6) if i in np.unique(y)],zero_division=0))
    return cal,scaler,y_te,y_pred,rfc


def plot_results(y_te,y_pred,rf_raw,df,feat_cols):
    fig=plt.figure(figsize=(20,12)); fig.patch.set_facecolor("#0a0f1e")
    plt.suptitle("MODEL 2 — Crop Stress Detection | Governance API + RFC",color="white",fontsize=14,y=0.98)
    def s(ax,t=""):
        ax.set_facecolor("#0f1e38"); ax.tick_params(colors="white")
        ax.xaxis.label.set_color("white"); ax.yaxis.label.set_color("white")
        ax.title.set_color("white"); [sp.set_edgecolor("#1e3a5f") for sp in ax.spines.values()]
        if t: ax.set_title(t,pad=8)

    cmap=["#22c55e","#ef4444","#f97316","#38bdf8","#a78bfa","#fbbf24"]
    classes_present=sorted(np.unique(np.concatenate([y_te,y_pred])))

    # 1. Confusion matrix
    ax1=fig.add_subplot(2,3,1); cm=confusion_matrix(y_te,y_pred)
    ax1.imshow(cm.astype(float)/cm.sum(axis=1)[:,None]*100,cmap="Blues")
    labels=[STRESS_CLASSES[i][:8] for i in classes_present]
    ax1.set_xticks(range(len(classes_present))); ax1.set_xticklabels(labels,rotation=45,ha="right",color="white",fontsize=7)
    ax1.set_yticks(range(len(classes_present))); ax1.set_yticklabels(labels,color="white",fontsize=7)
    for i in range(len(classes_present)):
        for j in range(len(classes_present)):
            v=cm.astype(float)/cm.sum(axis=1)[:,None]*100
            ax1.text(j,i,f"{v[i,j]:.0f}%",ha="center",va="center",color="white",fontsize=7)
    s(ax1,"Confusion Matrix")

    # 2. Class dist
    ax2=fig.add_subplot(2,3,2)
    if "stress_label" in df.columns:
        cnts=df["stress_label"].value_counts().sort_index()
        ax2.bar([STRESS_CLASSES.get(i,str(i)) for i in cnts.index],cnts.values,
                color=[cmap[i%6] for i in cnts.index])
        ax2.set_xticklabels([STRESS_CLASSES.get(i,str(i))[:8] for i in cnts.index],rotation=30,ha="right",color="white",fontsize=8)
    s(ax2,"Class Distribution (API Data)")

    # 3. Feature importance
    ax3=fig.add_subplot(2,3,3); fi=rf_raw.feature_importances_[:len(feat_cols)]; idx=np.argsort(fi)[-12:]
    ax3.barh([feat_cols[i] for i in idx],fi[idx],color=plt.cm.YlOrRd(np.linspace(0.3,1.0,len(idx))))
    s(ax3,"Feature Importances"); ax3.set_xlabel("Importance")

    # 4. Drought index vs stress (API col)
    ax4=fig.add_subplot(2,3,4)
    if "drought_index" in df.columns and "stress_label" in df.columns:
        samp=df.sample(min(2000,len(df)),random_state=42)
        for lbl in classes_present:
            mask=samp["stress_label"]==lbl
            ax4.scatter(samp.loc[mask,"drought_index"],samp.loc[mask,"mean_temp"] if "mean_temp" in samp.columns else [lbl]*mask.sum(),
                       c=cmap[lbl%6],s=8,alpha=0.5,label=STRESS_CLASSES[lbl])
        ax4.legend(fontsize=6,facecolor="#0a0f1e",labelcolor="white")
    s(ax4,"Drought Index vs Temp (API)"); ax4.set_xlabel("Drought Index"); ax4.set_ylabel("Temp (°C)")

    # 5. Pest/disease incidence
    ax5=fig.add_subplot(2,3,5)
    if "pest_incidence" in df.columns and "disease_incidence" in df.columns and "stress_label" in df.columns:
        samp=df.sample(min(2000,len(df)),random_state=42)
        for lbl in classes_present:
            mask=samp["stress_label"]==lbl
            ax5.scatter(samp.loc[mask,"pest_incidence"],samp.loc[mask,"disease_incidence"],
                       c=cmap[lbl%6],s=8,alpha=0.5,label=STRESS_CLASSES[lbl])
        ax5.legend(fontsize=6,facecolor="#0a0f1e",labelcolor="white")
    s(ax5,"Pest vs Disease Incidence (API)"); ax5.set_xlabel("Pest Incidence"); ax5.set_ylabel("Disease Incidence")

    # 6. Per-class F1
    from sklearn.metrics import classification_report as cr
    ax6=fig.add_subplot(2,3,6)
    rep=cr(y_te,y_pred,target_names=[STRESS_CLASSES[i] for i in range(6)],output_dict=True,zero_division=0)
    f1s=[rep.get(STRESS_CLASSES[i],{}).get("f1-score",0) for i in range(6)]
    ax6.bar([STRESS_CLASSES[i][:10] for i in range(6)],f1s,color=cmap)
    ax6.set_xticklabels([STRESS_CLASSES[i][:10] for i in range(6)],rotation=30,ha="right",color="white",fontsize=8)
    ax6.set_ylim(0,1.1); s(ax6,"Per-class F1")

    plt.tight_layout(rect=[0,0,1,0.97])
    plt.savefig(f"{OUTPUT_DIR}/model2_stress_detection.png",dpi=150,bbox_inches="tight",facecolor="#0a0f1e")
    plt.close(); print("[INFO] Plot → model2_stress_detection.png")


def predict_live(district,crop_idx,season_idx,ndvi,model,scaler,feat_cols,gds=None):
    api_feat=gds.to_live_feature_dict(district) if gds else {}
    coords=INDIA_COORDS.get(district.lower(),(20.5,78.9))
    w=fetch_live_weather(*coords)
    feat_vals={
        "mean_temp":w["temp"],"humidity":w["humidity"],"annual_rainfall":api_feat.get("annual_rainfall",w["rain_7d"]*52),
        "soil_moisture":api_feat.get("soil_moisture",w["soil_m"]),"vpd":w["vpd"],
        "wind_speed":w["wind"],"evapotranspiration":w["et"],"ndvi":api_feat.get("ndvi",ndvi),
        "crop_idx":crop_idx,"season_idx":season_idx,
        "rainfall_anomaly":api_feat.get("rainfall_anomaly",0),
        "drought_index":api_feat.get("drought_index",0.2),
        "pest_incidence":api_feat.get("pest_incidence",10),
        "disease_incidence":api_feat.get("disease_incidence",5),
        "flood_risk":api_feat.get("flood_risk",0.1),
        "temp_anomaly":api_feat.get("temp_anomaly",0),
    }
    x=np.array([[feat_vals.get(c,0) for c in feat_cols]])
    x_sc=scaler.transform(x)
    label=int(model.predict(x_sc)[0]); proba=model.predict_proba(x_sc)[0]
    stress_score=int(sum(i*20*p for i,p in enumerate(proba)))
    actions={0:"Normal. Continue monitoring.",
             1:"Apply mulching, increase irrigation, shade netting.",
             2:"Drip irrigation immediately. Anti-transpirant spray.",
             3:"Open drainage. Suspend irrigation. Check root rot.",
             4:"Cover crops. Delay sowing if <10°C.",
             5:"Preventive fungicide / bio-pesticide spray."}
    return {"district":district,"stress_class":STRESS_CLASSES[label],"stress_score":stress_score,
            "confidence":round(float(proba[label]),3),
            "all_probs":{STRESS_CLASSES[i]:round(float(p),3) for i,p in enumerate(proba)},
            "action":actions[label],"live_temp":w["temp"],
            "api_drought_index":round(api_feat.get("drought_index",0.2),3),
            "api_pest_incidence":round(api_feat.get("pest_incidence",10),1),
            "data_source":"Governance API + Open-Meteo"}


if __name__=="__main__":
    print("\n"+"▓"*55+"\n  MODEL 2: CROP STRESS (Governance API)\n"+"▓"*55)
    df,feat_cols,gds=load_and_prepare(12000)
    model,scaler,y_te,y_pred,rf_raw=train(df,feat_cols)
    plot_results(y_te,y_pred,rf_raw,df,feat_cols)
    joblib.dump(model,f"{OUTPUT_DIR}/saved_models/m2_rfc.pkl")
    joblib.dump(scaler,f"{OUTPUT_DIR}/saved_models/m2_scaler.pkl")
    joblib.dump(feat_cols,f"{OUTPUT_DIR}/saved_models/m2_feat_cols.pkl")
    print("[INFO] Saved.\n── Live Demo ──")
    r=predict_live("hyderabad",0,0,0.55,model,scaler,feat_cols,gds)
    [print(f"  {k:<26}: {v}") for k,v in r.items() if k!="all_probs"]
