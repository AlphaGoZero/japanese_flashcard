import { create } from 'zustand';
import { quizAPI } from '../services/api';

interface Question {
  cardId: string;
  type: string;
  japanese?: string;
  hiragana?: string;
  options?: string[];
  correctAnswer: string;
}

interface QuizState {
  deckId: string | null;
  deckName: string | null;
  quizType: string | null;
  questions: Question[];
  currentIndex: number;
  answers: Map<string, string>;
  startTime: number | null;
  isLoading: boolean;
  result: {
    score: number;
    total: number;
    timeTaken: number;
  } | null;
  startQuiz: (deckId: string, quizType: string, count?: number) => Promise<void>;
  submitAnswer: (cardId: string, answer: string) => void;
  nextQuestion: () => void;
  submitQuiz: () => Promise<void>;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  deckId: null,
  deckName: null,
  quizType: null,
  questions: [],
  currentIndex: 0,
  answers: new Map(),
  startTime: null,
  isLoading: false,
  result: null,

  startQuiz: async (deckId: string, quizType: string, count = 10) => {
    set({ isLoading: true });
    try {
      const response = await quizAPI.start({ deckId, quizType, count });
      const { deck, questions } = response.data.data;
      set({
        deckId,
        deckName: deck.name,
        quizType,
        questions,
        currentIndex: 0,
        answers: new Map(),
        startTime: Date.now(),
        isLoading: false,
        result: null,
      });
    } catch (error) {
      console.error('Failed to start quiz:', error);
      set({ isLoading: false });
    }
  },

  submitAnswer: (cardId: string, answer: string) => {
    const { answers } = get();
    const newAnswers = new Map(answers);
    newAnswers.set(cardId, answer);
    set({ answers: newAnswers });
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get();
    if (currentIndex < questions.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    }
  },

  submitQuiz: async () => {
    const { deckId, quizType, answers, startTime } = get();
    if (!deckId || !quizType || !startTime) return;

    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const answerList = Array.from(answers.entries()).map(([cardId, answer]) => ({
      cardId,
      answer,
    }));

    set({ isLoading: true });
    try {
      const response = await quizAPI.submit({
        deckId,
        quizType,
        answers: answerList,
        timeTakenSeconds: timeTaken,
      });

      set({
        result: {
          score: response.data.data.score,
          total: response.data.data.total,
          timeTaken,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      set({ isLoading: false });
    }
  },

  resetQuiz: () => {
    set({
      deckId: null,
      deckName: null,
      quizType: null,
      questions: [],
      currentIndex: 0,
      answers: new Map(),
      startTime: null,
      result: null,
    });
  },
}));
