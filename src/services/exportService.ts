import { supabase } from './supabase';

export interface ExportData {
  version: string;
  exportedAt: string;
  user: {
    email: string;
    displayName: string;
  };
  progress: any[];
  quizResults: any[];
  gameResults: any[];
  favorites: any[];
  notes: any[];
  settings: any;
}

export const exportUserData = async (): Promise<ExportData | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const [progressRes, quizRes, gameRes, favoritesRes, notesRes, userRes] = await Promise.all([
      supabase.from('user_progress').select('*').eq('user_id', user.id),
      supabase.from('quiz_results').select('*').eq('user_id', user.id),
      supabase.from('game_results').select('*').eq('user_id', user.id),
      supabase.from('card_favorites').select('*').eq('user_id', user.id),
      supabase.from('card_notes').select('*').eq('user_id', user.id),
      supabase.from('users').select('*').eq('id', user.id).single(),
    ]);

    const settings = localStorage.getItem('userSettings');
    const parsedSettings = settings ? JSON.parse(settings) : {};

    const exportData: ExportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: {
        email: user.email || '',
        displayName: userRes.data?.display_name || '',
      },
      progress: progressRes.data || [],
      quizResults: quizRes.data || [],
      gameResults: gameRes.data || [],
      favorites: favoritesRes.data || [],
      notes: notesRes.data || [],
      settings: parsedSettings,
    };

    return exportData;
  } catch (error) {
    console.error('Failed to export data:', error);
    return null;
  }
};

export const downloadExport = async (filename?: string) => {
  const data = await exportUserData();
  if (!data) {
    throw new Error('Failed to export data');
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `nihongo-flash-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportProgressCSV = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: progress } = await supabase
      .from('user_progress')
      .select('*, cards!inner(japanese, hiragana, english)')
      .eq('user_id', user.id);

    if (!progress || progress.length === 0) return null;

    const headers = ['Japanese', 'Hiragana', 'English', 'Mastery Level', 'Times Reviewed', 'Correct Count', 'Last Reviewed'];
    const rows = progress.map((p: any) => [
      p.cards?.japanese || '',
      p.cards?.hiragana || '',
      p.cards?.english || '',
      p.mastery_level || 0,
      p.times_reviewed || 0,
      p.correct_count || 0,
      p.last_reviewed || '',
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nihongo-flash-progress-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Failed to export CSV:', error);
    return null;
  }
};

export interface DeckImportData {
  name: string;
  description: string;
  jlptLevel: string;
  category: string;
  cards: {
    japanese: string;
    hiragana: string;
    romaji?: string;
    english: string;
    exampleJapanese?: string;
    exampleEnglish?: string;
  }[];
}

export const importDeckData = async (file: File): Promise<{ success: boolean; message: string; deckId?: string }> => {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as DeckImportData;

    if (!data.name || !data.cards || !Array.isArray(data.cards)) {
      return { success: false, message: 'Invalid deck format. Please check your JSON file.' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'You must be logged in to import decks.' };
    }

    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .insert({
        name: data.name,
        description: data.description || '',
        jlpt_level: data.jlptLevel || 'N5',
        category: data.category || 'Custom',
        card_count: data.cards.length,
      })
      .select()
      .single();

    if (deckError) throw deckError;

    const cardsToInsert = data.cards.map(card => ({
      deck_id: deck.id,
      japanese: card.japanese,
      hiragana: card.hiragana,
      romaji: card.romaji || null,
      english: card.english,
      example_japanese: card.exampleJapanese || null,
      example_english: card.exampleEnglish || null,
      jlpt_level: data.jlptLevel || 'N5',
      category: data.category || 'Custom',
    }));

    const { error: cardsError } = await supabase
      .from('cards')
      .insert(cardsToInsert);

    if (cardsError) throw cardsError;

    return { success: true, message: `Successfully imported "${data.name}" with ${data.cards.length} cards!`, deckId: deck.id };
  } catch (error) {
    console.error('Failed to import deck:', error);
    return { success: false, message: 'Failed to import deck. Please check your JSON format.' };
  }
};

export const validateImportFile = (file: File): Promise<{ valid: boolean; error?: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (!data.name) {
          resolve({ valid: false, error: 'Missing deck name' });
          return;
        }
        
        if (!data.cards || !Array.isArray(data.cards) || data.cards.length === 0) {
          resolve({ valid: false, error: 'Missing or invalid cards array' });
          return;
        }

        const requiredFields = ['japanese', 'hiragana', 'english'];
        const invalidCards = data.cards.filter((card: any) => 
          !requiredFields.every(field => card[field])
        );

        if (invalidCards.length > 0) {
          resolve({ valid: false, error: `${invalidCards.length} cards are missing required fields (japanese, hiragana, english)` });
          return;
        }

        resolve({ valid: true });
      } catch {
        resolve({ valid: false, error: 'Invalid JSON format' });
      }
    };
    reader.onerror = () => resolve({ valid: false, error: 'Failed to read file' });
    reader.readAsText(file);
  });
};
