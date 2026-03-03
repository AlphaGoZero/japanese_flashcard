import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DecksPage } from './pages/DecksPage';
import { DeckDetailPage } from './pages/DeckDetailPage';
import { StudyPage } from './pages/StudyPage';
import { QuizPage } from './pages/QuizPage';
import { GamesPage } from './pages/GamesPage';
import { OfflineProvider } from './components/common/OfflineProvider';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <OfflineProvider>
      <BrowserRouter>
        <Routes>
          {/* public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/decks"
            element={
              <ProtectedRoute>
                <DecksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/decks/:id"
            element={
              <ProtectedRoute>
                <DeckDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/study/:deckId"
            element={
              <ProtectedRoute>
                <StudyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/:deckId"
            element={
              <ProtectedRoute>
                <QuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/:deckId"
            element={
              <ProtectedRoute>
                <GamesPage />
              </ProtectedRoute>
            }
          />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      
      {/* PWA Components */}
      <OfflineIndicator />
      <PWAInstallPrompt />
    </OfflineProvider>
  );
}

export default App;
