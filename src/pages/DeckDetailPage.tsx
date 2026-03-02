import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Layers, Clock, CheckCircle, Play, FileQuestion, Gamepad2 } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/common/Card';
import { useDeckStore } from '../stores/deckStore';

export const DeckDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentDeck, deckStats, fetchDeck, fetchDeckStats, isLoading, clearCurrentDeck } = useDeckStore();

  useEffect(() => {
    if (id) {
      fetchDeck(id);
      fetchDeckStats(id);
    }
    return () => clearCurrentDeck();
  }, [id]);

  if (isLoading || !currentDeck) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/decks')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          <span>Back to Decks</span>
        </button>

        {/* Deck Header */}
        <Card>
          <CardContent className="py-8">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full mb-3">
                  {currentDeck.jlptLevel}
                </span>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentDeck.name}</h1>
                <p className="text-gray-600">{currentDeck.description || 'Japanese vocabulary deck'}</p>
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <BookOpen size={16} />
                    {currentDeck.cards?.length || 0} cards
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers size={16} />
                    {currentDeck.category}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {deckStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mastered</p>
                  <p className="text-2xl font-bold text-gray-900">{deckStats.mastered}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{deckStats.learning}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">New Cards</p>
                  <p className="text-2xl font-bold text-gray-900">{deckStats.new}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to={`/study/${id}`}>
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
                  <Play className="text-white" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Study</h3>
                <p className="text-gray-600 text-sm text-center mt-2">Review cards with spaced repetition</p>
              </CardContent>
            </Card>
          </Link>

          <Link to={`/quiz/${id}`}>
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4">
                  <FileQuestion className="text-white" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Quiz</h3>
                <p className="text-gray-600 text-sm text-center mt-2">Test your knowledge</p>
              </CardContent>
            </Card>
          </Link>

          <Link to={`/games/${id}`}>
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4">
                  <Gamepad2 className="text-white" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Games</h3>
                <p className="text-gray-600 text-sm text-center mt-2">Fun learning games</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Cards Preview */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cards Preview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentDeck.cards?.slice(0, 9).map((card) => (
              <Card key={card.id} variant="bordered">
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900 font-japanese mb-1">{card.japanese}</p>
                  <p className="text-lg text-gray-600 mb-1">{card.hiragana}</p>
                  <p className="text-gray-500">{card.english}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {currentDeck.cards && currentDeck.cards.length > 9 && (
            <p className="text-center text-gray-500 mt-4">
              + {currentDeck.cards.length - 9} more cards
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
};
