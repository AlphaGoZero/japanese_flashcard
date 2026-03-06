/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  TrendingUp,
  Clock,
  Flame,
  Target,
  Award,
  Calendar,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useProgressStore } from '../stores/progressStore';
import { useDeckStore } from '../stores/deckStore';
import { supabase } from '../services/supabase';

interface QuizHistory {
  id: string;
  deck_id: string;
  quiz_type: string;
  score: number;
  total_questions: number;
  time_taken_seconds: number;
  completed_at: string;
  deck_name?: string;
}

interface GameHistory {
  id: string;
  deck_id: string;
  game_type: string;
  score: number;
  time_taken_seconds: number;
  completed_at: string;
  deck_name?: string;
}

interface DailyActivity {
  date: string;
  cards_reviewed: number;
}

export const ProgressPage: React.FC = () => {
  const { stats, fetchStats } = useProgressStore();
  const { decks, fetchDecks } = useDeckStore();
  const [isLoading, setIsLoading] = useState(true);
  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([]);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchStats(), fetchDecks(), fetchHistory()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const [quizRes, gameRes] = await Promise.all([
        supabase
          .from('quiz_results')
          .select('*')
          .eq('user_id', authUser.id)
          .order('completed_at', { ascending: false })
          .limit(10),
        supabase
          .from('game_results')
          .select('*')
          .eq('user_id', authUser.id)
          .order('completed_at', { ascending: false })
          .limit(10),
      ]);

      const quizzes = (quizRes.data || []) as QuizHistory[];
      const games = (gameRes.data || []) as GameHistory[];

      const deckMap = new Map(decks.map(d => [d.id, d.name]));

      setQuizHistory(quizzes.map(q => ({
        ...q,
        deck_name: deckMap.get(q.deck_id) || 'Unknown Deck'
      })));

      setGameHistory(games.map(g => ({
        ...g,
        deck_name: deckMap.get(g.deck_id) || 'Unknown Deck'
      })));

      const activityMap = new Map<string, number>();
      quizzes.forEach(q => {
        const date = q.completed_at.split('T')[0];
        activityMap.set(date, (activityMap.get(date) || 0) + q.total_questions);
      });
      games.forEach(g => {
        const date = g.completed_at.split('T')[0];
        activityMap.set(date, (activityMap.get(date) || 0) + Math.ceil(g.score / 10));
      });

      const activity: DailyActivity[] = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        activity.push({
          date: dateStr,
          cards_reviewed: activityMap.get(dateStr) || 0
        });
      }
      setDailyActivity(activity);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const getMaxActivity = () => Math.max(...dailyActivity.map(d => d.cards_reviewed), 1);

  const getActivityColor = (value: number, max: number) => {
    const ratio = value / max;
    if (ratio === 0) return 'bg-gray-100 dark:bg-gray-700';
    if (ratio < 0.25) return 'bg-primary-200 dark:bg-primary-800';
    if (ratio < 0.5) return 'bg-primary-300 dark:bg-primary-700';
    if (ratio < 0.75) return 'bg-primary-400 dark:bg-primary-600';
    return 'bg-primary-500 dark:bg-primary-500';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getQuizTypeName = (type: string) => {
    const types: Record<string, string> = {
      multiple_choice: 'Multiple Choice',
      fill_blank: 'Fill in Blank',
      typing: 'Typing',
      audio: 'Audio'
    };
    return types[type] || type;
  };

  const getGameTypeName = (type: string) => {
    const types: Record<string, string> = {
      timed_challenge: 'Timed Challenge',
      matching_pairs: 'Matching Pairs'
    };
    return types[type] || type;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="animate-pulse h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const totalQuizzes = quizHistory.length;
  const totalGames = gameHistory.length;
  const avgQuizScore = totalQuizzes > 0
    ? Math.round(quizHistory.reduce((acc, q) => acc + (q.score / q.total_questions) * 100, 0) / totalQuizzes)
    : 0;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Progress</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your learning journey</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center">
                <BookOpen className="text-primary-600 dark:text-primary-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cards Reviewed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalReviewed || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Mastered</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.mastered || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center">
                <Clock className="text-yellow-600 dark:text-yellow-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Learning</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.learning || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center">
                <Flame className="text-orange-600 dark:text-orange-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Day Streak</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.streak || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="text-primary-600 dark:text-primary-400" size={20} />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">30-Day Activity</h2>
            </div>
          </CardHeader>
          <CardContent>
            {dailyActivity.length > 0 ? (
              <div className="flex items-end gap-1 h-32">
                {dailyActivity.map((day, i) => {
                  const max = getMaxActivity();
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-t ${getActivityColor(day.cards_reviewed, max)} transition-all hover:opacity-80`}
                      style={{ height: `${Math.max((day.cards_reviewed / max) * 100, 4)}%` }}
                      title={`${formatDate(day.date)}: ${day.cards_reviewed} cards`}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <AlertCircle className="mr-2" size={20} />
                No activity data yet. Start studying to see your progress!
              </div>
            )}
            <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{formatDate(dailyActivity[0]?.date || '')}</span>
              <span>{formatDate(dailyActivity[dailyActivity.length - 1]?.date || '')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Quiz & Game History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quiz History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="text-primary-600 dark:text-primary-400" size={20} />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Quizzes</h2>
              </div>
              <Link to="/decks" className="text-primary-600 dark:text-primary-400 text-sm hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {quizHistory.length > 0 ? (
                <div className="space-y-4">
                  {quizHistory.slice(0, 5).map((quiz) => {
                    const percentage = Math.round((quiz.score / quiz.total_questions) * 100);
                    return (
                      <div key={quiz.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{getQuizTypeName(quiz.quiz_type)}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{quiz.deck_name}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${percentage >= 70 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                            {percentage}%
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(quiz.completed_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={32} />
                  <p className="text-gray-500 dark:text-gray-400">No quizzes taken yet</p>
                  <Link to="/decks">
                    <Button variant="outline" size="sm" className="mt-4">
                      Start Quiz
                      <ArrowRight className="ml-2" size={16} />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Game History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="text-purple-600 dark:text-purple-400" size={20} />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Games</h2>
              </div>
              <Link to="/games" className="text-primary-600 dark:text-primary-400 text-sm hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {gameHistory.length > 0 ? (
                <div className="space-y-4">
                  {gameHistory.slice(0, 5).map((game) => (
                    <div key={game.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{getGameTypeName(game.game_type)}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{game.deck_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600 dark:text-purple-400">{game.score} pts</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(game.completed_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={32} />
                  <p className="text-gray-500 dark:text-gray-400">No games played yet</p>
                  <Link to="/decks">
                    <Button variant="outline" size="sm" className="mt-4">
                      Play Games
                      <ArrowRight className="ml-2" size={16} />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">{totalQuizzes}</p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Quizzes Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{totalGames}</p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Games Played</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">{avgQuizScore}%</p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Average Quiz Score</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
