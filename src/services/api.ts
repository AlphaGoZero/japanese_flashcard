import { supabase } from './supabase';

export const gameAPI = {
  submit: async (deckId: string, gameType: string, score: number, timeTakenSeconds: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase.from('game_results').insert({
      user_id: user.id,
      deck_id: deckId,
      game_type: gameType,
      score,
      time_taken_seconds: timeTakenSeconds,
    }).select().single();
    
    if (error) throw error;
    return { data };
  },
  
  getHistory: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [] };
    
    const { data, error } = await supabase
      .from('game_results')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    return { data: data || [] };
  },
};

export const quizAPI = {
  getHistory: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [] };
    
    const { data, error } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    return { data: data || [] };
  },
};

export const progressAPI = {
  review: async (payload: { cardId: string; correct: boolean }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data: existing } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('card_id', payload.cardId)
      .single();
    
    if (existing) {
      const { data, error } = await supabase
        .from('user_progress')
        .update({
          times_reviewed: existing.times_reviewed + 1,
          correct_count: payload.correct ? existing.correct_count + 1 : existing.correct_count,
          mastery_level: payload.correct ? Math.min(existing.mastery_level + 1, 10) : Math.max(existing.mastery_level - 1, 0),
          last_reviewed: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return { data };
    } else {
      const { data, error } = await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          card_id: payload.cardId,
          times_reviewed: 1,
          correct_count: payload.correct ? 1 : 0,
          mastery_level: payload.correct ? 1 : 0,
          last_reviewed: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data };
    }
  },
};
