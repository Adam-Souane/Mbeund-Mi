import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';
import { ThemeProvider } from './theme/ThemeContext';
import { NotificationProvider } from './shared/contexts/NotificationContext';
import { ToastProvider } from './shared/toast/ToastContext';
import { useAlertesSocket } from './realtime/useAlertesSocket';
import AppRoutes from './routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function RealtimeAlertes() {
  useAlertesSocket();
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <ToastProvider>
              <BrowserRouter>
                <RealtimeAlertes />
                <AppRoutes />
              </BrowserRouter>
            </ToastProvider>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
