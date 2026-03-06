/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, Check, X, Clock, Zap, RotateCcw } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useDeckStore } from '../stores/deckStore';
import { useProgressStore } from '../stores/progressStore';
import { speakJapanese } from '../utils/tts';
import { supabase } from '../services/supabase';

interface Card {
  id: string;
  japanese: string;
  hiragana: string;
  english: string;
}

export const QuickReviewPage: React.FC = () => {
  const { deckId } = useParams<{ deckId?: string }>();
  const navigate = useNavigate();
  const { currentDeck, fetchDeck, clearCurrentDeck } = useDeckStore();
  const { recordReview } = useProgressStore();
  
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0, skipped: 0 });
  const [timePerCard, setTimePerCard] = useState(5);
  const [showTimer, setShowTimer] = useState(true);
  const [timeLeft, setTimeLeft] = useState(timePerCard);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (deckId) {
      fetchDeck(deckId);
    } else {
      loadAllCards();
    }
    return () => clearCurrentDeck();
  }, [deckId]);

  useEffect(() => {
    if (currentDeck?.cards) {
      const shuffled = [...currentDeck.cards].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setIsLoading(false);
    }
  }, [currentDeck]);

  useEffect(() => {
    if (isComplete || !showTimer || isFlipped) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAnswer(false);
          return timePerCard;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timePerCard, showTimer, isFlipped, isComplete, currentIndex]);

  const loadAllCards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('cards')
        .select('*')
        .limit(50);

      if (data) {
        setCards(data.sort(() => Math.random() - 0.5));
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to load cards:', error);
    }
  };

  const handleAnswer = useCallback(async (correct: boolean) => {
    const card = cards[currentIndex];
    await recordReview(card.id, correct);
    
    setSessionStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1),
      skipped: prev.skipped,
    }));

    setTimeLeft(timePerCard);
    setIsFlipped(false);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  }, [cards, currentIndex, currentIndex, timePerCard]);

  const handleSkip = () => {
    setSessionStats(prev => ({
      ...prev,
      skipped: prev.skipped + 1,
    }));
    setTimeLeft(timePerCard);
    setIsFlipped(false);
    
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleSpeak = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      await speakJapanese(text);
    } catch (error) {
      console.error('Audio error:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleRestart = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsComplete(false);
    setSessionStats({ correct: 0, incorrect: 0, skipped: 0 });
    setTimeLeft(timePerCard);
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

  if (isComplete) {
    const total = sessionStats.correct + sessionStats.incorrect + sessionStats.skipped;
    const accuracy = total > 0 ? Math.round((sessionStats.correct / total) * 100) : 0;

    return (
      <Layout>
        <div className="max-w-md mx-auto text-center">
          <Card className="py-12">
            <CardContent>
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="text-green-600 dark:text-green-400" size={48} />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quick Review Complete!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">Great speed practice!</p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{sessionStats.correct}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Correct</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">{sessionStats.incorrect}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Wrong</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">{sessionStats.skipped}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Skipped</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-2">
                  <div 
                    className="bg-green-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{accuracy}% accuracy</p>
              </div>

              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
                <Button onClick={handleRestart}>
                  <RotateCcw className="mr-2" size={18} />
                  Try Again
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
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft size={20} />
            Exit
          </button>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentIndex + 1} / {cards.length}
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {sessionStats.correct} ✓ {sessionStats.incorrect} ✗
            </p>
          </div>
          <button
            onClick={() => setShowTimer(!showTimer)}
            className={`p-2 rounded-lg ${showTimer ? 'bg-primary-100 dark:bg-primary-900 text-primary-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
          >
            <Clock size={20} />
          </button>
        </div>

        {/* Timer */}
        {showTimer && (
          <div className="mb-6">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${timeLeft <= 2 ? 'bg-red-500' : 'bg-primary-500'}`}
                style={{ width: `${(timeLeft / timePerCard) * 100}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-1">
              {timeLeft}s remaining
            </p>
          </div>
        )}

        {/* Card */}
        <Card className="mb-6">
          <CardContent className="py-8 text-center">
            <button
              onClick={() => handleSpeak(currentCard.japanese)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <Volume2 size={24} className={isSpeaking ? 'animate-pulse' : ''} />
            </button>

            <div 
              className="cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <p className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
                {currentCard.japanese}
              </p>
              <p className="text-2xl text-gray-600 dark:text-gray-400 mb-4">
                {currentCard.hiragana}
              </p>
              
              {isFlipped && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-2xl font-semibold text-primary-600 dark:text-primary-400">
                    {currentCard.english}
                  </p>
                </div>
              )}
              
              {!isFlipped && (
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-4">Tap to reveal</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex justify-center gap-3">
          <button
            onClick={handleSkip}
            className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            <span className="text-lg">⏭</span>
            Skip
          </button>
          <button
            onClick={() => handleAnswer(false)}
            disabled={!isFlipped}
            className="flex items-center gap-2 px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={20} />
            Wrong
          </button>
          <button
            onClick={() => handleAnswer(true)}
            disabled={!isFlipped}
            className="flex items-center gap-2 px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={20} />
            Correct
          </button>
        </div>

        {/* Timer Settings */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Time per card:</p>
          <div className="flex justify-center gap-2">
            {[3, 5, 10].map((time) => (
              <button
                key={time}
                onClick={() => {
                  setTimePerCard(time);
                  setTimeLeft(time);
                }}
                className={`px-3 py-1 rounded-lg text-sm ${
                  timePerCard === time
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {time}s
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};
