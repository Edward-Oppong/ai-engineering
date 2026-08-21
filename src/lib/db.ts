import { 
  UserLessonRecord, 
  UserQuizAttempt, 
  SM2ReviewItem, 
  UserActivityLog, 
  LessonStatus,
  UserDataBackup,
  UserReadingPreferences
} from '../types';

const DB_VERSION = 2;

export class StudyDB {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private currentUserId: string = 'default';

  constructor(userId?: string) {
    if (userId) {
      this.currentUserId = userId;
    } else {
      try {
        const active = localStorage.getItem('ai_eng_active_user_id');
        if (active) this.currentUserId = active;
      } catch {
        this.currentUserId = 'default';
      }
    }
  }

  /**
   * Switch the active user database context.
   * Closes any existing connection so that subsequent queries hit the newly selected user's database.
   */
  public async switchUser(userId: string): Promise<void> {
    if (this.currentUserId === userId && this.dbPromise) {
      return;
    }

    if (this.dbPromise) {
      try {
        const conn = await this.dbPromise;
        conn.close();
      } catch {
        // Connection already closed or unavailable
      }
    }
    this.dbPromise = null;
    this.currentUserId = userId;
  }

  public getUserId(): string {
    return this.currentUserId;
  }

  private getDBName(): string {
    return this.currentUserId === 'default'
      ? 'ai_engineering_study_db'
      : `ai_engineering_study_db_${this.currentUserId}`;
  }

  private getBookmarksKey(): string {
    return this.currentUserId === 'default'
      ? 'ai_eng_bookmarks'
      : `ai_eng_bookmarks_${this.currentUserId}`;
  }

  private getReadingPrefsKey(): string {
    return this.currentUserId === 'default'
      ? 'ai_eng_reading_prefs'
      : `ai_eng_reading_prefs_${this.currentUserId}`;
  }

