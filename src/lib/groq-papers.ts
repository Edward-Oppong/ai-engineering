/**
 * groq-papers.ts
 * ─────────────────────────────────────────────────────────────
 * Groq-powered research paper assistant for the AI Engineering
 * Study Companion.  Uses the llama-3.3-70b-versatile model via
 * Groq's OpenAI-compatible chat completions endpoint.
 *
 * Responsibilities:
 *   • Curate a daily list of 4-5 research papers relevant to
 *     the active phase/topic using Groq LLM.
 *   • Generate deep AI analysis, key takeaways and discussion
 *     questions for each paper.
 *   • Retrieve trending AI news / papers from Semantic Scholar
 *     (public, CORS-safe) to give fresh context.
 *   • Enforce the daily reading gate: lessons are locked until
 *     the user has marked ≥ 4 papers read.
 */

import { ResearchPaper, AITrendItem } from '../types';

const GROQ_STORAGE_KEY = 'ai_eng_groq_api_key';
const GROQ_BASE        = 'https://api.groq.com/openai/v1';
const GROQ_MODEL       = 'llama-3.3-70b-versatile';

/**
 * Retrieves the Groq API key from localStorage or Vite environment variable.
 * Does not expose or commit raw secret tokens to version control.
 */
export function getGroqApiKey(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(GROQ_STORAGE_KEY);
    if (stored && stored.trim()) return stored.trim();
  }
  const envKey = (import.meta as any).env?.VITE_GROQ_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim()) {
    return envKey.trim();
  }
  return '';
}

export function setGroqApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem(GROQ_STORAGE_KEY, trimmed);
  } else {
    localStorage.removeItem(GROQ_STORAGE_KEY);
  }
}

export function hasGroqApiKey(): boolean {
  return Boolean(getGroqApiKey());
}

