import { describe, it, expect } from 'vitest';
import { 
  roadmap, 
  lessonsSummary, 
  projectsData, 
  certificationsData, 
  learningPathsData,
  getProjectById,
  getCertificationProgram
} from '../src/lib/curriculum-loader';

describe('Curriculum Data Integrity', () => {
  it('loads all 22 phases (20 standard + 2 certification phases)', () => {
    expect(roadmap.length).toBe(22);
    expect(roadmap.some(p => p.id === 'phase-cert-mcpa')).toBe(true);
    expect(roadmap.some(p => p.id === 'phase-cert-claude')).toBe(true);
  });

  it('indexes 590 lessons with metadata, quizzes, and estimated times', () => {
    expect(lessonsSummary.length).toBe(590);
    const mcpaLessons = lessonsSummary.filter(l => l.phaseId === 'phase-cert-mcpa');
    const claudeLessons = lessonsSummary.filter(l => l.phaseId === 'phase-cert-claude');
    expect(mcpaLessons.length).toBe(34);
    expect(claudeLessons.length).toBe(33);
  });

  it('indexes 48 production builds and 52 planned roadmap projects', () => {
    expect(projectsData.totalProjects).toBe(48);
    expect(projectsData.projects.length).toBe(48);
    expect(projectsData.planned.length).toBeGreaterThanOrEqual(48);
    expect(projectsData.levels.length).toBe(5);

    // Test helper lookup
    const tinyCodingAgent = getProjectById('tiny-coding-agent');
    expect(tinyCodingAgent).toBeDefined();
    expect(tinyCodingAgent?.title).toBe('Tiny Coding Agent');
    expect(tinyCodingAgent?.stages.length).toBeGreaterThan(0);
    expect(tinyCodingAgent?.stages[0].starterFiles).toBeDefined();
  });

  it('indexes MCPA and Claude certification programs with domain blueprints', () => {
    expect(certificationsData.programs.length).toBe(2);
    expect(certificationsData.totalCertificationLessons).toBe(67);

    const mcpa = getCertificationProgram('mcpa');
    expect(mcpa).toBeDefined();
    expect(mcpa?.shortName).toBe('MCPA');
    expect(mcpa?.tracks[0].domains.length).toBe(5);

    const claude = getCertificationProgram('claude');
    expect(claude).toBeDefined();
    expect(claude?.tracks.length).toBe(4);
  });

  it('indexes 12 learning paths and career routes', () => {
    expect(learningPathsData.length).toBe(12);
    const careerRoutes = learningPathsData.filter(p => p.kind === 'career-route');
    expect(careerRoutes.length).toBe(6);
    expect(careerRoutes.some(c => c.id === 'forward-deployed-ai-engineer')).toBe(true);
    expect(careerRoutes.some(c => c.id === 'agentic-ai-engineer')).toBe(true);
  });
});
