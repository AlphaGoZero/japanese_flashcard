/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, MoreVertical, Edit, Trash2, BookOpen, Layers } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useUserDeckStore } from '../stores/userDeckStore';

export const MyDecksPage: React.FC = () => {
  const navigate = useNavigate();
  const { userDecks, fetchUserDecks, isLoading, deleteDeck } = useUserDeckStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchUserDecks();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteDeck(id);
    setDeleteConfirm(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">My Decks</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage your own vocabulary decks</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2" size={18} />
            Create Deck
          </Button>
        </div>

        {/* Decks Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="py-6">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : userDecks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 stagger-animation">
            {userDecks.map(deck => (
              <Card key={deck.id} className="hover:shadow-lg transition-all">
                <CardContent className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-full">
                      {deck.jlpt_level}
                    </span>
                    <div className="relative">
                      <button
                        onClick={() => setDeleteConfirm(deleteConfirm === deck.id ? null : deck.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <MoreVertical size={20} />
                      </button>
                      {deleteConfirm === deck.id && (
                        <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 py-2 z-10 min-w-[120px]">
                          <button
                            onClick={() => navigate(`/my-decks/${deck.id}/edit`)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Edit size={16} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(deck.id)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Link to={`/my-decks/${deck.id}`} className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{deck.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {deck.description || 'No description'}
                    </p>
                  </Link>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <BookOpen size={18} />
                      <span className="font-medium">{deck.cardCount || 0} cards</span>
                    </div>
                    <Link to={`/study/my/${deck.id}`}>
                      <Button size="sm">Study</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Layers className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No custom decks yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first deck to start adding your own vocabulary</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2" size={18} />
                Create Your First Deck
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <CreateDeckModal onClose={() => setShowCreateModal(false)} />
        )}
      </div>
    </Layout>
  );
};

const CreateDeckModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const { createDeck } = useUserDeckStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [jlptLevel, setJlptLevel] = useState('N5');
  const [category, setCategory] = useState('Custom');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    const deck = await createDeck({ name, description, jlpt_level: jlptLevel, category, is_public: false });
    setIsLoading(false);

    if (deck) {
      onClose();
      navigate(`/my-decks/${deck.id}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Deck</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Deck Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., My Vocabulary"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  JLPT Level
                </label>
                <select
                  value={jlptLevel}
                  onChange={(e) => setJlptLevel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="N5">N5</option>
                  <option value="N4">N4</option>
                  <option value="N3">N3</option>
                  <option value="N2">N2</option>
                  <option value="N1">N1</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Custom">Custom</option>
                  <option value="Business">Business</option>
                  <option value="Travel">Travel</option>
                  <option value="Conversation">Conversation</option>
                  <option value="Grammar">Grammar</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading} className="flex-1">
                Create Deck
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyDecksPage;
