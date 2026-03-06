import React, { useEffect } from 'react';
import { X, Trophy } from 'lucide-react';
import { useAchievementStore } from '../../stores/achievementStore';
import { AchievementBadge } from './AchievementBadge';

interface AchievementToastProps {
  onClose: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ onClose }) => {
  const { newAchievements, clearNewAchievements } = useAchievementStore();
  
  useEffect(() => {
    if (newAchievements.length > 0) {
      const timer = setTimeout(() => {
        clearNewAchievements();
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [newAchievements, clearNewAchievements, onClose]);

  if (newAchievements.length === 0) return null;

  const latestAchievement = newAchievements[newAchievements.length - 1];

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-primary-300 dark:border-primary-700 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AchievementBadge
              id={latestAchievement.id}
              name={latestAchievement.name}
              description={latestAchievement.description}
              icon={latestAchievement.icon}
              category={latestAchievement.category}
              isUnlocked={true}
              size="md"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="text-yellow-500" size={16} />
              <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
                Achievement Unlocked!
              </span>
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">
              {latestAchievement.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {latestAchievement.description}
            </p>
            {latestAchievement.xpReward > 0 && (
              <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mt-2">
                +{latestAchievement.xpReward} XP
              </p>
            )}
          </div>
          
          <button
            onClick={() => {
              clearNewAchievements();
              onClose();
            }}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>
        
        {newAchievements.length > 1 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
            +{newAchievements.length - 1} more achievement{newAchievements.length > 2 ? 's' : ''} unlocked!
          </p>
        )}
      </div>
    </div>
  );
};
