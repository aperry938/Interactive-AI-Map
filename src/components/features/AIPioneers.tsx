import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { navigate } from '../../router/AppRouter';

// ============================================================================
// Data
// ============================================================================

interface Pioneer {
  name: string;
  years: string;
  role: string;
  institution: string;
  contributions: string[];
  image?: string;
  era: 'foundations' | 'winter-revival' | 'deep-learning' | 'modern';
}

interface AITool {
  name: string;
  category: string;
  description: string;
  url: string;
  year: string;
}

interface AIMethod {
  name: string;
  description: string;
  keyPapers: string[];
  impact: string;
}

const ERAS = {
  foundations: { label: 'Foundations', years: '1940s\u20131960s', color: '#3B82F6', description: 'The birth of artificial intelligence as a field' },
  'winter-revival': { label: 'AI Winter & Revival', years: '1970s\u20131990s', color: '#8B5CF6', description: 'Setbacks, neural network resurgence, and expert systems' },
  'deep-learning': { label: 'Deep Learning Revolution', years: '2000s\u20132010s', color: '#EC4899', description: 'GPUs, big data, and the rise of deep neural networks' },
  modern: { label: 'Modern Era', years: '2020s+', color: '#10B981', description: 'Foundation models, agents, and the AI boom' },
} as const;

