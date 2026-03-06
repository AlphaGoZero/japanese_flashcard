import React from 'react';
import { 
  Footprints, BookOpen, GraduationCap, 
  Star, Stars, Trophy, Crown, Flame, Zap, 
  CheckCircle, ClipboardList, Award, Gamepad2, 
  Crosshair, Target, Moon, Sunrise, TrendingUp, 
  ChevronUp, Layers, Lock, Trophy as TrophyIcon,
  Hash
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface AchievementBadgeProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  progress?: number;
  requirementValue?: number;
  isUnlocked: boolean;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const iconMap: Record<string, React.ElementType> = {
  'footprints': Footprints,
  'hundred': Hash,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  'star': Star,
  'stars': Stars,
  'trophy': Trophy,
  'crown': Crown,
  'flame': Flame,
  'zap': Zap,
  'check-circle': CheckCircle,
  'clipboard-list': ClipboardList,
  'award': Award,
  'gamepad-2': Gamepad2,
  'crosshair': Crosshair,
  'target': Target,
  'moon': Moon,
  'sunrise': Sunrise,
  'trending-up': TrendingUp,
  'chevrons-up': ChevronUp,
  'layers': Layers,
};

const categoryColors: Record<string, string> = {
  milestone: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
  mastery: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400',
  streak: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
  quiz: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
  game: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
  special: 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-400',
  level: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400',
  exploration: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-400',
};

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  name,
  description,
  icon,
  category,
  progress = 0,
  requirementValue = 0,
  isUnlocked,
  showProgress = false,
  size = 'md',
}) => {
  const Icon = iconMap[icon] || TrophyIcon;
  const progressPercentage = requirementValue > 0 ? Math.min((progress / requirementValue) * 100, 100) : 0;
  const categoryColor = categoryColors[category] || 'bg-gray-100 text-gray-600';

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const iconSizes = {
    sm: 20,
    md: 28,
    lg: 40,
  };

  return (
    <div className={cn('flex flex-col items-center text-center', !isUnlocked && 'opacity-60')}>
      <div className={cn(
        'relative rounded-full flex items-center justify-center',
        sizeClasses[size],
        isUnlocked ? categoryColor : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
      )}>
        {isUnlocked ? (
          <Icon size={iconSizes[size]} />
        ) : (
          <Lock size={iconSizes[size] * 0.6} />
        )}
        
        {showProgress && !isUnlocked && requirementValue > 0 && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              {Math.round(progressPercentage)}%
            </span>
          </div>
        )}
      </div>
      
      <h3 className={cn(
        'mt-2 font-semibold',
        size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base',
        isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
      )}>
        {name}
      </h3>
      
      {showProgress && !isUnlocked && requirementValue > 0 && (
        <div className="mt-1 w-full">
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {progress} / {requirementValue}
          </p>
        </div>
      )}
      
      {size === 'lg' && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
          {description}
        </p>
      )}
    </div>
  );
};
