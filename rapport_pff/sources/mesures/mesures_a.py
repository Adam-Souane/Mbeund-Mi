import pickle, numpy as np, json
from sklearn.metrics import accuracy_score, log_loss, confusion_matrix, f1_score
D='C:/Users/pc/Documents/PERSO/Mbeund-Mi/mbeund_mi_ia/data'
L=lambda f: pickle.load(open(D+'/'+f,'rb'))
X,y=L('X_test.pkl'),L('y_test.pkl'); rf,rfc=L('modele_rf.pkl'),L('modele_rf_calibre.pkl')
y=np.asarray(y,dtype=int); out={'n_test':len(y),'classes_test':np.bincount(y,minlength=4).tolist(),'features':list(X.columns)}
for nom,m in [('brut',rf),('calibre',rfc)]:
    p=m.predict_proba(X); oh=np.eye(4)[y][:, :p.shape[1]]
    out[nom]={'accuracy':round(accuracy_score(y,m.predict(X)),4),'brier':round(float(np.mean(np.sum((np.eye(4)[y]-np.pad(p,((0,0),(0,4-p.shape[1]))))**2,axis=1))),5),
              'logloss':round(log_loss(y,p,labels=list(range(p.shape[1]))),5),'f1_macro':round(f1_score(y,m.predict(X),average='macro'),4)}
out['importances']=dict(zip(X.columns,[round(v,4) for v in rf.feature_importances_]))
out['confusion_calibre']=confusion_matrix(y,rfc.predict(X),labels=[0,1,2,3]).tolist()
print(json.dumps(out,indent=1))
