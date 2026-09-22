import { Routes, Route, Navigate } from 'react-router-dom';
import SplashScreen from './shared/layout/SplashScreen';
import LoginPage from './auth-pages/LoginPage';
import SignupPage from './auth-pages/SignupPageNew';
import ForgotPasswordPage from './auth-pages/ForgotPasswordPage';
import AdminRegisterPage from './auth-pages/AdminRegisterPage';
import OTPVerificationPage from './auth-pages/OTPVerificationPage';
import RequireAuth from './auth/RequireAuth';
import AccueilPageBody from './citizen/pages/AccueilPageBody';
import CartePageBody from './citizen/pages/CartePageBody';
import AlertesPrevisionsPageBody from './citizen/pages/AlertesPrevisionsPageBody';
import SignalerPageBody from './citizen/pages/SignalerPageBody';
import ProfilPageBody from './citizen/pages/ProfilPageBody';
import ChatPageBody from './citizen/pages/ChatPageBody';
import TableauDeBordPage from './autorite/pages/TableauDeBordPage';
import CarteInteractivePage from './autorite/pages/CarteInteractivePage';
import PrevisionsAlertesPage from './autorite/pages/PrevisionsAlertesPage';
import SignalementsTerrainPage from './autorite/pages/SignalementsTerrainPage';
import StatistiquesPage from './autorite/pages/StatistiquesPage';
import GestionDeCrisePage from './autorite/pages/GestionDeCrisePage';
import AdminCapteursPage from './autorite/pages/AdminCapteursPage';
import ContactUrgencePage from './autorite/pages/ContactUrgencePage';
import RegistreCommunautairePage from './autorite/pages/RegistreCommunautairePage';
import FiabiliteModelePage from './autorite/pages/FiabiliteModelePage';
import BacktestingPage from './autorite/pages/BacktestingPage';
import ManageAuthoritiesPage from './autorite/pages/ManageAuthoritiesPage';
import AuthorityTrackingPage from './autorite/pages/AuthorityTrackingPage';
import ExportPage from './autorite/pages/ExportPage';
import PredictionsDashboard from './pages/PredictionsDashboard';

function Citoyen({ children }) {
  return <RequireAuth space="citoyen">{children}</RequireAuth>;
}

function Autorite({ children }) {
  return <RequireAuth space="autorite">{children}</RequireAuth>;
}

export default function AppRoutes() {
  return (
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
  );
}
