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
    console.warn(`[Indexer] Warning: 0 phase directories found in ${curriculumDir} (e.g. uninitialized git submodule in CI/Vercel). Preserving pre-compiled src/data/ bundle.`);
    process.exit(0);
  }
  console.error(`[Indexer Error] No phase directories found in ${phasesDir}`);
  process.exit(1);
}

const allLessonsSummary = [];
const phasesMetadata = [];

for (const phaseFolder of phaseFolders) {
  // Folder format e.g. "00-setup-and-tooling" -> num: 0, slug: "setup-and-tooling"
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
    // E.g. "01-dev-environment" -> num: 1, slug: "dev-environment"
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
    const codeFiles = [];
    if (fs.existsSync(codeDir) && fs.statSync(codeDir).isDirectory()) {
      const codeFilenames = fs.readdirSync(codeDir);
      for (const cName of codeFilenames) {
        const cPath = path.join(codeDir, cName);
        if (fs.statSync(cPath).isFile()) {
          const content = fs.readFileSync(cPath, 'utf-8');
          codeFiles.push({
            filename: cName,
            language: getLanguageFromFilename(cName),
            content,
            sizeBytes: fs.statSync(cPath).size
          });
        }
      }
    }

    // Quiz
    const quizPath = path.join(lessonPath, 'quiz.json');
    let quizData = null;
    if (fs.existsSync(quizPath)) {
      try {
        const quizRaw = fs.readFileSync(quizPath, 'utf-8');
        quizData = JSON.parse(quizRaw);
      } catch (err) {
        console.warn(`[Indexer] Failed to parse quiz at ${quizPath}:`, err.message);
      }
    }

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
      tags: [phaseSlug, lessonSlug, ...(docMeta.languages || [])]
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

// 3. Write summary files
fs.writeFileSync(
  path.join(outDataDir, 'roadmap.json'),
  JSON.stringify(phasesMetadata, null, 2)
);

fs.writeFileSync(
  path.join(outDataDir, 'lessons-summary.json'),
  JSON.stringify(allLessonsSummary, null, 2)
);

console.log(`[Indexer] Successfully compiled ${phasesMetadata.length} phases and ${allLessonsSummary.length} lessons into src/data/!`);

// Helper Functions
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
