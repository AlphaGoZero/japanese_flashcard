import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  Target, 
  CheckCircle,
  XCircle,
  RotateCcw,
  Timer
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { supabase } from '../services/supabase';

interface KanjiData {
  id: string;
  kanji: string;
  jlpt_level: string;
  onyomi: string;
  kunyomi: string;
  meaning: string;
  stroke_count: number;
}

type QuizMode = 'meaning' | 'reading' | 'mixed';

export const KanjiQuizPage: React.FC = () => {
  const navigate = useNavigate();
  const [kanjiList, setKanjiList] = useState<KanjiData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [quizMode, setQuizMode] = useState<QuizMode>('meaning');
  const [selectedLevel, setSelectedLevel] = useState('N5');
  const [isLoading, setIsLoading] = useState(true);
  const [options, setOptions] = useState<string[]>([]);
  const [useTimer, setUseTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);

  useEffect(() => {
    fetchKanji();
  }, [selectedLevel]);

  useEffect(() => {
    if (useTimer && isQuizStarted && !showResult && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleAnswer(-1);
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [useTimer, isQuizStarted, showResult, timeLeft]);

  const fetchKanji = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('kanji_writing')
        .select('*')
        .eq('jlpt_level', selectedLevel)
        .order('id', { ascending: true });

      if (error) throw error;
      setKanjiList(data || []);
    } catch (error) {
      console.error('Error fetching kanji:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const generateOptions = (correctKanji: KanjiData) => {
    const otherKanji = kanjiList.filter(k => k.id !== correctKanji.id);
    const shuffled = shuffleArray(otherKanji).slice(0, 3);
    
    let correctAnswer: string;
    const mode = quizMode === 'mixed' 
      ? (Math.random() > 0.5 ? 'meaning' : 'reading')
      : quizMode;

    if (mode === 'meaning') {
      correctAnswer = correctKanji.meaning;
    } else {
      correctAnswer = Math.random() > 0.5 ? correctKanji.onyomi : correctKanji.kunyomi;
    }

    const wrongOptions = shuffled.map(k => 
      mode === 'meaning' ? k.meaning : (Math.random() > 0.5 ? k.onyomi : k.kunyomi)
    );

    const allOptions = shuffleArray([correctAnswer, ...wrongOptions]);
    const correctIndex = allOptions.indexOf(correctAnswer);
    
    setOptions(allOptions);
    return correctIndex;
  };

  const startQuiz = () => {
    setIsQuizStarted(true);
    setCurrentIndex(0);
    setScore(0);
    setTotalAnswered(0);
    setShowResult(false);
    setSelectedAnswer(null);
    generateOptionsForCurrent();
  };

  const generateOptionsForCurrent = () => {
    if (kanjiList.length === 0) return;
    const correctIndex = generateOptions(kanjiList[currentIndex]);
    setCorrectAnswerIndex(correctIndex);
    setShowResult(false);
    setSelectedAnswer(null);
    setTimeLeft(15);
  };

  const handleAnswer = (answerIndex: number) => {
    if (showResult) return;

    const correctKanji = kanjiList[currentIndex];
    const mode = quizMode === 'mixed' 
      ? (Math.random() > 0.5 ? 'meaning' : 'reading')
      : quizMode;
    
    const correctAnswer = mode === 'meaning' 
      ? correctKanji.meaning 
      : (Math.random() > 0.5 ? correctKanji.onyomi : correctKanji.kunyomi);
    
    const correctIndex = options.indexOf(correctAnswer);
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    setTotalAnswered(prev => prev + 1);

    if (answerIndex === correctIndex || answerIndex === -1) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < kanjiList.length - 1) {
      setCurrentIndex(prev => prev + 1);
      generateOptionsForCurrent();
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      generateOptionsForCurrent();
    }
  };

  const speakKanji = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      speechSynthesis.speak(utterance);
    }
  };

  const currentKanji = kanjiList[currentIndex];
  const accuracy = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      </Layout>
    );
  }

  if (!isQuizStarted) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-6">
          <Button variant="outline" onClick={() => navigate('/kanji')} className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardContent className="p-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                Kanji Quiz
              </h1>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    JLPT Level
                  </label>
                  <div className="flex gap-2">
                    {['N5', 'N4', 'N3', 'N2', 'N1'].map(level => (
                      <Button
                        key={level}
                        variant={selectedLevel === level ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedLevel(level)}
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quiz Mode
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={quizMode === 'meaning' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setQuizMode('meaning')}
                    >
                      Meaning
                    </Button>
                    <Button
                      variant={quizMode === 'reading' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setQuizMode('reading')}
                    >
                      Reading
                    </Button>
                    <Button
                      variant={quizMode === 'mixed' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setQuizMode('mixed')}
                    >
                      Mixed
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useTimer}
                      onChange={(e) => setUseTimer(e.target.checked)}
                      className="w-4 h-4 text-orange-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Use timer (15 seconds per question)
                    </span>
                  </label>
                </div>
              </div>

              <div className="text-center text-gray-600 dark:text-gray-400 mb-6">
                <p>{kanjiList.length} kanji available</p>
              </div>

              <Button onClick={startQuiz} className="w-full" size="lg">
                Start Quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => setIsQuizStarted(false)}>
            End Quiz
          </Button>
          
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4 text-orange-500" />
              <span className="text-gray-700 dark:text-gray-300">
                {score}/{totalAnswered}
              </span>
            </div>
            {useTimer && (
              <div className="flex items-center gap-1">
                <Timer className={`w-4 h-4 ${timeLeft <= 5 ? 'text-red-500' : 'text-gray-500'}`} />
                <span className={`font-mono ${timeLeft <= 5 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {timeLeft}s
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-orange-500 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / kanjiList.length) * 100}%` }}
          />
        </div>

        {currentKanji && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Question {currentIndex + 1} of {kanjiList.length}
                </div>
                
                <div className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
                  {currentKanji.kanji}
                </div>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => speakKanji(currentKanji.kanji)}
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  Listen
                </Button>

                <div className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                  {quizMode === 'meaning' ? 'What is the meaning?' : 'What is the reading?'}
                </div>
              </div>

              <div className="space-y-3">
                {options.map((option, idx) => {
                  const isCorrect = idx === correctAnswerIndex;
                  const isSelected = selectedAnswer === idx;
                  const btnClass = showResult 
                    ? (isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : (isSelected ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'))
                    : (isSelected ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-orange-300');
                  return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={showResult}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${btnClass}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {option}
                      </span>
                      {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {showResult && !isCorrect && isSelected && <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                  </button>
                  );
                })}
              </div>

              {showResult && (
                <div className="mt-6 flex justify-center">
                  {currentIndex < kanjiList.length - 1 ? (
                    <Button onClick={nextQuestion}>
                      Next Question
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={() => setIsQuizStarted(false)}>
                      View Results
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={prevQuestion}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button variant="outline" onClick={generateOptionsForCurrent}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Skip
          </Button>
        </div>

        {totalAnswered > 0 && (
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-orange-500 mb-2">
                {accuracy}%
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Current Accuracy
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};
