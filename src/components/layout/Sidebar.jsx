import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  CloudRain, 
  Camera, 
  BarChart3, 
  ShieldAlert, 
  Settings, 
  PhoneCall
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { darkMode } = useTheme();

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
    <aside className={`w-full md:w-64 border flex flex-col shrink-0 rounded-3xl transition-colors duration-300 md:sticky md:top-20 md:max-h-[calc(100vh-6rem)] overflow-y-auto shadow-lg select-none ${
      darkMode 
        ? 'bg-brand-navy border-slate-800 text-slate-300' 
        : 'bg-white border-slate-200 text-slate-700'
    }`}>
      
      {/* Navigation menu title */}
      <div className={`p-4 text-xs font-semibold uppercase tracking-wider flex items-center justify-between shrink-0 ${
        darkMode ? 'text-slate-400' : 'text-slate-500'
      }`}>
        <span>Navigation Principale</span>
      </div>

      <nav className="flex-1 px-3 space-y-1 pb-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all min-w-0 ${
                isActive 
                  ? 'bg-gradient-to-r from-brand-red to-red-700 text-white shadow-md shadow-red-900/30 font-bold' 
                  : darkMode
                    ? 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                    : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3 truncate mr-1">
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${isActive ? 'text-white' : darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                  item.badgeColor || (isActive 
                    ? 'bg-white/20 text-white' 
                    : darkMode ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-600 border border-slate-200')
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Emergency Hotline Footer Widget */}
      <div className={`p-4 m-3 rounded-2xl border text-xs transition-colors shrink-0 ${
        darkMode 
          ? 'bg-slate-900/90 border-red-500/20' 
          : 'bg-red-50/60 border-red-200'
      }`}>
        <div className="flex items-center space-x-2 text-brand-red font-bold mb-1">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span className="truncate">Cellule de Crise</span>
        </div>
        <p className={`text-[11px] leading-relaxed mb-2 break-words ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          En cas d'inondation subite à Thiaroye-sur-Mer, contactez directement la mairie ou les sapeurs-pompiers.
        </p>
        <a 
          href="tel:18" 
          className="block text-center bg-red-600 text-white hover:bg-red-700 font-mono font-bold py-1.5 rounded-lg transition shadow-sm truncate"
        >
          SOS Pompiers : 18
        </a>
      </div>
    </aside>
  );
}
