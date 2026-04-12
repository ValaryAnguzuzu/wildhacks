import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { FloatingThemeToggle } from '@/components/FloatingThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { updateUser } from '@/firebase/firestore';
import { useStore } from '@/store/useStore';

const questions = [
  {
    question: 'When you think about investing, you feel...',
    options: [
      { emoji: '😅', text: 'Honestly lost' },
      { emoji: '🤔', text: 'Curious but unsure' },
      { emoji: '😎', text: 'Pretty confident' },
    ],
  },
  {
    question: 'Your biggest money goal right now is...',
    options: [
      { emoji: '💰', text: 'Save more money' },
      { emoji: '📈', text: 'Start investing' },
      { emoji: '🏡', text: 'Buy a home' },
    ],
  },
  {
    question: 'You learn best when...',
    options: [
      { emoji: '🎮', text: 'It feels like a game' },
      { emoji: '📚', text: 'I can read at my pace' },
      { emoji: '🎯', text: 'I solve real scenarios' },
    ],
  },
];

export function SkillCheck() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const profile = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);

  useEffect(() => {
    if (profile?.skillLevel) {
      navigate(profile.activeCategory ? '/home' : '/onboarding/pick-category', {
        replace: true,
      });
    }
  }, [profile?.skillLevel, profile?.activeCategory, navigate]);

  const handleSelect = (index: number) => {
    setSelected(index);
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setAnswers((a) => [...a, index]);
        setCurrentQuestion(currentQuestion + 1);
        setSelected(null);
      } else {
        const nextAnswers = [...answers, index];
        const skillLevel = `level-${nextAnswers.join('-')}`;
        const uid = user?.uid;
        void (async () => {
          if (!uid) {
            navigate('/onboarding/pick-category');
            return;
          }
          await updateUser(uid, { skillLevel });
          const cur = useStore.getState().user;
          if (cur?.uid === uid) {
            setUser({ ...cur, skillLevel });
          } else {
            setUser({
              uid,
              displayName: user.displayName,
              email: user.email,
              xp: 0,
              streak: 0,
              hearts: 5,
              lastPlayed: null,
              netWorth: 10000,
              skillLevel,
              activeCategory: null,
              activeGroupId: null,
              streakFreezes: 0,
              recoverableStreak: null,
            });
          }
          navigate('/onboarding/pick-category');
        })();
      }
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 relative bg-[var(--background)]">
      <FloatingThemeToggle />
      <div className="flex gap-2 mb-12">
        {questions.map((_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor:
                i <= currentQuestion ? 'var(--teal)' : 'var(--border-subtle)',
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col"
        >
          <h2
            className="mb-8"
            style={{
              fontSize: 'var(--font-heading)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
            }}
          >
            {questions[currentQuestion].question}
          </h2>

          <div className="flex flex-col gap-4">
            {questions[currentQuestion].options.map((option, index) => (
              <motion.button
                key={index}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelect(index)}
                className="p-6 rounded-[var(--radius-card)] border-2 text-left transition-all"
                style={{
                  backgroundColor:
                    selected === index ? 'var(--surface-elevated)' : 'var(--surface)',
                  borderColor:
                    selected === index ? 'var(--teal)' : 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{option.emoji}</span>
                  <span
                    style={{
                      fontSize: 'var(--font-subheading)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {option.text}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
