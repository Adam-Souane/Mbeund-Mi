import pickle, json, numpy as np, pandas as pd
from sklearn.base import clone
from sklearn.model_selection import LeaveOneOut, cross_val_predict
from sklearn.metrics import accuracy_score, confusion_matrix
B='C:/Users/pc/Documents/PERSO/Mbeund-Mi/backend/alertes/'
md=pickle.load(open(B+'random_forest_flood_risk_model.pkl','rb'))
print('cles', list(md.keys()))
model=md['model']; enc=md.get('drainage_encoder')
h=pd.read_csv(B+'historique_inondations_2020_2026.csv'); t=pd.read_csv(B+'topographie_thiaroye.csv')
d=h.merge(t,on='Zone')
gmap={'Faible':0,'Moyen':1,'Grave':2}
X=pd.DataFrame({'Pluviometrie_mm':d.Pluviometrie_mm,'Altitude_mediane_m':d.Altitude_mediane_m,'Pente_percent':d.Pente_percent,
                'Permeabilite_percent':d.Permeabilite_percent,'Drainage_encoded':enc.transform(d.Drainage_qualite)})
y=d.Gravite_niveau.map(gmap).values
print('repartition', dict(d.Gravite_niveau.value_counts()))
print('params', {k:v for k,v in model.get_params().items() if k in ('n_estimators','max_depth','random_state','class_weight')})
print('exactitude_apprentissage', accuracy_score(y, model.predict(X)))
p=cross_val_predict(clone(model), X, y, cv=LeaveOneOut())
print('exactitude_LOO', round(accuracy_score(y,p),3))
print('confusion_LOO', confusion_matrix(y,p,labels=[0,1,2]).tolist())
print('importances', dict(zip(X.columns, np.round(model.feature_importances_,3))))
print('majoritaire', round(max(np.bincount(y))/len(y),3))
