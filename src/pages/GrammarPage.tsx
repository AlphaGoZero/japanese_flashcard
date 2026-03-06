/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { BookOpen, Search, Filter, Check, ChevronRight, Volume2 } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { speakJapanese } from '../utils/tts';
import { supabase } from '../services/supabase';

interface GrammarLesson {
  id: string;
  title: string;
  jlptLevel: string;
  category: string;
  grammarPattern: string;
  explanation: string;
  formation: string;
  examples: { sentence: string; reading: string; meaning: string }[];
  exercises: { question: string; answer: string }[];
  difficulty: number;
}

interface UserGrammarProgress {
  lesson_id: string;
  completed: boolean;
  score: number;
}

const jlptLevels = ['All', 'N5', 'N4', 'N3', 'N2', 'N1'];
const categories = ['All', 'Particles', 'Sentence Endings', 'Conjugation', 'Conjunctions', 'Adverbs'];

export const GrammarPage: React.FC = () => {
  const [lessons, setLessons] = useState<GrammarLesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<GrammarLesson[]>([]);
  const [progress, setProgress] = useState<UserGrammarProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<GrammarLesson | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterLessons();
  }, [lessons, selectedLevel, selectedCategory, searchQuery]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [lessonsRes, progressRes] = await Promise.all([
        supabase.from('grammar_lessons').select('*').order('jlpt_level_num', { ascending: true }),
        supabase.from('user_grammar_progress').select('*'),
      ]);

      setLessons(lessonsRes.data || []);
      setProgress(progressRes.data || []);
    } catch (error) {
      console.error('Failed to load grammar:', error);
    }
    setIsLoading(false);
  };

  const filterLessons = () => {
    let filtered = lessons;
    
    if (selectedLevel !== 'All') {
      filtered = filtered.filter(l => l.jlptLevel === selectedLevel);
    }
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(l => l.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(l => 
        l.title.toLowerCase().includes(query) ||
        l.grammarPattern.toLowerCase().includes(query) ||
        l.explanation.toLowerCase().includes(query)
      );
    }
    
    setFilteredLessons(filtered);
  };

  const getProgress = (lessonId: string) => {
    return progress.find(p => p.lesson_id === lessonId);
  };

  const getProgressColor = (lessonId: string) => {
    const p = getProgress(lessonId);
    if (!p) return 'bg-gray-200 dark:bg-gray-700';
    if (p.completed && p.score >= 80) return 'bg-green-500';
    if (p.completed) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const handleSpeak = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      await speakJapanese(text);
    } catch (error) {
      console.error('Audio error:', error);
    }
    setIsSpeaking(false);
  };

  const completedCount = progress.filter(p => p.completed).length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Grammar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Learn Japanese grammar patterns with examples and exercises</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center">
                <BookOpen className="text-primary-600 dark:text-primary-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Lessons</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{lessons.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                <Check className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedCount}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                <ChevronRight className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Available</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {lessons.filter(l => !getProgress(l.id)?.completed).length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search grammar patterns..."
              className="w-full pl-10 pr-4 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              {jlptLevels.map(level => (
                <option key={level} value={level}>
                  {level === 'All' ? 'All Levels' : `JLPT ${level}`}
                </option>
              ))}
            </select>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lessons List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLessons.map((lesson) => {
              const lessonProgress = getProgress(lesson.id);
              return (
                <Card 
                  key={lesson.id} 
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setSelectedLesson(lesson)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getProgressColor(lesson.id)}`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs font-medium rounded">
                            {lesson.jlptLevel}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                            {lesson.category}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {lesson.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {lesson.grammarPattern}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        {lessonProgress?.completed ? (
                          <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                            {lessonProgress.score}%
                          </span>
                        ) : (
                          <ChevronRight className="text-gray-400" size={20} />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {filteredLessons.length === 0 && !isLoading && (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No lessons found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters</p>
            </CardContent>
          </Card>
        )}

        {/* Lesson Detail Modal */}
        {selectedLesson && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs font-medium rounded">
                    {selectedLesson.jlptLevel}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
                    {selectedLesson.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
                >
                  ✕
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pattern */}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Grammar Pattern</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-lg text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
                      {selectedLesson.grammarPattern}
                    </p>
                    <button
                      onClick={() => handleSpeak(selectedLesson.grammarPattern)}
                      className="text-gray-400 hover:text-primary-500"
                    >
                      <Volume2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Formation */}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Formation</p>
                  <p className="font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
                    {selectedLesson.formation}
                  </p>
                </div>

                {/* Explanation */}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Explanation</p>
                  <p className="text-gray-700 dark:text-gray-300">{selectedLesson.explanation}</p>
                </div>

                {/* Examples */}
                {selectedLesson.examples && selectedLesson.examples.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Examples</p>
                    <div className="space-y-2">
                      {selectedLesson.examples.map((ex, i) => (
                        <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center justify-between">
                            <p className="font-japanese text-gray-900 dark:text-white">{ex.sentence}</p>
                            <button
                              onClick={() => handleSpeak(ex.sentence)}
                              className="text-gray-400 hover:text-primary-500"
                            >
                              <Volume2 size={16} />
                            </button>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{ex.reading}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{ex.meaning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button className="w-full" onClick={() => setSelectedLesson(null)}>
                  Close
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};
