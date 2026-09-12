import { Routes, Route, Navigate } from 'react-router-dom';
import SplashScreen from './shared/layout/SplashScreen';
import PlaceholderPage from './shared/layout/PlaceholderPage';
import LoginPage from './auth-pages/LoginPage';
import SignupPage from './auth-pages/SignupPage';
import RequireAuth from './auth/RequireAuth';
import AccueilPageBody from './citizen/pages/AccueilPageBody';
import CartePageBody from './citizen/pages/CartePageBody';
import TableauDeBordPage from './autorite/pages/TableauDeBordPage';
import CarteInteractivePage from './autorite/pages/CarteInteractivePage';

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

      {/* Citoyen */}
      <Route path="/citoyen/accueil" element={<Citoyen><AccueilPageBody /></Citoyen>} />
      <Route path="/citoyen/carte" element={<Citoyen><CartePageBody /></Citoyen>} />
      <Route
        path="/citoyen/alertes"
        element={
          <Citoyen>
            <PlaceholderPage title="Alertes & Prévisions" backTo="/citoyen/accueil" />
          </Citoyen>
        }
      />
      <Route
        path="/citoyen/signaler"
        element={
          <Citoyen>
            <PlaceholderPage title="Nouveau signalement" backTo="/citoyen/accueil" />
          </Citoyen>
        }
      />
      <Route
        path="/citoyen/profil"
        element={
          <Citoyen>
            <PlaceholderPage title="Profil" backTo="/citoyen/accueil" />
          </Citoyen>
        }
      />
      <Route
        path="/citoyen/chat"
        element={
          <Citoyen>
            <PlaceholderPage title="NDAM · Assistant" backTo="/citoyen/accueil" />
          </Citoyen>
        }
      />

      {/* Autorité */}
      <Route path="/autorite/dashboard" element={<Autorite><TableauDeBordPage /></Autorite>} />
      <Route path="/autorite/carte" element={<Autorite><CarteInteractivePage /></Autorite>} />
      <Route
        path="/autorite/crise"
        element={
          <Autorite>
            <PlaceholderPage title="Gestion de Crise" backTo="/autorite/dashboard" />
          </Autorite>
        }
      />
      <Route
        path="/autorite/statistiques"
        element={
          <Autorite>
            <PlaceholderPage title="Statistiques" backTo="/autorite/dashboard" />
          </Autorite>
        }
      />
      <Route
        path="/autorite/capteurs"
        element={
          <Autorite>
            <PlaceholderPage title="Admin & Capteurs" backTo="/autorite/dashboard" />
          </Autorite>
        }
      />
      <Route
        path="/autorite/contact"
        element={
          <Autorite>
            <PlaceholderPage title="Contact & Urgence" backTo="/autorite/dashboard" />
          </Autorite>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
