/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Check } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Flashcard } from '../components/flashcards/Flashcard';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useDeckStore } from '../stores/deckStore';
import { useProgressStore } from '../stores/progressStore';

interface Card {
  id: string;
  japanese: string;
  hiragana: string;
  english: string;
  exampleJapanese?: string;
  exampleEnglish?: string;
}

export const StudyPage: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { currentDeck, fetchDeck, clearCurrentDeck } = useDeckStore();
  const { recordReview } = useProgressStore();
  
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });

  useEffect(() => {
    if (deckId) {
      fetchDeck(deckId);
    }
    return () => clearCurrentDeck();
  }, [deckId]);

  useEffect(() => {
    if (currentDeck?.cards) {
      setCards(currentDeck.cards);
      setIsLoading(false);
    }
  }, [currentDeck]);

  const handleAnswer = async (correct: boolean) => {
    const card = cards[currentIndex];
    
    // Record progress
    try {
      await recordReview(card.id, correct);
    } catch (error) {
      console.error('Failed to record review:', error);
    }

    // Update stats
    setStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1),
    }));

    // Move to next card
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setSessionComplete(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSessionComplete(false);
    setStats({ correct: 0, incorrect: 0 });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (sessionComplete) {
    const total = stats.correct + stats.incorrect;
    const percentage = total > 0 ? Math.round((stats.correct / total) * 100) : 0;

    return (
      <Layout>
        <div className="max-w-md mx-auto text-center">
          <Card className="py-12">
            <CardContent>
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="text-green-600" size={48} />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Session Complete!</h2>
              <p className="text-gray-600 mb-8">Great job studying {currentDeck?.name}</p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{total}</p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{stats.correct}</p>
                  <p className="text-sm text-gray-500">Correct</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{stats.incorrect}</p>
                  <p className="text-sm text-gray-500">To Review</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div 
                    className="bg-green-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">{percentage}% accuracy</p>
              </div>

              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={handleRestart}>
                  <RotateCcw className="mr-2" size={20} />
                  Study Again
                </Button>
                <Button onClick={() => navigate(`/decks/${deckId}`)}>
                  Back to Deck
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(`/decks/${deckId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>Exit</span>
          </button>

          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">{currentDeck?.name}</h2>
            <p className="text-gray-500">Card {currentIndex + 1} of {cards.length}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">{stats.correct}</span>
            <span className="text-gray-300">/</span>
            <span className="text-red-600 font-medium">{stats.incorrect}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>

        {/* Flashcard */}
        {currentCard && (
          <Flashcard
            cardId={currentCard.id}
            japanese={currentCard.japanese}
            hiragana={currentCard.hiragana}
            english={currentCard.english}
            exampleJapanese={currentCard.exampleJapanese}
            exampleEnglish={currentCard.exampleEnglish}
            onCorrect={() => handleAnswer(true)}
            onIncorrect={() => handleAnswer(false)}
          />
        )}

        {/* Keyboard shortcuts hint */}
        <p className="text-center text-gray-400 text-sm mt-8">
          Press <kbd className="px-2 py-1 bg-gray-100 rounded">1</kbd> for correct, <kbd className="px-2 py-1 bg-gray-100 rounded">2</kbd> for incorrect
        </p>
      </div>
    </Layout>
  );
};
