import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, RotateCcw, Trophy, Zap, Grid, Play } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useDeckStore } from '../stores/deckStore';
import { gameAPI } from '../services/api';

interface GameCard {
  id: string;
  type: 'japanese' | 'english';
  value: string;
  matchId: string;
}

const gameTypes = [
  { id: 'timed_challenge', name: 'Timed Challenge', description: 'Answer as many questions as possible in 60 seconds', icon: Clock, color: 'bg-red-500' },
  { id: 'matching_pairs', name: 'Matching Pairs', description: 'Match Japanese words with their meanings', icon: Grid, color: 'bg-blue-500' },
];

export const GamesPage: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { currentDeck, fetchDeck, clearCurrentDeck } = useDeckStore();
  
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  useEffect(() => {
    if (deckId) {
      fetchDeck(deckId);
    }
    return () => clearCurrentDeck();
  }, [deckId]);

  const handleStartGame = async (gameType: string) => {
    setSelectedGame(gameType);
  };

  if (!selectedGame) {
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
          <p className="text-gray-600 mb-8">Choose a game to practice your vocabulary</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gameTypes.map((game) => {
              const Icon = game.icon;
              return (
                <button
                  key={game.id}
                  onClick={() => handleStartGame(game.id)}
                  className="text-left p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all"
                >
                  <div className={`w-14 h-14 ${game.color} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="text-white" size={28} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{game.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{game.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </Layout>
    );
  }

  if (selectedGame === 'timed_challenge') {
    return <TimedChallenge deckId={deckId!} onExit={() => setSelectedGame(null)} />;
  }

  if (selectedGame === 'matching_pairs') {
    return <MatchingPairs deckId={deckId!} onExit={() => setSelectedGame(null)} />;
  }

  return null;
};

const TimedChallenge: React.FC<{ deckId: string; onExit: () => void }> = ({ deckId, onExit }) => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const startGame = async () => {
    setIsLoading(true);
    try {
      const response = await gameAPI.start({ deckId, gameType: 'timed_challenge' });
      setQuestions(response.data.data.questions);
      setGameStarted(true);
    } catch (error) {
      console.error('Failed to start game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameOver) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameStarted && !gameOver) {
      setGameOver(true);
      gameAPI.submit({ deckId, gameType: 'timed_challenge', score, timeTakenSeconds: 60 }).catch(console.error);
    }
  }, [timeLeft, gameStarted, gameOver, score, deckId]);

  const handleAnswer = (option: string) => {
    if (showResult) return;
    setSelectedOption(option);
    setShowResult(true);

    if (option === questions[currentIndex]?.correctAnswer) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      setSelectedOption(null);
      setShowResult(false);
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
      } else {
        setGameOver(true);
        const finalScore = option === questions[currentIndex]?.correctAnswer ? score + 1 : score;
        gameAPI.submit({ deckId, gameType: 'timed_challenge', score: finalScore, timeTakenSeconds: 60 - timeLeft }).catch(console.error);
      }
    }, 500);
  };

  if (!gameStarted) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center">
          <Card className="py-12">
            <CardContent>
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="text-white" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Timed Challenge</h2>
              <p className="text-gray-600 mb-8">Answer as many questions as you can in 60 seconds!</p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={onExit}>Back</Button>
                <Button onClick={startGame} isLoading={isLoading}>
                  <Play className="mr-2" size={20} />
                  Start Game
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (gameOver) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center">
          <Card className="py-12">
            <CardContent>
              <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="text-white" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Game Over!</h2>
              <p className="text-5xl font-bold text-gray-900 mb-2">{score}</p>
              <p className="text-gray-600 mb-8">points</p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => {
                  setScore(0);
                  setTimeLeft(60);
                  setCurrentIndex(0);
                  setGameOver(false);
                  startGame();
                }}>
                  <RotateCcw className="mr-2" size={20} />
                  Play Again
                </Button>
                <Button onClick={() => navigate(`/decks/${deckId}`)}>Back to Deck</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const question = questions[currentIndex];

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onExit} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </button>
          <div className={`px-4 py-2 rounded-full font-bold ${timeLeft <= 10 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
            {timeLeft}s
          </div>
          <div className="text-xl font-bold text-gray-900">Score: {score}</div>
        </div>

        <Card className="mb-6">
          <CardContent className="py-8 text-center">
            <p className="text-4xl font-bold text-gray-900 font-japanese">{question?.japanese}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {question?.options?.map((option: string, i: number) => (
            <button
              key={i}
              onClick={() => handleAnswer(option)}
              disabled={showResult}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                showResult 
                  ? option === question.correctAnswer 
                    ? 'bg-green-100 border-green-500' 
                    : selectedOption === option 
                      ? 'bg-red-100 border-red-500' 
                      : 'border-gray-200'
                  : 'border-gray-200 hover:border-primary-500'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
};

const MatchingPairs: React.FC<{ deckId: string; onExit: () => void }> = ({ deckId, onExit }) => {
  const navigate = useNavigate();
  const [cards, setCards] = useState<GameCard[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const startGame = async () => {
    setIsLoading(true);
    try {
      const response = await gameAPI.start({ deckId, gameType: 'matching_pairs' });
      const shuffled = [...response.data.data.cards].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setGameStarted(true);
    } catch (error) {
      console.error('Failed to start game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (cardId: string) => {
    if (flipped.length >= 2 || flipped.includes(cardId) || matched.includes(cards.find(c => c.id === cardId)?.matchId || '')) {
      return;
    }

    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const card1 = cards.find(c => c.id === newFlipped[0]);
      const card2 = cards.find(c => c.id === newFlipped[1]);

      if (card1 && card2 && card1.matchId === card2.matchId) {
        setMatched(prev => [...prev, card1.matchId]);
        setScore(s => s + 10);
        setFlipped([]);
        
        if (matched.length + 1 === cards.length / 2) {
          setGameWon(true);
          gameAPI.submit({ deckId, gameType: 'matching_pairs', score: score + 10, timeTakenSeconds: moves + 1 }).catch(console.error);
        }
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  if (!gameStarted) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center">
          <Card className="py-12">
            <CardContent>
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Grid className="text-white" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Matching Pairs</h2>
              <p className="text-gray-600 mb-8">Match Japanese words with their English meanings!</p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={onExit}>Back</Button>
                <Button onClick={startGame} isLoading={isLoading}>
                  <Play className="mr-2" size={20} />
                  Start Game
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (gameWon) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center">
          <Card className="py-12">
            <CardContent>
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="text-white" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You Won!</h2>
              <p className="text-gray-600 mb-2">Completed in {moves} moves</p>
              <p className="text-3xl font-bold text-gray-900 mb-8">{score} points</p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => {
                  setScore(0);
                  setMoves(0);
                  setMatched([]);
                  setFlipped([]);
                  setGameWon(false);
                  startGame();
                }}>
                  <RotateCcw className="mr-2" size={20} />
                  Play Again
                </Button>
                <Button onClick={() => navigate(`/decks/${deckId}`)}>Back to Deck</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onExit} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </button>
          <div className="text-lg font-medium text-gray-900">Moves: {moves}</div>
          <div className="text-xl font-bold text-gray-900">Score: {score}</div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {cards.map((card) => {
            const isFlipped = flipped.includes(card.id) || matched.includes(card.matchId);
            const isMatched = matched.includes(card.matchId);
            
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                  isFlipped || isMatched
                    ? 'bg-white border-2 border-primary-500'
                    : 'bg-primary-600 hover:bg-primary-700'
                } ${isMatched ? 'bg-green-100 border-green-500' : ''}`}
              >
                {isFlipped || isMatched ? (
                  <span className={card.type === 'japanese' ? 'font-japanese text-lg' : ''}>
                    {card.value}
                  </span>
                ) : (
                  <span className="text-white text-2xl">?</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};
