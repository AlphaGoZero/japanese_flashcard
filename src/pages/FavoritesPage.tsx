/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, BookOpen, Volume2, Trash2, Edit3, Save, X, Search } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useFavoritesStore } from '../stores/favoritesStore';
import { speakJapanese } from '../utils/tts';

export const FavoritesPage: React.FC = () => {
  const { favorites, fetchFavorites, removeFavorite, isLoading, notes, fetchNotes, updateNote, getNote } = useFavoritesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    fetchFavorites();
    fetchNotes();
  }, []);

  const filteredFavorites = favorites.filter(
    (fav) =>
      fav.japanese.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.hiragana.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.english.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSpeak = async (japanese: string) => {
    try {
      await speakJapanese(japanese);
    } catch (error) {
      console.error('Failed to speak:', error);
    }
  };

  const handleRemoveFavorite = async (cardId: string) => {
    if (window.confirm('Remove this card from favorites?')) {
      await removeFavorite(cardId);
    }
  };

  const handleEditNote = (cardId: string) => {
    setEditingNote(cardId);
    setNoteText(getNote(cardId));
  };

  const handleSaveNote = async (cardId: string) => {
    await updateNote(cardId, noteText);
    setEditingNote(null);
    setNoteText('');
  };

  const handleCancelNote = () => {
    setEditingNote(null);
    setNoteText('');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Favorites</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Your saved vocabulary cards for quick review</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search favorites..."
            className="w-full pl-10 pr-4 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-xl flex items-center justify-center">
                <Heart className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Favorites</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{favorites.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center">
                <Edit3 className="text-yellow-600 dark:text-yellow-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cards with Notes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{notes.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                <BookOpen className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Decks Covered</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Set(favorites.map(f => f.deckId)).size}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Favorites List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="py-4">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredFavorites.length > 0 ? (
          <div className="space-y-3">
            {filteredFavorites.map((fav) => (
              <Card key={fav.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{fav.japanese}</h3>
                        <button
                          onClick={() => handleSpeak(fav.japanese)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        >
                          <Volume2 size={18} />
                        </button>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{fav.hiragana}</span>
                        {fav.romaji && (
                          <span className="text-sm text-gray-400 dark:text-gray-500">({fav.romaji})</span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-2">{fav.english}</p>
                      
                      {fav.exampleJapanese && (
                        <div className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded-lg mb-2">
                          <p className="font-japanese text-gray-700 dark:text-gray-300">{fav.exampleJapanese}</p>
                          {fav.exampleEnglish && (
                            <p className="text-gray-500 dark:text-gray-400">{fav.exampleEnglish}</p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Link 
                          to={`/decks/${fav.deckId}`}
                          className="text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          {fav.deckName}
                        </Link>
                      </div>

                      {/* Note Section */}
                      {editingNote === fav.cardId ? (
                        <div className="mt-3">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add a personal note..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none"
                            rows={2}
                          />
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" onClick={() => handleSaveNote(fav.cardId)}>
                              <Save size={14} className="mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCancelNote}>
                              <X size={14} className="mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2">
                          {getNote(fav.cardId) ? (
                            <div className="flex items-start gap-2">
                              <p className="text-sm text-yellow-700 dark:text-yellow-300 italic">
                                "{getNote(fav.cardId)}"
                              </p>
                              <button
                                onClick={() => handleEditNote(fav.cardId)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <Edit3 size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditNote(fav.cardId)}
                              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1"
                            >
                              <Edit3 size={14} />
                              Add note
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleRemoveFavorite(fav.cardId)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remove from favorites"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Heart className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No favorites yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery ? 'Try adjusting your search' : 'Start studying and save cards you want to review later'}
              </p>
              <Link to="/decks">
                <Button>Browse Decks</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};
