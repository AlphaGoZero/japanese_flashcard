import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Layers, Gamepad2, Flame, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/common/Card';
import { useAuthStore } from '../stores/authStore';
import { useProgressStore } from '../stores/progressStore';
import { useDeckStore } from '../stores/deckStore';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { stats, fetchStats } = useProgressStore();
  const { decks, fetchDecks } = useDeckStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchStats(), fetchDecks()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const recentDecks = decks.slice(0, 3);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.displayName || 'Learner'}!
          </h1>
          <p className="text-gray-600 mt-2">Ready to continue your Japanese learning journey?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <BookOpen className="text-primary-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cards Reviewed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stats?.totalReviewed || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Mastered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stats?.mastered || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Learning</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stats?.learning || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Flame className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Day Streak</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stats?.streak || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/decks">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center">
                  <Layers className="text-white" size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Start Learning</h3>
                  <p className="text-gray-600">Browse vocabulary decks and start studying</p>
                </div>
                <ArrowRight className="text-gray-400" size={24} />
              </CardContent>
            </Card>
          </Link>

          <Link to="/games">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Gamepad2 className="text-white" size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Play Games</h3>
                  <p className="text-gray-600">Challenge yourself with fun vocabulary games</p>
                </div>
                <ArrowRight className="text-gray-400" size={24} />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Decks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Decks</h2>
            <Link to="/decks" className="text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="py-6">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))
            ) : recentDecks.length > 0 ? (
              recentDecks.map((deck) => (
                <Link key={deck.id} to={`/decks/${deck.id}`}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent>
                      <span className="inline-block px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded mb-2">
                        {deck.jlptLevel}
                      </span>
                      <h3 className="font-semibold text-gray-900">{deck.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{deck.cardCount} cards</p>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Layers className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-gray-600">No decks available yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
