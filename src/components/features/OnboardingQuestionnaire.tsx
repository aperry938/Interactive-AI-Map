import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OnboardingProfile } from '../../types';
import { getConceptsByTier } from '../../data/curriculum';
import type { Tier } from '../../types';
import { TIER_CONFIG } from '../../types';

interface OnboardingQuestionnaireProps {
  onComplete: (profile: OnboardingProfile) => void;
  onSkip: () => void;
}

const TOTAL_STEPS = 5;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

const PRIOR_COURSES = [
  { id: 'linear-algebra', label: 'Linear Algebra' },
  { id: 'probability', label: 'Probability & Statistics' },
  { id: 'intro-ml', label: 'Intro to ML' },
  { id: 'deep-learning', label: 'Deep Learning' },
  { id: 'nlp', label: 'NLP' },
  { id: 'computer-vision', label: 'Computer Vision' },
  { id: 'reinforcement-learning', label: 'Reinforcement Learning' },
];

const MATH_LABELS = [
  'No math background',
  'Basic algebra & stats',
  'Calculus & linear algebra',
  'Multivariate calc & proofs',
  'Graduate-level math',
];

export const OnboardingQuestionnaire: React.FC<OnboardingQuestionnaireProps> = ({
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const stepContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // After animation settles, focus the step heading
    const timer = setTimeout(() => {
      const heading = stepContainerRef.current?.querySelector('h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [step]);

  // Step 1
  const [experienceLevel, setExperienceLevel] = useState<OnboardingProfile['experienceLevel'] | null>(null);
  // Step 2
  const [mathComfort, setMathComfort] = useState<number>(1);
  const [programmingLevel, setProgrammingLevel] = useState<OnboardingProfile['programmingLevel']>('none');
  const [priorCourses, setPriorCourses] = useState<string[]>([]);
  // Step 3
  const [mlFamiliarity, setMlFamiliarity] = useState<string[]>([]);
  // Step 4
  const [learningGoal, setLearningGoal] = useState<OnboardingProfile['learningGoal'] | null>(null);

  const canProceed = (): boolean => {
    if (step === 0) return experienceLevel !== null;
    if (step === 1) return true;
    if (step === 2) return true;
    if (step === 3) return learningGoal !== null;
    if (step === 4) return true;
    return false;
  };

  const goNext = () => {
    if (step === TOTAL_STEPS - 1) {
      onComplete({
        experienceLevel: experienceLevel!,
        mathComfort: mathComfort as OnboardingProfile['mathComfort'],
        programmingLevel,
        mlFamiliarity,
        learningGoal: learningGoal!,
        priorCourses,
        completedAt: Date.now(),
      });
      return;
    }
    setDirection(1);
    setStep(s => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(s => Math.max(0, s - 1));
  };

  const toggleCourse = (id: string) => {
    setPriorCourses(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleFamiliarity = (id: string) => {
    setMlFamiliarity(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-her-dark/95 backdrop-blur-md flex flex-col" role="dialog" aria-modal="true" aria-label="Onboarding questionnaire">
      {/* Progress bar */}
      <div className="w-full px-6 pt-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-her-cream/40">Step {step + 1} of {TOTAL_STEPS}</span>
            <button
              onClick={onSkip}
              className="text-xs text-her-cream/30 hover:text-her-cream/60 transition-colors"
            >
              Skip Onboarding
            </button>
          </div>
          <div className="h-1 bg-her-dark/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-her-red to-her-orange"
              initial={false}
              animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 overflow-y-auto">
        <div className="w-full max-w-xl" ref={stepContainerRef}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {step === 0 && (
                <StepExperience
                  selected={experienceLevel}
                  onSelect={setExperienceLevel}
                />
              )}
              {step === 1 && (
                <StepBackground
                  mathComfort={mathComfort}
                  onMathChange={setMathComfort}
                  programmingLevel={programmingLevel}
                  onProgrammingChange={setProgrammingLevel}
                  priorCourses={priorCourses}
                  onToggleCourse={toggleCourse}
                />
              )}
              {step === 2 && (
                <StepFamiliarity
                  selected={mlFamiliarity}
                  onToggle={toggleFamiliarity}
                />
              )}
              {step === 3 && (
                <StepGoal
                  selected={learningGoal}
                  onSelect={setLearningGoal}
                />
              )}
              {step === 4 && (
                <StepSummary
                  experienceLevel={experienceLevel}
                  mathComfort={mathComfort}
                  programmingLevel={programmingLevel}
                  priorCourses={priorCourses}
                  mlFamiliarity={mlFamiliarity}
                  learningGoal={learningGoal}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-6">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            onClick={goBack}
            disabled={step === 0}
            className="px-4 py-2 text-sm text-her-cream/40 hover:text-her-cream transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            onClick={goNext}
            disabled={!canProceed()}
            className="bg-white text-her-dark rounded-full px-6 py-2.5 font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {step === TOTAL_STEPS - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Step Components
// ============================================================================

const StepExperience: React.FC<{
  selected: string | null;
  onSelect: (v: OnboardingProfile['experienceLevel']) => void;
}> = ({ selected, onSelect }) => {
  const options = [
    {
      value: 'beginner' as const,
      title: 'Beginner',
      desc: 'New to AI/ML — excited to learn the basics',
    },
    {
      value: 'intermediate' as const,
      title: 'Intermediate',
      desc: 'Taken a course or two, comfortable with core concepts',
    },
    {
      value: 'advanced' as const,
      title: 'Advanced',
      desc: 'Working professional or researcher, deep ML background',
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-light text-her-cream mb-2 text-center">
        What's your experience with AI/ML?
      </h2>
      <p className="text-sm text-her-cream/50 mb-8 text-center">
        This helps us personalize your learning path
      </p>
      <div className="grid gap-3" role="radiogroup" aria-label="Experience level">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            role="radio"
            aria-checked={selected === opt.value}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              selected === opt.value
                ? 'border-her-red/40 bg-her-red/5'
                : 'border-her-dark/10 dark:border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <div>
              <p className="font-medium text-her-cream">{opt.title}</p>
              <p className="text-sm text-her-cream/50">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const StepBackground: React.FC<{
  mathComfort: number;
  onMathChange: (v: number) => void;
  programmingLevel: OnboardingProfile['programmingLevel'];
  onProgrammingChange: (v: OnboardingProfile['programmingLevel']) => void;
  priorCourses: string[];
  onToggleCourse: (id: string) => void;
}> = ({ mathComfort, onMathChange, programmingLevel, onProgrammingChange, priorCourses, onToggleCourse }) => {
  const progOptions: { value: OnboardingProfile['programmingLevel']; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'basic', label: 'Basic' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-light text-her-cream mb-2 text-center">
        Your Background
      </h2>
      <p className="text-sm text-her-cream/50 mb-6 text-center">
        Help us understand your strengths
      </p>

      {/* Math comfort */}
      <div className="mb-6">
        <label className="block text-[10px] uppercase tracking-[0.2em] text-her-cream/60 mb-2">
          Math Comfort Level
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={mathComfort}
          onChange={e => onMathChange(Number(e.target.value))}
          className="w-full accent-her-red"
          aria-label="Math comfort level"
          aria-valuetext={MATH_LABELS[mathComfort - 1]}
        />
        <div className="flex justify-between mt-1">
          {MATH_LABELS.map((label, i) => (
            <span
              key={i}
              className={`text-[10px] max-w-[60px] text-center leading-tight ${
                mathComfort === i + 1 ? 'text-her-red font-medium' : 'text-her-cream/40'
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Programming */}
      <div className="mb-6">
        <label className="block text-[10px] uppercase tracking-[0.2em] text-her-cream/60 mb-2">
          Programming Proficiency
        </label>
        <div className="grid grid-cols-4 gap-2">
          {progOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onProgrammingChange(opt.value)}
              className={`py-2 px-3 text-xs rounded-lg border transition-all ${
                programmingLevel === opt.value
                  ? 'border-her-red/40 bg-her-red/5 text-her-red'
                  : 'border-her-dark/10 dark:border-white/10 text-her-cream/50 hover:border-white/20'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prior courses */}
      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-her-cream/60 mb-2">
          Prior Coursework <span className="text-her-cream/30 font-normal">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {PRIOR_COURSES.map(course => (
            <button
              key={course.id}
              onClick={() => onToggleCourse(course.id)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                priorCourses.includes(course.id)
                  ? 'border-her-red/40 bg-her-red/5 text-her-red'
                  : 'border-her-dark/10 dark:border-white/10 text-her-cream/50 hover:border-white/20'
              }`}
            >
              {course.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const StepFamiliarity: React.FC<{
  selected: string[];
  onToggle: (id: string) => void;
}> = ({ selected, onToggle }) => {
  const tiers = [1, 2, 3, 4, 5] as Tier[];

  return (
    <div>
      <h2 className="text-2xl font-light text-her-cream mb-2 text-center">
        Concept Familiarity
      </h2>
      <p className="text-sm text-her-cream/50 mb-6 text-center">
        Tap concepts you're already familiar with
      </p>
      <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-4">
        {tiers.map(tier => {
          const concepts = getConceptsByTier(tier);
          if (concepts.length === 0) return null;
          return (
            <div key={tier}>
              <p className="text-xs font-medium mb-2" style={{ color: TIER_CONFIG[tier].color }}>
                {TIER_CONFIG[tier].label}
              </p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={`${TIER_CONFIG[tier].label} concepts`}>
                {concepts.map(c => (
                  <button
                    key={c.id}
                    onClick={() => onToggle(c.id)}
                    role="checkbox"
                    aria-checked={selected.includes(c.id)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                      selected.includes(c.id)
                        ? ''
                        : 'border-her-dark/10 dark:border-white/10 text-her-cream/50 hover:border-white/20'
                    }`}
                    style={
                      selected.includes(c.id)
                        ? {
                            borderColor: TIER_CONFIG[tier].color,
                            backgroundColor: `${TIER_CONFIG[tier].color}20`,
                            color: TIER_CONFIG[tier].color,
                          }
                        : undefined
                    }
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StepGoal: React.FC<{
  selected: string | null;
  onSelect: (v: OnboardingProfile['learningGoal']) => void;
}> = ({ selected, onSelect }) => {
  const goals = [
    {
      value: 'explore' as const,
      title: 'Explore',
      desc: 'Curious about AI, no specific goal',
    },
    {
      value: 'career' as const,
      title: 'Career',
      desc: 'Preparing for ML engineer roles',
    },
    {
      value: 'research' as const,
      title: 'Research',
      desc: 'Preparing for graduate research',
    },
    {
      value: 'academic' as const,
      title: 'Academic',
      desc: 'Supplementing coursework',
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-light text-her-cream mb-2 text-center">
        What's Your Goal?
      </h2>
      <p className="text-sm text-her-cream/50 mb-8 text-center">
        We'll tailor recommendations to your path
      </p>
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Learning goal">
        {goals.map(goal => (
          <button
            key={goal.value}
            onClick={() => onSelect(goal.value)}
            role="radio"
            aria-checked={selected === goal.value}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              selected === goal.value
                ? 'border-her-red/40 bg-her-red/5'
                : 'border-her-dark/10 dark:border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <p className="font-medium text-her-cream text-sm">{goal.title}</p>
            <p className="text-xs text-her-cream/50 mt-1">{goal.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

const StepSummary: React.FC<{
  experienceLevel: string | null;
  mathComfort: number;
  programmingLevel: string;
  priorCourses: string[];
  mlFamiliarity: string[];
  learningGoal: string | null;
}> = ({ experienceLevel, mathComfort, programmingLevel, priorCourses, mlFamiliarity, learningGoal }) => (
  <div>
    <h2 className="text-2xl font-light text-her-cream mb-2 text-center">Review Your Profile</h2>
    <p className="text-sm text-her-cream/50 mb-6 text-center">Confirm your selections before we personalize your experience</p>
    <div className="space-y-4 rounded-xl border border-her-dark/10 dark:border-white/10 bg-white/5 p-4">
      <SummaryRow label="Experience" value={experienceLevel ?? 'Not set'} />
      <SummaryRow label="Math Comfort" value={`${mathComfort}/5 — ${MATH_LABELS[mathComfort - 1]}`} />
      <SummaryRow label="Programming" value={programmingLevel} />
      <SummaryRow label="Prior Courses" value={priorCourses.length > 0 ? priorCourses.map(c => PRIOR_COURSES.find(p => p.id === c)?.label ?? c).join(', ') : 'None'} />
      <SummaryRow label="Familiar Concepts" value={mlFamiliarity.length > 0 ? `${mlFamiliarity.length} selected` : 'None'} />
      <SummaryRow label="Goal" value={learningGoal ?? 'Not set'} />
    </div>
  </div>
);

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-start">
    <span className="text-xs text-her-cream/40">{label}</span>
    <span className="text-sm text-her-cream/80 text-right max-w-[60%] capitalize">{value}</span>
  </div>
);
