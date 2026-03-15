"""
=============================================================================
MODEL 3 — PLANT DISEASE DETECTION  [Governance API Integration]
Algorithm : ResNet-9 CNN (PyTorch) + Google Gemini 1.5 Flash remedy
Training  : PlantVillage Dataset (87K images, 38 classes)
Governance: district disease_incidence + pest_incidence for alert context
Live Input: Image upload → CNN → Gemini remedy + outbreak tracker
=============================================================================
"""
import os,sys,json,base64,argparse,warnings,requests
from pathlib import Path
from datetime import datetime
from collections import defaultdict
import numpy as np
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt

warnings.filterwarnings("ignore")
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from master_data_loader import smart_load

try:
    import torch, torch.nn as nn, torch.nn.functional as F
    import torchvision.transforms as T
    from torchvision.datasets import ImageFolder
    from torch.utils.data import DataLoader
    from PIL import Image
    TORCH_AVAILABLE=True
except ImportError:
    TORCH_AVAILABLE=False
    print("[WARN] PyTorch not installed.")

GEMINI_API_KEY="AIzaSyDDgHtjNZYdbV0Ojtkf7jfVYSr8GsgfA2Q"
GEMINI_URL=f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
DATA_DIR="./plant_disease_dataset"
OUTPUT_DIR="/mnt/user-data/outputs"
os.makedirs(f"{OUTPUT_DIR}/saved_models",exist_ok=True)
MODEL_PATH=f"{OUTPUT_DIR}/saved_models/m3_resnet9.pth"

# ── ResNet-9 Architecture ─────────────────────────────────────────────────────
if TORCH_AVAILABLE:
    def conv_block(ic,oc,pool=False):
        layers=[nn.Conv2d(ic,oc,3,padding=1),nn.BatchNorm2d(oc),nn.ReLU(inplace=True)]
        if pool: layers.append(nn.MaxPool2d(4))
        return nn.Sequential(*layers)

    class ResNet9(nn.Module):
        def __init__(self,ic=3,nc=38):
            super().__init__()
            self.conv1=conv_block(ic,64); self.conv2=conv_block(64,128,pool=True)
            self.res1=nn.Sequential(conv_block(128,128),conv_block(128,128))
            self.conv3=conv_block(128,256,pool=True); self.conv4=conv_block(256,512,pool=True)
            self.res2=nn.Sequential(conv_block(512,512),conv_block(512,512))
            self.classifier=nn.Sequential(nn.MaxPool2d(4),nn.Flatten(),nn.Dropout(0.2),nn.Linear(512,nc))
        def forward(self,x):
            x=self.conv2(self.conv1(x)); x=self.res1(x)+x
            x=self.conv4(self.conv3(x)); x=self.res2(x)+x
            return self.classifier(x)

    INFER_TRANSFORM=T.Compose([T.Resize((256,256)),T.ToTensor(),
        T.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])])

# ── Governance API — district disease context ─────────────────────────────────
def get_district_disease_context(district, gds=None):
    """Pull disease_incidence + pest_incidence from governance API for district."""
    if gds is None: return {}
    feat=gds.to_live_feature_dict(district)
    return {
        "disease_incidence": feat.get("disease_incidence",0),
        "pest_incidence":    feat.get("pest_incidence",0),
        "stress_score":      feat.get("stress_score_raw",0),
        "crop":              feat.get("crop","Unknown"),
        "season":            feat.get("season","Unknown"),
        "rainfall_anomaly":  feat.get("rainfall_anomaly",0),
    }

