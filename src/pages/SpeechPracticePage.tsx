import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  ChevronLeft,
  Play,
  Target,
  TrendingUp,
  MessageCircle
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';

interface Phrase {
  id: number;
  japanese: string;
  hiragana: string;
  english: string;
  difficulty: string;
}

const practicePhrases: Phrase[] = [
  { id: 1, japanese: 'こんにちは', hiragana: 'こんにちは', english: 'Hello', difficulty: 'beginner' },
  { id: 2, japanese: 'おはようございます', hiragana: 'おはようございます', english: 'Good morning', difficulty: 'beginner' },
  { id: 3, japanese: 'ありがとうございます', hiragana: 'ありがとうございます', english: 'Thank you', difficulty: 'beginner' },
  { id: 4, japanese: 'すみません', hiragana: 'すみません', english: 'Excuse me / Sorry', difficulty: 'beginner' },
  { id: 5, japanese: 'お願いします', hiragana: 'おねがいします', english: 'Please', difficulty: 'beginner' },
  { id: 6, japanese: 'いただきます', hiragana: 'いただきます', english: 'Before eating', difficulty: 'beginner' },
  { id: 7, japanese: 'ごちそうさまでした', hiragana: 'ごちそうさまでした', english: 'After eating', difficulty: 'beginner' },
  { id: 8, japanese: 'いただきます', hiragana: 'いただきます', english: 'Before eating', difficulty: 'beginner' },
  { id: 9, japanese: '行ってください', hiragana: 'いってください', english: 'Please go', difficulty: 'intermediate' },
  { id: 10, japanese: '見えました', hiragana: 'みえました', english: 'I saw', difficulty: 'intermediate' },
  { id: 11, japanese: '東京大学出版社', hiragana: 'とうきょうだいがくしゅっぱんしゃ', english: 'Tokyo University Press', difficulty: 'advanced' },
  { id: 12, japanese: 'ディズランド', hiragana: 'ディズランド', english: 'Disneyland', difficulty: 'advanced' },
];

export const SpeechPracticePage: React.FC = () => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognizedText, setRecognizedText] = useState('');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [matchResult, setMatchResult] = useState<'match' | 'mismatch' | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'ja-JP';

    recognition.onstart = () => {
      setIsListening(true);
      setMatchResult(null);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results = Array.from(event.results) as any[];
      const transcriptText = results.map((result: any) => result[0].transcript).join('');
      setRecognizedText(transcriptText);
      
      if (results[0]?.isFinal) {
        setTranscript(transcriptText);
        checkMatch(transcriptText);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setPermissionDenied(true);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setRecognizedText('');
      setTranscript('');
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const checkMatch = (spoken: string) => {
    const targetPhrase = practicePhrases[currentPhraseIndex].hiragana;
    const similarity = calculateSimilarity(spoken, targetPhrase);
    const isMatch = similarity >= 0.6;

    setAttempts(prev => prev + 1);
    
    if (isMatch) {
      setScore(prev => prev + 1);
    }
    
    setMatchResult(isMatch ? 'match' : 'mismatch');
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().replace(/\s/g, '');
    const s2 = str2.toLowerCase().replace(/\s/g, '');
    
    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  };

  const speakPhrase = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const nextPhrase = () => {
    setCurrentPhraseIndex(prev => (prev + 1) % practicePhrases.length);
    setTranscript('');
    setRecognizedText('');
    setMatchResult(null);
  };

  const prevPhrase = () => {
    setCurrentPhraseIndex(prev => (prev - 1 + practicePhrases.length) % practicePhrases.length);
    setTranscript('');
    setRecognizedText('');
    setMatchResult(null);
  };

  const resetPractice = () => {
    setScore(0);
    setAttempts(0);
    setCurrentPhraseIndex(0);
    setTranscript('');
    setRecognizedText('');
    setMatchResult(null);
  };

  const currentPhrase = practicePhrases[currentPhraseIndex];
  const accuracy = attempts > 0 ? Math.round((score / attempts) * 100) : 0;

  if (!isSupported) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Speech Recognition Not Supported
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your browser does not support the Web Speech API. 
                Please try using Chrome, Edge, or Safari.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4 text-orange-500" />
              <span className="text-gray-700 dark:text-gray-300">
                Attempts: {attempts}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">
                Accuracy: {accuracy}%
              </span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Speech Practice
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Practice your Japanese pronunciation
          </p>
        </div>

        {permissionDenied && (
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="w-6 h-6 text-red-500" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">
                    Microphone Access Denied
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Please enable microphone access in your browser settings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Phrase {currentPhraseIndex + 1} of {practicePhrases.length}
              </div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {currentPhrase.japanese}
              </div>
              <div className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                {currentPhrase.hiragana}
              </div>
              <div className="text-gray-500 dark:text-gray-500">
                {currentPhrase.english}
              </div>
              
              <div className="flex justify-center gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => speakPhrase(currentPhrase.japanese)}
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  Listen
                </Button>
              </div>
            </div>

            <div className="flex justify-center mb-8">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-red-500 animate-pulse' 
                    : 'bg-orange-500 hover:bg-orange-600'
                } text-white shadow-lg`}
              >
                {isListening ? (
                  <MicOff className="w-10 h-10" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </button>
            </div>

            {recognizedText && (
              <div className="text-center mb-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Recognizing...
                </div>
                <div className="text-xl text-gray-700 dark:text-gray-300">
                  {recognizedText}
                </div>
              </div>
            )}

            {transcript && (
              <div className="text-center mb-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  You said:
                </div>
                <div className="text-xl text-gray-900 dark:text-white">
                  {transcript}
                </div>
              </div>
            )}

            {matchResult && (
              <div className={`flex items-center justify-center gap-2 p-4 rounded-lg ${
                matchResult === 'match' 
                  ? 'bg-green-50 dark:bg-green-900/20' 
                  : 'bg-red-50 dark:bg-red-900/20'
              }`}>
                {matchResult === 'match' ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <span className="text-green-700 dark:text-green-300 font-medium">
                      Great job! That's correct!
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-500" />
                    <span className="text-red-700 dark:text-red-300 font-medium">
                      Not quite. Try again!
                    </span>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={prevPhrase}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <Button variant="outline" onClick={nextPhrase}>
            Next
            <Play className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="flex justify-center">
          <Button variant="outline" onClick={resetPractice}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Progress
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export { SpeechPracticePage as default };
