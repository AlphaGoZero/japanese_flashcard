/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Trophy, Filter, Star, Flame, Gamepad2, ClipboardList, Sparkles, Search, Lock } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/common/Card';
import { AchievementBadge } from '../components/achievements/AchievementBadge';
import { useAchievementStore, Achievement } from '../stores/achievementStore';

const categories = [
  { id: 'all', label: 'All', icon: Trophy },
  { id: 'milestone', label: 'Milestones', icon: Star },
  { id: 'streak', label: 'Streaks', icon: Flame },
  { id: 'mastery', label: 'Mastery', icon: Trophy },
  { id: 'quiz', label: 'Quizzes', icon: ClipboardList },
  { id: 'game', label: 'Games', icon: Gamepad2 },
  { id: 'special', label: 'Special', icon: Sparkles },
];

export const AchievementsPage: React.FC = () => {
  const { achievements, userAchievements, fetchAchievements, fetchUserAchievements, isLoading } = useAchievementStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchAchievements(), fetchUserAchievements()]);
    };
    loadData();
  }, []);

  const filteredAchievements = achievements.filter(achievement => {
    const matchesCategory = selectedCategory === 'all' || achievement.category === selectedCategory;
    const matchesSearch = achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const unlockedCount = Object.values(userAchievements).filter(a => a.isUnlocked).length;
  const totalXP = achievements.reduce((acc, a) => {
    if (userAchievements[a.id]?.isUnlocked) {
      return acc + a.xpReward;
    }
    return acc;
  }, 0);

  const groupedAchievements = filteredAchievements.reduce((acc, achievement) => {
    const category = achievement.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Achievements</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your milestones and earn rewards</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center">
                <Trophy className="text-yellow-600 dark:text-yellow-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Unlocked</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {unlockedCount} / {achievements.length}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center">
                <Star className="text-primary-600 dark:text-primary-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total XP Earned</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalXP}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                <Sparkles className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completion</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search achievements..."
              className="w-full pl-10 pr-4 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter size={20} className="text-gray-400 flex-shrink-0" />
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <category.icon size={16} />
                <span className="text-sm font-medium">{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="py-6">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : selectedCategory === 'all' ? (
          <div className="space-y-8">
            {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">
                  {category}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {categoryAchievements.map((achievement) => {
                    const userAchievement = userAchievements[achievement.id];
                    return (
                      <Card 
                        key={achievement.id} 
                        className={userAchievement?.isUnlocked ? 'border-primary-300 dark:border-primary-700' : ''}
                      >
                        <CardContent className="py-4">
                          <AchievementBadge
                            id={achievement.id}
                            name={achievement.name}
                            description={achievement.description}
                            icon={achievement.icon}
                            category={achievement.category}
                            progress={userAchievement?.progress || 0}
                            requirementValue={achievement.requirementValue}
                            isUnlocked={userAchievement?.isUnlocked || false}
                            showProgress={true}
                            size="sm"
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredAchievements.map((achievement) => {
              const userAchievement = userAchievements[achievement.id];
              return (
                <Card 
                  key={achievement.id} 
                  className={userAchievement?.isUnlocked ? 'border-primary-300 dark:border-primary-700' : ''}
                >
                  <CardContent className="py-4">
                    <AchievementBadge
                      id={achievement.id}
                      name={achievement.name}
                      description={achievement.description}
                      icon={achievement.icon}
                      category={achievement.category}
                      progress={userAchievement?.progress || 0}
                      requirementValue={achievement.requirementValue}
                      isUnlocked={userAchievement?.isUnlocked || false}
                      showProgress={true}
                      size="sm"
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {filteredAchievements.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Lock className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No achievements found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};
