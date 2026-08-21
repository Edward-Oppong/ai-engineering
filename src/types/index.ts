// Types for the AI Engineering Curriculum Study Companion

export interface PhaseMetadata {
  id: string;             // e.g. "phase-00"
  number: number;         // e.g. 0
  slug: string;           // e.g. "setup-and-tooling"
  title: string;          // e.g. "Setup & Tooling"
  estTime: string;        // e.g. "~14 hours"
  statusGlyph: string;    // "✅" | "🚧" | "⬚"
  lessonsCount: number;
  folderName: string;
}

export interface LessonSummary {
  id: string;             // e.g. "phase-00-lesson-01"
  phaseId: string;        // "phase-00"
  phaseNum: number;
  phaseTitle: string;
  lessonNum: number;
  title: string;
  slug: string;
  estTime: string;
  motto: string;
  type: string;
  languages: string[];
  prerequisites: string;
  hasQuiz: boolean;
  questionCount: number;
  codeFilesCount: number;
  tags: string[];
}

export interface CodeFile {
  filename: string;
  language: string;
  content: string;
  sizeBytes: number;
}

export interface QuizQuestion {
  id?: string;
  stage?: 'pre' | 'post';
  question: string;
  options: string[];
  correct: number;       // index of correct option
  explanation: string;
}

export interface QuizData {
  questions: QuizQuestion[];
}

export interface LessonDetail extends LessonSummary {
  markdown: string;
  beats: {
    heading: string;
    anchor: string;
  }[];
  codeFiles: CodeFile[];
  quiz: QuizData | null;
}

export interface PhaseChunk {
  phase: PhaseMetadata;
  lessons: LessonDetail[];
}

// User Persistence Models (IndexedDB)
export type LessonStatus = 'not_started' | 'in_progress' | 'completed';

export interface UserLessonRecord {
  id: string;             // matches LessonSummary.id
  phaseId: string;
  title: string;
  slug: string;
  status: LessonStatus;
  notes: string;
  completedAt?: string;   // ISO timestamp
  lastViewedAt?: string;  // ISO timestamp
  timeSpentSeconds?: number;
}

export interface UserQuizAttempt {
  id: string;             // UUID or timestamp
  lessonId: string;
  phaseId: string;
  score: number;          // percentage 0 - 100
  totalQuestions: number;
  correctCount: number;
  answeredAt: string;     // ISO timestamp
  wrongQuestionIds: number[]; // question indexes
  answers: {
    questionIndex: number;
    selectedOption: number;
    isCorrect: boolean;
  }[];
}

export interface SM2ReviewItem {
  id: string;             // unique key e.g. "lessonId:questionIndex"
  questionId: string;
  lessonId: string;
  phaseId: string;
  lessonTitle: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  
  // SM-2 parameters
  repetitions: number;    // n consecutive correct responses
  interval: number;       // interval in days
  easeFactor: number;     // EF (starts at 2.5)
  dueDate: string;        // ISO date string (YYYY-MM-DD)
  lastReviewedAt?: string;// ISO timestamp
  lastQualityRating?: number; // 0-5
}

export interface UserActivityLog {
  date: string;           // YYYY-MM-DD
  count: number;          // lessons completed or reviews done
}

export type ReadingFontSize = 'sm' | 'base' | 'lg' | 'xl';
export type ReadingFontFamily = 'serif' | 'sans';
export type ReadingColumnWidth = 'focused' | 'standard' | 'wide';

export interface UserReadingPreferences {
  fontSize: ReadingFontSize;
  fontFamily: ReadingFontFamily;
  columnWidth: ReadingColumnWidth;
  focusMode: boolean;
}

export interface UserDataBackup {
  version: number;
  exportedAt: string;
  appName: string;
  data: {
    lessons: UserLessonRecord[];
    quizAttempts: UserQuizAttempt[];
    reviewQueue: SM2ReviewItem[];
    activityLog: UserActivityLog[];
    bookmarks: string[];
    readingPreferences?: UserReadingPreferences;
  };
}

export interface PythonExecutionResult {
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  error: string | null;
}

// User Profiles & Authentication (for online/multi-user progress isolation)
export interface UserProfile {
  id: string;              // unique user id, e.g. "usr_12345" or "default"
  name: string;            // display name, e.g. "Edward"
  username: string;        // unique handle, e.g. "edward"
  email?: string;          // optional email for identification
  avatarColor: string;     // color identifier for avatar badge
  avatarIcon?: string;     // optional icon identifier
  pinHash?: string;        // optional hashed PIN / password for profile security
  createdAt: string;       // ISO timestamp
  lastLoginAt: string;     // ISO timestamp
  isDefault?: boolean;     // true for initial default profile
}

export interface AuthSession {
  currentUser: UserProfile;
  availableUsers: UserProfile[];
}

