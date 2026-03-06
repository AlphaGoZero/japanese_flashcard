import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle,
  Target,
  Clock,
  FileAudio,
  Eye,
  EyeOff
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { supabase } from '../services/supabase';

interface ListeningLesson {
  id: string;
  title: string;
  title_japanese: string;
  audio_url: string;
  transcript: string;
  transcript_japanese: string;
  level: string;
  category: string;
  duration: number;
  questions: {
    id: number;
    question: string;
    options: string[];
    correct: number;
  }[];
}

const playbackSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5];

export const ListeningPage: React.FC = () => {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [lessons, setLessons] = useState<ListeningLesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<ListeningLesson | null>(null);
  const [selectedLevel, setSelectedLevel] = useState('N5');
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const score = useRef(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    fetchLessons();
  }, [selectedLevel]);

  useEffect(() => {
    if (lessonId) {
      const lesson = lessons.find(l => l.id === lessonId);
      if (lesson) {
        setCurrentLesson(lesson);
      }
    }
  }, [lessonId, lessons]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentLesson]);

  const fetchLessons = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('listening_lessons')
        .select('*')
        .eq('level', selectedLevel)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSpeedChange = (speed: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const handleAnswer = (answerIndex: number) => {
    if (showResult || !currentLesson) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    if (answerIndex === currentLesson.questions[currentQuestion].correct) {
      score.current = score.current + 1;
    }
  };

  const nextQuestion = () => {
    if (!currentLesson) return;
    if (currentQuestion < currentLesson.questions.length - 1) {
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

  const finishLesson = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentLesson(null);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    score.current = 0;
    setHasStarted(false);
    navigate('/listening');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  if (currentLesson) {
    const question = currentLesson.questions[currentQuestion];
    const audioSrc = currentLesson.audio_url || 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3';
    
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <audio ref={audioRef} src={audioSrc} />
          
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={finishLesson}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Lessons
            </Button>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Question {currentQuestion + 1} of {currentLesson.questions.length}
            </div>
          </div>

          {!hasStarted ? (
            <Card>
              <CardContent className="p-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {currentLesson.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {currentLesson.title_japanese}
                </p>
                
                <div className="flex justify-center gap-2 mb-6">
                  {playbackSpeeds.map(speed => (
                    <Button
                      key={speed}
                      variant={playbackSpeed === speed ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleSpeedChange(speed)}
                    >
                      {speed}x
                    </Button>
                  ))}
                </div>

                <Button onClick={() => setHasStarted(true)} size="lg">
                  <Play className="w-5 h-5 mr-2" />
                  Start Listening
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                    </button>
                    
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${(currentTime / duration) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTranscript(!showTranscript)}
                    >
                      {showTranscript ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {showTranscript ? 'Hide' : 'Show'} Transcript
                    </Button>

                    <div className="flex gap-2">
                      {playbackSpeeds.map(speed => (
                        <Button
                          key={speed}
                          variant={playbackSpeed === speed ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => handleSpeedChange(speed)}
                        >
                          {speed}x
                        </Button>
                      ))}
                    </div>
                  </div>

                  {showTranscript && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        {currentLesson.transcript}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {question.question}
                  </h3>

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

                  <div className="flex justify-between mt-6">
                    <Button 
                      variant="outline" 
                      onClick={prevQuestion}
                      disabled={currentQuestion === 0}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    
                    {currentQuestion < currentLesson.questions.length - 1 ? (
                      <Button onClick={nextQuestion}>
                        Next
                      </Button>
                    ) : (
                      <Button onClick={finishLesson}>
                        Finish
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Listening Practice
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Improve your Japanese listening skills
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

        <div className="grid gap-4 md:grid-cols-2">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {lesson.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {lesson.title_japanese}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded-full">
                    {lesson.level}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {lesson.duration} sec
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {lesson.questions.length} questions
                  </div>
                </div>

                <Button 
                  onClick={() => {
                    setCurrentLesson(lesson);
                    setCurrentQuestion(0);
                    score.current = 0;
                    setShowResult(false);
                    setHasStarted(false);
                  }}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Listening
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {lessons.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileAudio className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No listening lessons available for this level yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};