const PIONEERS: Pioneer[] = [
  // Foundations
  { name: 'Alan Turing', years: '1912\u20131954', role: 'Father of Computer Science', institution: 'University of Manchester', contributions: ['Turing Machine (1936)', 'Turing Test for machine intelligence (1950)', 'Foundational work on computability theory'], era: 'foundations' },
  { name: 'Claude Shannon', years: '1916\u20132001', role: 'Father of Information Theory', institution: 'Bell Labs / MIT', contributions: ['Information Theory (1948)', 'Boolean logic for circuit design', 'Mathematical framework for communication'], era: 'foundations' },
  { name: 'John McCarthy', years: '1927\u20132011', role: 'Coined the term "Artificial Intelligence"', institution: 'Stanford / MIT / Dartmouth', contributions: ['Organized Dartmouth Conference (1956)', 'Created Lisp programming language', 'Time-sharing computing concept'], era: 'foundations' },
  { name: 'Marvin Minsky', years: '1927\u20132016', role: 'Co-founder of MIT AI Lab', institution: 'MIT', contributions: ['Founded MIT AI Laboratory (1959)', '"Perceptrons" book with Papert (1969)', 'Society of Mind theory', 'Neural network research'], era: 'foundations' },
  { name: 'Frank Rosenblatt', years: '1928\u20131971', role: 'Inventor of the Perceptron', institution: 'Cornell University', contributions: ['Perceptron algorithm (1958)', 'First hardware neural network (Mark I)', 'Pioneered connectionist AI approach'], era: 'foundations' },

  // Winter & Revival
  { name: 'Judea Pearl', years: '1936\u2013', role: 'Pioneer of Bayesian Networks', institution: 'UCLA', contributions: ['Bayesian networks and causal inference', 'Turing Award (2011)', '"The Book of Why" \u2014 causal reasoning framework'], era: 'winter-revival' },
  { name: 'Geoffrey Hinton', years: '1947\u2013', role: 'Godfather of Deep Learning', institution: 'University of Toronto / Google', contributions: ['Backpropagation popularization (1986)', 'Boltzmann machines', 'Deep belief networks', 'Turing Award (2018)', 'Nobel Prize in Physics (2024)'], era: 'winter-revival' },
  { name: 'Yann LeCun', years: '1960\u2013', role: 'Father of Convolutional Networks', institution: 'Meta AI / NYU', contributions: ['Convolutional Neural Networks (1989)', 'LeNet for handwriting recognition', 'Self-supervised learning advocacy', 'Turing Award (2018)'], era: 'winter-revival' },
  { name: 'Yoshua Bengio', years: '1964\u2013', role: 'Pioneer of Deep Learning', institution: 'Mila / Universit\u00e9 de Montr\u00e9al', contributions: ['Neural language models', 'Attention mechanisms', 'Generative Adversarial Networks research', 'Turing Award (2018)'], era: 'winter-revival' },

  // Deep Learning Revolution
  { name: 'Andrew Ng', years: '1976\u2013', role: 'AI Educator & Entrepreneur', institution: 'Stanford / Google Brain / Coursera / DeepLearning.AI', contributions: ['Co-founded Google Brain', 'Coursera ML course (most popular online course)', 'Democratized AI education globally', 'Landing AI and AI Fund'], era: 'deep-learning' },
  { name: 'Fei-Fei Li', years: '1976\u2013', role: 'Godmother of AI', institution: 'Stanford / Google Cloud', contributions: ['ImageNet dataset and challenge (2009)', 'Catalyzed the deep learning revolution', 'Human-centered AI advocacy', 'Co-directed Stanford HAI'], era: 'deep-learning' },
  { name: 'Ian Goodfellow', years: '1985\u2013', role: 'Inventor of GANs', institution: 'Google DeepMind', contributions: ['Generative Adversarial Networks (2014)', 'Deep Learning textbook', 'Adversarial examples research'], era: 'deep-learning' },
  { name: 'Demis Hassabis', years: '1976\u2013', role: 'CEO of Google DeepMind', institution: 'Google DeepMind / Isomorphic Labs', contributions: ['Co-founded DeepMind (2010)', 'AlphaGo defeats world champion (2016)', 'AlphaFold protein structure prediction', 'Nobel Prize in Chemistry (2024)'], era: 'deep-learning' },
  { name: 'Ilya Sutskever', years: '1985\u2013', role: 'Co-founder of OpenAI & SSI', institution: 'OpenAI / Safe Superintelligence Inc.', contributions: ['AlexNet (2012, with Krizhevsky & Hinton)', 'Co-founded OpenAI', 'Led GPT research', 'Founded Safe Superintelligence Inc. (2024)'], era: 'deep-learning' },

  // Modern Era
  { name: 'Sam Altman', years: '1985\u2013', role: 'CEO of OpenAI', institution: 'OpenAI', contributions: ['Led development of ChatGPT', 'GPT-4, GPT-5 model releases', 'Drove mainstream AI adoption', 'Advocated for AI safety regulation'], era: 'modern' },
  { name: 'Dario Amodei', years: '1983\u2013', role: 'CEO of Anthropic', institution: 'Anthropic', contributions: ['Co-founded Anthropic (2021)', 'Constitutional AI approach', 'Claude model family', 'AI safety-first research organization'], era: 'modern' },
  { name: 'Andrej Karpathy', years: '1986\u2013', role: 'AI Educator & Researcher', institution: 'Tesla / OpenAI', contributions: ['Led Tesla Autopilot AI', 'GPT development at OpenAI', 'YouTube AI education (neural nets from scratch)', 'nanoGPT and minbpe open-source tools'], era: 'modern' },
  { name: 'Jensen Huang', years: '1963\u2013', role: 'CEO of NVIDIA', institution: 'NVIDIA', contributions: ['GPU computing revolution for AI', 'CUDA parallel computing platform', 'NVIDIA reached $3T+ market cap', 'Enabled modern deep learning at scale'], era: 'modern' },
  { name: 'Timnit Gebru', years: '1983\u2013', role: 'AI Ethics Researcher', institution: 'DAIR Institute', contributions: ['Co-authored "Stochastic Parrots" paper', 'Founded DAIR Institute', 'Black in AI co-founder', 'Pioneered AI bias and fairness research'], era: 'modern' },
  { name: 'Peter Steinberger', years: '1980\u2013', role: 'Creator of OpenClaw', institution: 'OpenAI', contributions: ['Created OpenClaw AI agent', '190K+ GitHub stars \u2014 viral open-source agent', 'Messaging-platform-native AI assistant', 'Joined OpenAI (2026) for next-gen agents'], era: 'modern' },
];