# ── Gemini Remedy Engine ──────────────────────────────────────────────────────
def get_gemini_remedy(disease_label, image_b64=None, farmer_description="",
                       district_context=None):
    parts=[]
    if image_b64:
        parts.append({"inlineData":{"mimeType":"image/jpeg","data":image_b64}})
    ctx=""
    if district_context:
        ctx=(f"\nDistrict Context from Governance API:\n"
             f"- Disease incidence in district: {district_context.get('disease_incidence',0):.1f}%\n"
             f"- Pest incidence: {district_context.get('pest_incidence',0):.1f}%\n"
             f"- Current season: {district_context.get('season','Unknown')}\n"
             f"- Prevalent crop: {district_context.get('crop','Unknown')}\n"
             f"- Rainfall anomaly: {district_context.get('rainfall_anomaly',0):.1f} mm\n")

    prompt=f"""You are a senior plant pathologist at ICAR (Indian Council of Agricultural Research).
CNN Model detected: "{disease_label}"
{f'Farmer description: "{farmer_description}"' if farmer_description else ''}
{ctx}
Provide comprehensive treatment advisory for Indian farmers.
Respond ONLY in this exact JSON (no markdown, no backticks):
{{"disease_name":"full name","causative_agent":"Fungus/Bacteria/Virus","affected_plant":"plant",
"severity_assessment":"Mild/Moderate/Severe","economic_threshold":"% loss if untreated",
"immediate_action":"do in next 24 hours",
"chemical_treatment":{{"fungicide":"product+dosage","bactericide":"product+dosage","application":"spray method","preharvest_interval":"days"}},
"biological_control":"bio-pesticide with dosage","cultural_practices":"agronomic changes",
"prevention_next_season":"seed treatment + resistant varieties",
"government_schemes":"PMFBY/NHM/RKVY scheme","urgency_level":"Low/Medium/High/Critical",
"spread_risk":"High/Medium/Low","advisory_for_dept":"district advisory text",
"district_risk_note":"assessment given district incidence data"}}"""

    parts.append({"text":prompt})
    try:
        resp=requests.post(GEMINI_URL,json={"contents":[{"parts":parts}]},timeout=25)
        resp.raise_for_status()
        text=resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text.replace("```json","").replace("```","").strip())
    except Exception as e:
        print(f"[WARN] Gemini: {e}")
        return {"disease_name":disease_label,"causative_agent":"Unknown",
                "severity_assessment":"Moderate","immediate_action":"Contact local KVK",
                "chemical_treatment":{"fungicide":"Consult KVK","bactericide":"N/A",
                "application":"Foliar spray","preharvest_interval":"14 days"},
                "biological_control":"Trichoderma viride @ 5g/L",
                "urgency_level":"Medium","spread_risk":"Medium",
                "advisory_for_dept":"Field survey recommended"}


# ── Disease Frequency Tracker ─────────────────────────────────────────────────
class DiseaseFrequencyTracker:
    THRESHOLDS={"watch":2,"advisory":5,"alert":10,"emergency":20}

    def __init__(self,path=f"{OUTPUT_DIR}/disease_freq.json"):
        self.path=path; self.records=self._load()

    def _load(self):
        if os.path.exists(self.path):
            with open(self.path) as f: return json.load(f)
        return {}

    def _save(self):
        with open(self.path,"w") as f: json.dump(self.records,f,indent=2)

    def record(self,disease,district,governance_context=None):
        key=f"{disease}|{district}"
        if key not in self.records:
            self.records[key]={"count":0,"disease":disease,"district":district,
                                "first_seen":str(datetime.now()),"last_seen":str(datetime.now()),
                                "governance_incidence":0}
        self.records[key]["count"]+=1
        self.records[key]["last_seen"]=str(datetime.now())
        if governance_context:
            self.records[key]["governance_incidence"]=governance_context.get("disease_incidence",0)
        self._save()

    def get_alert(self,disease,district):
        key=f"{disease}|{district}"
        count=self.records.get(key,{}).get("count",0)
        # Also factor in governance_incidence
        gov_inc=self.records.get(key,{}).get("governance_incidence",0)
        effective=count + gov_inc/10  # weight API data
        for lvl,th in sorted(self.THRESHOLDS.items(),key=lambda x:-x[1]):
            if effective>=th: return lvl
        return "normal"

    def summary(self):
        rows=[]
        for key,v in self.records.items():
            rows.append({**v,"alert_level":self.get_alert(v["disease"],v["district"])})
        return sorted(rows,key=lambda x:-x["count"])

    def plot_frequency(self):
        s=self.summary()
        if not s: return
        df=s[:15]; labels=[f"{r['disease'][:25]} ({r['district']})" for r in df]
        counts=[r["count"] for r in df]
        colors={"normal":"#22c55e","watch":"#38bdf8","advisory":"#eab308","alert":"#f97316","emergency":"#ef4444"}
        bc=[colors[r["alert_level"]] for r in df]
        fig,ax=plt.subplots(figsize=(14,7)); fig.patch.set_facecolor("#0a0f1e")
        ax.set_facecolor("#0f1e38"); ax.barh(labels[::-1],counts[::-1],color=bc[::-1])
        ax.tick_params(colors="white"); ax.xaxis.label.set_color("white")
        ax.title.set_color("white"); [sp.set_edgecolor("#1e3a5f") for sp in ax.spines.values()]
        ax.set_xlabel("Community Reports"); ax.set_title("Disease Outbreak Frequency (Community + Governance API)")
        patches=[plt.Rectangle((0,0),1,1,color=c) for c in colors.values()]
        ax.legend(patches,colors.keys(),facecolor="#0a0f1e",labelcolor="white")
        plt.tight_layout()
        plt.savefig(f"{OUTPUT_DIR}/model3_disease_frequency.png",dpi=150,bbox_inches="tight",facecolor="#0a0f1e")
        plt.close(); print("[INFO] Frequency chart → model3_disease_frequency.png")


