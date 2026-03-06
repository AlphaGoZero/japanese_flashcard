export interface SRSCard {
  id: string;
  userId: string;
  cardId: string;
  masteryLevel: number;
  timesReviewed: number;
  correctCount: number;
  lastReviewed: Date | null;
  nextReview: Date | null;
  easeFactor: number;
  interval: number;
}

export interface SRSResult {
  masteryLevel: number;
  easeFactor: number;
  interval: number;
  nextReview: Date;
}

export const calculateSRS = (
  quality: number,
  currentEaseFactor: number = 2.5,
  currentInterval: number = 0,
  currentMasteryLevel: number = 0
): SRSResult => {
  let easeFactor = currentEaseFactor;
  let interval = currentInterval;
  let masteryLevel = currentMasteryLevel;

  if (quality < 3) {
    masteryLevel = Math.max(0, masteryLevel - 1);
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    masteryLevel = Math.min(10, masteryLevel + 1);
    
    if (currentInterval === 0) {
      interval = 1;
    } else if (currentInterval === 1) {
      interval = 6;
    } else {
      interval = Math.round(currentInterval * easeFactor);
    }
    
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(1.3, easeFactor);
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    masteryLevel,
    easeFactor,
    interval,
    nextReview,
  };
};

export const getMasteryLabel = (level: number): string => {
  if (level === 0) return 'New';
  if (level <= 2) return 'Learning';
  if (level <= 4) return 'Reviewing';
  if (level <= 6) return 'Familiar';
  if (level <= 8) return 'Confident';
  return 'Mastered';
};

export const getMasteryColor = (level: number): string => {
  if (level === 0) return 'text-gray-500';
  if (level <= 2) return 'text-yellow-500';
  if (level <= 4) return 'text-orange-500';
  if (level <= 6) return 'text-blue-500';
  if (level <= 8) return 'text-green-500';
  return 'text-purple-500';
};

export const isDueForReview = (nextReview: Date | null): boolean => {
  if (!nextReview) return true;
  return new Date() >= new Date(nextReview);
};

export const getDueCards = <T extends { nextReview: Date | null }>(cards: T[]): T[] => {
  return cards.filter(card => isDueForReview(card.nextReview));
};

export const getNewCards = <T extends { timesReviewed: number }>(cards: T[]): T[] => {
  return cards.filter(card => card.timesReviewed === 0);
};

export const getMasteredCards = <T extends { masteryLevel: number }>(cards: T[], threshold: number = 8): T[] => {
  return cards.filter(card => card.masteryLevel >= threshold);
};
