import React, { useState } from 'react';
import CitizenReportCard from '../components/reports/CitizenReportCard';
import NewReportModal from '../components/reports/NewReportModal';
import { CITIZEN_REPORTS } from '../utils/mockData';
import { Camera, Plus, Filter, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export default function CitizenReportsPage({ isModalOpen, onOpenModal, onCloseModal }) {
  const [reports, setReports] = useState(CITIZEN_REPORTS);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const filteredReports = reports.filter(r => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'VALIDÉ') return r.status === 'VALIDÉ';
    if (activeFilter === 'EN COURS') return r.status === 'EN COURS';
    if (activeFilter === 'CRITIQUE') return r.severity === 'ÉLEVÉE' || r.severity === 'CRITIQUE';
    return true;
  });

  const handleAddReport = (newReport) => {
    setReports([newReport, ...reports]);
  };

  const handleLike = (id) => {
    setReports(reports.map(r => r.id === id ? { ...r, likes: r.likes + 1 } : r));
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-brand-navy border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
            <Camera className="w-6 h-6 text-amber-400" />
            <span>Signalements & Observations du Terrain</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Contributions citoyennes géolocalisées pour orienter le déploiement des motopompes à Thiaroye-sur-Mer.
          </p>
        </div>

        <button 
          onClick={onOpenModal}
          className="bg-brand-red hover:bg-red-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-red-900/40 transition hover:scale-105 active:scale-95 text-xs flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un Signalement</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-brand-navy p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Total Signalements</span>
            <span className="text-2xl font-extrabold text-white">{reports.length}</span>
          </div>
          <Camera className="w-6 h-6 text-slate-500" />
        </div>

        <div className="bg-brand-navy p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Validés & Traités</span>
            <span className="text-2xl font-extrabold text-emerald-400">
              {reports.filter(r => r.status === 'VALIDÉ' || r.status === 'RÉSOLU').length}
            </span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>

        <div className="bg-brand-navy p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">En Attente Intervention</span>
            <span className="text-2xl font-extrabold text-amber-400">
              {reports.filter(r => r.status === 'EN COURS').length}
            </span>
          </div>
          <Clock className="w-6 h-6 text-amber-400" />
        </div>

        <div className="bg-brand-navy p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Cas Critiques (&gt;40 cm)</span>
            <span className="text-2xl font-extrabold text-brand-red">
              {reports.filter(r => r.severity === 'ÉLEVÉE').length}
            </span>
          </div>
          <AlertTriangle className="w-6 h-6 text-brand-red animate-pulse" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 bg-brand-navy p-2 rounded-2xl border border-slate-800 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
            activeFilter === 'ALL' ? 'bg-brand-red text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Tous les signalements ({reports.length})
        </button>

        <button
          onClick={() => setActiveFilter('VALIDÉ')}
          className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
            activeFilter === 'VALIDÉ' ? 'bg-brand-red text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Validés par le Comité
        </button>

        <button
          onClick={() => setActiveFilter('EN COURS')}
          className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
            activeFilter === 'EN COURS' ? 'bg-brand-red text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          En cours d'examen
        </button>

        <button
          onClick={() => setActiveFilter('CRITIQUE')}
          className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
            activeFilter === 'CRITIQUE' ? 'bg-brand-red text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Niveau d'urgence élevé
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => (
          <CitizenReportCard key={report.id} report={report} onLike={handleLike} />
        ))}
      </div>

      {/* Modal Dialog */}
      <NewReportModal 
        isOpen={isModalOpen} 
        onClose={onCloseModal} 
        onSubmitReport={handleAddReport} 
      />
    </div>
  );
}
