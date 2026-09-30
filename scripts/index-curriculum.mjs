import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const curriculumDir = process.env.CURRICULUM_PATH 
  ? path.resolve(rootDir, process.env.CURRICULUM_PATH)
  : path.resolve(rootDir, 'curriculum');

const outDataDir = path.resolve(rootDir, 'src', 'data');
const outPhasesDir = path.resolve(outDataDir, 'phases');

if (!fs.existsSync(outDataDir)) {
  fs.mkdirSync(outDataDir, { recursive: true });
}
if (!fs.existsSync(outPhasesDir)) {
  fs.mkdirSync(outPhasesDir, { recursive: true });
}

console.log(`[Indexer] Reading curriculum from: ${curriculumDir}`);

const existingRoadmapPath = path.join(outDataDir, 'roadmap.json');
const hasExistingData = fs.existsSync(existingRoadmapPath) && fs.statSync(existingRoadmapPath).size > 100;

if (!fs.existsSync(curriculumDir)) {
  if (hasExistingData) {
    console.warn(`[Indexer] Warning: Curriculum directory not found at ${curriculumDir}. Preserving existing src/data/ bundle.`);
    process.exit(0);
  }
  console.error(`[Indexer Error] Curriculum directory not found at ${curriculumDir}`);
  process.exit(1);
}

// 1. Parse ROADMAP.md
const roadmapPath = path.join(curriculumDir, 'ROADMAP.md');
let roadmapPhases = [];
if (fs.existsSync(roadmapPath)) {
  const roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');
  roadmapPhases = parseRoadmap(roadmapContent);
} else {
  console.warn(`[Indexer] Warning: ROADMAP.md not found at ${roadmapPath}`);
}

function parseRoadmap(content) {
  const phases = [];
  const lines = content.split('\n');
  let currentPhase = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Match: ## Phase 0: Setup & Tooling — ✅ (~14 hours) or ## Phase 10: LLMs from Scratch — 🚧 (~38 hours)
    const phaseMatch = line.match(/^##\s+Phase\s+(\d+)[:\s]+(.*?)(?:—|-)\s*([✅🚧⬚])\s*(?:\((.*?)\))?$/);
    if (phaseMatch) {
      const phaseNum = parseInt(phaseMatch[1], 10);
      const title = phaseMatch[2].trim();
      const statusGlyph = phaseMatch[3];
      const estTime = phaseMatch[4] ? phaseMatch[4].trim() : '';
      currentPhase = {
        number: phaseNum,
        id: `phase-${String(phaseNum).padStart(2, '0')}`,
        title,
        statusGlyph,
        estTime,
        lessons: []
      };
      phases.push(currentPhase);
      continue;
    }

    // Match table rows: | 01 | Dev Environment | ✅ | ~75 min |
    if (currentPhase && line.startsWith('|') && !line.includes('Lesson') && !line.includes('---')) {
      const parts = line.split('|').map(s => s.trim()).filter(Boolean);
      if (parts.length >= 3) {
        const num = parts[0];
        const title = parts[1];
        const status = parts[2];
        const est = parts[3] || '';
        currentPhase.lessons.push({
          num,
          title,
          status,
          est
        });
      }
    }
  }
  return phases;
}

// 2. Scan curriculum/phases directory
const phasesDir = path.join(curriculumDir, 'phases');
const phaseFolders = fs.existsSync(phasesDir) 
  ? fs.readdirSync(phasesDir).filter(f => fs.statSync(path.join(phasesDir, f)).isDirectory()).sort()
  : [];

console.log(`[Indexer] Found ${phaseFolders.length} phase directories.`);

if (phaseFolders.length === 0) {
  if (hasExistingData) {
    console.warn(`[Indexer] Warning: 0 phase directories found in ${curriculumDir}. Preserving pre-compiled src/data/ bundle.`);
    process.exit(0);
  }
  console.error(`[Indexer Error] No phase directories found in ${phasesDir}`);
  process.exit(1);
}

const allLessonsSummary = [];
const phasesMetadata = [];

