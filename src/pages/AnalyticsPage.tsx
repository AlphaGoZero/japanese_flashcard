/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, Target, Clock, 
  Award, Brain, Calendar, ArrowRight, AlertTriangle,
  BookOpen, Zap
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useProgressStore } from '../stores/progressStore';
import { useAnalyticsStore } from '../stores/analyticsStore';

interface HeatmapData {
  date: string;
  value: number;
}

export const AnalyticsPage: React.FC = () => {
  const { stats } = useProgressStore();
  const { weeklyData, weaknessList, dailyVelocity, fetchAllAnalytics, isLoading } = useAnalyticsStore();
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  useEffect(() => {
    const generateHeatmap = () => {
      const data: HeatmapData[] = [];
      const today = new Date();
      const activityMap = new Map<string, number>();
      
      dailyVelocity.forEach(d => {
        activityMap.set(d.date, d.cardsReviewed);
      });

      for (let i = 89; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        data.push({
          date: dateStr,
          value: activityMap.get(dateStr) || 0,
        });
      }
      setHeatmapData(data);
    };

    generateHeatmap();
  }, [dailyVelocity]);

  const getHeatmapColor = (value: number) => {
    if (value === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (value < 10) return 'bg-primary-200 dark:bg-primary-800';
    if (value < 25) return 'bg-primary-300 dark:bg-primary-700';
    if (value < 50) return 'bg-primary-400 dark:bg-primary-600';
    return 'bg-primary-500 dark:bg-primary-500';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDayOfWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getDay();
  };

  const weeks: HeatmapData[][] = [];
  let currentWeek: HeatmapData[] = [];
  
  heatmapData.forEach((day, index) => {
    const dayOfWeek = getDayOfWeek(day.date);
    if (index === 0) {
      for (let i = 0; i < dayOfWeek; i++) {
        currentWeek.push({ date: '', value: -1 });
      }
    }
    currentWeek.push(day);
    if (dayOfWeek === 6 || index === heatmapData.length - 1) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: '', value: -1 });
      }
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const avgCardsPerDay = dailyVelocity.length > 0
    ? Math.round(dailyVelocity.reduce((acc, d) => acc + d.cardsReviewed, 0) / dailyVelocity.length)
    : 0;
  
  const avgXPPerDay = dailyVelocity.length > 0
    ? Math.round(dailyVelocity.reduce((acc, d) => acc + d.xpEarned, 0) / dailyVelocity.length)
    : 0;

  const totalStudyTime = weeklyData.reduce((acc, w) => acc + w.studyTimeSeconds, 0);
  const hoursStudied = Math.floor(totalStudyTime / 3600);
  const minutesStudied = Math.floor((totalStudyTime % 3600) / 60);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="animate-pulse h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your learning insights and performance</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center">
                <BookOpen className="text-primary-600 dark:text-primary-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg Cards/Day</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgCardsPerDay}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center">
                <Zap className="text-yellow-600 dark:text-yellow-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg XP/Day</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgXPPerDay}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                <Clock className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Study Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {hoursStudied > 0 ? `${hoursStudied}h ${minutesStudied}m` : `${minutesStudied}m`}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Learning Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.level || 1}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Heatmap */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="text-primary-600 dark:text-primary-400" size={20} />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Heatmap (90 Days)</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`w-3 h-3 rounded-sm ${
                          day.value === -1 ? 'bg-transparent' : getHeatmapColor(day.value)
                        }`}
                        title={day.date ? `${formatDate(day.date)}: ${day.value} cards` : ''}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-500 dark:text-gray-400">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800"></div>
                <div className="w-3 h-3 rounded-sm bg-primary-200 dark:bg-primary-800"></div>
                <div className="w-3 h-3 rounded-sm bg-primary-300 dark:bg-primary-700"></div>
                <div className="w-3 h-3 rounded-sm bg-primary-400 dark:bg-primary-600"></div>
                <div className="w-3 h-3 rounded-sm bg-primary-500 dark:bg-primary-500"></div>
              </div>
              <span>More</span>
            </div>
          </CardContent>
        </Card>

        {/* Weakness Analysis */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={20} />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cards to Review</h2>
            </div>
            <Link to="/decks" className="text-primary-600 dark:text-primary-400 text-sm hover:underline">
              Study now
            </Link>
          </CardHeader>
          <CardContent>
            {weaknessList.length > 0 ? (
              <div className="space-y-3">
                {weaknessList.slice(0, 10).map((card, index) => (
                  <div 
                    key={card.cardId} 
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-xs font-bold text-red-600 dark:text-red-400">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{card.japanese}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{card.hiragana} • {card.english}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        {card.timesIncorrect} errors
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{card.jlptLevel} • {card.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="mx-auto text-green-500 mb-2" size={32} />
                <p className="text-gray-600 dark:text-gray-400">Great job! No difficult cards identified yet.</p>
                <Link to="/decks">
                  <Button variant="outline" size="sm" className="mt-4">
                    Start Learning
                    <ArrowRight className="ml-2" size={16} />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="text-primary-600 dark:text-primary-400" size={20} />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Progress</h2>
            </div>
          </CardHeader>
          <CardContent>
            {weeklyData.length > 0 ? (
              <div className="space-y-4">
                {weeklyData.slice(0, 8).map((week, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {week.quizzesCompleted} quizzes • {week.gamesPlayed} games
                      </p>
                    </div>
                    <div className="flex gap-6">
                      <div className="text-center">
                        <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{week.cardsReviewed}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Cards</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{week.cardsMastered}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Mastered</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">+{week.xpEarned}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">XP</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={32} />
                <p className="text-gray-500 dark:text-gray-400">No weekly data yet. Start studying to see your progress!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/decks">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                  <Target className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Take a Quiz</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Test your knowledge</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/progress">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                  <Award className="text-purple-600 dark:text-purple-400" size={24} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">View Progress</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">See your stats</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/achievements">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center">
                  <Award className="text-yellow-600 dark:text-yellow-400" size={24} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Achievements</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Earn rewards</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </Layout>
  );
};