# ── Training ──────────────────────────────────────────────────────────────────
if TORCH_AVAILABLE:
    def train_model(data_dir,epochs=5,batch_size=32,max_lr=0.01):
        from pathlib import Path
        train_dir=Path(data_dir)/"train"; valid_dir=Path(data_dir)/"valid"
        if not train_dir.exists():
            raise FileNotFoundError(f"Dataset not found at {train_dir}\nDownload: kaggle datasets download vipoooool/new-plant-diseases-dataset")
        TRAIN_T=T.Compose([T.Resize((256,256)),T.RandomHorizontalFlip(),T.RandomRotation(15),
                           T.ColorJitter(0.3,0.3,0.2),T.ToTensor(),T.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])])
        VALID_T=T.Compose([T.Resize((256,256)),T.ToTensor(),T.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])])
        train_ds=ImageFolder(str(train_dir),transform=TRAIN_T)
        valid_ds=ImageFolder(str(valid_dir),transform=VALID_T)
        classes=train_ds.classes; device=torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"[INFO] {len(train_ds):,} train | {len(valid_ds):,} valid | {len(classes)} classes | {device}")
        train_dl=DataLoader(train_ds,batch_size,shuffle=True,num_workers=4,pin_memory=True)
        valid_dl=DataLoader(valid_ds,batch_size,num_workers=4,pin_memory=True)
        model=ResNet9(3,len(classes)).to(device)
        opt=torch.optim.Adam(model.parameters(),max_lr,weight_decay=1e-4)
        sched=torch.optim.lr_scheduler.OneCycleLR(opt,max_lr,epochs=epochs,steps_per_epoch=len(train_dl))
        best_acc=0
        for epoch in range(1,epochs+1):
            model.train(); tr_loss=[]
            for imgs,lbls in train_dl:
                imgs,lbls=imgs.to(device),lbls.to(device)
                opt.zero_grad(); loss=F.cross_entropy(model(imgs),lbls)
                loss.backward(); nn.utils.clip_grad_value_(model.parameters(),0.1)
                opt.step(); sched.step(); tr_loss.append(loss.item())
            model.eval(); val_loss=[]; correct=0; total=0
            with torch.no_grad():
                for imgs,lbls in valid_dl:
                    imgs,lbls=imgs.to(device),lbls.to(device); out=model(imgs)
                    val_loss.append(F.cross_entropy(out,lbls).item())
                    _,preds=torch.max(out,1); correct+=(preds==lbls).sum().item(); total+=lbls.size(0)
            acc=correct/total
            print(f"  Epoch {epoch}/{epochs} train={np.mean(tr_loss):.4f} val={np.mean(val_loss):.4f} acc={acc*100:.2f}%")
            if acc>best_acc:
                best_acc=acc
                torch.save({"model_state":model.state_dict(),"classes":classes,"best_acc":best_acc},MODEL_PATH)
                print(f"    ✓ Saved (best={best_acc*100:.2f}%)")
        return model,classes


def load_model():
    if not TORCH_AVAILABLE or not os.path.exists(MODEL_PATH): return None,None
    ckpt=torch.load(MODEL_PATH,map_location="cpu")
    m=ResNet9(3,len(ckpt["classes"])); m.load_state_dict(ckpt["model_state"]); m.eval()
    print(f"[INFO] Loaded model. Best acc: {ckpt['best_acc']*100:.2f}%")
    return m,ckpt["classes"]


