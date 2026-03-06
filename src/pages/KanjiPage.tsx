/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { BookOpen, Search, Filter, Volume2, Star, Check } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { speakJapanese } from '../utils/tts';
import { supabase } from '../services/supabase';

interface Kanji {
  id: string;
  character: string;
  onyomi: string;
  kunyomi: string[];
  meaning: string;
  jlptLevel: string;
  strokeCount: number;
  examples: { sentence: string; reading: string; meaning: string }[];
}

interface UserKanjiProgress {
  kanji_id: string;
  mastery_level: number;
}

const jlptLevels = ['All', 'N5', 'N4', 'N3', 'N2', 'N1'];

export const KanjiPage: React.FC = () => {
  const [kanji, setKanji] = useState<Kanji[]>([]);
  const [filteredKanji, setFilteredKanji] = useState<Kanji[]>([]);
  const [progress, setProgress] = useState<UserKanjiProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKanji, setSelectedKanji] = useState<Kanji | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterKanji();
  }, [kanji, selectedLevel, searchQuery]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [kanjiRes, progressRes] = await Promise.all([
        supabase.from('kanji').select('*').order('jlpt_level_num', { ascending: true }),
        supabase.from('user_kanji_progress').select('*'),
      ]);

      setKanji(kanjiRes.data || []);
      setProgress(progressRes.data || []);
    } catch (error) {
      console.error('Failed to load kanji:', error);
    }
    setIsLoading(false);
  };

  const filterKanji = () => {
    let filtered = kanji;
    
    if (selectedLevel !== 'All') {
      filtered = filtered.filter(k => k.jlptLevel === selectedLevel);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(k => 
        k.character.includes(query) ||
        k.meaning.toLowerCase().includes(query) ||
        k.onyomi?.toLowerCase().includes(query)
      );
    }
    
    setFilteredKanji(filtered);
  };

  const getMasteryLevel = (kanjiId: string) => {
    const p = progress.find(p => p.kanji_id === kanjiId);
    return p?.mastery_level || 0;
  };

  const getMasteryColor = (level: number) => {
    if (level === 0) return 'bg-gray-200 dark:bg-gray-700';
    if (level < 3) return 'bg-red-200 dark:bg-red-800';
    if (level < 5) return 'bg-yellow-200 dark:bg-yellow-800';
    if (level < 7) return 'bg-green-200 dark:bg-green-800';
    return 'bg-primary-200 dark:bg-primary-800';
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

  const masteredCount = progress.filter(p => p.mastery_level >= 8).length;
  const learningCount = progress.filter(p => p.mastery_level > 0 && p.mastery_level < 8).length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kanji</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Learn Japanese kanji with stroke order and examples</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center">
                <BookOpen className="text-primary-600 dark:text-primary-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Kanji</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{kanji.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                <Star className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Mastered</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{masteredCount}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center">
                <Check className="text-yellow-600 dark:text-yellow-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Learning</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{learningCount}</p>
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
              placeholder="Search kanji, meaning, or reading..."
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
          </div>
        </div>

        {/* Kanji Grid */}
        {isLoading ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="animate-pulse h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {filteredKanji.map((k) => {
              const level = getMasteryLevel(k.id);
              return (
                <button
                  key={k.id}
                  onClick={() => setSelectedKanji(k)}
                  className={`relative p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    level >= 8
                      ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <p className="text-2xl font-bold text-gray-900 dark:text-white text-center font-japanese">
                    {k.character}
                  </p>
                  <div className={`absolute bottom-1 left-1 right-1 h-1 rounded-full ${getMasteryColor(level)}`}>
                    <div 
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${(level / 10) * 100}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {filteredKanji.length === 0 && !isLoading && (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No kanji found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters</p>
            </CardContent>
          </Card>
        )}

        {/* Kanji Detail Modal */}
        {selectedKanji && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary-600 dark:text-primary-400 font-japanese">
                      {selectedKanji.character}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">JLPT {selectedKanji.jlptLevel}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedKanji.strokeCount} strokes</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedKanji(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Readings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">On'yomi</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">{selectedKanji.onyomi || '-'}</p>
                      <button
                        onClick={() => handleSpeak(selectedKanji.onyomi || '')}
                        className="text-gray-400 hover:text-primary-500"
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Kun'yomi</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedKanji.kunyomi?.join(', ') || '-'}
                    </p>
                  </div>
                </div>

                {/* Meaning */}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Meaning</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedKanji.meaning}</p>
                </div>

                {/* Examples */}
                {selectedKanji.examples && selectedKanji.examples.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Examples</p>
                    <div className="space-y-2">
                      {selectedKanji.examples.slice(0, 3).map((ex, i) => (
                        <div key={i} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center justify-between">
                            <p className="font-japanese text-gray-900 dark:text-white">{ex.sentence}</p>
                            <button
                              onClick={() => handleSpeak(ex.sentence)}
                              className="text-gray-400 hover:text-primary-500"
                            >
                              <Volume2 size={14} />
                            </button>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{ex.reading}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{ex.meaning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button className="w-full" onClick={() => setSelectedKanji(null)}>
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
