import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  ChevronRight, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Timer,
  Target,
  TrendingUp
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useJLPTExamStore } from '../stores/jlptExamStore';
import { useAuthStore } from '../stores/authStore';

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export const JLPTExamsPage: React.FC = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const { user } = useAuthStore();
  const { 
    levels, 
    exams, 
    examResults, 
    currentExam,
    fetchLevels, 
    fetchExams, 
    fetchExamResults,
    fetchExam,
    submitExam,
    clearCurrentExam
  } = useJLPTExamStore();

  const [selectedLevel, setSelectedLevel] = useState<string>('N5');
  const [examStarted, setExamStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{selectedIndex: number}[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetchLevels();
    fetchExams();
    if (user) {
      fetchExamResults();
    }
  }, [user]);

  useEffect(() => {
    if (examId) {
      fetchExam(examId);
    }
    return () => clearCurrentExam();
  }, [examId]);

  useEffect(() => {
    if (currentExam && examStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentExam, examStarted]);

  const startExam = () => {
    if (!currentExam) return;
    setExamStarted(true);
    setSelectedAnswers(new Array(currentExam.questions.length).fill({ selectedIndex: -1 }));
    setTimeLeft(currentExam.time_limit);
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = { selectedIndex: optionIndex };
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentExam && currentQuestion < currentExam.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!currentExam) return;

    let correct = 0;
    selectedAnswers.forEach((answer, index) => {
      const question = currentExam.questions[index] as Question;
      if (question && answer.selectedIndex === question.correct) {
        correct++;
      }
    });

    const finalScore = Math.round((correct / currentExam.questions.length) * currentExam.total_points);
    setScore(finalScore);
    setShowResults(true);

    const timeTaken = currentExam.time_limit - timeLeft;
    await submitExam(currentExam.id, selectedAnswers, timeTaken);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (examId && currentExam) {
    if (showResults) {
      return (
        <Layout>
          <div className="max-w-2xl mx-auto p-6">
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className={`w-20 h-20 mx-auto mb-4 ${score >= currentExam.total_points * 0.7 ? 'text-yellow-500' : 'text-gray-400'}`} />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Exam Complete!
                </h1>
                <div className="text-5xl font-bold text-orange-500 mb-4">
                  {score}/{currentExam.total_points}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {score >= currentExam.total_points * 0.7 
                    ? 'Great job! You passed!' 
                    : 'Keep practicing! You can do better!'}
                </p>
                
                <div className="flex justify-center gap-4 mb-6">
                  <Button onClick={() => navigate('/jlpt')}>
                    Back to Exams
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>

                <div className="text-left space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Review Answers:</h3>
                  {currentExam.questions.map((q: Question, idx: number) => (
                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white mb-2">
                        {idx + 1}. {q.question}
                      </p>
                      <div className="flex items-center gap-2">
                        {selectedAnswers[idx]?.selectedIndex === q.correct ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          Your answer: {q.options[selectedAnswers[idx]?.selectedIndex || 0]}
                        </span>
                      </div>
                      {selectedAnswers[idx]?.selectedIndex !== q.correct && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Correct: {q.options[q.correct]}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {q.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </Layout>
      );
    }

    if (!examStarted) {
      return (
        <Layout>
          <div className="max-w-2xl mx-auto p-6">
            <Button variant="outline" onClick={() => navigate('/jlpt')} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Card>
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {currentExam.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {currentExam.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-500" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {currentExam.questions.length} Questions
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-orange-500" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {Math.floor(currentExam.time_limit / 60)} minutes
                    </span>
                  </div>
                </div>

                <Button onClick={startExam} className="w-full">
                  Start Exam
                </Button>
              </CardContent>
            </Card>
          </div>
        </Layout>
      );
    }

    const question = currentExam.questions[currentQuestion] as Question;

    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Question {currentQuestion + 1} of {currentExam.questions.length}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className={`text-lg font-mono ${timeLeft < 60 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Section</div>
              <div className="font-semibold text-gray-900 dark:text-white">{currentExam.section}</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / currentExam.questions.length) * 100}%` }}
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {question.question}
              </h2>

              <div className="space-y-3">
                {question.options.map((option: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(idx)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      selectedAnswers[currentQuestion]?.selectedIndex === idx
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                    }`}
                  >
                    <span className="font-medium text-gray-900 dark:text-white">
                      {String.fromCharCode(65 + idx)}. {option}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline" 
                  onClick={handlePrevQuestion}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </Button>
                
                {currentQuestion < currentExam.questions.length - 1 ? (
                  <Button onClick={handleNextQuestion}>
                    Next
                  </Button>
                ) : (
                  <Button onClick={handleSubmit}>
                    Submit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            JLPT Practice Exams
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test your Japanese proficiency with practice exams
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          {levels.map((level) => {
            const levelResults = examResults.filter(r => {
              const exam = exams.find(e => e.id === r.exam_id);
              return exam?.level === level.level;
            });
            const avgScore = levelResults.length > 0
              ? Math.round(levelResults.reduce((a, b) => a + b.score, 0) / levelResults.length)
              : 0;

            return (
              <Card 
                key={level.level}
                className={`cursor-pointer hover:shadow-lg transition-all ${
                  selectedLevel === level.level ? 'ring-2 ring-orange-500' : ''
                }`}
                onClick={() => setSelectedLevel(level.level)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-500 mb-1">
                    {level.level}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {level.name}
                  </div>
                  {levelResults.length > 0 && (
                    <div className="flex items-center justify-center gap-1 text-sm">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="font-medium">{avgScore}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {examResults.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Recent Results
              </h3>
              <div className="space-y-2">
                {examResults.slice(0, 5).map((result) => {
                  const exam = exams.find(e => e.id === result.exam_id);
                  return (
                    <div key={result.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {exam?.title || 'Exam'}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {new Date(result.completed_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`font-bold ${result.score >= 70 ? 'text-green-500' : 'text-red-500'}`}>
                        {result.score}/{result.total_points}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Available Exams - {selectedLevel}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {exams
              .filter(e => e.level === selectedLevel)
              .map((exam) => (
                <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {exam.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {exam.section}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded-full">
                        {exam.level}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {exam.questions.length} questions
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {Math.floor(exam.time_limit / 60)} min
                      </div>
                    </div>

                    <Button 
                      onClick={() => navigate(`/jlpt/${exam.id}`)}
                      className="w-full"
                    >
                      Start Exam
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};