def predict_from_image(img_input,model,classes):
    if isinstance(img_input,str): img=Image.open(img_input).convert("RGB")
    else: img=img_input.convert("RGB")
    t=INFER_TRANSFORM(img).unsqueeze(0)
    with torch.no_grad():
        out=model(t); probs=F.softmax(out,1)[0]
        top5v,top5i=torch.topk(probs,5)
    top5=[(classes[i],float(p)) for i,p in zip(top5i,top5v)]
    label,conf=top5[0]; parts=label.split("___")
    return {"label":label,"plant":parts[0].replace("_"," "),
            "disease":parts[1].replace("_"," ") if len(parts)>1 else "healthy",
            "confidence":round(conf,4),"top5":top5,
            "is_healthy":"healthy" in label.lower()}


# ── Full Pipeline ─────────────────────────────────────────────────────────────
def full_pipeline(image_input, district="hyderabad", farmer_text="",
                   model=None, classes=None, tracker=None, gds=None):
    # 1. CNN
    cnn_result={"label":"Unknown","confidence":0,"is_healthy":False}
    if model and classes:
        cnn_result=predict_from_image(image_input,model,classes)
    disease_label=cnn_result["label"] if cnn_result["label"]!="Unknown" else farmer_text

    # 2. Get governance district context
    gov_ctx=get_district_disease_context(district,gds)

    # 3. Gemini remedy (with district context)
    img_b64=None
    if isinstance(image_input,str) and os.path.exists(image_input):
        with open(image_input,"rb") as f: img_b64=base64.b64encode(f.read()).decode()
    remedy=get_gemini_remedy(disease_label,img_b64,farmer_text,gov_ctx)

    # 4. Track + alert (weighted by governance API incidence)
    alert="normal"
    if tracker and not cnn_result["is_healthy"]:
        tracker.record(remedy.get("disease_name",disease_label),district,gov_ctx)
        alert=tracker.get_alert(remedy.get("disease_name",disease_label),district)

    return {"cnn_result":cnn_result,"remedy":remedy,"alert_level":alert,
            "district":district,"governance_context":gov_ctx,"timestamp":str(datetime.now())}


# ── Main ──────────────────────────────────────────────────────────────────────
if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--demo",action="store_true")
    parser.add_argument("--train",action="store_true")
    parser.add_argument("--epochs",type=int,default=5)
    parser.add_argument("--infer",type=str,default=None)
    args=parser.parse_args()

    print("\n"+"▓"*55+"\n  MODEL 3: DISEASE DETECTION (Governance API + Gemini)\n"+"▓"*55)

    # Load governance data for district context
    df_gov,gds=smart_load(n_fallback=3000)
    tracker=DiseaseFrequencyTracker()

    if args.train and TORCH_AVAILABLE:
        print("[MODE] Training ResNet-9...")
        model,classes=train_model(DATA_DIR,epochs=args.epochs)
    elif args.infer:
        model,classes=load_model()
        result=full_pipeline(args.infer,district="hyderabad",model=model,classes=classes,tracker=tracker,gds=gds)
        print(json.dumps(result,indent=2,default=str))
    else:
        print("[MODE] Demo — Gemini remedy + Governance API context")
        demos=[("Tomato___Late_blight","hyderabad"),("Corn___Common_rust","lucknow"),
               ("Rice___Brown_Spot","patna"),("Wheat___Yellow_Rust","amritsar")]
        for disease,district in demos:
            gov_ctx=get_district_disease_context(district,gds)
            remedy=get_gemini_remedy(disease,district_context=gov_ctx)
            tracker.record(remedy.get("disease_name",disease),district,gov_ctx)
            alert=tracker.get_alert(remedy.get("disease_name",disease),district)
            print(f"\n  {disease} @ {district}")
            print(f"    Urgency   : {remedy.get('urgency_level')}")
            print(f"    Immediate : {str(remedy.get('immediate_action',''))[:80]}")
            print(f"    Alert Lvl : {alert.upper()}")
            print(f"    Gov Incid : disease={gov_ctx.get('disease_incidence',0):.1f}% pest={gov_ctx.get('pest_incidence',0):.1f}%")
        tracker.plot_frequency()
        print("\n  Outbreak Summary:")
        for r in tracker.summary()[:8]:
            print(f"    {r['disease'][:30]:<30} {r['district']:<12} count={r['count']} gov_inc={r['governance_incidence']:.1f}% [{r['alert_level'].upper()}]")
