/* eslint-disable @typescript-eslint/no-explicit-any */
import Dexie, { Table } from 'dexie';

export interface DBCard {
  id: string;
  deckId: string;
  japanese: string;
  hiragana: string;
  romaji?: string;
  english: string;
  exampleJapanese?: string;
  exampleEnglish?: string;
  jlptLevel: string;
  category: string;
}

export interface DBUserProgress {
  id?: number;
  cardId: string;
  masteryLevel: number;
  timesReviewed: number;
  correctCount: number;
  lastReviewed?: Date;
  nextReview?: Date;
}

export interface DBDeck {
  id: string;
  name: string;
  description?: string;
  jlptLevel: string;
  category: string;
  cardCount: number;
  isPremium: boolean;
}

export interface DBCachedQuiz {
  id: string;
  deckId: string;
  quizType: string;
  questions: any[];
  createdAt: Date;
}

export interface DBSyncQueueItem {
  id?: number;
  type: 'progress' | 'quiz' | 'game';
  action: 'create' | 'update';
  payload: any;
  timestamp: number;
  synced: boolean;
}

class FlashDB extends Dexie {
  cards!: Table<DBCard>;
  decks!: Table<DBDeck>;
  progress!: Table<DBUserProgress>;
  cachedQuizzes!: Table<DBCachedQuiz>;
  syncQueue!: Table<DBSyncQueueItem>;

  constructor() {
    super('NihongoFlashDB');
    
    this.version(1).stores({
      cards: 'id, deckId, jlptLevel, category',
      decks: 'id, jlptLevel, category',
      progress: '++id, cardId, masteryLevel',
      cachedQuizzes: 'id, deckId, quizType',
      syncQueue: '++id, type, synced, timestamp'
    });
  }
}

export const db = new FlashDB();

export const offlineDB = {
  async saveDecks(decks: DBDeck[]) {
    await db.decks.bulkPut(decks);
  },

  async getDecks(): Promise<DBDeck[]> {
    return await db.decks.toArray();
  },

  async saveCards(cards: DBCard[]) {
    await db.cards.bulkPut(cards);
  },

  async getCardsByDeck(deckId: string): Promise<DBCard[]> {
    return await db.cards.where('deckId').equals(deckId).toArray();
  },

  async getAllCards(): Promise<DBCard[]> {
    return await db.cards.toArray();
  },

  async saveProgress(progress: DBUserProgress) {
    const existing = await db.progress.where('cardId').equals(progress.cardId).first();
    if (existing) {
      await db.progress.update(existing.id!, progress);
    } else {
      await db.progress.add(progress);
    }
  },

  async getProgress(): Promise<DBUserProgress[]> {
    return await db.progress.toArray();
  },

  async getProgressByCard(cardId: string): Promise<DBUserProgress | undefined> {
    return await db.progress.where('cardId').equals(cardId).first();
  },

  async addToSyncQueue(item: Omit<DBSyncQueueItem, 'id' | 'synced'>) {
    await db.syncQueue.add({
      ...item,
      synced: false
    });
  },

  async getPendingSyncItems(): Promise<DBSyncQueueItem[]> {
    return await db.syncQueue.where('synced').equals(0).toArray();
  },

  async markSynced(id: number) {
    await db.syncQueue.update(id, { synced: true });
  },

  async clearSynced() {
    await db.syncQueue.where('synced').equals(1).delete();
  },

  async getDueCards(limit = 20): Promise<DBCard[]> {
    const now = new Date();
    const progress = await db.progress
      .filter(p => !p.nextReview || p.nextReview <= now)
      .limit(limit)
      .toArray();
    
    const cardIds = progress.map(p => p.cardId);
    if (cardIds.length === 0) {
      return await db.cards.limit(limit).toArray();
    }
    
    return await db.cards.where('id').anyOf(cardIds).toArray();
  }
};
