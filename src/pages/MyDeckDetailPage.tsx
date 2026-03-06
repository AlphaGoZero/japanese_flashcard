/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, Play, Volume2 } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useUserDeckStore } from '../stores/userDeckStore';
import { speakJapanese } from '../utils/tts';

export const MyDeckDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentDeck, deckCards, fetchUserDeck, deleteCard, clearCurrentDeck, isLoading } = useUserDeckStore();
  const [showAddCard, setShowAddCard] = useState(false);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchUserDeck(id);
    }
    return () => clearCurrentDeck();
  }, [id]);

  const handleDeleteCard = async (cardId: string) => {
    await deleteCard(cardId);
    setDeleteConfirm(null);
  };

  const handleSpeak = async (text: string) => {
    try {
      await speakJapanese(text);
    } catch (error) {
      console.error('Failed to speak:', error);
    }
  };

  if (isLoading || !currentDeck) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/my-decks')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
            >
              <ArrowLeft size={20} />
              Back to My Decks
            </button>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {currentDeck.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {currentDeck.description || 'No description'}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-full">
                {currentDeck.jlpt_level}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {deckCards.length} cards
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/study/my/${id}`}>
              <Button>
                <Play className="mr-2" size={18} />
                Study
              </Button>
            </Link>
            <Button variant="outline" onClick={() => setShowAddCard(true)}>
              <Plus className="mr-2" size={18} />
              Add Card
            </Button>
          </div>
        </div>

        {/* Cards List */}
        {deckCards.length > 0 ? (
          <div className="grid gap-4">
            {deckCards.map((card, index) => (
              <Card key={card.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400 dark:text-gray-500 text-sm w-6">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-gray-900 dark:text-white font-japanese">
                          {card.japanese}
                        </span>
                        <button
                          onClick={() => handleSpeak(card.japanese)}
                          className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          <Volume2 size={16} />
                        </button>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">{card.hiragana}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.english}</p>
                      {card.example_japanese && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-japanese">
                          例: {card.example_japanese}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingCard(card.id)}
                      className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(card.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </CardContent>

                {/* Delete Confirmation */}
                {deleteConfirm === card.id && (
                  <div className="px-6 pb-4 flex items-center justify-end gap-2">
                    <span className="text-sm text-red-600 dark:text-red-400 mr-auto">
                      Delete this card?
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>
                      Cancel
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteCard(card.id)}>
                      Delete
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No cards yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Add your first vocabulary card to this deck</p>
              <Button onClick={() => setShowAddCard(true)}>
                <Plus className="mr-2" size={18} />
                Add First Card
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Card Modal */}
        {(showAddCard || editingCard) && (
          <CardModal
            deckId={id!}
            card={editingCard ? deckCards.find(c => c.id === editingCard) : undefined}
            onClose={() => {
              setShowAddCard(false);
              setEditingCard(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

const CardModal: React.FC<{
  deckId: string;
  card?: any;
  onClose: () => void;
}> = ({ deckId, card, onClose }) => {
  const { addCard, updateCard } = useUserDeckStore();
  const [japanese, setJapanese] = useState(card?.japanese || '');
  const [hiragana, setHiragana] = useState(card?.hiragana || '');
  const [romaji, setRomaji] = useState(card?.romaji || '');
  const [english, setEnglish] = useState(card?.english || '');
  const [exampleJapanese, setExampleJapanese] = useState(card?.example_japanese || '');
  const [exampleEnglish, setExampleEnglish] = useState(card?.example_english || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!japanese.trim() || !hiragana.trim() || !english.trim()) return;

    setIsLoading(true);
    
    const cardData = {
      japanese,
      hiragana,
      romaji: romaji || null,
      english,
      example_japanese: exampleJapanese || null,
      example_english: exampleEnglish || null,
    };

    if (card?.id) {
      await updateCard(card.id, cardData);
    } else {
      await addCard(deckId, cardData);
    }
    
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {card ? 'Edit Card' : 'Add New Card'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Japanese (Kanji) *
                </label>
                <input
                  type="text"
                  value={japanese}
                  onChange={(e) => setJapanese(e.target.value)}
                  placeholder="東京"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 font-japanese text-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hiragana *
                </label>
                <input
                  type="text"
                  value={hiragana}
                  onChange={(e) => setHiragana(e.target.value)}
                  placeholder="とうきょう"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Romaji
              </label>
              <input
                type="text"
                value={romaji}
                onChange={(e) => setRomaji(e.target.value)}
                placeholder="Tokyo"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                English Meaning *
              </label>
              <input
                type="text"
                value={english}
                onChange={(e) => setEnglish(e.target.value)}
                placeholder="Tokyo"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Example Sentence (Japanese)
              </label>
              <input
                type="text"
                value={exampleJapanese}
                onChange={(e) => setExampleJapanese(e.target.value)}
                placeholder="東京は日本の首都です"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 font-japanese"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Example Translation
              </label>
              <input
                type="text"
                value={exampleEnglish}
                onChange={(e) => setExampleEnglish(e.target.value)}
                placeholder="Tokyo is the capital of Japan"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading} className="flex-1">
                {card ? 'Update Card' : 'Add Card'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyDeckDetailPage;
