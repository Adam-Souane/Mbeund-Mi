import React from 'react';
import { MapPin, Clock, ThumbsUp, MessageSquare, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function CitizenReportCard({ report, onLike }) {
  const { darkMode } = useTheme();
  const isDanger = report.severity === 'ÉLEVÉE';

  return (
    <div className={`border rounded-3xl overflow-hidden shadow-xl transition flex flex-col justify-between ${
      darkMode 
        ? 'bg-brand-navy border-slate-800 text-white hover:border-slate-700' 
        : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 shadow-md'
    }`}>
      
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
            isDanger ? 'bg-brand-red text-white shadow-lg animate-pulse' : 'bg-slate-900/80 text-white backdrop-blur'
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
          <div className="flex items-center space-x-1 text-xs mb-1">
            <MapPin className="w-3.5 h-3.5 text-brand-red" />
            <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{report.location}</span>
          </div>

          <p className={`text-xs leading-relaxed line-clamp-3 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            "{report.description}"
          </p>
        </div>

        {/* Author & Timestamp */}
        <div className={`flex items-center justify-between text-[11px] border-t pt-3 ${
          darkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-500'
        }`}>
          <span className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Signalé par {report.author}</span>
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{report.timestamp}</span>
          </span>
        </div>

        {/* Action Buttons (Like / Comment) */}
        <div className="flex items-center justify-between pt-1">
          <button 
            onClick={() => onLike && onLike(report.id)}
            className={`flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-xl border transition ${
              darkMode 
                ? 'text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border-slate-700' 
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5 text-brand-sky" />
            <span>Utile ({report.likes})</span>
          </button>

          <div className={`flex items-center space-x-1 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{report.comments} réponses</span>
          </div>
        </div>
      </div>
    </div>
  );
}