const AI_TOOLS: AITool[] = [
  { name: 'PyTorch', category: 'Deep Learning', description: 'Meta\'s open-source deep learning framework. Dynamic computation graphs, dominant in research.', url: 'https://pytorch.org', year: '2016\u2013' },
  { name: 'TensorFlow', category: 'Deep Learning', description: 'Google\'s production ML framework. TF 2.x with Keras integration, TFLite for mobile.', url: 'https://tensorflow.org', year: '2015\u2013' },
  { name: 'JAX', category: 'Deep Learning', description: 'Google\'s high-performance ML framework. NumPy-like API with XLA compilation and auto-differentiation.', url: 'https://github.com/google/jax', year: '2018\u2013' },
  { name: 'Hugging Face', category: 'Model Hub', description: 'The "GitHub of ML" \u2014 hosts 500K+ models, datasets, and Spaces. Transformers library is the standard.', url: 'https://huggingface.co', year: '2016\u2013' },
  { name: 'LangChain', category: 'LLM Framework', description: 'Modular framework for building LLM-powered applications. Chains, agents, tools, and memory management.', url: 'https://langchain.com', year: '2022\u2013' },
  { name: 'LlamaIndex', category: 'RAG Framework', description: 'Specializes in retrieval-augmented generation. Connects LLMs to documents, databases, and APIs.', url: 'https://llamaindex.ai', year: '2022\u2013' },
  { name: 'OpenClaw', category: 'AI Agent', description: 'Open-source autonomous AI agent. Integrates with WhatsApp, Discord, Slack. 190K+ GitHub stars.', url: 'https://github.com/AgeOfAI/OpenClaw', year: '2025\u2013' },
  { name: 'Weights & Biases', category: 'MLOps', description: 'Experiment tracking, model versioning, dataset management. Industry standard for ML observability.', url: 'https://wandb.ai', year: '2017\u2013' },
  { name: 'MLflow', category: 'MLOps', description: 'Open-source platform for ML lifecycle management. Experiment tracking, model registry, deployment.', url: 'https://mlflow.org', year: '2018\u2013' },
  { name: 'vLLM', category: 'Inference', description: 'High-throughput LLM serving with PagedAttention. 24x higher throughput than HuggingFace Transformers.', url: 'https://vllm.ai', year: '2023\u2013' },
  { name: 'Ollama', category: 'Local LLM', description: 'Run LLMs locally on your machine. One-command setup for Llama, Mistral, Gemma, and more.', url: 'https://ollama.com', year: '2023\u2013' },
  { name: 'Claude Code', category: 'AI Coding', description: 'Anthropic\'s CLI coding agent. Reads, writes, and debugs code autonomously with safety-first design.', url: 'https://claude.ai/claude-code', year: '2025\u2013' },
];

const AI_METHODS: AIMethod[] = [
  { name: 'Mixture of Experts (MoE)', description: 'Architecture where only a subset of "expert" sub-networks activate per input token. Enables trillion-parameter models with manageable compute costs. Used by GPT-5, DeepSeek V3, Mixtral, and most frontier models.', keyPapers: ['Shazeer et al. (2017) \u2014 Outrageously Large Neural Networks', 'Fedus et al. (2021) \u2014 Switch Transformers'], impact: 'Nearly all frontier LLMs in 2025-2026 use MoE architecture.' },
  { name: 'Multi-Head Latent Attention (MLA)', description: 'DeepSeek\'s innovation that compresses key-value caches into a low-rank latent space, reducing memory bandwidth by 5-13x during inference. Enables long-context models on consumer hardware.', keyPapers: ['DeepSeek V2/V3 technical reports'], impact: 'Dramatically reduces inference costs for long-context models.' },
  { name: 'Reasoning Models (Chain-of-Thought)', description: 'Models trained to "think step-by-step" before answering. Inference-time compute scaling: spending more tokens thinking improves accuracy on hard problems. Key examples: DeepSeek-R1, o1/o3, Claude with extended thinking.', keyPapers: ['Wei et al. (2022) \u2014 Chain-of-Thought Prompting', 'DeepSeek-R1 technical report'], impact: 'Shifted focus from training-time to inference-time scaling.' },
  { name: 'Retrieval-Augmented Generation (RAG)', description: 'Combines LLM generation with external document retrieval. The model searches a knowledge base before generating answers, grounding responses in factual data and reducing hallucination.', keyPapers: ['Lewis et al. (2020) \u2014 Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks'], impact: 'Standard pattern for production LLM applications.' },
  { name: 'Direct Preference Optimization (DPO)', description: 'Simplified alternative to RLHF. Trains models on human preference pairs without needing a separate reward model. Mathematically equivalent but more stable and easier to implement.', keyPapers: ['Rafailov et al. (2023) \u2014 Direct Preference Optimization'], impact: 'Becoming preferred over RLHF for alignment due to simplicity.' },
  { name: 'Constitutional AI (CAI)', description: 'Self-supervision approach where the AI critiques and revises its own outputs based on a set of principles ("constitution"). Reduces reliance on human feedback for safety training.', keyPapers: ['Bai et al. (2022) \u2014 Constitutional AI: Harmlessness from AI Feedback'], impact: 'Pioneered by Anthropic, influenced alignment across the industry.' },
  { name: 'State Space Models (Mamba)', description: 'Alternative to Transformers that processes sequences in linear time (vs quadratic for attention). Selective state spaces enable efficient long-sequence modeling without attention mechanisms.', keyPapers: ['Gu & Dao (2023) \u2014 Mamba: Linear-Time Sequence Modeling with Selective State Spaces'], impact: 'Hybrid Mamba-attention models used in NVIDIA Nemotron and others.' },
  { name: 'Agentic AI', description: 'AI systems that autonomously plan, use tools, execute code, browse the web, and complete multi-step tasks. Shifted from single-turn Q&A to autonomous workflows.', keyPapers: ['Significant Gravitas \u2014 AutoGPT (2023)', 'OpenClaw (2025)'], impact: '2025-2026 is the "Year of Agents" \u2014 every major lab ships agent products.' },
  { name: 'Multimodal Foundation Models', description: 'Single models that process text, images, audio, video, and code natively. Vision-language models like GPT-4V, Claude with vision, and Gemini handle diverse inputs in one architecture.', keyPapers: ['Alayrac et al. (2022) \u2014 Flamingo', 'OpenAI GPT-4V technical report'], impact: 'Multimodal is now the default, not the exception.' },
  { name: 'Sparse Attention & Efficient Transformers', description: 'Techniques to reduce the quadratic cost of attention: sliding window attention, grouped-query attention, flash attention, and DeepSeek Sparse Attention (DSA) which reduces costs 50-75%.', keyPapers: ['Dao et al. (2022) \u2014 FlashAttention', 'DeepSeek DSA technical report'], impact: 'Enables million-token context windows in production.' },
];

