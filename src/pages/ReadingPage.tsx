import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  CheckCircle, 
  XCircle,
  Target,
  Clock,
  FileText
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { supabase } from '../services/supabase';

interface ReadingPassage {
  id: string;
  title: string;
  title_japanese: string;
  content: string;
  content_japanese: string;
  level: string;
  category: string;
  word_count: number;
  reading_time: number;
  questions: {
    id: number;
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  }[];
  vocabulary_list: {
    word: string;
    reading: string;
    meaning: string;
  }[];
}

export const ReadingPage: React.FC = () => {
  const navigate = useNavigate();
  const { passageId } = useParams();
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [currentPassage, setCurrentPassage] = useState<ReadingPassage | null>(null);
  const [selectedLevel, setSelectedLevel] = useState('N5');
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetchPassages();
  }, [selectedLevel]);

  useEffect(() => {
    if (passageId) {
      const passage = passages.find(p => p.id === passageId);
      if (passage) {
        setCurrentPassage(passage);
      }
    }
  }, [passageId, passages]);

  const fetchPassages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reading_passages')
        .select('*')
        .eq('level', selectedLevel)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPassages(data || []);
    } catch (error) {
      console.error('Error fetching passages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    if (showResult || !currentPassage) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    if (answerIndex === currentPassage.questions[currentQuestion].correct) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (!currentPassage) return;
    if (currentQuestion < currentPassage.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const finishReading = () => {
    setCurrentPassage(null);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    navigate('/reading');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      </Layout>
    );
  }

  if (currentPassage) {
    const question = currentPassage.questions[currentQuestion];
    
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={finishReading}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Passages
            </Button>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Question {currentQuestion + 1} of {currentPassage.questions.length}
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {question.question}
              </h2>

              <div className="space-y-3">
                {question.options.map((option: string, idx: number) => {
                  const isCorrect = idx === question.correct;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={showResult}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                        showResult
                          ? isCorrect
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : selectedAnswer === idx
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          : selectedAnswer === idx
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {option}
                        </span>
                        {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {showResult && !isCorrect && selectedAnswer === idx && <XCircle className="w-5 h-5 text-red-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {showResult && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Explanation:</strong> {question.explanation}
                  </p>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline" 
                  onClick={prevQuestion}
                  disabled={currentQuestion === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                
                {currentQuestion < currentPassage.questions.length - 1 ? (
                  <Button onClick={nextQuestion}>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={finishReading}>
                    Finish
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900 dark:text-white">
                  Score: {score} / {currentPassage.questions.length}
                </span>
                <span className="text-orange-500 font-bold">
                  {Math.round((score / currentPassage.questions.length) * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Reading Comprehension
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Practice reading Japanese passages and answer questions
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {passages.map((passage) => (
            <Card key={passage.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {passage.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {passage.title_japanese}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded-full">
                    {passage.level}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {passage.content}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {passage.word_count} words
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {passage.reading_time} min
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {passage.questions.length} questions
                  </div>
                </div>

                <Button 
                  onClick={() => {
                    setCurrentPassage(passage);
                    setCurrentQuestion(0);
                    setScore(0);
                    setShowResult(false);
                  }}
                  className="w-full"
                >
                  Start Reading
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {passages.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No passages available for this level yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};
