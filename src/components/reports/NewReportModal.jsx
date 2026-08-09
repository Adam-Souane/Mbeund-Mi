import React, { useState } from 'react';
import { X, Camera, MapPin, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function NewReportModal({ isOpen, onClose, onSubmitReport }) {
  const [formData, setFormData] = useState({
    author: '',
    location: 'Thiaroye Gare',
    waterDepth: '30 cm',
    severity: 'ÉLEVÉE',
    description: '',
    photoUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80'
  });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onSubmitReport({
        id: `REP-2026-${Math.floor(100 + Math.random() * 900)}`,
        ...formData,
        timestamp: "À l'instant",
        status: "EN COURS",
        coords: [14.7480, -17.3760],
        likes: 1,
        comments: 0
      });
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-brand-navy border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-brand-red animate-pulse" />
            <h3 className="font-bold text-white text-base">Signaler une Inondation Terrain</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-xl font-bold text-white">Signalement Envoyé !</h4>
            <p className="text-slate-400 text-xs">
              Merci pour votre contribution. L'équipe municipale et la cellule de crise ont bien reçu la géolocalisation et la photo.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            
            {/* Author Name */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Votre Nom & Prénom</label>
              <input 
                type="text" 
                required
                placeholder="Ex: Moussa Diop" 
                value={formData.author}
                onChange={e => setFormData({ ...formData, author: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-red"
              />
            </div>

            {/* Location Select */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Quartier / Emplacement (Thiaroye)</label>
              <select 
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-red"
              >
                <option value="Thiaroye Gare — Centre">Thiaroye Gare — Centre</option>
                <option value="Tally Diallo">Tally Diallo</option>
                <option value="Guinaw Rails Sud">Guinaw Rails Sud</option>
                <option value="Thiaroye Sur Mer — Plage Nord">Thiaroye Sur Mer — Plage Nord</option>
                <option value="Route Nationale N1">Route Nationale N1</option>
              </select>
            </div>

            {/* Severity & Water Depth */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Niveau d'Eau Estimé</label>
                <input 
                  type="text" 
                  value={formData.waterDepth}
                  onChange={e => setFormData({ ...formData, waterDepth: e.target.value })}
                  placeholder="Ex: 40 cm"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Gravité de l'Incident</label>
                <select 
                  value={formData.severity}
                  onChange={e => setFormData({ ...formData, severity: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-red"
                >
                  <option value="FAIBLE">FAIBLE (Légère stagnation)</option>
                  <option value="MOYENNE">MOYENNE (Niveau chevilles)</option>
                  <option value="ÉLEVÉE">ÉLEVÉE (Infiltration maisons)</option>
                  <option value="CRITIQUE">CRITIQUE (Urgence secours)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Description détaillée</label>
              <textarea 
                rows="3"
                required
                placeholder="Précisez les blocages (caniveau bouché, maisons touchées, véhicules coincés)..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-red"
              ></textarea>
            </div>

            {/* Photo Upload simulation */}
            <div className="p-3 bg-slate-900/80 border border-dashed border-slate-700 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-brand-sky" />
                <span className="text-slate-300">Photo d'illustration jointe</span>
              </div>
              <span className="text-emerald-400 text-[11px] font-bold">Image_Inondation.jpg</span>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              className="w-full flex items-center justify-center space-x-2 bg-brand-red hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-900/40 transition active:scale-95 text-sm mt-2"
            >
              <Send className="w-4 h-4" />
              <span>Transmettre le Signalement</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
