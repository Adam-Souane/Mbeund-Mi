import { Routes, Route, Navigate } from 'react-router-dom';
import SplashScreen from './shared/layout/SplashScreen';
import LoginPage from './auth-pages/LoginPage';
import SignupPage from './auth-pages/SignupPage';
import RequireAuth from './auth/RequireAuth';
import AccueilPageBody from './citizen/pages/AccueilPageBody';
import TableauDeBordPage from './autorite/pages/TableauDeBordPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Citoyen — Phase 2 ajoutera carte/alertes/signaler/profil ici */}
      <Route
        path="/citoyen/accueil"
        element={
          <RequireAuth space="citoyen">
            <AccueilPageBody />
          </RequireAuth>
        }
      />

      {/* Autorité — Phase 2 ajoutera carte/crise/statistiques/capteurs/contact ici */}
      <Route
        path="/autorite/dashboard"
        element={
          <RequireAuth space="autorite">
            <TableauDeBordPage />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
