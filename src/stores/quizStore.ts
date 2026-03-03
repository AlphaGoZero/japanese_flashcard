import { create } from 'zustand';
import { supabase } from '../services/supabase';

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
      // Get cards from deck
      const { data: cards, error } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', deckId)
        .limit(count);

      if (error || !cards || cards.length === 0) {
        console.error('No cards found');
        set({ isLoading: false });
        return;
      }

      // Get deck name
      const { data: deck } = await supabase
        .from('decks')
        .select('name')
        .eq('id', deckId)
        .single();

      // Generate questions based on quiz type
      const questions: Question[] = cards.map((card: any) => {
        if (quizType === 'multiple_choice') {
          // Get wrong answers from other cards
          const wrongAnswers = cards
            .filter((c: any) => c.id !== card.id)
            .slice(0, 3)
            .map((c: any) => c.english);
          
          const options = [card.english, ...wrongAnswers].sort(() => Math.random() - 0.5);
          
          return {
            cardId: card.id,
            type: 'multiple_choice',
            japanese: card.japanese,
            hiragana: card.hiragana,
            options,
            correctAnswer: card.english,
          };
        } else if (quizType === 'typing') {
          return {
            cardId: card.id,
            type: 'typing',
            japanese: card.japanese,
            hiragana: card.hiragana,
            correctAnswer: card.english,
          };
        } else {
          // Default to multiple choice
          return {
            cardId: card.id,
            type: 'multiple_choice',
            japanese: card.japanese,
            hiragana: card.hiragana,
            options: [card.english, 'wrong1', 'wrong2', 'wrong3'],
            correctAnswer: card.english,
          };
        }
      });

      set({
        deckId,
        deckName: deck?.name || 'Quiz',
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
    const { deckId, quizType, answers, questions, startTime } = get();
    if (!deckId || !quizType || !startTime) return;

    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    
    // Calculate score
    let score = 0;
    questions.forEach((q) => {
      const userAnswer = answers.get(q.cardId);
      if (userAnswer?.toLowerCase() === q.correctAnswer.toLowerCase()) {
        score++;
      }
    });

    // Save to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('quiz_results').insert({
          user_id: user.id,
          deck_id: deckId,
          quiz_type: quizType,
          score,
          total_questions: questions.length,
          time_taken_seconds: timeTaken,
        });
      }
    } catch (error) {
      console.error('Failed to save quiz result:', error);
    }

    set({
      result: {
        score,
        total: questions.length,
        timeTaken,
      },
      isLoading: false,
    });
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