// ─── Groq chat helper ────────────────────────────────────────
async function groqChat(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 2048
): Promise<string> {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error('Groq API Key is not configured. Add your free key in Settings or .env.local.');
  }

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage  },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ─── Canonical paper catalogue (always available, offline) ───
export const PAPER_CATALOGUE: ResearchPaper[] = [
  // Foundations
  {
    id: 'attention-is-all-you-need',
    title: 'Attention Is All You Need',
    authors: ['Vaswani et al.'],
    publishedDate: '2017-06-12',
    category: 'Transformers & LLMs',
    phaseIds: ['phase-07', 'phase-08'],
    phaseTitles: ['Transformer Internals', 'Language Modelling'],
    abstract: 'Proposes the Transformer architecture built entirely on self-attention, dispensing with recurrence and convolutions. Achieves state-of-the-art on machine translation tasks while training faster and more parallelisably than previous models.',
    keyTakeaways: [
      'Multi-head self-attention enables the model to attend to all positions in parallel.',
      'Positional encodings inject sequence order without recurrent connections.',
      'Scaled dot-product attention prevents gradient saturation in high dimensions.',
    ],
    arxivUrl: 'https://arxiv.org/abs/1706.03762',
    readingMinutes: 25,
    isSeminal: true,
  },
  {
    id: 'gpt3',
    title: 'Language Models are Few-Shot Learners (GPT-3)',
    authors: ['Brown et al.'],
    publishedDate: '2020-05-28',
    category: 'Transformers & LLMs',
    phaseIds: ['phase-09', 'phase-10'],
    phaseTitles: ['Pretraining & Fine-Tuning', 'Prompt Engineering'],
    abstract: 'Demonstrates that scaling language models to 175B parameters yields surprising few-shot learning abilities across diverse NLP tasks—simply via in-context examples and no gradient updates.',
    keyTakeaways: [
      'Scale + data + compute unlocks emergent in-context learning.',
      'Zero-/few-shot prompting can match fine-tuned small models.',
      'Calibration, bias and factuality remain open challenges.',
    ],
    arxivUrl: 'https://arxiv.org/abs/2005.14165',
    readingMinutes: 30,
    isSeminal: true,
  },
  {
    id: 'rlhf-instruct',
    title: 'Training Language Models to Follow Instructions with Human Feedback',
    authors: ['Ouyang et al.'],
    publishedDate: '2022-03-04',
    category: 'Transformers & LLMs',
    phaseIds: ['phase-11'],
    phaseTitles: ['RLHF & Alignment'],
    abstract: 'Introduces InstructGPT: combining supervised fine-tuning with RLHF to align GPT-3 with human intent—producing models that are more helpful, harmless, and honest.',
    keyTakeaways: [
      'PPO + reward model derived from human comparisons dramatically improves alignment.',
      'Smaller RLHF models beat larger raw pre-trained ones on human preference.',
      'Value alignment is learnable from ranked demonstrations.',
    ],
    arxivUrl: 'https://arxiv.org/abs/2203.02155',
    readingMinutes: 28,
    isSeminal: true,
  },
  {
    id: 'rag-paper',
    title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
    authors: ['Lewis et al.'],
    publishedDate: '2020-05-22',
    category: 'Agents & MCP',
    phaseIds: ['phase-14'],
    phaseTitles: ['RAG & Tool Use'],
    abstract: 'Introduces RAG: combining dense retrieval with seq2seq generation so models can ground answers in dynamically retrieved documents without retraining.',
    keyTakeaways: [
      'Retrieval decouples knowledge storage from model parameters.',
      'Dense Passage Retrieval (DPR) using FAISS enables fast similarity search.',
      'RAG reduces hallucinations on open-domain QA tasks.',
    ],
    arxivUrl: 'https://arxiv.org/abs/2005.11401',
    readingMinutes: 22,
    isSeminal: true,
  },
  {
    id: 'react-paper',
    title: 'ReAct: Synergizing Reasoning and Acting in Language Models',
    authors: ['Yao et al.'],
    publishedDate: '2022-10-06',
    category: 'Agents & MCP',
    phaseIds: ['phase-13', 'phase-15'],
    phaseTitles: ['Agent Internals', 'Multi-Agent Orchestration'],
    abstract: 'Shows that interleaving chain-of-thought reasoning traces with action steps dramatically improves LLM agent performance on interactive decision-making tasks.',
    keyTakeaways: [
      'Reasoning+acting (ReAct) beats purely reactive or purely reasoning agents.',
      'Thought traces improve interpretability and error recovery.',
      'Applicable to web browsing, fact-checking, and API usage tasks.',
    ],
    arxivUrl: 'https://arxiv.org/abs/2210.03629',
    readingMinutes: 20,
    isSeminal: false,
  },
  {
    id: 'chain-of-thought',
    title: 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models',
    authors: ['Wei et al.'],
    publishedDate: '2022-01-28',
    category: 'Transformers & LLMs',
    phaseIds: ['phase-10'],
    phaseTitles: ['Prompt Engineering'],
    abstract: 'Demonstrates that prompting language models with worked examples of reasoning steps ("chain-of-thought") greatly improves accuracy on arithmetic, commonsense, and symbolic reasoning.',
    keyTakeaways: [
      'Few-shot CoT examples unlock multi-step reasoning without fine-tuning.',
      'The benefit scales with model size—emergent above ~100B params.',
      'Zero-shot CoT ("Let\'s think step by step") is effective and simple.',
    ],
    arxivUrl: 'https://arxiv.org/abs/2201.11903',
    readingMinutes: 18,
    isSeminal: true,
  },
  {
    id: 'lora',
    title: 'LoRA: Low-Rank Adaptation of Large Language Models',
    authors: ['Hu et al.'],
    publishedDate: '2021-06-17',
    category: 'Inference & Systems',
    phaseIds: ['phase-11', 'phase-17'],
    phaseTitles: ['RLHF & Alignment', 'Inference Optimization'],
    abstract: 'Proposes injecting trainable low-rank decomposition matrices into Transformer weight matrices so that fine-tuning cost scales with adapter rank, not full model size.',
    keyTakeaways: [
      'Reduces trainable parameters by 10,000× with comparable task quality.',
      'No inference latency overhead — adapters merge into frozen weights.',
      'Enables personal fine-tuning on consumer hardware.',
    ],
    arxivUrl: 'https://arxiv.org/abs/2106.09685',
    readingMinutes: 22,
    isSeminal: true,
  },
  {
    id: 'mcp-spec',
    title: 'Model Context Protocol: Standardizing LLM Tool Integrations',
    authors: ['Anthropic'],
    publishedDate: '2024-11-25',
    category: 'Agents & MCP',
    phaseIds: ['phase-13'],
    phaseTitles: ['MCP & Tool Protocols'],
    abstract: 'MCP defines an open, JSON-RPC-based protocol allowing AI assistants to securely connect to local and remote data sources and tools. It replaces bespoke plugin systems with a standardised host/client/server architecture.',
    keyTakeaways: [
      'MCP servers expose resources, tools, and prompts over a standard transport.',
      'Clients (LLM hosts) discover capabilities at runtime without code changes.',
      'Enables a rich ecosystem of shared, composable AI tooling.',
    ],
    arxivUrl: 'https://modelcontextprotocol.io/docs',
    readingMinutes: 30,
    isSeminal: false,
  },
  {
    id: 'flash-attention',
    title: 'FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness',
    authors: ['Dao et al.'],
    publishedDate: '2022-05-27',
    category: 'Inference & Systems',
    phaseIds: ['phase-07', 'phase-18'],
    phaseTitles: ['Transformer Internals', 'Distributed Inference'],
    abstract: 'An IO-aware exact attention algorithm that tiles computation to avoid materialising the full N×N attention matrix in HBM, reducing memory to O(N) and speeding up training 2-4×.',
    keyTakeaways: [
      'SRAM tiling achieves the same numerics as standard attention, no approximation.',
      'Critical for long-context LLMs at inference time.',
      'FlashAttention-2/3 push further gains with better GPU utilisation.',
    ],
    arxivUrl: 'https://arxiv.org/abs/2205.14135',
    readingMinutes: 25,
    isSeminal: true,
  },
  {
    id: 'vllm',
    title: 'Efficient Memory Management for Large Language Model Serving with PagedAttention',
    authors: ['Kwon et al.'],
    publishedDate: '2023-09-12',
    category: 'Inference & Systems',
    phaseIds: ['phase-18'],
    phaseTitles: ['Distributed Inference'],
    abstract: 'PagedAttention manages the KV-cache like OS virtual memory pages, eliminating fragmentation and enabling near-optimal batching — forming the core of vLLM.',
    keyTakeaways: [
      'KV-cache fragmentation wastes 60-80% of GPU memory in naïve implementations.',
      'Paged blocks + continuous batching can raise GPU utilisation to >55%.',
      'vLLM achieves up to 24× higher throughput vs HuggingFace Transformers.',
    ],
    arxivUrl: 'https://arxiv.org/abs/2309.06180',
    readingMinutes: 22,
    isSeminal: true,
  },
  {
    id: 'scaling-laws',
    title: 'Scaling Laws for Neural Language Models',
    authors: ['Kaplan et al.'],
    publishedDate: '2020-01-23',
    category: 'Foundations',
    phaseIds: ['phase-09'],
    phaseTitles: ['Pretraining & Scaling'],
    abstract: 'Empirically derives power-law relationships between model size, dataset size, and compute budget and their effect on cross-entropy loss — providing a science of LLM scaling.',
    keyTakeaways: [
      'Loss follows smooth power-laws in N (parameters), D (tokens), C (compute).',
      'Optimal allocation under fixed compute: scale N and D together.',
      'Later refined by Chinchilla showing prior models were overtrained on too few tokens.',
    ],
    arxivUrl: 'https://arxiv.org/abs/2001.08361',
    readingMinutes: 30,
    isSeminal: true,
  },
  {
    id: 'gpt4-technical-report',
    title: 'GPT-4 Technical Report',
    authors: ['OpenAI'],
    publishedDate: '2023-03-15',
    category: 'Frontier Evals',
    phaseIds: ['phase-09', 'phase-19'],
    phaseTitles: ['Pretraining', 'Capstones & Frontier'],
    abstract: 'OpenAI\'s technical report on GPT-4: a large multimodal model that accepts image and text inputs and produces text outputs. Reports performance across diverse professional and academic benchmarks.',
    keyTakeaways: [
      'GPT-4 passes bar exam and many professional certifications at human-level.',
      'Multimodal (vision) capability integrated without major architectural change.',
      'System card reveals extensive red-teaming and safety evaluation.',
    ],
    arxivUrl: 'https://arxiv.org/abs/2303.08774',
    readingMinutes: 35,
    isSeminal: false,
  },
];

