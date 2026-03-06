/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Volume2, Check, X } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useProgressStore } from '../stores/progressStore';
import { useDeckStore } from '../stores/deckStore';
import { speakJapanese } from '../utils/tts';

interface DueCard {
  id: string;
  card_id: string;
  mastery_level: number;
  times_reviewed: number;
  last_reviewed: string | null;
  next_review: string | null;
  cards: {
    id: string;
    japanese: string;
    hiragana: string;
    english: string;
    example_japanese: string | null;
    example_english: string | null;
    deck_id: string;
  };
}

export const DailyReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { fetchStats, dueCards, fetchDueCards, todayProgress, dailyGoal, recordReview } = useProgressStore();
  const { decks } = useDeckStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });
  const [isComplete, setIsComplete] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchDueCards();
  }, []);

  const deckMap = new Map(decks.map(d => [d.id, d.name]));
  const dueCardsData = dueCards as unknown as DueCard[];

  const handleAnswer = async (correct: boolean) => {
    const card = dueCardsData[currentIndex];
    await recordReview(card.card_id, correct);
    
    setSessionStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1),
    }));

    if (currentIndex < dueCardsData.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
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

  const progressPercentage = Math.min((todayProgress / dailyGoal) * 100, 100);

  if (isComplete) {
    const total = sessionStats.correct + sessionStats.incorrect;
    const accuracy = total > 0 ? Math.round((sessionStats.correct / total) * 100) : 0;

    return (
      <Layout>
        <div className="max-w-md mx-auto text-center">
          <Card className="py-12">
            <CardContent>
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="text-green-600 dark:text-green-400" size={48} />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Session Complete!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">Great work on your daily review!</p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{total}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{sessionStats.correct}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Correct</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">{sessionStats.incorrect}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Review Again</p>
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
                {sessionStats.incorrect > 0 && (
                  <Button onClick={() => {
                    setCurrentIndex(0);
                    setIsFlipped(false);
                    setSessionStats({ correct: 0, incorrect: 0 });
                    setIsComplete(false);
                  }}>
                    Review Mistakes
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (dueCardsData.length === 0) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center">
          <Card className="py-12">
            <CardContent>
              <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="text-primary-600 dark:text-primary-400" size={48} />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">All Caught Up!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">No cards due for review right now. Great job!</p>

              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
                <Link to="/decks">
                  <Button>Study New Cards</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const currentCard = dueCardsData[currentIndex];
  const deckName = deckMap.get(currentCard?.cards?.deck_id) || 'Unknown Deck';

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft size={20} />
            Exit
          </button>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{deckName}</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentIndex + 1} / {dueCardsData.length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Daily Goal</p>
            <p className="font-semibold text-gray-900 dark:text-white">{todayProgress} / {dailyGoal}</p>
          </div>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-8">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <Card className="mb-6">
          <CardContent className="py-8 text-center">
            <button
              onClick={() => handleSpeak(currentCard.cards.japanese)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <Volume2 size={24} className={isSpeaking ? 'animate-pulse' : ''} />
            </button>

            <div 
              className="cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <p className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {currentCard.cards.japanese}
              </p>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                {currentCard.cards.hiragana}
              </p>
              
              {isFlipped && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-2xl font-semibold text-primary-600 dark:text-primary-400">
                    {currentCard.cards.english}
                  </p>
                </div>
              )}
              
              {!isFlipped && (
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-4">Tap to reveal</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleAnswer(false)}
            className="flex items-center gap-2 px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium"
          >
            <X size={20} />
            Still Learning
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="flex items-center gap-2 px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors font-medium"
          >
            <Check size={20} />
            Got It!
          </button>
        </div>
      </div>
    </Layout>
  );
};
