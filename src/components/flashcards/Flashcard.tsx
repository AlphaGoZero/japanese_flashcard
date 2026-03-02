import React, { useState } from 'react';
import { Volume2, Check, X } from 'lucide-react';
import { speakJapanese } from '../../utils/tts';

interface FlashcardProps {
  japanese: string;
  hiragana: string;
  english: string;
  exampleJapanese?: string;
  exampleEnglish?: string;
  onCorrect: () => void;
  onIncorrect: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({
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
            className="absolute inset-0 bg-white rounded-2xl shadow-xl border-2 border-gray-200 backface-hidden flex flex-col items-center justify-center p-6"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSpeak();
              }}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <Volume2 size={24} className={isSpeaking ? 'animate-pulse text-primary-600' : ''} />
            </button>
            
            <p className="text-5xl font-bold text-gray-900 font-japanese mb-4 text-center">
              {japanese}
            </p>
            <p className="text-2xl text-gray-600 mb-4 text-center">{hiragana}</p>
            <p className="text-sm text-gray-400">Tap to reveal</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-primary-50 rounded-2xl shadow-xl border-2 border-primary-200 backface-hidden flex flex-col items-center justify-center p-6"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <p className="text-3xl font-bold text-primary-700 mb-2">{english}</p>
            
            {exampleJapanese && (
              <div className="mt-4 text-center">
                <p className="text-lg text-gray-700 font-japanese">{exampleJapanese}</p>
                {exampleEnglish && (
                  <p className="text-sm text-gray-500">{exampleEnglish}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Answer Buttons */}
      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={() => handleAnswer(false)}
          className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors font-medium"
        >
          <X size={24} />
          Still Learning
        </button>
        <button
          onClick={() => handleAnswer(true)}
          className="flex items-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors font-medium"
        >
          <Check size={24} />
          Got It!
        </button>
      </div>
    </div>
  );
};
