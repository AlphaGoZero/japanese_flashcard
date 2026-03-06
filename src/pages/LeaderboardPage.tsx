/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Medal, Crown, ArrowRight, User } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useLeaderboardStore } from '../stores/leaderboardStore';

export const LeaderboardPage: React.FC = () => {
  const { 
    weeklyLeaderboard, 
    monthlyLeaderboard, 
    allTimeLeaderboard,
    userRank,
    isLoading, 
    period,
    fetchLeaderboard,
    fetchUserRank,
    setPeriod 
  } = useLeaderboardStore();

  useEffect(() => {
    fetchLeaderboard(period);
    fetchUserRank();
  }, [period]);

  const leaderboard = period === 'weekly' 
    ? weeklyLeaderboard 
    : period === 'monthly' 
      ? monthlyLeaderboard 
      : allTimeLeaderboard;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="text-yellow-500" size={24} />;
      case 2: return <Medal className="text-gray-400" size={24} />;
      case 3: return <Medal className="text-orange-400" size={24} />;
      default: return null;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 2: return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';
      case 3: return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      default: return '';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">See how you rank against other learners</p>
        </div>

        {/* User Rank Card */}
        {userRank && (
          <Card className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-100 dark:text-primary-200 text-sm">Your Current Rank</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-4xl font-bold text-white">#{userRank.rank}</span>
                    <div>
                      <p className="text-white/90">{userRank.totalXp.toLocaleString()} XP</p>
                      <p className="text-white/70 text-sm">{userRank.cardsMastered} cards mastered</p>
                    </div>
                  </div>
                </div>
                <Trophy className="text-white/30" size={64} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Period Selector */}
        <div className="flex gap-2">
          {(['weekly', 'monthly', 'all_time'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === p
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {p === 'weekly' ? 'This Week' : p === 'monthly' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.slice(0, 50).map((entry) => (
              <Card 
                key={entry.userId} 
                className={`${getRankBgColor(entry.rank)} transition-all hover:scale-[1.01]`}
              >
                <CardContent className="py-3">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-10 flex justify-center">
                      {getRankIcon(entry.rank) || (
                        <span className="text-lg font-bold text-gray-500 dark:text-gray-400">
                          {entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      {entry.avatarUrl ? (
                        <img src={entry.avatarUrl} alt={entry.displayName} className="w-10 h-10 rounded-full" />
                      ) : (
                        <User className="text-primary-600 dark:text-primary-400" size={20} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {entry.displayName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {entry.cardsMastered} mastered • {entry.quizzesCompleted} quizzes
                      </p>
                    </div>

                    {/* XP */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {entry.totalXp.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">XP</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {leaderboard.length === 0 && !isLoading && (
          <Card>
            <CardContent className="text-center py-12">
              <Trophy className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No rankings yet</h3>
              <p className="text-gray-600 dark:text-gray-400">Start studying to appear on the leaderboard!</p>
              <Link to="/decks" className="mt-4 inline-block">
                <Button>Start Learning</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <div className="flex justify-center">
          <Link to="/progress">
            <Button variant="outline">
              View Full Progress
              <ArrowRight className="ml-2" size={18} />
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};
