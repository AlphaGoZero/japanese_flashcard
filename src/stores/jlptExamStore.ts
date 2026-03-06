/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface JLPTLevel {
  level: string;
  name: string;
  description: string;
  kanji_count: number;
  vocabulary_count: number;
  grammar_count: number;
  passing_score: number;
}

interface JLPTExam {
  id: string;
  level: string;
  section: string;
  title: string;
  description: string | null;
  questions: any[];
  time_limit: number;
  total_points: number;
}

interface ExamResult {
  id: string;
  user_id: string;
  exam_id: string;
  score: number;
  total_points: number;
  time_taken: number;
  answers: any;
  weak_areas: any;
  completed_at: string;
}

interface JLPTExamState {
  levels: JLPTLevel[];
  exams: JLPTExam[];
  examResults: ExamResult[];
  currentExam: JLPTExam | null;
  isLoading: boolean;
  fetchLevels: () => Promise<void>;
  fetchExams: (level?: string) => Promise<void>;
  fetchExamResults: () => Promise<void>;
  fetchExam: (id: string) => Promise<void>;
  submitExam: (examId: string, answers: any[], timeTaken: number) => Promise<void>;
  clearCurrentExam: () => void;
}

export const useJLPTExamStore = create<JLPTExamState>((set, get) => ({
  levels: [],
  exams: [],
  examResults: [],
  currentExam: null,
  isLoading: false,

  fetchLevels: async () => {
    try {
      const { data, error } = await supabase
        .from('jlpt_levels')
        .select('*')
        .order('level', { ascending: true });

      if (error) throw error;
      set({ levels: data || [] });
    } catch (error) {
      console.error('Error fetching JLPT levels:', error);
    }
  },

  fetchExams: async (level?: string) => {
    set({ isLoading: true });
    try {
      let query = supabase
        .from('jlpt_exams')
        .select('*')
        .eq('is_active', true);

      if (level) {
        query = query.eq('level', level);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      set({ exams: data || [] });
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchExamResults: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('exam_results')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      set({ examResults: data || [] });
    } catch (error) {
      console.error('Error fetching exam results:', error);
    }
  },

  fetchExam: async (id: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('jlpt_exams')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      set({ currentExam: data });
    } catch (error) {
      console.error('Error fetching exam:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  submitExam: async (examId: string, answers: any[], timeTaken: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const exam = get().currentExam;
      if (!exam) return;

      let correct = 0;
      const weakAreas: Record<string, number> = {};

      answers.forEach((answer: any, index: number) => {
        const question = exam.questions[index];
        if (question && answer.selectedIndex === question.correct) {
          correct++;
        } else if (question) {
          const section = exam.section;
          weakAreas[section] = (weakAreas[section] || 0) + 1;
        }
      });

      const score = Math.round((correct / exam.questions.length) * exam.total_points);

      const { error } = await supabase
        .from('exam_results')
        .insert({
          user_id: user.id,
          exam_id: examId,
          score,
          total_points: exam.total_points,
          time_taken: timeTaken,
          answers,
          weak_areas: weakAreas
        });

      if (error) throw error;
      get().fetchExamResults();
    } catch (error) {
      console.error('Error submitting exam:', error);
    }
  },

  clearCurrentExam: () => {
    set({ currentExam: null });
  }
}));
