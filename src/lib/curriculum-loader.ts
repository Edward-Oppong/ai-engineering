import { 
  PhaseChunk, 
  LessonDetail, 
  PhaseMetadata, 
  LessonSummary,
  ProjectsBundle,
  CertificationsBundle,
  LearningPath,
  ProjectItem,
  CertificationProgram
} from '../types';
import roadmapData from '../data/roadmap.json';
import lessonsSummaryData from '../data/lessons-summary.json';
import projectsBundleData from '../data/projects.json';
import certsBundleData from '../data/certifications.json';
import learningPathsBundleData from '../data/learning-paths.json';

// In-memory cache for loaded phase chunks
const phaseCache = new Map<string, PhaseChunk>();

// Vite glob import for lazy chunk loading
const phaseModules = import.meta.glob('../data/phases/*.json');

export const roadmap: PhaseMetadata[] = roadmapData as PhaseMetadata[];
export const lessonsSummary: LessonSummary[] = lessonsSummaryData as LessonSummary[];
export const projectsData: ProjectsBundle = projectsBundleData as unknown as ProjectsBundle;
export const certificationsData: CertificationsBundle = certsBundleData as unknown as CertificationsBundle;
export const learningPathsData: LearningPath[] = learningPathsBundleData as unknown as LearningPath[];

export function getProjectById(projectId: string): ProjectItem | undefined {
  return projectsData.projects.find(p => p.id === projectId);
}

export function getCertificationProgram(slug: string): CertificationProgram | undefined {
  return certificationsData.programs.find(p => p.slug === slug);
}

/**
 * Load a full phase chunk with lazy evaluation and memory caching
 */
export async function loadPhaseChunk(phaseId: string): Promise<PhaseChunk | null> {
  if (phaseCache.has(phaseId)) {
    return phaseCache.get(phaseId)!;
  }

  const modulePath = `../data/phases/${phaseId}.json`;
  const loader = phaseModules[modulePath];

  if (!loader) {
    console.error(`Phase chunk not found for id: ${phaseId}`);
    return null;
  }

  try {
    const rawModule = (await loader()) as { default?: PhaseChunk } | PhaseChunk;
    const chunk = ('default' in rawModule ? rawModule.default : rawModule) as PhaseChunk;
    phaseCache.set(phaseId, chunk);
    return chunk;
  } catch (err) {
    console.error(`Error loading phase chunk ${phaseId}:`, err);
    return null;
  }
}

/**
 * Load a specific lesson detail by lesson ID
 */
export async function loadLessonDetail(lessonId: string): Promise<{ lesson: LessonDetail; phase: PhaseMetadata } | null> {
  const summary = lessonsSummary.find(l => l.id === lessonId);
  if (!summary) return null;

  const phaseChunk = await loadPhaseChunk(summary.phaseId);
  if (!phaseChunk) return null;

  const lesson = phaseChunk.lessons.find(l => l.id === lessonId);
  if (!lesson) return null;

  return {
    lesson,
    phase: phaseChunk.phase
  };
}

/**
 * Get the next and previous lesson summaries
 */
export function getAdjacentLessons(lessonId: string): { prev: LessonSummary | null; next: LessonSummary | null } {
  const currentIndex = lessonsSummary.findIndex(l => l.id === lessonId);
  if (currentIndex === -1) return { prev: null, next: null };

  const prev = currentIndex > 0 ? lessonsSummary[currentIndex - 1] : null;
  const next = currentIndex < lessonsSummary.length - 1 ? lessonsSummary[currentIndex + 1] : null;

  return { prev, next };
}
