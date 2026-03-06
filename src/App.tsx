/* eslint-disable react-hooks/exhaustive-deps */
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
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';
import { MyDecksPage } from './pages/MyDecksPage';
import { MyDeckDetailPage } from './pages/MyDeckDetailPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { DailyReviewPage } from './pages/DailyReviewPage';
import { QuickReviewPage } from './pages/QuickReviewPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AvatarEditorPage } from './pages/AvatarEditorPage';
import { KanjiPage } from './pages/KanjiPage';
import { GrammarPage } from './pages/GrammarPage';
import { CommunityPage } from './pages/CommunityPage';
import { GroupsPage } from './pages/GroupsPage';
import { WidgetsPage } from './pages/WidgetsPage';
import { GenresPage } from './pages/GenresPage';
import { JLPTExamsPage } from './pages/JLPTExamsPage';
import { KanjiWritingPage } from './pages/KanjiWritingPage';
import { SpeechPracticePage } from './pages/SpeechPracticePage';
import { KanjiQuizPage } from './pages/KanjiQuizPage';
import { ReadingPage } from './pages/ReadingPage';
import { ListeningPage } from './pages/ListeningPage';
import { ExchangePage } from './pages/ExchangePage';
import { OfflineProvider } from './components/common/OfflineProvider';
import { AchievementToast } from './components/achievements/AchievementToast';
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
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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
            path="/review"
            element={
              <ProtectedRoute>
                <DailyReviewPage />
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
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <ProgressPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-decks"
            element={
              <ProtectedRoute>
                <MyDecksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-decks/:id"
            element={
              <ProtectedRoute>
                <MyDeckDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/achievements"
            element={
              <ProtectedRoute>
                <AchievementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quick-review"
            element={
              <ProtectedRoute>
                <QuickReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quick-review/:deckId"
            element={
              <ProtectedRoute>
                <QuickReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <LeaderboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/avatar"
            element={
              <ProtectedRoute>
                <AvatarEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kanji"
            element={
              <ProtectedRoute>
                <KanjiPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grammar"
            element={
              <ProtectedRoute>
                <GrammarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community"
            element={
              <ProtectedRoute>
                <CommunityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <GroupsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/widgets"
            element={
              <ProtectedRoute>
                <WidgetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/genres"
            element={
              <ProtectedRoute>
                <GenresPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/study/genre/:genreSlug"
            element={
              <ProtectedRoute>
                <StudyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jlpt"
            element={
              <ProtectedRoute>
                <JLPTExamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jlpt/:examId"
            element={
              <ProtectedRoute>
                <JLPTExamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kanji/write"
            element={
              <ProtectedRoute>
                <KanjiWritingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/speech"
            element={
              <ProtectedRoute>
                <SpeechPracticePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kanji/quiz"
            element={
              <ProtectedRoute>
                <KanjiQuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reading"
            element={
              <ProtectedRoute>
                <ReadingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reading/:passageId"
            element={
              <ProtectedRoute>
                <ReadingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/listening"
            element={
              <ProtectedRoute>
                <ListeningPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/listening/:lessonId"
            element={
              <ProtectedRoute>
                <ListeningPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exchange"
            element={
              <ProtectedRoute>
                <ExchangePage />
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
      <AchievementToast onClose={() => {}} />
    </OfflineProvider>
  );
}

export default App;
