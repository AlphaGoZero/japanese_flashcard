/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileQuestion, Check, X, Volume2, Clock } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useDeckStore } from '../stores/deckStore';
import { useQuizStore } from '../stores/quizStore';
import { speakJapanese } from '../utils/tts';

const quizTypes = [
  { id: 'multiple_choice', name: 'Multiple Choice', description: 'Choose the correct meaning', icon: '📝' },
  { id: 'fill_blank', name: 'Fill in Blank', description: 'Type the English meaning', icon: '✍️' },
  { id: 'typing', name: 'Typing', description: 'Type the hiragana reading', icon: '⌨️' },
  { id: 'audio', name: 'Audio Challenge', description: 'Listen and identify', icon: '🔊' },
];

export const QuizPage: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { currentDeck, fetchDeck, clearCurrentDeck } = useDeckStore();
  const { 
    questions, 
    currentIndex, 
    result, 
    isLoading,
    startQuiz, 
    submitAnswer, 
    nextQuestion, 
    submitQuiz, 
    resetQuiz 
  } = useQuizStore();

  const [selectedQuizType, setSelectedQuizType] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (deckId) {
      fetchDeck(deckId);
    }
    return () => clearCurrentDeck();
  }, [deckId]);

  const handleStartQuiz = async (quizType: string) => {
    setSelectedQuizType(quizType);
    await startQuiz(deckId!, quizType);
  };

  const handleSubmitAnswer = () => {
    const question = questions[currentIndex];
    let answer = '';

    if (question.type === 'multiple_choice' || question.type === 'fill_blank' || question.type === 'audio') {
      answer = selectedOption || '';
    } else if (question.type === 'typing') {
      answer = textAnswer;
    }

    if (!answer) return;

    const correct = answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
    setIsCorrect(correct);
    setShowResult(true);

    submitAnswer(question.cardId, answer);
  };

  const handleNext = () => {
    setShowResult(false);
    setSelectedOption(null);
    setTextAnswer('');

    if (currentIndex < questions.length - 1) {
      nextQuestion();
    } else {
      submitQuiz();
    }
  };

  const handlePlayAudio = async () => {
    if (isSpeaking) return;
    const question = questions[currentIndex];
    setIsSpeaking(true);
    try {
      await speakJapanese(question.japanese || '');
    } catch (e) {
      console.error('Audio error:', e);
    } finally {
      setIsSpeaking(false);
    }
  };

  // Quiz Setup View
  if (!selectedQuizType || questions.length === 0) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(`/decks/${deckId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={20} />
            Back to Deck
          </button>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentDeck?.name}</h1>
          <p className="text-gray-600 mb-8">Choose a quiz type to test your knowledge</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleStartQuiz(type.id)}
                disabled={isLoading}
                className="text-left p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all"
              >
                <div className="text-4xl mb-3">{type.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900">{type.name}</h3>
                <p className="text-gray-600 text-sm">{type.description}</p>
              </button>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Result View
  if (result) {
    const percentage = Math.round((result.score / result.total) * 100);
    
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center">
          <Card className="py-12">
            <CardContent>
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${percentage >= 70 ? 'bg-green-100' : 'bg-yellow-100'}`}>
                {percentage >= 70 ? (
                  <Check className="text-green-600" size={48} />
                ) : (
                  <FileQuestion className="text-yellow-600" size={48} />
                )}
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
              <p className="text-gray-600 mb-8">
                You got {result.score} out of {result.total} correct
              </p>

              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div 
                  className={`h-4 rounded-full transition-all ${percentage >= 70 ? 'bg-green-500' : 'bg-yellow-500'}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mb-8">{percentage}% • {result.timeTaken}s</p>

              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => {
                  resetQuiz();
                  setSelectedQuizType(null);
                }}>
                  Try Another
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

  // Quiz Question View
  const question = questions[currentIndex];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              resetQuiz();
              setSelectedQuizType(null);
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            Exit Quiz
          </button>

          <div className="flex items-center gap-2">
            <Clock size={18} className="text-gray-400" />
            <span className="text-gray-600">Question {currentIndex + 1}/{questions.length}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        <Card className="mb-6">
          <CardContent className="py-8 text-center">
            {/* Audio Challenge */}
            {question.type === 'audio' ? (
              <div>
                <button
                  onClick={handlePlayAudio}
                  className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-primary-700 transition-colors"
                >
                  <Volume2 className={`text-white ${isSpeaking ? 'animate-pulse' : ''}`} size={32} />
                </button>
                <p className="text-gray-600">Click to listen</p>
              </div>
            ) : (
              <>
                <p className="text-4xl font-bold text-gray-900 font-japanese mb-2">{question.japanese}</p>
                {question.hiragana && (
                  <p className="text-xl text-gray-600">{question.hiragana}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Answer Options */}
        {question.type === 'multiple_choice' && question.options && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {question.options.map((option, i) => (
              <button
                key={i}
                onClick={() => setSelectedOption(option)}
                disabled={showResult}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedOption === option
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${showResult && option === question.correctAnswer ? 'bg-green-100 border-green-500' : ''}`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {(question.type === 'fill_blank' || question.type === 'typing' || question.type === 'audio') && (
          <div className="mb-6">
            <input
              type="text"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder={question.type === 'typing' ? 'Type hiragana...' : 'Type English meaning...'}
              disabled={showResult}
              className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
            />
          </div>
        )}

        {/* Result Feedback */}
        {showResult && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {isCorrect ? <Check size={24} /> : <X size={24} />}
            <span className="font-medium">
              {isCorrect ? 'Correct!' : `Incorrect. The answer is: ${question.correctAnswer}`}
            </span>
          </div>
        )}

        {/* Actions */}
        {!showResult ? (
          <Button 
            onClick={handleSubmitAnswer} 
            className="w-full" 
            size="lg"
            disabled={
              (question.type === 'multiple_choice' && !selectedOption) ||
              (question.type !== 'multiple_choice' && !textAnswer)
            }
          >
            Submit Answer
          </Button>
        ) : (
          <Button onClick={handleNext} className="w-full" size="lg">
            {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
          </Button>
        )}
      </div>
    </Layout>
  );
};
