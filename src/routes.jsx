import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import SplashScreen from './shared/layout/SplashScreen';
import LoginPage from './auth-pages/LoginPage';
import SignupPage from './auth-pages/SignupPageNew';
import ForgotPasswordPage from './auth-pages/ForgotPasswordPage';
import AdminRegisterPage from './auth-pages/AdminRegisterPage';
import OTPVerificationPage from './auth-pages/OTPVerificationPage';
import RequireAuth from './auth/RequireAuth';

// Pages de l'application chargées à la demande : l'accueil et la connexion
// n'embarquent plus les graphiques (Recharts) ni la carte (Leaflet).
const AccueilPageBody = lazy(() => import('./citizen/pages/AccueilPageBody'));
const CartePageBody = lazy(() => import('./citizen/pages/CartePageBody'));
const AlertesPrevisionsPageBody = lazy(() => import('./citizen/pages/AlertesPrevisionsPageBody'));
const SignalerPageBody = lazy(() => import('./citizen/pages/SignalerPageBody'));
const ProfilPageBody = lazy(() => import('./citizen/pages/ProfilPageBody'));
const ChatPageBody = lazy(() => import('./citizen/pages/ChatPageBody'));
const TableauDeBordPage = lazy(() => import('./autorite/pages/TableauDeBordPage'));
const CarteInteractivePage = lazy(() => import('./autorite/pages/CarteInteractivePage'));
const PrevisionsAlertesPage = lazy(() => import('./autorite/pages/PrevisionsAlertesPage'));
const SignalementsTerrainPage = lazy(() => import('./autorite/pages/SignalementsTerrainPage'));
const StatistiquesPage = lazy(() => import('./autorite/pages/StatistiquesPage'));
const GestionDeCrisePage = lazy(() => import('./autorite/pages/GestionDeCrisePage'));
const AdminCapteursPage = lazy(() => import('./autorite/pages/AdminCapteursPage'));
const ContactUrgencePage = lazy(() => import('./autorite/pages/ContactUrgencePage'));
const RegistreCommunautairePage = lazy(() => import('./autorite/pages/RegistreCommunautairePage'));
const FiabiliteModelePage = lazy(() => import('./autorite/pages/FiabiliteModelePage'));
const BacktestingPage = lazy(() => import('./autorite/pages/BacktestingPage'));
const ManageAuthoritiesPage = lazy(() => import('./autorite/pages/ManageAuthoritiesPage'));
const AuthorityTrackingPage = lazy(() => import('./autorite/pages/AuthorityTrackingPage'));
const ExportPage = lazy(() => import('./autorite/pages/ExportPage'));
const PredictionsDashboard = lazy(() => import('./pages/PredictionsDashboard'));

function ChargementPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-50 dark:bg-navy-950" role="status" aria-label="Chargement">
      <Loader2 size={28} className="animate-spin text-navy-400" aria-hidden="true" />
    </div>
  );
}

function Citoyen({ children }) {
  return <RequireAuth space="citoyen">{children}</RequireAuth>;
}

function Autorite({ children }) {
  return <RequireAuth space="autorite">{children}</RequireAuth>;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<ChargementPage />}>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/admin-register" element={<AdminRegisterPage />} />
        <Route path="/otp-verify" element={<OTPVerificationPage />} />

        {/* Citoyen */}
        <Route path="/citoyen/accueil" element={<Citoyen><AccueilPageBody /></Citoyen>} />
        <Route path="/citoyen/carte" element={<Citoyen><CartePageBody /></Citoyen>} />
        <Route path="/citoyen/alertes" element={<Citoyen><AlertesPrevisionsPageBody /></Citoyen>} />
        <Route path="/citoyen/signaler" element={<Citoyen><SignalerPageBody /></Citoyen>} />
        <Route path="/citoyen/profil" element={<Citoyen><ProfilPageBody /></Citoyen>} />
        <Route path="/citoyen/chat" element={<Citoyen><ChatPageBody /></Citoyen>} />

        {/* Autorité */}
        <Route path="/autorite/dashboard" element={<Autorite><TableauDeBordPage /></Autorite>} />
        <Route path="/autorite/predictions" element={<Autorite><PredictionsDashboard /></Autorite>} />
        <Route path="/autorite/carte" element={<Autorite><CarteInteractivePage /></Autorite>} />
        <Route path="/autorite/previsions" element={<Autorite><PrevisionsAlertesPage /></Autorite>} />
        <Route path="/autorite/signalements" element={<Autorite><SignalementsTerrainPage /></Autorite>} />
        <Route path="/autorite/registre" element={<Autorite><RegistreCommunautairePage /></Autorite>} />
        <Route path="/autorite/statistiques" element={<Autorite><StatistiquesPage /></Autorite>} />
        <Route path="/autorite/fiabilite" element={<Autorite><FiabiliteModelePage /></Autorite>} />
        <Route path="/autorite/backtesting" element={<Autorite><BacktestingPage /></Autorite>} />
        <Route path="/autorite/crise" element={<Autorite><GestionDeCrisePage /></Autorite>} />
        <Route path="/autorite/capteurs" element={<Autorite><AdminCapteursPage /></Autorite>} />
        <Route path="/autorite/contact" element={<Autorite><ContactUrgencePage /></Autorite>} />
        <Route path="/autorite/authorities" element={<Autorite><ManageAuthoritiesPage /></Autorite>} />
        <Route path="/autorite/tracking" element={<Autorite><AuthorityTrackingPage /></Autorite>} />
        <Route path="/autorite/export" element={<Autorite><ExportPage /></Autorite>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
