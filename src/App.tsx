import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { SearchModal } from './components/SearchModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { DesktopInstallModal } from './components/DesktopInstallModal';
import { DashboardView } from './views/DashboardView';
import { PhasesView } from './views/PhasesView';
import { LessonView } from './views/LessonView';
import { ReviewQueueView } from './views/ReviewQueueView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StorageWarningBanner } from './components/StorageWarningBanner';
import { roadmap, lessonsSummary } from './lib/curriculum-loader';
import { db, StudyDB } from './lib/db';
import { auth } from './lib/auth';
import { UserLessonRecord, SM2ReviewItem, UserProfile } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'phases' | 'lesson' | 'review'>('dashboard');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('phase-00');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isDesktopInstallOpen, setIsDesktopInstallOpen] = useState<boolean>(false);

  // Detect if running inside Electron desktop app — hide install guide banner when true
  const isElectron = navigator.userAgent.toLowerCase().includes('electron');

  // Multi-learner profile state
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => auth.getCurrentUser());

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  const [userLessons, setUserLessons] = useState<UserLessonRecord[]>([]);
  const [dueReviews, setDueReviews] = useState<SM2ReviewItem[]>([]);
  const [streakCount, setStreakCount] = useState<number>(0);

  // IDB availability — checked once on mount
  const [storageAvailable, setStorageAvailable] = useState<boolean>(true);
  const [storageWarningDismissed, setStorageWarningDismissed] = useState<boolean>(false);

  // Apply dark mode class to <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Check IndexedDB availability on mount
  useEffect(() => {
    StudyDB.isAvailable().then(available => {
      setStorageAvailable(available);
    });
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!storageAvailable) return;
    try {
      const lessons = await db.getAllLessons();
      const due = await db.getDueReviewItems();
      const streak = await db.calculateStreak();

      setUserLessons(lessons);
      setDueReviews(due);
      setStreakCount(streak.currentStreak);
    } catch (err) {
      console.error('Failed to sync IndexedDB data:', err);
    }
  }, [storageAvailable]);

  // Initial user sync
  useEffect(() => {
    db.switchUser(currentUser.id).then(() => {
      refreshUserData();
    });
  }, [currentUser.id, refreshUserData]);

  const handleUserChanged = useCallback(async (newUser: UserProfile) => {
    setCurrentUser(newUser);
    await db.switchUser(newUser.id);
    await refreshUserData();
  }, [refreshUserData]);

  // Hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash.startsWith('lesson-')) {
        const lessonId = hash.replace('lesson-', '');
        setSelectedLessonId(lessonId);
        setCurrentTab('lesson');
      } else if (hash.startsWith('phase-')) {
        setSelectedPhaseId(hash);
        setCurrentTab('phases');
      } else if (hash === 'phases') {
        setCurrentTab('phases');
      } else if (hash === 'review') {
        setCurrentTab('review');
      } else if (hash === 'dashboard' || !hash) {
        setCurrentTab('dashboard');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Ctrl+K / Cmd+K → open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsSettingsOpen(false);
        setIsAuthOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setCurrentTab('lesson');
    window.location.hash = `lesson-${lessonId}`;
  };

  const handleSelectPhase = (phaseId: string) => {
    setSelectedPhaseId(phaseId);
    setCurrentTab('phases');
    window.location.hash = `${phaseId}`;
  };

  const handleSelectTab = (tab: 'dashboard' | 'phases' | 'review') => {
    setCurrentTab(tab);
    window.location.hash = tab;
  };

  const completedLessonIds = new Set(
    userLessons.filter(l => l.status === 'completed').map(l => l.id)
  );

  return (
    <div className="min-h-screen bg-[#f5f2eb] dark:bg-[#1c1b1a] text-stone-900 dark:text-stone-100 font-sans flex flex-col transition-colors duration-200 selection:bg-amber-500/20 selection:text-amber-900 dark:selection:text-amber-100">
      
      {/* Storage unavailability warning */}
      {!storageAvailable && !storageWarningDismissed && (
        <StorageWarningBanner onDismiss={() => setStorageWarningDismissed(true)} />
      )}

      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        streakCount={streakCount}
        dueReviewCount={dueReviews.length}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(prev => !prev)}
      />

      <main className="flex-1" id="main-content">
        <ErrorBoundary context="Study Overview" key={`dashboard-${currentTab}-${currentUser.id}`}>
          {currentTab === 'dashboard' && (
            <DashboardView
              roadmap={roadmap}
              lessonsSummary={lessonsSummary}
              userLessons={userLessons}
              dueReviews={dueReviews}
              streakCount={streakCount}
              onSelectLesson={handleSelectLesson}
              onSelectPhase={handleSelectPhase}
              onOpenReview={() => handleSelectTab('review')}
              onOpenDesktopInstall={isElectron ? undefined : () => setIsDesktopInstallOpen(true)}
            />
          )}
        </ErrorBoundary>

        <ErrorBoundary context="Syllabus" key={`phases-${currentUser.id}`}>
          {currentTab === 'phases' && (
            <PhasesView
              roadmap={roadmap}
              lessonsSummary={lessonsSummary}
              userLessons={userLessons}
              initialSelectedPhaseId={selectedPhaseId}
              onSelectLesson={handleSelectLesson}
            />
          )}
        </ErrorBoundary>

        <ErrorBoundary context="Lesson Reader" key={`lesson-${selectedLessonId}-${currentUser.id}`}>
          {currentTab === 'lesson' && selectedLessonId && (
            <LessonView
              lessonId={selectedLessonId}
              onBackToPhases={() => handleSelectTab('phases')}
              onSelectLesson={handleSelectLesson}
              onProgressUpdated={refreshUserData}
            />
          )}
        </ErrorBoundary>

        <ErrorBoundary context="Spaced Review Deck" key={`review-${currentUser.id}`}>
          {currentTab === 'review' && (
            <ReviewQueueView
              onSelectLesson={handleSelectLesson}
              onReviewUpdated={refreshUserData}
            />
          )}
        </ErrorBoundary>
      </main>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectLesson={handleSelectLesson}
        completedLessonIds={completedLessonIds}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDataChanged={refreshUserData}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onUserChanged={handleUserChanged}
      />

      <DesktopInstallModal
        isOpen={isDesktopInstallOpen}
        onClose={() => setIsDesktopInstallOpen(false)}
      />
    </div>
  );
}

export default App;
