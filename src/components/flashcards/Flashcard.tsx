import React, { useState, useEffect } from 'react';
import { Volume2, Check, X, Heart } from 'lucide-react';
import { speakJapanese } from '../../utils/tts';
import { useFavoritesStore } from '../../stores/favoritesStore';

interface FlashcardProps {
  cardId: string;
  japanese: string;
  hiragana: string;
  english: string;
  exampleJapanese?: string;
  exampleEnglish?: string;
  onCorrect: () => void;
  onIncorrect: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({
  cardId,
  japanese,
  hiragana,
  english,
  exampleJapanese,
  exampleEnglish,
  onCorrect,
  onIncorrect,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { favorites, fetchFavorites, addFavorite, removeFavorite } = useFavoritesStore();
  const isFavorite = favorites.some(f => f.cardId === cardId);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite) {
      await removeFavorite(cardId);
    } else {
      await addFavorite(cardId);
    }
  };

  const handleSpeak = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      await speakJapanese(japanese);
    } catch (error) {
      console.error('Failed to speak:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = (correct: boolean) => {
    setIsFlipped(false);
    if (correct) {
      onCorrect();
    } else {
      onIncorrect();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div 
        className="relative h-80 cursor-pointer perspective-1000"
        onClick={handleFlip}
      >
        <div
          className={`absolute inset-0 transition-transform duration-500 preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-gray-200 dark:border-gray-700 backface-hidden flex flex-col items-center justify-center p-6"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSpeak();
              }}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            >
              <Volume2 size={24} className={isSpeaking ? 'animate-pulse text-primary-600 dark:text-primary-400' : ''} />
            </button>
            <button
              onClick={handleToggleFavorite}
              className={`absolute top-4 left-4 p-2 rounded-lg transition-colors ${
                isFavorite 
                  ? 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20' 
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
            >
              <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            
            <p className="text-5xl font-bold text-gray-900 dark:text-white font-japanese mb-4 text-center">
              {japanese}
            </p>
            <p className="text-2xl text-gray-600 dark:text-gray-400 mb-4 text-center">{hiragana}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Tap to reveal</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-primary-50 dark:bg-primary-900/20 rounded-2xl shadow-xl border-2 border-primary-200 dark:border-primary-800 backface-hidden flex flex-col items-center justify-center p-6"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <p className="text-3xl font-bold text-primary-700 dark:text-primary-300 mb-2">{english}</p>
            
            {exampleJapanese && (
              <div className="mt-4 text-center bg-white/50 dark:bg-black/20 rounded-lg p-3">
                <p className="text-lg text-gray-700 dark:text-gray-300 font-japanese">{exampleJapanese}</p>
                {exampleEnglish && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{exampleEnglish}</p>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeak();
                  }}
                  className="mt-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 mx-auto text-sm"
                >
                  <Volume2 size={14} />
                  Listen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Answer Buttons */}
      <div className="flex justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
        <button
          onClick={() => handleAnswer(false)}
          className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium text-sm sm:text-base"
        >
          <X size={20} />
          <span className="hidden sm:inline">Still Learning</span>
          <span className="sm:hidden">Wrong</span>
        </button>
        <button
          onClick={() => handleAnswer(true)}
          className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors font-medium text-sm sm:text-base"
        >
          <Check size={20} />
          <span className="hidden sm:inline">Got It!</span>
          <span className="sm:hidden">Correct</span>
        </button>
      </div>
    </div>
  );
};