for (const phaseFolder of phaseFolders) {
  const phaseMatch = phaseFolder.match(/^(\d+)-(.*)$/);
  const phaseNum = phaseMatch ? parseInt(phaseMatch[1], 10) : -1;
  const phaseSlug = phaseMatch ? phaseMatch[2] : phaseFolder;
  const phaseId = `phase-${String(phaseNum).padStart(2, '0')}`;

  const roadmapInfo = roadmapPhases.find(p => p.number === phaseNum);
  const phaseTitle = roadmapInfo ? roadmapInfo.title : formatTitle(phaseSlug);
  const phaseEstTime = roadmapInfo ? roadmapInfo.estTime : '';
  const phaseStatusGlyph = roadmapInfo ? roadmapInfo.statusGlyph : '✅';

  const phasePath = path.join(phasesDir, phaseFolder);
  const lessonFolders = fs.readdirSync(phasePath)
    .filter(f => fs.statSync(path.join(phasePath, f)).isDirectory())
    .sort();

  const phaseLessonsData = [];

  for (const lessonFolder of lessonFolders) {
    const lessonMatch = lessonFolder.match(/^(\d+)-(.*)$/);
    const lessonNum = lessonMatch ? parseInt(lessonMatch[1], 10) : -1;
    const lessonSlug = lessonMatch ? lessonMatch[2] : lessonFolder;
    const lessonId = `${phaseId}-lesson-${String(lessonNum).padStart(2, '0')}`;

    const lessonPath = path.join(phasePath, lessonFolder);
    const docPath = path.join(lessonPath, 'docs', 'en.md');
    
    let rawMarkdown = '';
    let docMeta = {};
    if (fs.existsSync(docPath)) {
      rawMarkdown = fs.readFileSync(docPath, 'utf-8');
      docMeta = extractDocMeta(rawMarkdown);
    }

    // Code files
    const codeDir = path.join(lessonPath, 'code');
    const codeFiles = readCodeFiles(codeDir);

    // Quiz
    const quizPath = path.join(lessonPath, 'quiz.json');
    const quizData = readQuizFile(quizPath);

    const title = docMeta.title || (roadmapInfo?.lessons.find(l => parseInt(l.num, 10) === lessonNum)?.title) || formatTitle(lessonSlug);
    const estTime = docMeta.time || (roadmapInfo?.lessons.find(l => parseInt(l.num, 10) === lessonNum)?.est) || '~45 min';

    const lessonSummaryItem = {
      id: lessonId,
      phaseId,
      phaseNum,
      phaseTitle,
      lessonNum,
      title,
      slug: lessonSlug,
      estTime,
      motto: docMeta.motto || '',
      type: docMeta.type || 'Lesson',
      languages: docMeta.languages || [],
      prerequisites: docMeta.prerequisites || 'None',
      hasQuiz: !!(quizData && quizData.questions && quizData.questions.length > 0),
      questionCount: quizData?.questions?.length || 0,
      codeFilesCount: codeFiles.length,
      tags: [phaseSlug, lessonSlug, ...(docMeta.languages || [])],
      relativePath: `phases/${phaseFolder}/${lessonFolder}`
    };

    allLessonsSummary.push(lessonSummaryItem);

    phaseLessonsData.push({
      ...lessonSummaryItem,
      markdown: rawMarkdown,
      beats: docMeta.beats || [],
      codeFiles,
      quiz: quizData
    });
  }

  phasesMetadata.push({
    id: phaseId,
    number: phaseNum,
    slug: phaseSlug,
    title: phaseTitle,
    estTime: phaseEstTime,
    statusGlyph: phaseStatusGlyph,
    lessonsCount: phaseLessonsData.length,
    folderName: phaseFolder
  });

  // Write phase chunk JSON
  const phaseJsonPath = path.join(outPhasesDir, `${phaseId}.json`);
  fs.writeFileSync(phaseJsonPath, JSON.stringify({
    phase: phasesMetadata[phasesMetadata.length - 1],
    lessons: phaseLessonsData
  }, null, 2));
}

// 3. Index Certifications (MCPA and Claude)
const certsData = indexCertifications(curriculumDir, outDataDir, outPhasesDir, allLessonsSummary, phasesMetadata);

