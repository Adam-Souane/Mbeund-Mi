import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  CloudRain, 
  Camera, 
  BarChart3, 
  ShieldAlert, 
  Settings, 
  PhoneCall,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard, badge: null },
    { id: 'map', label: 'Carte Interactive', icon: Map, badge: 'SIG' },
    { id: 'forecast', label: 'Prévisions & Alertes', icon: CloudRain, badge: 'Pluie' },
    { id: 'reports', label: 'Signalements Terrain', icon: Camera, badge: '4' },
    { id: 'stats', label: 'Statistiques & Graphiques', icon: BarChart3, badge: null },
    { id: 'crisis', label: 'Gestion de Crise', icon: ShieldAlert, badge: 'URGENT', badgeColor: 'bg-red-600 text-white' },
    { id: 'admin', label: 'Admin & Capteurs', icon: Settings, badge: '92%' },
    { id: 'contact', label: 'Contact & Urgence', icon: PhoneCall, badge: null }
  ];

  return (
    <aside className="w-full md:w-64 bg-brand-navy border-r border-slate-800 text-slate-300 flex flex-col shrink-0">
      
      {/* Navigation menu title */}
      <div className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
        <span>Navigation Principale</span>
      </div>

      <nav className="flex-1 px-3 space-y-1 pb-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-gradient-to-r from-brand-red to-red-700 text-white shadow-lg shadow-red-900/30' 
                  : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700')
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Emergency Hotline Footer Widget */}
      <div className="p-4 m-3 bg-slate-900/90 rounded-2xl border border-red-500/20 text-xs">
        <div className="flex items-center space-x-2 text-brand-red font-bold mb-1">
          <ShieldAlert className="w-4 h-4" />
          <span>Cellule de Crise</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed mb-2">
          En cas d'inondation subite à Thiaroye-sur-Mer, contactez directement la mairie ou les sapeurs-pompiers.
        </p>
        <a 
          href="tel:18" 
          className="block text-center bg-red-600/20 hover:bg-red-600/30 text-red-400 font-mono font-bold py-1.5 rounded-lg border border-red-500/30 transition"
        >
          SOS Pompiers : 18
        </a>
      </div>
    </aside>
  );
}