// ============================================================================
// Components
// ============================================================================

const PioneerCard: React.FC<{ pioneer: Pioneer; index: number }> = ({ pioneer, index }) => {
  const [expanded, setExpanded] = useState(false);
  const eraConfig = ERAS[pioneer.era];

  return (
    <motion.div
      className="glass rounded-2xl p-4 border-l-[3px] cursor-pointer"
      style={{ borderLeftColor: eraConfig.color }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-her-dark dark:text-her-cream text-sm">{pioneer.name}</h3>
          <p className="text-xs text-her-dark/50 dark:text-her-cream/50">{pioneer.years}</p>
          <p className="text-xs mt-0.5" style={{ color: eraConfig.color }}>{pioneer.role}</p>
          <p className="text-[11px] text-her-dark/50 dark:text-her-cream/50">{pioneer.institution}</p>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-her-dark/40 dark:text-her-cream/40 transition-transform duration-200 mt-1 shrink-0 ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ul className="mt-2 space-y-1 border-t border-her-dark/5 dark:border-white/5 pt-2">
              {pioneer.contributions.map((c, i) => (
                <li key={i} className="text-xs text-her-dark/60 dark:text-her-cream/60 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: eraConfig.color }} />
                  {c}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ToolCard: React.FC<{ tool: AITool; index: number }> = ({ tool, index }) => (
  <motion.a
    href={tool.url}
    target="_blank"
    rel="noopener noreferrer"
    className="glass rounded-2xl p-3 hover:border-her-red/30 border border-transparent transition-colors group block"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.03 }}
  >
    <div className="flex items-center justify-between mb-1">
      <h4 className="text-sm font-medium text-her-dark dark:text-her-cream group-hover:text-her-red transition-colors">{tool.name}</h4>
      <span className="text-[10px] bg-her-red/10 text-her-red px-1.5 py-0.5 rounded-full">{tool.category}</span>
    </div>
    <p className="text-xs text-her-dark/50 dark:text-her-cream/50 leading-relaxed">{tool.description}</p>
    <p className="text-[10px] text-her-dark/50 dark:text-her-cream/50 mt-1">{tool.year}</p>
  </motion.a>
);

const MethodCard: React.FC<{ method: AIMethod; index: number }> = ({ method, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className="glass rounded-2xl p-4 cursor-pointer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between">
        <h4 className="text-sm font-medium text-her-dark dark:text-her-cream flex-1">{method.name}</h4>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-her-dark/40 dark:text-her-cream/40 transition-transform duration-200 shrink-0 ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <p className="text-xs text-her-dark/50 dark:text-her-cream/50 mt-1 leading-relaxed">{method.description}</p>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-2 border-t border-her-dark/5 dark:border-white/5 space-y-2">
              <div>
                <p className="text-[10px] text-her-dark/50 dark:text-her-cream/50 uppercase tracking-wider mb-1">Key Papers</p>
                {method.keyPapers.map((p, i) => (
                  <p key={i} className="text-xs text-her-dark/60 dark:text-her-cream/60 italic">{p}</p>
                ))}
              </div>
              <div>
                <p className="text-[10px] text-her-dark/50 dark:text-her-cream/50 uppercase tracking-wider mb-1">Impact</p>
                <p className="text-xs text-emerald-400">{method.impact}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// Timeline Visualization
// ============================================================================

const Timeline: React.FC = () => (
  <div className="relative mb-8">
    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-tier-1 via-tier-3 to-tier-5 opacity-30" />
    {(Object.entries(ERAS) as [keyof typeof ERAS, typeof ERAS[keyof typeof ERAS]][]).map(([key, era]) => (
      <div key={key} className="relative pl-10 mb-6">
        <div
          className="absolute left-2.5 w-3 h-3 rounded-full border-2 border-[#0F0A0A]"
          style={{ backgroundColor: era.color, top: '4px' }}
        />
        <h3 className="text-sm font-semibold" style={{ color: era.color }}>{era.label}</h3>
        <p className="text-xs text-her-dark/50 dark:text-her-cream/50">{era.years}</p>
        <p className="text-xs text-her-dark/40 dark:text-her-cream/40 mt-0.5">{era.description}</p>
      </div>
    ))}
  </div>
);

// ============================================================================
// Main Page
// ============================================================================

type Tab = 'pioneers' | 'tools' | 'methods';

export const AIPioneers: React.FC = () => {
  const [tab, setTab] = useState<Tab>('pioneers');
  const [eraFilter, setEraFilter] = useState<string | null>(null);

  const filteredPioneers = eraFilter
    ? PIONEERS.filter(p => p.era === eraFilter)
    : PIONEERS;

  return (
    <div className="min-h-screen overflow-y-auto transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back button */}
        <button
          onClick={() => navigate('/learn')}
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-her-dark/40 dark:text-her-cream/40 hover:text-her-red mb-8 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Learning
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-light tracking-[0.05em] text-her-dark dark:text-her-cream mb-2">
            AI/ML Encyclopedia
          </h1>
          <p className="text-sm text-her-dark/40 dark:text-her-cream/40 mb-8">
            Key figures, cutting-edge methods, and essential tools in artificial intelligence
          </p>
        </motion.div>

        {/* Tab navigation */}
        <div className="flex gap-1 mb-8 glass rounded-full p-1">
          {([
            { id: 'pioneers' as Tab, label: 'Pioneers & History', count: PIONEERS.length },
            { id: 'methods' as Tab, label: 'Cutting-Edge Methods', count: AI_METHODS.length },
            { id: 'tools' as Tab, label: 'Tools & Frameworks', count: AI_TOOLS.length },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-full transition-all ${
                tab === t.id
                  ? 'bg-white dark:bg-white/15 text-her-dark dark:text-her-cream shadow-sm'
                  : 'text-her-dark/50 dark:text-her-cream/50 hover:text-her-dark dark:hover:text-her-cream'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-xs ${tab === t.id ? 'text-her-dark/40 dark:text-her-cream/40' : 'text-her-dark/30 dark:text-her-cream/30'}`}>
                ({t.count})
              </span>
            </button>
          ))}
        </div>

        {/* Pioneers Tab */}
        {tab === 'pioneers' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Timeline />

            {/* Era filter chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setEraFilter(null)}
                className={`px-3 py-1 text-xs rounded-full transition-all ${
                  eraFilter === null ? 'bg-white/20 text-her-dark dark:text-white' : 'bg-white/5 text-her-dark/40 dark:text-her-cream/40 hover:text-her-dark dark:hover:text-her-cream'
                }`}
              >
                All Eras
              </button>
              {(Object.entries(ERAS) as [string, { label: string; color: string }][]).map(([key, era]) => (
                <button
                  key={key}
                  onClick={() => setEraFilter(eraFilter === key ? null : key)}
                  className={`px-3 py-1 text-xs rounded-full transition-all border ${
                    eraFilter === key
                      ? 'border-current'
                      : 'border-transparent hover:border-current/30'
                  }`}
                  style={{ color: era.color, backgroundColor: eraFilter === key ? `${era.color}15` : 'transparent' }}
                >
                  {era.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredPioneers.map((pioneer, i) => (
                <PioneerCard key={pioneer.name} pioneer={pioneer} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Methods Tab */}
        {tab === 'methods' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <p className="text-sm text-her-dark/40 dark:text-her-cream/40 mb-6 font-serif">
              The most important architectural innovations and training techniques shaping AI in 2025\u20132026.
            </p>
            <div className="space-y-3">
              {AI_METHODS.map((method, i) => (
                <MethodCard key={method.name} method={method} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Tools Tab */}
        {tab === 'tools' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <p className="text-sm text-her-dark/40 dark:text-her-cream/40 mb-6 font-serif">
              Essential frameworks, platforms, and tools for modern AI/ML development.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AI_TOOLS.map((tool, i) => (
                <ToolCard key={tool.name} tool={tool} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-her-dark/5 dark:border-white/5">
          <p className="text-xs text-her-dark/30 dark:text-her-cream/30">
            Data compiled from TIME 100 AI (2025), Nobel Prize archives, ACM Turing Award records, and current research publications.
          </p>
        </div>
      </div>
    </div>
  );
};
