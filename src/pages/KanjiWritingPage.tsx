import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  Volume2,
  Lightbulb,
  Target
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
  examples: string[];
  common_words: string[];
}

export const KanjiWritingPage: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [kanjiList, setKanjiList] = useState<KanjiData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('N5');

  useEffect(() => {
    fetchKanji();
  }, [selectedLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [currentIndex]);

  const fetchKanji = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('kanji_writing')
        .select('*')
        .eq('jlpt_level', selectedLevel)
        .order('id', { ascending: true })
        .limit(10);

      if (error) throw error;
      setKanjiList(data || []);
    } catch (error) {
      console.error('Error fetching kanji:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    setStrokeCount(prev => prev + 1);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokeCount(0);
    setAccuracy(null);
  };

  const checkAnswer = () => {
    const expectedStrokes = kanjiList[currentIndex]?.stroke_count || 0;
    const diff = Math.abs(strokeCount - expectedStrokes);
    const acc = Math.max(0, 100 - (diff * 20));
    setAccuracy(acc);
    setShowAnswer(true);
  };

  const nextKanji = () => {
    if (currentIndex < kanjiList.length - 1) {
      setCurrentIndex(prev => prev + 1);
      clearCanvas();
      setShowHint(false);
      setShowAnswer(false);
    }
  };

  const prevKanji = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      clearCanvas();
      setShowHint(false);
      setShowAnswer(false);
    }
  };

  const speakKanji = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const currentKanji = kanjiList[currentIndex];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate('/kanji')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Kanji
          </Button>
          
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

        {currentKanji && (
          <>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Kanji Writing Practice
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Draw the kanji: {currentKanji.meaning}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    <div 
                      className="w-48 h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-6xl font-bold text-gray-400"
                    >
                      {showAnswer ? currentKanji.kanji : '?'}
                    </div>
                  </div>

                  {showAnswer && (
                    <div className="space-y-3 text-center">
                      <div className="flex justify-center gap-4">
                        <Button variant="outline" onClick={() => speakKanji(currentKanji.kanji)}>
                          <Volume2 className="w-4 h-4 mr-2" />
                          Listen
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Onyomi:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{currentKanji.onyomi}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Kunyomi:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{currentKanji.kunyomi}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Question {currentIndex + 1} of {kanjiList.length}
                    </span>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowHint(!showHint)}
                      >
                        <Lightbulb className="w-4 h-4 mr-1" />
                        Hint
                      </Button>
                    </div>
                  </div>

                  {showHint && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Strokes: {currentKanji.stroke_count}
                      </p>
                    </div>
                  )}

                  <canvas
                    ref={canvasRef}
                    width={280}
                    height={280}
                    className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-crosshair touch-none bg-white dark:bg-gray-800"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />

                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Strokes: {strokeCount}
                    </div>
                    
                    {accuracy !== null && (
                      <div className={`flex items-center gap-1 ${accuracy >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>
                        {accuracy >= 80 ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        <span className="font-medium">{accuracy}%</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" onClick={clearCanvas} className="flex-1">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                    <Button onClick={checkAnswer} className="flex-1">
                      <Target className="w-4 h-4 mr-2" />
                      Check
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={prevKanji}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button 
                onClick={nextKanji}
                disabled={currentIndex === kanjiList.length - 1}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {currentKanji.examples && currentKanji.examples.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Example Words
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentKanji.examples.map((word, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => speakKanji(word)}
                      >
                        {word}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};