// 4. Index Projects
const projectsData = indexProjects(curriculumDir, outDataDir);

// 5. Index Learning Paths
const learningPathsData = indexLearningPaths(curriculumDir, outDataDir, allLessonsSummary);

// 6. Write summary files
fs.writeFileSync(
  path.join(outDataDir, 'roadmap.json'),
  JSON.stringify(phasesMetadata, null, 2)
);

fs.writeFileSync(
  path.join(outDataDir, 'lessons-summary.json'),
  JSON.stringify(allLessonsSummary, null, 2)
);

console.log(`[Indexer] Successfully compiled ${phasesMetadata.length} phases and ${allLessonsSummary.length} total lessons (including certifications)!`);
console.log(`[Indexer] Compiled ${projectsData.projects.length} ready projects and ${projectsData.planned.length} planned projects.`);
console.log(`[Indexer] Compiled ${certsData.programs.length} certification programs with ${certsData.totalCertificationLessons} exam prep lessons.`);
console.log(`[Indexer] Compiled ${learningPathsData.length} learning paths and career routes.`);

// ==========================================
// Helper Functions
// ==========================================

function readCodeFiles(codeDir) {
  const codeFiles = [];
  if (fs.existsSync(codeDir) && fs.statSync(codeDir).isDirectory()) {
    const codeFilenames = fs.readdirSync(codeDir);
    for (const cName of codeFilenames) {
      const cPath = path.join(codeDir, cName);
      if (fs.statSync(cPath).isFile()) {
        try {
          const content = fs.readFileSync(cPath, 'utf-8');
          codeFiles.push({
            filename: cName,
            language: getLanguageFromFilename(cName),
            content,
            sizeBytes: fs.statSync(cPath).size
          });
        } catch (e) {}
      }
    }
  }
  return codeFiles;
}

function readQuizFile(quizPath) {
  if (fs.existsSync(quizPath)) {
    try {
      const quizRaw = fs.readFileSync(quizPath, 'utf-8');
      return JSON.parse(quizRaw);
    } catch (err) {
      console.warn(`[Indexer] Failed to parse quiz at ${quizPath}:`, err.message);
    }
  }
  return null;
}

function formatTitle(slug) {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getLanguageFromFilename(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.py': return 'python';
    case '.rs': return 'rust';
    case '.ts': return 'typescript';
    case '.js': return 'javascript';
    case '.json': return 'json';
    case '.jl': return 'julia';
    case '.cpp':
    case '.cc':
    case '.cxx': return 'cpp';
    case '.c': return 'c';
    case '.cu': return 'cuda';
    case '.sh': return 'bash';
    case '.md': return 'markdown';
    case '.yaml':
    case '.yml': return 'yaml';
    case '.toml': return 'toml';
    case '.sql': return 'sql';
    default: return 'plaintext';
  }
}

function extractDocMeta(markdown) {
  const lines = markdown.split('\n');
  let title = '';
  let motto = '';
  let type = 'Build';
  let languages = [];
  let prerequisites = 'None';
  let time = '';
  const beats = [];

  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const line = lines[i].trim();
    if (line.startsWith('# ') && !title) {
      title = line.replace(/^#\s+/, '').trim();
    } else if (line.startsWith('>') && !motto) {
      motto = line.replace(/^>\s+/, '').trim();
    } else if (line.startsWith('**Type:**')) {
      type = line.replace('**Type:**', '').trim();
    } else if (line.startsWith('**Languages:**')) {
      languages = line.replace('**Languages:**', '').split(',').map(s => s.trim()).filter(Boolean);
    } else if (line.startsWith('**Prerequisites:**')) {
      prerequisites = line.replace('**Prerequisites:**', '').trim();
    } else if (line.startsWith('**Time:**')) {
      time = line.replace('**Time:**', '').trim();
    }
  }

  // Detect beat sections: Motto, Problem, Concept, Build It, Use It, Ship It, Objectives, etc.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('## ')) {
      const heading = line.replace(/^##\s+/, '').trim();
      beats.push({
        heading,
        anchor: heading.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      });
    }
  }

  return { title, motto, type, languages, prerequisites, time, beats };
}