// ─── Custom & Dynamic Papers Storage ──────────────────────────
const CUSTOM_PAPERS_KEY = 'ai_eng_custom_papers';

export function getCustomPapers(): ResearchPaper[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_PAPERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomPapers(papers: ResearchPaper[]): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getCustomPapers();
    const existingIds = new Set(existing.map(p => p.id));
    const newOnes = papers.filter(p => !existingIds.has(p.id));
    localStorage.setItem(CUSTOM_PAPERS_KEY, JSON.stringify([...existing, ...newOnes]));
  } catch (err) {
    console.error('Failed to save custom papers:', err);
  }
}

export function getAllPapers(): ResearchPaper[] {
  const custom = getCustomPapers();
  const seen = new Set<string>();
  const combined: ResearchPaper[] = [];

  for (const p of [...PAPER_CATALOGUE, ...custom]) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      combined.push(p);
    }
  }
  return combined;
}

// ─── Daily paper selection & refresh ──────────────────────────
/**
 * Returns papers from the catalogue/custom library for the session.
 * Supports cycleOffset so the user can refresh/cycle to new batches anytime!
 */
export function getDailyPapers(count = 5, cycleOffset = 0): ResearchPaper[] {
  const all = getAllPapers();
  const today = new Date().toISOString().slice(0, 10);
  // Seeded shuffle using date + offset
  let seed = today.split('-').reduce((acc, n) => acc + parseInt(n), 0) + (cycleOffset * 7919);
  const shuffled = [...all].sort(() => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff - 0.5;
  });
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// ─── Groq AI dynamic paper discovery ──────────────────────────
export async function fetchDynamicResearchPapers(
  topicOrPhase: string = 'General AI Engineering',
  count = 3
): Promise<ResearchPaper[]> {
  const system = `You are an AI research curator. Return strictly valid JSON with no markdown wrapping or additional text.`;
  const user = `Generate a JSON array of ${count} real, landmark AI research papers relevant to: "${topicOrPhase}".
Each paper object must have exactly these fields:
{
  "id": "kebab-case-unique-id",
  "title": "Exact Title of the Paper",
  "authors": ["Author 1", "Author 2 et al."],
  "publishedDate": "YYYY-MM-DD",
  "category": "one of: Foundations | Transformers & LLMs | Agents & MCP | Inference & Systems | Frontier Evals",
  "phaseIds": ["phase-07"],
  "phaseTitles": ["Relevant Curriculum Topic"],
  "abstract": "Clear 2-3 sentence overview of the paper and findings",
  "keyTakeaways": [
    "Technical takeaway 1",
    "Technical takeaway 2",
    "Technical takeaway 3"
  ],
  "arxivUrl": "https://arxiv.org/abs/...",
  "readingMinutes": 25,
  "isSeminal": true
}
Return ONLY a valid JSON array.`;

  const raw = await groqChat(system, user, 2048);
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('No valid JSON array returned from Groq');

  const papers: ResearchPaper[] = JSON.parse(match[0]);
  saveCustomPapers(papers);
  return papers;
}