  /**
   * Test whether IndexedDB is available in this browser context.
   * Returns false in Safari Private mode, Firefox strict containers, or when
   * storage is blocked by browser policy or quota exceeded.
   */
  static async isAvailable(): Promise<boolean> {
    return new Promise(resolve => {
      try {
        const testName = '__idb_test__';
        const req = indexedDB.open(testName, 1);
        req.onsuccess = () => {
          req.result.close();
          indexedDB.deleteDatabase(testName);
          resolve(true);
        };
        req.onerror = () => resolve(false);
        req.onblocked = () => resolve(false);
        setTimeout(() => resolve(false), 3000);
      } catch {
        resolve(false);
      }
    });
  }

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const dbName = this.getDBName();
      const request = indexedDB.open(dbName, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;

        // 1. Lessons store
        if (!db.objectStoreNames.contains('lessons')) {
          const lessonStore = db.createObjectStore('lessons', { keyPath: 'id' });
          lessonStore.createIndex('phaseId', 'phaseId', { unique: false });
          lessonStore.createIndex('status', 'status', { unique: false });
          lessonStore.createIndex('completedAt', 'completedAt', { unique: false });
        }

        // 2. Quiz attempts store
        if (!db.objectStoreNames.contains('quizAttempts')) {
          const quizStore = db.createObjectStore('quizAttempts', { keyPath: 'id' });
          quizStore.createIndex('lessonId', 'lessonId', { unique: false });
          quizStore.createIndex('answeredAt', 'answeredAt', { unique: false });
        }

        // 3. Spaced Repetition Review Queue
        if (!db.objectStoreNames.contains('reviewQueue')) {
          const reviewStore = db.createObjectStore('reviewQueue', { keyPath: 'id' });
          reviewStore.createIndex('dueDate', 'dueDate', { unique: false });
          reviewStore.createIndex('lessonId', 'lessonId', { unique: false });
          reviewStore.createIndex('questionId', 'questionId', { unique: false });
        }

        // 4. Activity Log (for streaks & study sessions)
        if (!db.objectStoreNames.contains('activityLog')) {
          db.createObjectStore('activityLog', { keyPath: 'date' });
        }

        // 5. Bookmarks store (added in v2)
        if (!db.objectStoreNames.contains('bookmarks')) {
          db.createObjectStore('bookmarks', { keyPath: 'lessonId' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // --- Lessons Store Operations ---

  async getLesson(id: string): Promise<UserLessonRecord | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('lessons', 'readonly');
      const store = tx.objectStore('lessons');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async getAllLessons(): Promise<UserLessonRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('lessons', 'readonly');
      const store = tx.objectStore('lessons');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getLessonsByPhase(phaseId: string): Promise<UserLessonRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('lessons', 'readonly');
      const store = tx.objectStore('lessons');
      const index = store.index('phaseId');
      const req = index.getAll(phaseId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async setLessonStatus(
    lesson: { id: string; phaseId: string; title: string; slug: string },
    status: LessonStatus
  ): Promise<UserLessonRecord> {
    const db = await this.getDB();
    const existing = (await this.getLesson(lesson.id)) || {
      id: lesson.id,
      phaseId: lesson.phaseId,
      title: lesson.title,
      slug: lesson.slug,
      status: 'not_started',
      notes: '',
    };

    const updated: UserLessonRecord = {
      ...existing,
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : (status === 'not_started' ? undefined : existing.completedAt),
      lastViewedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['lessons', 'activityLog'], 'readwrite');
      const store = tx.objectStore('lessons');
      const putReq = store.put(updated);

      if (status === 'completed' && existing.status !== 'completed') {
        this.recordActivitySync(tx);
      }

      putReq.onsuccess = () => resolve(updated);
      putReq.onerror = () => reject(putReq.error);
    });
  }

  async markLessonViewed(
    lesson: { id: string; phaseId: string; title: string; slug: string }
  ): Promise<UserLessonRecord> {
    const db = await this.getDB();
    const existing = (await this.getLesson(lesson.id)) || {
      id: lesson.id,
      phaseId: lesson.phaseId,
      title: lesson.title,
      slug: lesson.slug,
      status: 'in_progress',
      notes: '',
    };

    const updated: UserLessonRecord = {
      ...existing,
      status: existing.status === 'not_started' ? 'in_progress' : existing.status,
      lastViewedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('lessons', 'readwrite');
      const store = tx.objectStore('lessons');
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve(updated);
      putReq.onerror = () => reject(putReq.error);
    });
  }

  async updateLessonNotes(
    lesson: { id: string; phaseId: string; title: string; slug: string },
    notes: string
  ): Promise<UserLessonRecord> {
    const db = await this.getDB();
    const existing = (await this.getLesson(lesson.id)) || {
      id: lesson.id,
      phaseId: lesson.phaseId,
      title: lesson.title,
      slug: lesson.slug,
      status: 'in_progress',
      notes: '',
    };

    const updated: UserLessonRecord = {
      ...existing,
      notes,
      lastViewedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('lessons', 'readwrite');
      const store = tx.objectStore('lessons');
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve(updated);
      putReq.onerror = () => reject(putReq.error);
    });
  }

  async saveNotes(lessonId: string, notes: string): Promise<void> {
    const db = await this.getDB();
    const existing = await this.getLesson(lessonId);
    if (!existing) return;

    existing.notes = notes;
    existing.lastViewedAt = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('lessons', 'readwrite');
      const store = tx.objectStore('lessons');
      const req = store.put(existing);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async updateTimeSpent(lessonId: string, secondsDelta: number): Promise<void> {
    const db = await this.getDB();
    const existing = await this.getLesson(lessonId);
    if (!existing) return;

    existing.timeSpentSeconds = (existing.timeSpentSeconds || 0) + secondsDelta;
    existing.lastViewedAt = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('lessons', 'readwrite');
      const store = tx.objectStore('lessons');
      const req = store.put(existing);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Quiz Store Operations ---

  async saveQuizAttempt(attempt: Omit<UserQuizAttempt, 'id'>): Promise<UserQuizAttempt> {
    const db = await this.getDB();
    const fullAttempt: UserQuizAttempt = {
      ...attempt,
      id: `${attempt.lessonId}-${Date.now()}`,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['quizAttempts', 'activityLog'], 'readwrite');
      const store = tx.objectStore('quizAttempts');
      const req = store.put(fullAttempt);

      this.recordActivitySync(tx);

      req.onsuccess = () => resolve(fullAttempt);
      req.onerror = () => reject(req.error);
    });
  }

  async getQuizAttempts(lessonId?: string): Promise<UserQuizAttempt[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('quizAttempts', 'readonly');
      const store = tx.objectStore('quizAttempts');

      if (lessonId) {
        const index = store.index('lessonId');
        const req = index.getAll(lessonId);
        req.onsuccess = () => {
          const results = (req.result || []) as UserQuizAttempt[];
          resolve(results.sort((a, b) => new Date(b.answeredAt).getTime() - new Date(a.answeredAt).getTime()));
        };
        req.onerror = () => reject(req.error);
      } else {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      }
    });
  }

  // --- Spaced Repetition (SM-2) Queue Operations ---

  async getReviewItem(id: string): Promise<SM2ReviewItem | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reviewQueue', 'readonly');
      const store = tx.objectStore('reviewQueue');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async saveReviewItem(item: SM2ReviewItem): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reviewQueue', 'readwrite');
      const store = tx.objectStore('reviewQueue');
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async saveReviewItems(items: SM2ReviewItem[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reviewQueue', 'readwrite');
      const store = tx.objectStore('reviewQueue');
      for (const item of items) {
        store.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAllReviewItems(): Promise<SM2ReviewItem[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reviewQueue', 'readonly');
      const store = tx.objectStore('reviewQueue');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getDueReviewItems(): Promise<SM2ReviewItem[]> {
    const db = await this.getDB();
    const today = new Date().toISOString().slice(0, 10);

    return new Promise((resolve, reject) => {
      const tx = db.transaction('reviewQueue', 'readonly');
      const store = tx.objectStore('reviewQueue');
      const req = store.getAll();
      req.onsuccess = () => {
        const all = req.result || [];
        const due = all.filter(item => item.dueDate <= today);
        resolve(due.sort((a, b) => a.dueDate.localeCompare(b.dueDate)));
      };
      req.onerror = () => reject(req.error);
    });
  }

  async removeReviewItem(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reviewQueue', 'readwrite');
      const store = tx.objectStore('reviewQueue');
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Bookmark Operations ---

  async getBookmarks(): Promise<string[]> {
    const localKey = this.getBookmarksKey();
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        if (!db.objectStoreNames.contains('bookmarks')) {
          const local = localStorage.getItem(localKey);
          resolve(local ? JSON.parse(local) : []);
          return;
        }
        const tx = db.transaction('bookmarks', 'readonly');
        const store = tx.objectStore('bookmarks');
        const req = store.getAll();
        req.onsuccess = () => {
          const items = (req.result || []) as { lessonId: string }[];
          resolve(items.map(i => i.lessonId));
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      const local = localStorage.getItem(localKey);
      return local ? JSON.parse(local) : [];
    }
  }

  async toggleBookmark(lessonId: string): Promise<boolean> {
    const currentBookmarks = await this.getBookmarks();
    const isCurrentlyBookmarked = currentBookmarks.includes(lessonId);
    const updated = isCurrentlyBookmarked
      ? currentBookmarks.filter(id => id !== lessonId)
      : [...currentBookmarks, lessonId];

    try {
      const db = await this.getDB();
      if (db.objectStoreNames.contains('bookmarks')) {
        const tx = db.transaction('bookmarks', 'readwrite');
        const store = tx.objectStore('bookmarks');
        if (isCurrentlyBookmarked) {
          store.delete(lessonId);
        } else {
          store.put({ lessonId, createdAt: new Date().toISOString() });
        }
      }
    } catch {
      // Fallback
    }

    localStorage.setItem(this.getBookmarksKey(), JSON.stringify(updated));
    return !isCurrentlyBookmarked;
  }

  // --- Activity & Streak Operations ---

  private recordActivitySync(tx: IDBTransaction) {
    const today = new Date().toISOString().slice(0, 10);
    const store = tx.objectStore('activityLog');
    const req = store.get(today);
    req.onsuccess = () => {
      const current = (req.result as UserActivityLog) || { date: today, count: 0 };
      store.put({ date: today, count: current.count + 1 });
    };
  }

  async getActivityLogs(): Promise<UserActivityLog[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('activityLog', 'readonly');
      const store = tx.objectStore('activityLog');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async calculateStreak(): Promise<{ currentStreak: number; longestStreak: number; lastActiveDate: string | null }> {
    const logs = await this.getActivityLogs();
    if (!logs.length) {
      return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
    }

    const activeDates = new Set(logs.filter(l => l.count > 0).map(l => l.date));
    const sortedDates = Array.from(activeDates).sort().reverse();
    
    if (sortedDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
    }

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    let currentStreak = 0;
    let checkDate = new Date();
    
    if (!activeDates.has(today)) {
      if (activeDates.has(yesterday)) {
        checkDate = new Date(Date.now() - 86400000);
      } else {
        return { currentStreak: 0, longestStreak: 1, lastActiveDate: sortedDates[0] };
      }
    }

    while (true) {
      const dStr = checkDate.toISOString().slice(0, 10);
      if (activeDates.has(dStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      currentStreak,
      longestStreak: Math.max(currentStreak, sortedDates.length),
      lastActiveDate: sortedDates[0]
    };
  }

  // --- Export & Import Operations ---

  async exportAllUserData(): Promise<UserDataBackup> {
    const lessons = await this.getAllLessons();
    const quizAttempts = await this.getQuizAttempts();
    const reviewQueue = await this.getAllReviewItems();
    const activityLog = await this.getActivityLogs();
    const bookmarks = await this.getBookmarks();

    let readingPreferences: UserReadingPreferences | undefined = undefined;
    try {
      const storedPref = localStorage.getItem(this.getReadingPrefsKey());
      if (storedPref) readingPreferences = JSON.parse(storedPref);
    } catch {
      // Ignore
    }

    return {
      version: 1,
      appName: 'ai-engineering-study-companion',
      exportedAt: new Date().toISOString(),
      data: {
        lessons,
        quizAttempts,
        reviewQueue,
        activityLog,
        bookmarks,
        readingPreferences
      }
    };
  }

  async importUserData(backup: UserDataBackup, mode: 'merge' | 'replace' = 'merge'): Promise<{ importedLessons: number; importedReviews: number }> {
    if (!backup || !backup.data) {
      throw new Error('Invalid backup file format.');
    }

    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['lessons', 'quizAttempts', 'reviewQueue', 'activityLog'], 'readwrite');

      if (mode === 'replace') {
        tx.objectStore('lessons').clear();
        tx.objectStore('quizAttempts').clear();
        tx.objectStore('reviewQueue').clear();
        tx.objectStore('activityLog').clear();
      }

      const lessonStore = tx.objectStore('lessons');
      for (const lesson of backup.data.lessons || []) {
        lessonStore.put(lesson);
      }

      const quizStore = tx.objectStore('quizAttempts');
      for (const attempt of backup.data.quizAttempts || []) {
        quizStore.put(attempt);
      }

      const reviewStore = tx.objectStore('reviewQueue');
      for (const item of backup.data.reviewQueue || []) {
        reviewStore.put(item);
      }

      const activityStore = tx.objectStore('activityLog');
      for (const log of backup.data.activityLog || []) {
        activityStore.put(log);
      }

      if (backup.data.bookmarks) {
        localStorage.setItem(this.getBookmarksKey(), JSON.stringify(backup.data.bookmarks));
      }
      if (backup.data.readingPreferences) {
        localStorage.setItem(this.getReadingPrefsKey(), JSON.stringify(backup.data.readingPreferences));
      }

      tx.oncomplete = () => {
        resolve({
          importedLessons: (backup.data.lessons || []).length,
          importedReviews: (backup.data.reviewQueue || []).length
        });
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Storage Stats & Reset ---

  async getStorageStats(): Promise<{ lessonCount: number; quizCount: number; reviewCount: number; activityDays: number; bookmarkCount: number }> {
    const lessons = await this.getAllLessons();
    const quizAttempts = await this.getQuizAttempts();
    const reviewQueue = await this.getAllReviewItems();
    const activityLog = await this.getActivityLogs();
    const bookmarks = await this.getBookmarks();

    return {
      lessonCount: lessons.length,
      quizCount: quizAttempts.length,
      reviewCount: reviewQueue.length,
      activityDays: activityLog.filter(l => l.count > 0).length,
      bookmarkCount: bookmarks.length
    };
  }

  async resetAllData(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['lessons', 'quizAttempts', 'reviewQueue', 'activityLog'], 'readwrite');
      tx.objectStore('lessons').clear();
      tx.objectStore('quizAttempts').clear();
      tx.objectStore('reviewQueue').clear();
      tx.objectStore('activityLog').clear();

      localStorage.removeItem(this.getBookmarksKey());
      localStorage.removeItem(this.getReadingPrefsKey());

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteUserData(userId: string): Promise<void> {
    if (this.currentUserId === userId && this.dbPromise) {
      const conn = await this.dbPromise;
      conn.close();
      this.dbPromise = null;
    }

    const dbName = userId === 'default' ? 'ai_engineering_study_db' : `ai_engineering_study_db_${userId}`;
    const bookmarksKey = userId === 'default' ? 'ai_eng_bookmarks' : `ai_eng_bookmarks_${userId}`;
    const readingPrefsKey = userId === 'default' ? 'ai_eng_reading_prefs' : `ai_eng_reading_prefs_${userId}`;

    localStorage.removeItem(bookmarksKey);
    localStorage.removeItem(readingPrefsKey);

    return new Promise((resolve) => {
      const req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  }
}

export const db = new StudyDB();
