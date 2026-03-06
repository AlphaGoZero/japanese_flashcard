/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Layers, Gamepad2, Flame, TrendingUp, Clock, ArrowRight, Target, Zap } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/common/Card';
import { useAuthStore } from '../stores/authStore';
import { useProgressStore } from '../stores/progressStore';
import { useDeckStore } from '../stores/deckStore';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { stats, fetchStats, dailyGoal, todayProgress } = useProgressStore();
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
  const progressPercentage = Math.min((todayProgress / dailyGoal) * 100, 100);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 lg:space-y-8">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.displayName || 'Learner'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 lg:mt-2">Ready to continue your Japanese learning journey?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          <Card>
            <CardContent className="flex items-center gap-3 lg:gap-4">
              <div className="w-10 lg:w-12 h-10 lg:h-12 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center">
                <BookOpen className="text-primary-600 dark:text-primary-400" size={20} />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Cards Reviewed</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalReviewed || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 lg:gap-4">
              <div className="w-10 lg:w-12 h-10 lg:h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Mastered</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.mastered || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 lg:gap-4">
              <div className="w-10 lg:w-12 h-10 lg:h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center">
                <Clock className="text-yellow-600 dark:text-yellow-400" size={20} />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Learning</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.learning || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 lg:gap-4">
              <div className="w-10 lg:w-12 h-10 lg:h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center">
                <Flame className="text-orange-600 dark:text-orange-400" size={20} />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Day Streak</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.streak || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 lg:gap-4">
              <div className="w-10 lg:w-12 h-10 lg:h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                <Zap className="text-purple-600 dark:text-purple-400" size={20} />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Level {stats?.level || 1}</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.xp || 0} XP
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Goal Progress */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="text-primary-600 dark:text-primary-400" size={20} />
                <span className="font-medium text-gray-900 dark:text-white">Daily Goal</span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{todayProgress} / {dailyGoal} cards</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            {progressPercentage >= 100 && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">Daily goal completed! Great job!</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <Link to="/review">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-2 border-primary-200 dark:border-primary-800">
              <CardContent className="flex items-center gap-3 lg:gap-4 py-4 lg:py-6">
                <div className="w-12 lg:w-14 h-12 lg:h-14 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="text-white" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white">Daily Review</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">Review due cards</p>
                </div>
                <ArrowRight className="text-gray-400 flex-shrink-0" size={20} />
              </CardContent>
            </Card>
          </Link>

          <Link to="/decks">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="flex items-center gap-3 lg:gap-4 py-4 lg:py-6">
                <div className="w-12 lg:w-14 h-12 lg:h-14 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Layers className="text-white" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white">Study Decks</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">Browse vocabulary</p>
                </div>
                <ArrowRight className="text-gray-400 flex-shrink-0" size={20} />
              </CardContent>
            </Card>
          </Link>

          <Link to="/my-decks">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="flex items-center gap-3 lg:gap-4 py-4 lg:py-6">
                <div className="w-12 lg:w-14 h-12 lg:h-14 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Gamepad2 className="text-white" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white">My Decks</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">Your custom decks</p>
                </div>
                <ArrowRight className="text-gray-400 flex-shrink-0" size={20} />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Decks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">Recent Decks</h2>
            <Link to="/decks" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentDecks.length > 0 ? (
              recentDecks.map((deck) => (
                <Link key={deck.id} to={`/decks/${deck.id}`}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent>
                      <span className="inline-block px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs font-medium rounded mb-2">
                        {deck.jlptLevel}
                      </span>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{deck.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{deck.cardCount} cards</p>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="text-center py-8">
                  <Layers className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={32} />
                  <p className="text-gray-600 dark:text-gray-400">No decks available yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
