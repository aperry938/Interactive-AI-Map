import React, { useRef, useEffect } from 'react';
import { navigate } from '../../router/AppRouter';
import { useLearner } from '../../stores/learnerStore';
import { downloadLearnerData } from '../../services/dataExport';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const MathInline: React.FC<{ latex: string }> = ({ latex }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current) {
      try { katex.render(latex, ref.current, { displayMode: false, throwOnError: false }); } catch { /* fallback */ }
    }
  }, [latex]);
  return <span ref={ref} />;
};

const MathBlock: React.FC<{ latex: string }> = ({ latex }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      try { katex.render(latex, ref.current, { displayMode: true, throwOnError: false }); } catch { /* fallback */ }
    }
  }, [latex]);
  return <div ref={ref} className="my-4" />;
};

export const AboutPage: React.FC = () => {
  const { profile } = useLearner();

  return (
    <div className="min-h-screen overflow-y-auto transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate('/learn')}
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/30 hover:text-white/60 mb-8 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Learning
        </button>

        <h1 className="text-3xl font-light tracking-[0.05em] text-white/85 mb-2">
          Research Presentation
        </h1>
        <p className="text-sm text-white/35 mb-10">
          Adaptive Interactive Visualization for AI/ML Concept Learning
        </p>

        {/* Abstract */}
        <Section title="Abstract">
          <p className="text-sm text-white/45 font-light leading-relaxed mb-3">
            This project presents an adaptive, web-based interactive learning platform for
            artificial intelligence and machine learning concepts. The system integrates
            Bayesian Knowledge Tracing (BKT) for mastery estimation, spaced repetition
            scheduling for long-term retention, and adaptive difficulty selection to
            personalize the learning experience.
          </p>
          <p className="text-sm text-white/45 font-light leading-relaxed mb-3">
            The platform features a force-directed knowledge graph for navigation across
            40 concepts organized in 5 progressive tiers, 6 interactive explorations
            with real-time computation (gradient descent, neural network backpropagation,
            attention mechanisms, decision boundaries, data preprocessing, and reinforcement
            learning), and a multi-format quiz system with progressive hints.
          </p>
          <p className="text-sm text-white/45 font-light leading-relaxed">
            Grounded in Cognitive Load Theory, explorable explanations, and the visual
            information-seeking mantra, this tool bridges the gap between static textbook
            diagrams and production ML frameworks, offering a research-grade platform for
            studying how interactive visualization affects conceptual understanding.
          </p>
        </Section>

        {/* Research Question */}
        <Section title="Research Question">
          <p className="text-white/50 font-light italic text-lg leading-relaxed">
            "How can adaptive interactive visualization, guided by Bayesian Knowledge
            Tracing and spaced repetition algorithms, improve conceptual understanding
            and long-term retention of AI/ML concepts across different expertise levels?"
          </p>
        </Section>

        {/* Theoretical Framework */}
        <Section title="Theoretical Framework">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <FrameworkCard
              title="Cognitive Load Theory"
              author="Sweller, 1988"
              description="Complex material is segmented into progressive levels. Each concept begins with plain-English intuition, then reveals technical detail only on request, preventing cognitive overload."
            />
            <FrameworkCard
              title="Bayesian Knowledge Tracing"
              author="Corbett & Anderson, 1994"
              description="Probabilistic model estimating the probability a learner has mastered each concept, updated after every quiz attempt using Bayesian inference."
            />
            <FrameworkCard
              title="Spaced Repetition"
              author="Ebbinghaus, 1885; Leitner, 1972"
              description="Concepts are reviewed at increasing intervals calibrated to the forgetting curve, maximizing long-term retention with minimal study time."
            />
            <FrameworkCard
              title="Explorable Explanations"
              author="Victor, 2011"
              description="Readers don't passively consume — they actively explore. Every visualization is interactive, building intuition through direct manipulation."
            />
          </div>
        </Section>

        {/* System Architecture */}
        <Section title="System Architecture">
          <div className="bg-white/[0.06] backdrop-blur-[12px] border border-white/[0.08] rounded-2xl p-6">
            <div className="flex flex-col gap-2">
              {[
                { label: 'Data Layer', desc: 'Curriculum graph (40 nodes, 5 tiers), quiz items, prerequisite DAG' },
                { label: 'Adaptive Engine', desc: 'BKT mastery tracking, SM-2 spaced repetition, difficulty adjuster, recommender' },
                { label: 'Interaction Layer', desc: 'Knowledge graph (D3 force), 6 Canvas explorations, multi-format quizzes' },
                { label: 'Learner State', desc: 'React Context store, localStorage persistence, session analytics' },
                { label: 'Presentation', desc: 'Responsive UI, dark mode, glass-morphism, particle background' },
              ].map((layer, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                  <div className="w-3 h-3 rounded-full bg-white/40 shrink-0" />
                  <div>
                    <span className="text-sm font-light text-white/70">{layer.label}</span>
                    <span className="text-xs text-white/35 ml-2">{layer.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* BKT Methodology */}
        <Section title="BKT Methodology">
          <p className="text-sm text-white/45 font-light leading-relaxed mb-4">
            Bayesian Knowledge Tracing models the probability <MathInline latex="P(L_n)" /> that
            a learner has mastered a concept after <MathInline latex="n" /> practice opportunities.
            The model uses four parameters per concept:
          </p>
          <ul className="space-y-1 text-sm text-white/45 font-light mb-4 ml-4">
            <li><MathInline latex="P(L_0)" /> — prior probability of knowing the concept</li>
            <li><MathInline latex="P(T)" /> — probability of transitioning from unknown to known</li>
            <li><MathInline latex="P(S)" /> — probability of slipping (incorrect despite knowing)</li>
            <li><MathInline latex="P(G)" /> — probability of guessing (correct despite not knowing)</li>
          </ul>
          <p className="text-sm text-white/45 font-light leading-relaxed mb-2">
            After observing a correct response:
          </p>
          <MathBlock latex="P(L_n | \text{correct}) = \frac{P(L_{n-1})(1 - P(S))}{P(L_{n-1})(1 - P(S)) + (1 - P(L_{n-1}))P(G)}" />
          <p className="text-sm text-white/45 font-light leading-relaxed mb-2">
            After observing an incorrect response:
          </p>
          <MathBlock latex="P(L_n | \text{incorrect}) = \frac{P(L_{n-1})P(S)}{P(L_{n-1})P(S) + (1 - P(L_{n-1}))(1 - P(G))}" />
          <p className="text-sm text-white/45 font-light leading-relaxed">
            The transition step is then applied: <MathInline latex="P(L_n) = P(L_n|\text{obs}) + (1 - P(L_n|\text{obs}))P(T)" />.
            Mastery is achieved when <MathInline latex="P(L) \geq 0.85" />.
          </p>
        </Section>

        {/* Evaluation Plan */}
        <Section title="Evaluation Plan">
          <div className="space-y-4">
            <div className="bg-white/[0.06] backdrop-blur-[12px] border border-white/[0.08] rounded-2xl p-4">
              <h3 className="text-white/70 font-light mb-1">A/B Testing</h3>
              <p className="text-sm text-white/40 font-light leading-relaxed">
                Compare learning outcomes between adaptive (BKT-driven) and non-adaptive
                (fixed sequence) conditions. Measure pre/post concept inventory scores,
                time-to-mastery, and retention at 1-week and 4-week intervals.
              </p>
            </div>
            <div className="bg-white/[0.06] backdrop-blur-[12px] border border-white/[0.08] rounded-2xl p-4">
              <h3 className="text-white/70 font-light mb-1">Think-Aloud Protocols</h3>
              <p className="text-sm text-white/40 font-light leading-relaxed">
                Qualitative analysis of 10-15 participants verbalizing thought processes
                while using the interactive explorations. Code transcripts for conceptual
                breakthroughs, misconceptions, and interface friction points.
              </p>
            </div>
            <div className="bg-white/[0.06] backdrop-blur-[12px] border border-white/[0.08] rounded-2xl p-4">
              <h3 className="text-white/70 font-light mb-1">System Usability Scale (SUS)</h3>
              <p className="text-sm text-white/40 font-light leading-relaxed">
                Standardized 10-item questionnaire to assess perceived usability.
                Target: SUS score above 80 (excellent usability).
              </p>
            </div>
            <div className="bg-white/[0.06] backdrop-blur-[12px] border border-white/[0.08] rounded-2xl p-4">
              <h3 className="text-white/70 font-light mb-1">Learning Analytics</h3>
              <p className="text-sm text-white/40 font-light leading-relaxed">
                Client-side learner data (mastery trajectories, quiz accuracy, session
                patterns) can be exported as JSON for quantitative analysis.
              </p>
              <button
                onClick={() => downloadLearnerData(profile)}
                className="mt-2 text-xs bg-white/[0.06] backdrop-blur-[12px] border border-white/[0.08] rounded-full text-white/40 hover:text-white/60 px-3 py-1.5 transition-colors"
              >
                Export My Learning Data
              </button>
            </div>
          </div>
        </Section>

        {/* Bibliography */}
        <Section title="References">
          <ul className="space-y-2 text-sm text-white/30">
            <li>Anderson, J. R., Corbett, A. T., Koedinger, K. R., & Pelletier, R. (1995). Cognitive tutors: Lessons learned. <em>The Journal of the Learning Sciences</em>, 4(2), 167-207.</li>
            <li>Bostock, M., Ogievetsky, V., & Heer, J. (2011). D3: Data-driven documents. <em>IEEE Transactions on Visualization and Computer Graphics</em>, 17(12), 2301-2309.</li>
            <li>Corbett, A. T., & Anderson, J. R. (1994). Knowledge tracing: Modeling the acquisition of procedural knowledge. <em>User Modeling and User-Adapted Interaction</em>, 4(4), 253-278.</li>
            <li>Ebbinghaus, H. (1885). <em>Memory: A contribution to experimental psychology</em>. Teachers College, Columbia University.</li>
            <li>Hohman, F., Park, H., Robinson, C., & Chau, D. H. (2020). Summit: Scaling deep learning interpretability by visualizing activation and attribution summarizations. <em>IEEE VIS</em>.</li>
            <li>Leitner, S. (1972). <em>So lernt man lernen</em>. Freiburg: Herder.</li>
            <li>Pashler, H., et al. (2007). Organizing instruction and study to improve student learning. <em>IES Practice Guide, NCER 2007-2004</em>.</li>
            <li>Piech, C., et al. (2015). Deep knowledge tracing. <em>Advances in Neural Information Processing Systems</em>, 28.</li>
            <li>Roediger, H. L., & Butler, A. C. (2011). The critical role of retrieval practice in long-term retention. <em>Trends in Cognitive Sciences</em>, 15(1), 20-27.</li>
            <li>Shneiderman, B. (1996). The eyes have it: A task by data type taxonomy for information visualizations. <em>IEEE Symposium on Visual Languages</em>.</li>
            <li>Smilkov, D., et al. (2017). Direct-manipulation visualization of deep networks. <em>ICML Workshop on Visualization for Deep Learning</em>.</li>
            <li>Sweller, J. (1988). Cognitive load during problem solving: Effects on learning. <em>Cognitive Science</em>, 12(2), 257-285.</li>
            <li>Sweller, J., Ayres, P., & Kalyuga, S. (2011). <em>Cognitive Load Theory</em>. Springer.</li>
            <li>Victor, B. (2011). Explorable Explanations. <em>worrydream.com/ExplorableExplanations</em>.</li>
            <li>Wattenberg, M., Vigas, F., & Johnson, I. (2016). How to use t-SNE effectively. <em>Distill</em>.</li>
            <li>Yudelson, M. V., Koedinger, K. R., & Gordon, G. J. (2013). Individualized Bayesian knowledge tracing models. <em>AIED</em>.</li>
          </ul>
        </Section>

        <div className="mt-12 pt-8 border-t border-white/[0.04]">
          <p className="text-sm text-white/30">
            Built by{' '}
            <a href="https://aperry938.github.io" target="_blank" rel="noopener noreferrer"
              className="text-her-red hover:text-her-orange underline underline-offset-2">
              Anthony C. Perry
            </a>
            {' '}&middot; Human-Centered AI Research Portfolio
          </p>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-10">
    <h2 className="text-lg font-light tracking-[0.05em] text-white/70 mb-4">{title}</h2>
    {children}
  </div>
);

const FrameworkCard: React.FC<{ title: string; author: string; description: string }> = ({
  title, author, description
}) => (
  <div className="bg-white/[0.06] backdrop-blur-[12px] border border-white/[0.08] rounded-2xl p-4 border-l border-white/[0.06]">
    <div className="flex items-baseline gap-2 mb-1">
      <h3 className="text-sm font-light text-white/70">{title}</h3>
    </div>
    <p className="text-xs text-white/25 mb-1">({author})</p>
    <p className="text-xs text-white/40 font-light leading-relaxed">{description}</p>
  </div>
);
