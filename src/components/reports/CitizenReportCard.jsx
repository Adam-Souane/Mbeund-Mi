import React from 'react';
import { MapPin, Clock, ThumbsUp, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CitizenReportCard({ report, onLike }) {
  const isDanger = report.severity === 'ÉLEVÉE';

  return (
    <div className="bg-brand-navy border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-slate-700 transition flex flex-col justify-between">
      
      {/* Report Image Preview with Badge */}
      <div className="relative h-48 w-full overflow-hidden group">
        <img 
          src={report.image} 
          alt={report.location} 
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
        />
        
        {/* Status Badge Top Left */}
        <div className="absolute top-3 left-3 flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
            report.status === 'VALIDÉ' ? 'bg-emerald-500 text-white shadow' : 'bg-amber-500 text-white shadow'
          }`}>
            {report.status}
          </span>
        </div>

        {/* Severity Badge Top Right */}
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
            isDanger ? 'bg-brand-red text-white shadow-lg animate-pulse' : 'bg-slate-900/80 text-slate-300 backdrop-blur'
          }`}>
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{report.severity}</span>
          </span>
        </div>

        {/* Water Depth Overlay Bottom */}
        <div className="absolute bottom-2 left-3 bg-slate-950/80 backdrop-blur px-3 py-1 rounded-xl text-xs font-mono font-bold text-cyan-400 border border-slate-700">
          💧 {report.waterDepth}
        </div>
      </div>

      {/* Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center space-x-1 text-slate-400 text-xs mb-1">
            <MapPin className="w-3.5 h-3.5 text-brand-red" />
            <span className="font-semibold text-slate-200">{report.location}</span>
          </div>

          <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
            "{report.description}"
          </p>
        </div>

        {/* Author & Timestamp */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-3">
          <span className="font-medium text-slate-300">Signalé par {report.author}</span>
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{report.timestamp}</span>
          </span>
        </div>

        {/* Action Buttons (Like / Comment) */}
        <div className="flex items-center justify-between pt-1">
          <button 
            onClick={() => onLike && onLike(report.id)}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 transition"
          >
            <ThumbsUp className="w-3.5 h-3.5 text-brand-sky" />
            <span>Utile ({report.likes})</span>
          </button>

          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{report.comments} réponses</span>
          </div>
        </div>
      </div>
    </div>
  );
}
