import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Utensils, 
  MapPin, 
  Briefcase, 
  Gamepad2, 
  Cpu, 
  HeartPulse, 
  ShoppingBag, 
  Leaf,
  Search,
  Play,
  BarChart3,
  Clock,
  Flame
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useGenreStore } from '../stores/genreStore';
import { useAuthStore } from '../stores/authStore';

const iconMap: Record<string, React.ReactNode> = {
  'utensils': <Utensils className="w-8 h-8" />,
  'map-pin': <MapPin className="w-8 h-8" />,
  'briefcase': <Briefcase className="w-8 h-8" />,
  'gamepad-2': <Gamepad2 className="w-8 h-8" />,
  'cpu': <Cpu className="w-8 h-8" />,
  'heart-pulse': <HeartPulse className="w-8 h-8" />,
  'shopping-bag': <ShoppingBag className="w-8 h-8" />,
  'leaf': <Leaf className="w-8 h-8" />,
};

const genreColors: Record<string, string> = {
  'food-dining': 'from-red-500 to-orange-500',
  'travel-transport': 'from-teal-500 to-cyan-500',
  'business-work': 'from-blue-500 to-indigo-500',
  'entertainment': 'from-purple-500 to-pink-500',
  'technology': 'from-blue-400 to-blue-600',
  'health-medicine': 'from-pink-500 to-rose-500',
  'shopping-money': 'from-yellow-500 to-amber-500',
  'nature-environment': 'from-green-500 to-emerald-500',
};

export const GenresPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { genres, genreProgress, isLoading, fetchGenres, fetchGenreProgress } = useGenreStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showInProgress, setShowInProgress] = useState(false);

  useEffect(() => {
    fetchGenres();
    if (user) {
      fetchGenreProgress();
    }
  }, [user]);

  const filteredGenres = genres.filter(genre => {
    const matchesSearch = genre.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      genre.name_japanese?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (showInProgress) {
      const progress = genreProgress.find(p => p.genre_slug === genre.slug);
      return matchesSearch && progress && progress.cards_studied > 0;
    }
    
    return matchesSearch;
  });

  const getProgressForGenre = (genreSlug: string) => {
    return genreProgress.find(p => p.genre_slug === genreSlug);
  };

  const handleStartGenre = (genreSlug: string) => {
    navigate(`/study/genre/${genreSlug}`);
  };

  const inProgressGenres = genres.filter(genre => {
    const progress = getProgressForGenre(genre.slug);
    return progress && progress.cards_studied > 0;
  });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Vocabulary by Genre
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Learn Japanese vocabulary organized by topic
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search genres..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <Button
            variant={showInProgress ? 'primary' : 'outline'}
            onClick={() => setShowInProgress(!showInProgress)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            In Progress
          </Button>
        </div>

        {/* Continue Learning Section */}
        {!showInProgress && inProgressGenres.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Continue Learning
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {inProgressGenres.slice(0, 3).map(genre => {
                const progress = getProgressForGenre(genre.slug);
                const colorClass = genreColors[genre.slug] || 'from-gray-500 to-gray-600';
                
                return (
                  <Card 
                    key={genre.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleStartGenre(genre.slug)}
                  >
                    <CardContent className="p-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white mb-3`}>
                        {iconMap[genre.icon || 'utensils']}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {genre.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {genre.name_japanese}
                      </p>
                      
                      {progress && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {progress.cards_studied} cards studied
                            </span>
                            <span className="text-orange-500 font-medium">
                              {progress.completion_percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`bg-gradient-to-r ${colorClass} h-2 rounded-full transition-all`}
                              style={{ width: `${progress.completion_percentage}%` }}
                            />
                          </div>
                          {progress.streak_days > 0 && (
                            <div className="flex items-center gap-1 text-sm text-orange-500">
                              <Flame className="w-4 h-4" />
                              {progress.streak_days} day streak
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* All Genres Grid */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {showInProgress ? 'In Progress' : 'All Genres'}
          </h2>
          
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredGenres.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {showInProgress 
                    ? 'No genres in progress yet. Start learning!'
                    : 'No genres found matching your search.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filteredGenres.map(genre => {
                const progress = getProgressForGenre(genre.slug);
                const colorClass = genreColors[genre.slug] || 'from-gray-500 to-gray-600';
                
                return (
                  <Card 
                    key={genre.id} 
                    className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
                    onClick={() => handleStartGenre(genre.slug)}
                  >
                    <CardContent className="p-5">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                        {iconMap[genre.icon || 'utensils']}
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {genre.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {genre.name_japanese}
                      </p>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-500 mb-4 line-clamp-2">
                        {genre.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {genre.card_count} cards
                        </span>
                        
                        {progress && progress.completion_percentage > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div 
                                className={`bg-gradient-to-r ${colorClass} h-1.5 rounded-full`}
                                style={{ width: `${progress.completion_percentage}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-orange-500">
                              {progress.completion_percentage}%
                            </span>
                          </div>
                        ) : (
                          <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-3 h-3 mr-1" />
                            Start
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
