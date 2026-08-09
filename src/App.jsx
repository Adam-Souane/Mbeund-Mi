import React, { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import DashboardPage from './pages/DashboardPage';
import InteractiveMapPage from './pages/InteractiveMapPage';
import AlertsForecastPage from './pages/AlertsForecastPage';
import CitizenReportsPage from './pages/CitizenReportsPage';
import StatisticsPage from './pages/StatisticsPage';
import CrisisPage from './pages/CrisisPage';
import AdminPage from './pages/AdminPage';
import EmergencyContactPage from './pages/EmergencyContactPage';
import NewReportModal from './components/reports/NewReportModal';
import LoginModal from './components/auth/LoginModal';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function AppContent() {
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage setActiveTab={setActiveTab} onOpenEmergencyModal={() => setIsReportModalOpen(true)} />;
      case 'map':
        return <InteractiveMapPage />;
      case 'forecast':
        return <AlertsForecastPage />;
      case 'reports':
        return (
          <CitizenReportsPage 
            isModalOpen={isReportModalOpen} 
            onOpenModal={() => setIsReportModalOpen(true)}
            onCloseModal={() => setIsReportModalOpen(false)}
          />
        );
      case 'stats':
        return <StatisticsPage />;
      case 'crisis':
        return <CrisisPage />;
      case 'admin':
        return <AdminPage />;
      case 'contact':
        return <EmergencyContactPage />;
      default:
        return <DashboardPage setActiveTab={setActiveTab} onOpenEmergencyModal={() => setIsReportModalOpen(true)} />;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'
    }`}>
      
      {/* Sticky Header Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenEmergencyModal={() => setIsReportModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        currentUser={currentUser}
      />

      {/* Main Container Layout */}
      <div className="flex-1 flex flex-col md:flex-row items-start max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 gap-6 min-w-0">
        
        {/* Navigation Sidebar (Fixed / Sticky) */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Page Content */}
        <main className="flex-1 min-w-0 w-full overflow-hidden">
          {renderActivePage()}
        </main>
      </div>

      {/* Footer */}
      <footer className={`border-t py-6 text-center text-xs transition-colors ${
        darkMode ? 'border-slate-800 bg-brand-navy text-slate-400' : 'border-slate-200 bg-white text-slate-500 shadow-inner'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>MBEUND MI</span> — Plateforme de Prévention des Inondations (Thiaroye-sur-Mer, Dakar 2026)
          </div>
          <div className="text-[11px]">
            Projet PFE Frontend React — Université & Commune de Thiaroye-sur-Mer
          </div>
        </div>
      </footer>

      {/* Global New Report Modal */}
      <NewReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitReport={(report) => {
          console.log("Nouveau signalement soumis:", report);
          setIsReportModalOpen(false);
        }}
      />

      {/* Global Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