/**
 * Index hands-on real-world projects from curriculum/projects
 */
function indexProjects(curriculumDir, outDataDir) {
  const projectsDir = path.join(curriculumDir, 'projects');
  if (!fs.existsSync(projectsDir)) {
    return { projects: [], planned: [] };
  }

  const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
  const projectDirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('_') && !e.name.startsWith('.'));

  const projects = [];

  for (const dir of projectDirs) {
    const pPath = path.join(projectsDir, dir.name);
    const pJsonPath = path.join(pPath, 'project.json');
    if (!fs.existsSync(pJsonPath)) continue;

    try {
      const pData = JSON.parse(fs.readFileSync(pJsonPath, 'utf-8'));
      const readmePath = path.join(pPath, 'README.md');
      const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf-8') : '';

      // Parse stages
      const stages = (pData.stages || []).map(st => {
        const stageDir = path.join(pPath, 'stages', st.id);
        const stageDocPath = path.join(stageDir, 'docs', 'en.md');
        const stageDoc = fs.existsSync(stageDocPath) ? fs.readFileSync(stageDocPath, 'utf-8') : '';

        // Starter files
        const starterDir = path.join(stageDir, 'starter');
        const starterFiles = readCodeFiles(starterDir);

        // Tests files
        const testsDir = path.join(stageDir, 'tests');
        const testFiles = readCodeFiles(testsDir);

        return {
          id: st.id,
          title: st.title,
          summary: st.summary,
          hours: st.hours || 2,
          difficulty: st.difficulty || 'starter',
          language: st.language || (pData.languages && pData.languages[0]) || 'python',
          concepts: st.concepts || [],
          markdown: stageDoc,
          starterFiles,
          testFiles
        };
      });

      // Solution files sample
      const solutionDir = path.join(pPath, 'solution');
      const solutionFiles = readCodeFiles(solutionDir);

      projects.push({
        id: pData.id || dir.name,
        title: pData.title,
        level: pData.level || 1,
        levelName: pData.levelName || 'Starter',
        tagline: pData.tagline || '',
        summary: pData.summary || '',
        youWillBuild: pData.youWillBuild || '',
        usefulFor: pData.usefulFor || [],
        hours: pData.hours || 8,
        languages: pData.languages || ['Python'],
        languageWhy: pData.languageWhy || {},
        status: pData.status || 'ready',
        skills: pData.skills || [],
        prerequisites: pData.prerequisites || [],
        demo: pData.demo || null,
        stages,
        stagesCount: stages.length,
        readme,
        solutionFilesSummary: solutionFiles.map(s => ({ filename: s.filename, language: s.language, sizeBytes: s.sizeBytes }))
      });
    } catch (err) {
      console.warn(`[Indexer] Failed to parse project in ${dir.name}:`, err.message);
    }
  }

  // Roadmap planned projects
  const roadmapPath = path.join(projectsDir, 'roadmap.json');
  let planned = [];
  if (fs.existsSync(roadmapPath)) {
    try {
      const rData = JSON.parse(fs.readFileSync(roadmapPath, 'utf-8'));
      const readyIds = new Set(projects.map(p => p.id));
      planned = (rData.planned || []).filter(p => !readyIds.has(p.id));
    } catch (e) {}
  }

  // Sort by level then title
  projects.sort((a, b) => a.level - b.level || a.title.localeCompare(b.title));

  const result = {
    generatedAt: new Date().toISOString(),
    totalProjects: projects.length,
    levels: [
      { level: 1, name: 'Starter', summary: 'One program, one clear input and output. No model needed to pass the tests.' },
      { level: 2, name: 'Builder', summary: 'A pipeline of three or more parts with a typed contract between them.' },
      { level: 3, name: 'Engineer', summary: 'State, budgets, retries, traces, and one measured eval number.' },
      { level: 4, name: 'Systems', summary: 'Isolation, concurrency, protocols, many tools, long-running work.' },
      { level: 5, name: 'Frontier', summary: 'Compare agent systems, trace failures, and measure reproducible experiments.' }
    ],
    projects,
    planned
  };

  fs.writeFileSync(path.join(outDataDir, 'projects.json'), JSON.stringify(result, null, 2));
  return result;
}

