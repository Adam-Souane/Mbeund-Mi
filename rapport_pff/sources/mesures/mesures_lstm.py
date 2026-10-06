import os, pickle, json, numpy as np
os.environ['TF_CPP_MIN_LOG_LEVEL']='3'
D='C:/Users/pc/Documents/PERSO/Mbeund-Mi/mbeund_mi_ia/data'
X=np.load(D+'/X_train.npy'); y=np.load(D+'/y_train.npy')
sc=pickle.load(open(D+'/scaler.pkl','rb'))
n=len(X); cut=int(n*0.8)            # validation_split=0.2 de Keras = 20 % finaux
Xv,yv=X[cut:],y[cut:]
import tensorflow as tf
m=tf.keras.models.load_model(D+'/modele_lstm.h5',compile=False)
pred=m.predict(Xv,verbose=0).ravel()
# Référence naïve : niveau du dernier jour de la fenêtre (persistance)
last=Xv[:,-1,:]; inv=sc.inverse_transform(last); pers=inv[:,3]
mae=lambda a,b: float(np.mean(np.abs(a-b)))
rmse=lambda a,b: float(np.sqrt(np.mean((a-b)**2)))
evts=yv>=30
print(json.dumps({'n_sequences':int(n),'n_validation':int(len(yv)),'niveau_moyen_cm':round(float(yv.mean()),2),
 'lstm':{'mae':round(mae(pred,yv),2),'rmse':round(rmse(pred,yv),2)},
 'persistance':{'mae':round(mae(pers,yv),2),'rmse':round(rmse(pers,yv),2)},
 'jours_niveau_ge_30cm':int(evts.sum()),
 'lstm_mae_sur_ces_jours':round(mae(pred[evts],yv[evts]),2) if evts.any() else None,
 'persistance_mae_sur_ces_jours':round(mae(pers[evts],yv[evts]),2) if evts.any() else None},indent=1))