// ─── Groq AI deep-dive analysis ──────────────────────────────
export async function getAIPaperAnalysis(paper: ResearchPaper): Promise<string> {
  const system = `You are a senior AI research mentor guiding engineering students through landmark AI/ML papers. 
Provide rich, practical analysis that connects theory to modern engineering practice.
Write in clear, engaging prose with concrete examples. Use markdown formatting.`;

  const user = `Analyse this paper for an AI engineering student:

**Title**: ${paper.title}
**Authors**: ${paper.authors.join(', ')}
**Published**: ${paper.publishedDate}
**Abstract**: ${paper.abstract}

Please provide:
1. **Why This Paper Matters** (2-3 sentences on its lasting impact)
2. **Core Technical Contribution** (the key idea explained simply)
3. **Engineering Implications** (how it affects how we build systems today)
4. **Limitations & Open Questions** (what it didn't solve)
5. **2 Discussion Questions** to test understanding

Keep the analysis under 500 words total. Be direct and insightful.`;

  return groqChat(system, user, 1024);
}

// ─── AI Trends fetch ─────────────────────────────────────────
export async function fetchAITrends(): Promise<AITrendItem[]> {
  const system = `You are an AI research news curator. Return information in valid JSON only.`;

  const user = `Generate a JSON array of 6 current AI engineering trends/developments from 2024-2026. 
Each item must have exactly these fields:
{
  "id": "unique-slug",
  "title": "Short trend title",
  "summary": "2-3 sentence summary of the trend",
  "category": "one of: LLMs | Agents | Inference | Training | Multimodal | Safety",
  "relatedPhase": "e.g. phase-13",
  "source": "e.g. Anthropic Blog / arXiv / DeepMind",
  "date": "YYYY-MM-DD",
  "engineeringTakeaway": "1 concrete engineering action this trend implies"
}
Return ONLY a valid JSON array with no explanation.`;

  try {
    const raw = await groqChat(system, user, 1500);
    // Extract JSON from possible markdown wrapping
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array found in response');
    const items: AITrendItem[] = JSON.parse(match[0]);
    return items.map((item, i) => ({ ...item, id: item.id || `trend-${i}` }));
  } catch (err) {
    console.error('Failed to fetch AI trends:', err);
    return FALLBACK_TRENDS;
  }
}