/**
 * Index Certification programs (MCPA & Claude)
 */
function indexCertifications(curriculumDir, outDataDir, outPhasesDir, allLessonsSummary, phasesMetadata) {
  const certsDir = path.join(curriculumDir, 'certifications');
  if (!fs.existsSync(certsDir)) {
    return { programs: [], totalCertificationLessons: 0 };
  }

  const certPrograms = ['mcpa', 'claude'];
  const programsData = [];
  let totalCertLessons = 0;

  for (const progSlug of certPrograms) {
    const progPath = path.join(certsDir, progSlug);
    const progJsonPath = path.join(progPath, 'program.json');
    if (!fs.existsSync(progJsonPath)) continue;

    const progManifest = JSON.parse(fs.readFileSync(progJsonPath, 'utf-8'));
    
    // Read tracks
    const tracksDir = path.join(progPath, 'tracks');
    const tracks = [];
    if (fs.existsSync(tracksDir)) {
      const trackFiles = fs.readdirSync(tracksDir).filter(f => f.endsWith('.json'));
      for (const tFile of trackFiles) {
        try {
          const tData = JSON.parse(fs.readFileSync(path.join(tracksDir, tFile), 'utf-8'));
          tracks.push(tData);
        } catch (e) {}
      }
    }

    // Process certification lessons
    const lessonsDir = path.join(progPath, 'lessons');
    const lessonDirs = fs.existsSync(lessonsDir) 
      ? fs.readdirSync(lessonsDir).filter(f => fs.statSync(path.join(lessonsDir, f)).isDirectory()).sort()
      : [];

    const phaseId = `phase-cert-${progSlug}`;
    const phaseNum = progSlug === 'mcpa' ? 101 : 102;
    const phaseTitle = progSlug === 'mcpa' ? 'MCPA Exam Prep (2026-07-28 Spec)' : 'Anthropic Claude Certifications';

    const certPhaseLessons = [];

    for (const lDir of lessonDirs) {
      const lessonPath = path.join(lessonsDir, lDir);
      const docPath = path.join(lessonPath, 'docs', 'en.md');
      const lessonMatch = lDir.match(/^(\d+)-(.*)$/);
      const lessonNum = lessonMatch ? parseInt(lessonMatch[1], 10) : 0;
      const lessonSlug = lessonMatch ? lessonMatch[2] : lDir;
      const lessonId = `${phaseId}-lesson-${String(lessonNum).padStart(2, '0')}`;

      let rawMarkdown = '';
      let docMeta = {};
      if (fs.existsSync(docPath)) {
        rawMarkdown = fs.readFileSync(docPath, 'utf-8');
        docMeta = extractDocMeta(rawMarkdown);
      }

      const codeFiles = readCodeFiles(path.join(lessonPath, 'code'));
      const quizData = readQuizFile(path.join(lessonPath, 'quiz.json'));

      const title = docMeta.title || formatTitle(lessonSlug);
      const estTime = docMeta.time || '~45 min';

      // Find domains from tracks
      const associatedDomains = [];
      for (const trk of tracks) {
        if (trk.lessons) {
          const relMatch = trk.lessons.find(l => l.path && l.path.includes(lDir));
          if (relMatch && relMatch.domains) {
            associatedDomains.push(...relMatch.domains);
          }
        }
      }

      const lessonSummaryItem = {
        id: lessonId,
        phaseId,
        phaseNum,
        phaseTitle,
        lessonNum,
        title,
        slug: lessonSlug,
        estTime,
        motto: docMeta.motto || '',
        type: 'Certification',
        languages: docMeta.languages || [],
        prerequisites: docMeta.prerequisites || 'None',
        hasQuiz: !!(quizData && quizData.questions && quizData.questions.length > 0),
        questionCount: quizData?.questions?.length || 0,
        codeFilesCount: codeFiles.length,
        tags: ['certification', progSlug, lessonSlug, ...associatedDomains],
        domains: [...new Set(associatedDomains)],
        relativePath: `certifications/${progSlug}/lessons/${lDir}`
      };

      allLessonsSummary.push(lessonSummaryItem);

      certPhaseLessons.push({
        ...lessonSummaryItem,
        markdown: rawMarkdown,
        beats: docMeta.beats || [],
        codeFiles,
        quiz: quizData
      });
    }

    totalCertLessons += certPhaseLessons.length;

    // Add to phasesMetadata
    phasesMetadata.push({
      id: phaseId,
      number: phaseNum,
      slug: `cert-${progSlug}`,
      title: phaseTitle,
      estTime: progSlug === 'mcpa' ? '~30 hours' : '~28 hours',
      statusGlyph: '✅',
      lessonsCount: certPhaseLessons.length,
      folderName: `certifications/${progSlug}`,
      isCertification: true
    });

    // Write phase chunk JSON so reader can load it!
    fs.writeFileSync(
      path.join(outPhasesDir, `${phaseId}.json`),
      JSON.stringify({
        phase: phasesMetadata[phasesMetadata.length - 1],
        lessons: certPhaseLessons
      }, null, 2)
    );

    programsData.push({
      ...progManifest,
      slug: progSlug,
      phaseId,
      lessonsCount: certPhaseLessons.length,
      tracks,
      lessons: certPhaseLessons.map(l => ({
        id: l.id,
        lessonNum: l.lessonNum,
        title: l.title,
        slug: l.slug,
        estTime: l.estTime,
        domains: l.domains,
        hasQuiz: l.hasQuiz,
        questionCount: l.questionCount
      }))
    });
  }

  const certsResult = {
    generatedAt: new Date().toISOString(),
    programs: programsData,
    totalCertificationLessons: totalCertLessons
  };

  fs.writeFileSync(path.join(outDataDir, 'certifications.json'), JSON.stringify(certsResult, null, 2));
  return certsResult;
}

