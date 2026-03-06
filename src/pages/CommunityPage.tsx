/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Share2, Copy, Check, Users } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useDeckStore } from '../stores/deckStore';
import { useUserDeckStore } from '../stores/userDeckStore';
import { supabase } from '../services/supabase';

export const CommunityPage: React.FC = () => {
  const { decks, fetchDecks } = useDeckStore();
  const { userDecks, fetchUserDecks } = useUserDeckStore();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchDecks(),
      fetchUserDecks(),
    ]);
    setIsLoading(false);
  };

  const filteredDecks = decks.filter(deck => {
    const matchesLevel = selectedLevel === 'All' || deck.jlptLevel === selectedLevel;
    const matchesCategory = selectedCategory === 'All' || deck.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesCategory && matchesSearch;
  });

  const handleShareDeck = async (deckId: string) => {
    try {
      const shareCode = crypto.randomUUID();
      const { error } = await supabase
        .from('decks')
        .update({ is_shared: true, share_code: shareCode })
        .eq('id', deckId);

      if (error) throw error;
      setShareCode(shareCode);
    } catch (error) {
      console.error('Failed to share deck:', error);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloneDeck = async (deckId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: deck } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .single();

      if (!deck) return;

      const { data: newDeck, error: deckError } = await supabase
        .from('user_decks')
        .insert({
          user_id: user.id,
          name: deck.name + ' (Copy)',
          description: deck.description,
          jlpt_level: deck.jlpt_level,
          category: deck.category,
        })
        .select()
        .single();

      if (deckError) throw deckError;

      const { data: cards } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', deckId);

      if (cards?.length) {
        await supabase
          .from('user_cards')
          .insert(
            cards.map((card: any) => ({
              user_deck_id: newDeck.id,
              user_id: user.id,
              japanese: card.japanese,
              hiragana: card.hiragana,
              romaji: card.romaji,
              english: card.english,
            }))
          );
      }

      await fetchUserDecks();
    } catch (error) {
      console.error('Failed to clone deck:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Community Decks</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Discover and share vocabulary decks with other learners</p>
        </div>

        {/* My Shared Decks */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Share2 className="text-primary-600" size={20} />
              <h2 className="text-lg font-semibold">My Shared Decks</h2>
            </div>
          </CardHeader>
          <CardContent>
            {userDecks.length > 0 ? (
              <div className="space-y-3">
                {userDecks.map((deck) => (
                  <div key={deck.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{deck.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{deck.cardCount} cards</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShareDeck(deck.id)}
                    >
                      <Share2 size={14} className="mr-1" />
                      Share
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No personal decks yet. Create one to share!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Share Code Modal */}
        {shareCode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <h2 className="text-lg font-semibold">Share Your Deck</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Share this code with others to let them clone your deck:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-lg text-center">
                    {shareCode}
                  </code>
                  <Button variant="outline" onClick={() => handleCopyCode(shareCode)}>
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </Button>
                </div>
                <Button className="w-full" onClick={() => setShareCode(null)}>
                  Done
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Browse Community Decks */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="text-primary-600" size={20} />
              <h2 className="text-lg font-semibold">Browse Shared Decks</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search decks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="All">All Levels</option>
                <option value="N5">JLPT N5</option>
                <option value="N4">JLPT N4</option>
                <option value="N3">JLPT N3</option>
                <option value="N2">JLPT N2</option>
                <option value="N1">JLPT N1</option>
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="All">All Categories</option>
                <option value="Greetings">Greetings</option>
                <option value="Numbers">Numbers</option>
                <option value="Time">Time</option>
                <option value="People">People</option>
                <option value="Food">Food</option>
                <option value="Verbs">Verbs</option>
                <option value="Adjectives">Adjectives</option>
              </select>
            </div>

            {/* Deck List */}
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            ) : filteredDecks.length > 0 ? (
              <div className="space-y-3">
                {filteredDecks.map((deck) => (
                  <div key={deck.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{deck.name}</h3>
                        <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded">
                          {deck.jlptLevel}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{deck.description}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{deck.cardCount} cards • {deck.category}</p>
                    </div>
                    <Button size="sm" onClick={() => handleCloneDeck(deck.id)}>
                      Clone
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No shared decks found. Be the first to share!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