// ─── Fallback trends (offline / error) ───────────────────────
const FALLBACK_TRENDS: AITrendItem[] = [
  {
    id: 'mcp-adoption',
    title: 'MCP Ecosystem Rapid Adoption',
    summary: 'Anthropic\'s Model Context Protocol is seeing accelerating adoption across IDEs, data tools, and enterprise platforms. Major providers like GitHub, Cloudflare, and Stripe have published MCP servers.',
    category: 'Agents',
    relatedPhase: 'phase-13',
    source: 'Anthropic Blog',
    date: '2025-03-01',
    engineeringTakeaway: 'Build MCP servers for your internal APIs to instantly make them accessible to any AI agent.',
  },
  {
    id: 'reasoning-models',
    title: 'Reasoning Models Go Mainstream',
    summary: 'Models like o3, DeepSeek-R1, and Gemini Thinking demonstrate that extended chain-of-thought at inference time radically improves performance on complex tasks without retraining.',
    category: 'LLMs',
    relatedPhase: 'phase-10',
    source: 'OpenAI / DeepSeek',
    date: '2025-06-15',
    engineeringTakeaway: 'Route complex multi-step tasks to reasoning models; keep simple extractions on faster/cheaper models.',
  },
  {
    id: 'vllm-v1',
    title: 'vLLM v1 Architecture Rewrite',
    summary: 'The vLLM team rewrote the core execution engine for v1, achieving significant throughput improvements through a new scheduler, prefix caching improvements, and better speculative decoding.',
    category: 'Inference',
    relatedPhase: 'phase-18',
    source: 'vLLM Blog',
    date: '2025-04-10',
    engineeringTakeaway: 'Profile your serving workload (batch size, context length) to pick the right vLLM configuration.',
  },
  {
    id: 'multimodal-agents',
    title: 'Multimodal Computer-Use Agents',
    summary: 'Models such as Claude 3.5 Sonnet and GPT-4o with computer-use capability can navigate GUIs, fill forms, and execute agentic workflows in real desktop environments.',
    category: 'Multimodal',
    relatedPhase: 'phase-16',
    source: 'Anthropic / OpenAI',
    date: '2025-05-20',
    engineeringTakeaway: 'Design your agentic pipelines with screenshot/DOM dual perception to improve reliability.',
  },
  {
    id: 'synthetic-data',
    title: 'Synthetic Data Dominates Post-Training',
    summary: 'Teams at Meta, Google and Mistral report that high-quality synthetic data generated by frontier models is now the primary mechanism for improving instruction-following and reasoning in open models.',
    category: 'Training',
    relatedPhase: 'phase-11',
    source: 'Meta AI / Mistral',
    date: '2025-07-01',
    engineeringTakeaway: 'Use LLM-as-judge + self-play to generate task-specific training data rather than relying solely on human annotation.',
  },
  {
    id: 'constitutional-ai',
    title: 'Constitutional AI & Scalable Oversight',
    summary: 'Scalable oversight techniques—debate, process reward models, and constitutional approaches—are emerging as the frontline strategy for safe super-human-level AI development.',
    category: 'Safety',
    relatedPhase: 'phase-19',
    source: 'Anthropic / ARC',
    date: '2025-02-14',
    engineeringTakeaway: 'Integrate process reward models into your RLHF pipelines to catch flawed reasoning, not just wrong final answers.',
  },
];

// ─── Daily reading gate helpers ───────────────────────────────
const DAILY_KEY_PREFIX = 'ai_eng_daily_reading_';

export function getDailyReadingKey(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${DAILY_KEY_PREFIX}${today}`;
}

export function getReadPapersToday(): string[] {
  try {
    const raw = localStorage.getItem(getDailyReadingKey());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markPaperRead(paperId: string): string[] {
  const current = getReadPapersToday();
  if (current.includes(paperId)) return current;
  const updated = [...current, paperId];
  localStorage.setItem(getDailyReadingKey(), JSON.stringify(updated));
  return updated;
}

export function isDailyReadingGoalMet(goal = 4): boolean {
  return getReadPapersToday().length >= goal;
}