/**
 * Index 12 Learning Paths and Career Routes
 */
function indexLearningPaths(curriculumDir, outDataDir, allLessonsSummary) {
  const lpDir = path.join(curriculumDir, 'learning-paths');
  if (!fs.existsSync(lpDir)) {
    return [];
  }

  const files = fs.readdirSync(lpDir).filter(f => f.endsWith('.json'));
  const paths = [];

  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(lpDir, file), 'utf-8'));
      const id = path.basename(file, '.json');

      // Resolve lesson paths to lesson IDs
      const stages = (data.stages || []).map(st => {
        const resolvedLessons = (st.lessonPaths || []).map(lp => {
          // lp e.g. "phases/13-tools-and-protocols/01-the-tool-interface"
          const match = allLessonsSummary.find(l => l.relativePath && l.relativePath.startsWith(lp) || l.relativePath === lp);
          return match ? { id: match.id, title: match.title, estTime: match.estTime, slug: match.slug, phaseId: match.phaseId } : { path: lp, title: formatTitle(path.basename(lp)) };
        });

        return {
          id: st.id,
          title: st.title,
          outcome: st.outcome || '',
          artifact: st.artifact || '',
          lessons: resolvedLessons
        };
      });

      paths.push({
        id: data.id || id,
        kind: data.kind || 'domain',
        title: data.title,
        workFamily: data.workFamily || '',
        commonTitles: data.commonTitles || [],
        summary: data.summary || '',
        decisionPrompt: data.decisionPrompt || '',
        mission: data.mission || '',
        responsibilities: data.responsibilities || [],
        goodFitIf: data.goodFitIf || [],
        baseline: data.baseline || [],
        boundary: data.boundary || '',
        portfolioProof: data.portfolioProof || null,
        readinessCriteria: data.readinessCriteria || [],
        coverage: data.coverage || {},
        estimatedMinutes: data.estimatedMinutes || 600,
        stages
      });
    } catch (err) {
      console.warn(`[Indexer] Failed to parse learning path ${file}:`, err.message);
    }
  }

  fs.writeFileSync(path.join(outDataDir, 'learning-paths.json'), JSON.stringify(paths, null, 2));
  return paths;
}
