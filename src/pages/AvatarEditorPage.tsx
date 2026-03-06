import React, { useEffect, useState } from 'react';
import { Save, Palette, Star, Lock, Check, Trophy } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../services/supabase';

interface AvatarConfig {
  background: string;
  accessory: string;
  expression: string;
  color: string;
}

interface AvatarItem {
  id: string;
  category: string;
  name: string;
  unlock_type: string | null;
  unlock_value: number | null;
}

interface UserProgress {
  level: number;
  streak: number;
  achievements: string[];
}

const defaultConfig: AvatarConfig = {
  background: 'bg_default',
  accessory: 'acc_none',
  expression: 'exp_smile',
  color: 'color_blue',
};

const categoryLabels: Record<string, string> = {
  background: 'Background',
  accessory: 'Accessory',
  expression: 'Expression',
  color: 'Color',
};

export const AvatarEditorPage: React.FC = () => {
  const { user } = useAuthStore();
  const [config, setConfig] = useState<AvatarConfig>(defaultConfig);
  const [unlockedItems, setUnlockedItems] = useState<string[]>(['bg_default', 'acc_none', 'exp_smile', 'color_blue']);
  const [userProgress, setUserProgress] = useState<UserProgress>({ level: 1, streak: 0, achievements: [] });
  const [items, setItems] = useState<Record<string, AvatarItem[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('background');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;

    const [userRes, itemsRes] = await Promise.all([
      supabase.from('users').select('avatar_config, level, achievements').eq('id', user.id).single(),
      supabase.from('avatar_items').select('*'),
    ]);

    if (userRes.data) {
      setConfig(userRes.data.avatar_config || defaultConfig);
      setUserProgress({
        level: userRes.data.level || 1,
        streak: 0,
        achievements: userRes.data.achievements || [],
      });
    }

    if (itemsRes.data) {
      const grouped: Record<string, AvatarItem[]> = {};
      (itemsRes.data as any[]).forEach((item: any) => {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push({
          id: item.id,
          category: item.category,
          name: item.name,
          unlock_type: item.unlock_type,
          unlock_value: item.unlock_value,
        });
      });
      setItems(grouped);
    }

    const unlockable = ['bg_default', 'acc_none', 'exp_smile', 'color_blue'];
    if (userRes.data?.level >= 5) {
      unlockable.push('bg_sunset', 'color_red');
    }
    if (userRes.data?.level >= 10) {
      unlockable.push('bg_forest', 'color_green');
    }
    if (userRes.data?.level >= 20) {
      unlockable.push('bg_ocean', 'color_purple');
    }
    if (userProgress.streak >= 7) unlockable.push('acc_glasses');
    if (userProgress.streak >= 30) unlockable.push('acc_hat');
    if (userProgress.achievements?.length >= 10) unlockable.push('acc_crown');
    setUnlockedItems(unlockable);
  };

  const isUnlocked = (itemId: string) => {
    return unlockedItems.includes(itemId);
  };

const canUnlock = (item: AvatarItem) => {
    if (!item.unlock_type) return true;
    switch (item.unlock_type) {
      case 'level': return userProgress.level >= (item.unlock_value || 0);
      case 'streak': return userProgress.streak >= (item.unlock_value || 0);
      case 'achievement': return userProgress.achievements?.length >= (item.unlock_value || 0);
      default: return true;
    }
  };

  const handleSelect = (category: string, itemId: string) => {
    const item = items[category]?.find(i => i.id === itemId);
    if (!isUnlocked(itemId) && item && !canUnlock(item)) return;
    setConfig(prev => ({ ...prev, [category]: itemId }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await supabase.from('users').update({ avatar_config: config }).eq('id', user.id);
    } catch (error) {
      console.error('Failed to save avatar:', error);
    }
    setIsSaving(false);
  };

  const renderAvatar = (size: 'sm' | 'lg' = 'lg') => {
    const bgColors: Record<string, string> = {
      bg_default: 'bg-gradient-to-br from-blue-400 to-indigo-600',
      bg_sunset: 'bg-gradient-to-br from-orange-400 to-pink-500',
      bg_forest: 'bg-gradient-to-br from-green-400 to-emerald-600',
      bg_ocean: 'bg-gradient-to-br from-cyan-400 to-blue-600',
    };

    const avatarColors: Record<string, string> = {
      color_blue: 'bg-blue-500',
      color_red: 'bg-red-500',
      color_green: 'bg-green-500',
      color_purple: 'bg-purple-500',
    };

    const expressions: Record<string, React.ReactNode> = {
      exp_smile: <span className="text-2xl">😊</span>,
      exp_serious: <span className="text-2xl">😐</span>,
      exp_excited: <span className="text-2xl">🤩</span>,
    };

    const accessories: Record<string, React.ReactNode> = {
      acc_none: null,
      acc_glasses: <span className="absolute -top-1 -right-1 text-lg">👓</span>,
      acc_hat: <span className="absolute -top-2 -right-1 text-lg">🎩</span>,
      acc_crown: <span className="absolute -top-2 -right-1 text-lg">👑</span>,
    };

    const sizeClasses = size === 'sm' ? 'w-10 h-10' : 'w-32 h-32';
    const innerSize = size === 'sm' ? 'w-6 h-6 text-sm' : 'w-16 h-16 text-4xl';

    return (
      <div className={`${sizeClasses} rounded-full ${bgColors[config.background] || bgColors.bg_default} relative flex items-center justify-center`}>
        <div className={`${innerSize} rounded-full ${avatarColors[config.color] || avatarColors.color_blue} flex items-center justify-center`}>
          {expressions[config.expression] || expressions.exp_smile}
        </div>
        {accessories[config.accessory]}
      </div>
    );
  };

  const categories = ['background', 'accessory', 'expression', 'color'];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Avatar Editor</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Customize your profile avatar</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview */}
          <Card className="lg:row-span-2">
            <CardHeader>
              <h2 className="text-lg font-semibold">Preview</h2>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="mb-6">
                {renderAvatar('lg')}
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-gray-900 dark:text-white">{user?.email?.split('@')[0]}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Level {userProgress.level}</p>
              </div>
              <Button onClick={handleSave} isLoading={isSaving} className="mt-6 w-full">
                <Save className="mr-2" size={18} />
                Save Avatar
              </Button>
            </CardContent>
          </Card>

          {/* Category Tabs */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="text-primary-600" size={20} />
                <h2 className="text-lg font-semibold">Customize</h2>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                      activeCategory === cat
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {categoryLabels[cat]}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-3">
                {items[activeCategory]?.map((item) => {
                  const isSelected = config[activeCategory as keyof AvatarConfig] === item.id;
                  const unlocked = isUnlocked(item.id);
                  const canUse = unlocked || canUnlock(item);

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(activeCategory, item.id)}
                      disabled={!canUse}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      } ${!canUse ? 'opacity-50' : ''}`}
                    >
                      <div className="text-center">
                        {item.category === 'background' && (
                          <div className={`w-8 h-8 rounded-full mx-auto mb-1 ${item.id.replace('bg_', 'bg-gradient-to-br from-')}`} style={{ background: item.id === 'bg_default' ? 'linear-gradient(to bottom right, #60a5fa, #4f46e5)' : item.id === 'bg_sunset' ? 'linear-gradient(to bottom right, #fb923c, #ec4899)' : item.id === 'bg_forest' ? 'linear-gradient(to bottom right, #4ade80, #059669)' : 'linear-gradient(to bottom right, #22d3ee, #2563eb)' }}></div>
                        )}
                        {item.category === 'color' && (
                          <div className={`w-8 h-8 rounded-full mx-auto mb-1 ${item.id.replace('color_', 'bg-')}`}></div>
                        )}
                        {item.category === 'expression' && (
                          <span className="text-2xl">{item.id === 'exp_smile' ? '😊' : item.id === 'exp_serious' ? '😐' : '🤩'}</span>
                        )}
                        {item.category === 'accessory' && (
                          <span className="text-2xl">{item.id === 'acc_none' ? '🚫' : item.id === 'acc_glasses' ? '👓' : item.id === 'acc_hat' ? '🎩' : '👑'}</span>
                        )}
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{item.name}</p>
                        {isSelected && <Check className="text-primary-500 mx-auto mt-1" size={14} />}
                        {!unlocked && canUse && <Star className="text-yellow-500 mx-auto mt-1" size={14} />}
                        {!canUse && <Lock className="text-gray-400 mx-auto mt-1" size={14} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Unlock Requirements */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <h2 className="text-lg font-semibold">How to Unlock</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="text-yellow-500" size={16} />
                  <span className="text-gray-600 dark:text-gray-400">Level up to unlock backgrounds</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <span className="text-gray-600 dark:text-gray-400">Maintain streaks for accessories</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="text-primary-500" size={16} />
                  <span className="text-gray-600 dark:text-gray-400">Earn achievements for exclusive items</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <span className="text-gray-600 dark:text-gray-400">Season pass for special rewards</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
