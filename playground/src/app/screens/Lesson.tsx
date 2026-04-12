import confetti from 'canvas-confetti';
import { Check, ChevronLeft, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { Button } from '../components/Button';

const lessonData = {
  world: 'World 2',
  title: 'Understanding Dollar-Cost Averaging',
  concept: {
    explanation:
      'Dollar-cost averaging (DCA) is an investment strategy where you invest a fixed amount of money at regular intervals, regardless of the market price. Instead of trying to time the market or investing a lump sum all at once, you spread your investment over time.\n\nFor example: investing $200 every month into an index fund, whether the market is up or down. When prices are low, your $200 buys more shares. When prices are high, it buys fewer shares. Over time, this averages out your purchase price.',
    takeaway:
      'DCA removes emotion from investing and helps you build wealth consistently without timing the market.',
  },
  scenario: {
    situation:
      "You just got a $12,000 bonus at work. You want to invest it all in an index fund. Your friend says you should wait for the market to drop before investing. What's the smarter DCA approach?",
    choices: [
      {
        text: 'Invest all $12,000 right now before the market goes up',
        correct: false,
        explanation:
          'This is lump-sum investing, not DCA. While it can work, it exposes you to short-term volatility risk.',
      },
      {
        text: 'Split the $12,000 into 12 monthly investments of $1,000',
        correct: true,
        explanation:
          "Perfect! This is dollar-cost averaging. You'll invest $1,000 every month for a year, buying at different price points and averaging out market volatility.",
      },
      {
        text: 'Wait for the market to crash, then invest everything',
        correct: false,
        explanation:
          'This is market timing, which rarely works. You might wait months or years for a crash that never comes, missing out on gains.',
      },
    ],
  },
};

export function Lesson() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'concept' | 'scenario' | 'result'>('concept');
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [xp, setXp] = useState(0);

  const handleChoiceSelect = (index: number) => {
    setSelectedChoice(index);
    setShowResult(true);

    const isCorrect = lessonData.scenario.choices[index].correct;
    if (isCorrect) {
      setXp(15);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#0D9488', '#34D399'],
      });
    }
  };

  const handleContinue = () => {
    if (phase === 'concept') {
      setPhase('scenario');
    } else if (phase === 'scenario' && showResult) {
      navigate('/home');
    }
  };

  const progress = phase === 'concept' ? 33 : phase === 'scenario' ? 66 : 100;

  return (
    <div
      className="min-h-screen flex flex-col md:items-center md:pt-8 md:pb-16"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="w-full md:max-w-3xl md:px-6">
        {/* Header */}
        <div
          className="sticky top-0 z-10 md:relative md:top-auto"
          style={{ backgroundColor: 'var(--background)' }}
        >
          <div className="flex items-center justify-between px-6 md:px-0 py-4">
            <button onClick={() => navigate('/home')}>
              <ChevronLeft size={24} style={{ color: 'var(--text-primary)' }} />
            </button>

            <div className="flex-1 mx-4">
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--border-subtle)' }}
              >
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: 'var(--teal)' }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <div
              className="font-semibold"
              style={{ fontSize: 'var(--font-body)', color: 'var(--xp-gold)' }}
            >
              +{xp}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 md:px-0 py-8">
          <AnimatePresence mode="wait">
            {phase === 'concept' && (
              <motion.div
                key="concept"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                <div
                  className="flex-1 p-6 md:p-8 rounded-[var(--radius-card)] mb-6 border"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderTop: '4px solid var(--teal)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div
                    className="mb-2 uppercase tracking-wide font-medium"
                    style={{
                      fontSize: 'var(--font-micro)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {lessonData.world} · Lesson
                  </div>

                  <h2
                    className="mb-6"
                    style={{
                      fontSize: 'var(--font-subheading)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {lessonData.title}
                  </h2>

                  <div
                    className="mb-6 whitespace-pre-line"
                    style={{
                      fontSize: 'var(--font-body)',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.7,
                    }}
                  >
                    {lessonData.concept.explanation}
                  </div>

                  <div
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: 'var(--teal)15',
                      borderLeft: '3px solid var(--teal)',
                    }}
                  >
                    <div
                      className="font-semibold"
                      style={{
                        fontSize: 'var(--font-body)',
                        color: 'var(--teal)',
                      }}
                    >
                      {lessonData.concept.takeaway}
                    </div>
                  </div>
                </div>

                <Button fullWidth onClick={handleContinue}>
                  Got it — test me
                </Button>
              </motion.div>
            )}

            {phase === 'scenario' && (
              <motion.div
                key="scenario"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                <div
                  className="flex-1 p-6 md:p-8 rounded-[var(--radius-card)] mb-6 border"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div
                    className="inline-block px-3 py-1 rounded-[var(--radius-pill)] mb-4 text-xs uppercase tracking-wide font-medium"
                    style={{
                      backgroundColor: 'var(--teal)20',
                      color: 'var(--teal)',
                    }}
                  >
                    Scenario
                  </div>

                  <p
                    className="mb-6"
                    style={{
                      fontSize: 'var(--font-body)',
                      color: 'var(--text-primary)',
                      lineHeight: 1.7,
                    }}
                  >
                    {lessonData.scenario.situation}
                  </p>

                  <div className="space-y-3">
                    {lessonData.scenario.choices.map((choice, index) => {
                      const isSelected = selectedChoice === index;
                      const isCorrect = choice.correct;
                      const showCorrect =
                        showResult && isCorrect && selectedChoice !== index;

                      return (
                        <motion.button
                          key={index}
                          onClick={() => !showResult && handleChoiceSelect(index)}
                          disabled={showResult}
                          whileTap={!showResult ? { scale: 0.98 } : {}}
                          className="w-full p-4 rounded-[var(--radius-button)] text-left border-2 transition-all relative"
                          style={{
                            backgroundColor:
                              isSelected && showResult
                                ? isCorrect
                                  ? 'var(--correct)15'
                                  : 'var(--wrong)15'
                                : showCorrect
                                  ? 'var(--correct)15'
                                  : 'var(--surface-elevated)',
                            borderColor:
                              isSelected && showResult
                                ? isCorrect
                                  ? 'var(--correct)'
                                  : 'var(--wrong)'
                                : showCorrect
                                  ? 'var(--correct)'
                                  : 'var(--border-subtle)',
                            opacity: showResult && !isSelected && !isCorrect ? 0.4 : 1,
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              style={{
                                fontSize: 'var(--font-body)',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {choice.text}
                            </span>

                            {isSelected && showResult && (
                              <div className="ml-auto flex-shrink-0">
                                {isCorrect ? (
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: 'var(--correct)' }}
                                  >
                                    <Check size={14} color="white" />
                                  </div>
                                ) : (
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: 'var(--wrong)' }}
                                  >
                                    <X size={14} color="white" />
                                  </div>
                                )}
                              </div>
                            )}

                            {showCorrect && (
                              <div className="ml-auto flex-shrink-0">
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: 'var(--correct)' }}
                                >
                                  <Check size={14} color="white" />
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {showResult && selectedChoice !== null && (
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 p-6 rounded-t-[var(--radius-card)]"
                    style={{
                      backgroundColor: 'var(--surface-elevated)',
                      maxHeight: '50vh',
                      boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
                    }}
                  >
                    <div className="text-center mb-4">
                      {lessonData.scenario.choices[selectedChoice].correct ? (
                        <>
                          <div className="text-5xl mb-2">✓</div>
                          <div
                            className="font-bold mb-2"
                            style={{
                              fontSize: 'var(--font-heading)',
                              color: 'var(--correct)',
                            }}
                          >
                            Correct!
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-5xl mb-2">✗</div>
                          <div
                            className="font-bold mb-2"
                            style={{
                              fontSize: 'var(--font-heading)',
                              color: 'var(--wrong)',
                            }}
                          >
                            Not quite
                          </div>
                        </>
                      )}
                    </div>

                    <p
                      className="mb-4"
                      style={{
                        fontSize: 'var(--font-body)',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                      }}
                    >
                      {lessonData.scenario.choices[selectedChoice].explanation}
                    </p>

                    <div
                      className="inline-block px-3 py-1 rounded-[var(--radius-pill)] mb-4 text-xs font-medium"
                      style={{
                        backgroundColor: 'var(--teal)20',
                        color: 'var(--teal)',
                      }}
                    >
                      Dollar-cost averaging
                    </div>

                    {lessonData.scenario.choices[selectedChoice].correct && (
                      <div
                        className="text-center mb-4 font-bold text-2xl"
                        style={{ color: 'var(--xp-gold)' }}
                      >
                        +15 XP
                      </div>
                    )}

                    <Button fullWidth onClick={handleContinue}>
                      Continue
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
