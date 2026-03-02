import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Search, Filter, BookOpen } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useDeckStore } from '../stores/deckStore';

const jlptLevels = ['All', 'N5', 'N4', 'N3', 'N2', 'N1'];
const categories = ['All', 'Greetings', 'Numbers', 'Time', 'People', 'Food', 'Places', 'Verbs', 'Adjectives'];

export const DecksPage: React.FC = () => {
  const { decks, fetchDecks, isLoading } = useDeckStore();
  const [selectedJlpt, setSelectedJlpt] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const params: { jlpt?: string; category?: string } = {};
    if (selectedJlpt !== 'All') params.jlpt = selectedJlpt;
    if (selectedCategory !== 'All') params.category = selectedCategory;
    fetchDecks(params);
  }, [selectedJlpt, selectedCategory]);

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
          <h1 className="text-3xl font-bold text-gray-900">Vocabulary Decks</h1>
          <p className="text-gray-600 mt-2">Choose a deck to start learning</p>
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
              placeholder="Search decks..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* JLPT Filter */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={selectedJlpt}
              onChange={(e) => setSelectedJlpt(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="py-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDecks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDecks.map((deck) => (
              <Link key={deck.id} to={`/decks/${deck.id}`}>
                <Card className="hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                  <CardContent className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                        {deck.jlptLevel}
                      </span>
                      <span className="text-sm text-gray-500">{deck.category}</span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{deck.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 flex-1">
                      {deck.description || 'No description'}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-gray-600">
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
              <Layers className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No decks found</h3>
              <p className="text-gray-600">Try adjusting your filters or search query</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};
