/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Search, Filter, BookOpen, TrendingUp, Clock, ArrowUpDown, Star } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useDeckStore } from '../stores/deckStore';

const jlptLevels = ['All', 'N5', 'N4', 'N3', 'N2', 'N1'];
const categories = ['All', 'Greetings', 'Numbers', 'Time', 'People', 'Food', 'Places', 'Verbs', 'Adjectives'];

const sortOptions = [
  { value: 'popular', label: 'Popular', icon: TrendingUp },
  { value: 'newest', label: 'Newest', icon: Clock },
  { value: 'name', label: 'A-Z', icon: ArrowUpDown },
  { value: 'cards', label: 'Most Cards', icon: BookOpen },
];

export const DecksPage: React.FC = () => {
  const { decks, fetchDecks, isLoading, sortBy, setSortBy } = useDeckStore();
  const [selectedJlpt, setSelectedJlpt] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const params: { jlpt?: string; category?: string; sort?: string } = {};
    if (selectedJlpt !== 'All') params.jlpt = selectedJlpt;
    if (selectedCategory !== 'All') params.category = selectedCategory;
    params.sort = sortBy;
    fetchDecks(params);
  }, [selectedJlpt, selectedCategory, sortBy]);

  const filteredDecks = decks.filter(
    (deck) =>
      deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Vocabulary Decks</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 lg:mt-2">Choose a deck to start learning</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search decks..."
              className="w-full pl-10 pr-4 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown size={20} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'popular' | 'newest' | 'name' | 'cards')}
              className="px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* JLPT Filter */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={selectedJlpt}
              onChange={(e) => setSelectedJlpt(e.target.value)}
              className="px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              {jlptLevels.map((level) => (
                <option key={level} value={level}>
                  JLPT {level}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'All' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>

        {/* Decks Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="py-6">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDecks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 stagger-animation">
            {filteredDecks.map((deck) => (
              <Link key={deck.id} to={`/decks/${deck.id}`} className="animate-fade-in">
                <Card className="hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                  <CardContent className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex gap-2">
                        <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm font-medium rounded-full">
                          {deck.jlptLevel}
                        </span>
                        {deck.isPremium && (
                          <span className="inline-block px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-sm font-medium rounded-full">
                            <Star size={12} className="inline mr-1" />
                            PRO
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{deck.category}</span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{deck.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-1">
                      {deck.description || 'No description'}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <BookOpen size={18} />
                        <span className="font-medium">{deck.cardCount} cards</span>
                      </div>
                      <Button size="sm">Study</Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Layers className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No decks found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or search query</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};
