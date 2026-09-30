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

// Hands-on Real World Projects
export interface ProjectStage {
  id: string;
  title: string;
  summary: string;
  hours: number;
  difficulty: 'starter' | 'builder' | 'engineer' | 'systems' | 'frontier' | string;
  language: string;
  concepts: string[];
  markdown: string;
  starterFiles: CodeFile[];
  testFiles: CodeFile[];
}

export interface ProjectItem {
  id: string;
  title: string;
  level: number;
  levelName: string;
  tagline: string;
  summary: string;
  youWillBuild: string;
  usefulFor: string[];
  hours: number;
  languages: string[];
  languageWhy?: Record<string, string>;
  status: 'ready' | 'draft' | 'planned';
  skills: string[];
  prerequisites: { title: string; path: string }[];
  demo?: { command: string[]; cwd: string; [key: string]: any } | null;
  stages: ProjectStage[];
  stagesCount: number;
  readme: string;
  solutionFilesSummary?: { filename: string; language: string; sizeBytes: number }[];
}

export interface PlannedProject {
  id: string;
  title: string;
  level: number;
  status: string;
  track: string;
  languages: string[];
  tagline: string;
  summary: string;
  output: string;
  milestones?: string[];
}

export interface ProjectsBundle {
  generatedAt: string;
  totalProjects: number;
  levels: { level: number; name: string; summary: string }[];
  projects: ProjectItem[];
  planned: PlannedProject[];
}

export interface UserProjectRecord {
  id: string;             // matches ProjectItem.id
  status: 'not_started' | 'in_progress' | 'completed';
  completedStages: string[]; // stage IDs completed
  notes: string;
  repoUrl?: string;
  completedAt?: string;
  lastWorkedAt?: string;
}

// Certification Programs & Tracks
export interface CertificationDomain {
  id: string;
  name: string;
  weight: number;
  objectives: string[];
}

export interface CertificationTrack {
  id: string;
  slug: string;
  examCode: string;
  credential: string;
  shortName: string;
  level: string;
  accent?: string;
  badge?: { imageUrl: string; width: number; height: number; shape: string };
  summary: string;
  audience?: string;
  recommendedExperience?: string[];
  exam?: {
    items: number;
    timeLimitMinutes: number;
    feeUsd?: number;
    format: string;
    delivery: string;
    officialGuideUrl?: string;
    [key: string]: any;
  };
  domains: CertificationDomain[];
  lessons?: { path: string; domains: string[] }[];
}

export interface CertificationProgram {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  phaseId: string;
  provider: string;
  summary: string;
  promise: string;
  accessNotice?: string;
  disclaimer?: string;
  scoringNotice?: string;
  specVersion?: string;
  officialLinks: { label: string; url: string }[];
  tracks: CertificationTrack[];
  lessonsCount: number;
  lessons: {
    id: string;
    lessonNum: number;
    title: string;
    slug: string;
    estTime: string;
    domains: string[];
    hasQuiz: boolean;
    questionCount: number;
  }[];
}

export interface CertificationsBundle {
  generatedAt: string;
  programs: CertificationProgram[];
  totalCertificationLessons: number;
}

// Learning Paths & Career Routes
export interface LearningPathStage {
  id: string;
  title: string;
  outcome: string;
  artifact: string;
  lessons: { id?: string; title: string; estTime?: string; slug?: string; phaseId?: string; path?: string }[];
}

export interface LearningPath {
  id: string;
  kind: 'domain' | 'career-route' | string;
  title: string;
  workFamily?: string;
  commonTitles?: string[];
  summary: string;
  decisionPrompt?: string;
  mission?: string;
  responsibilities?: string[];
  goodFitIf?: string[];
  baseline?: string[];
  boundary?: string;
  portfolioProof?: { title: string; description: string; evidence: string[] } | null;
  readinessCriteria?: string[];
  coverage?: { strong?: string[]; partial?: string[]; outsideCourse?: string[] };
  estimatedMinutes?: number;
  stages: LearningPathStage[];
}

// Research Papers, Trends & Daily Briefing Types
export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  publishedDate: string;
  category: 'Foundations' | 'Transformers & LLMs' | 'Agents & MCP' | 'Inference & Systems' | 'Frontier Evals';
  phaseIds: string[];
  phaseTitles: string[];
  abstract: string;
  keyTakeaways: string[];
  arxivUrl?: string;
  pdfUrl?: string;
  codeUrl?: string;
  readingMinutes: number;
  isSeminal: boolean;
  aiAnalysis?: string;
}

export interface DailyReadingProgress {
  date: string;              // YYYY-MM-DD
  readPaperIds: string[];     // IDs of papers read today
  dailyGoal: number;          // Target papers to read (default 4)
  isCompleted: boolean;       // true if readPaperIds.length >= dailyGoal
  completedAt?: string;       // ISO timestamp
}

export interface AITrendItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  relatedPhase: string;
  source: string;
  date: string;
  engineeringTakeaway: string;
}

