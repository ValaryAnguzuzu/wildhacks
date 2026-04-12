import { Check, ChevronLeft, Lock, Play, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';

import { Layout } from '../components/Layout';

const worlds: {
  id: number;
  name: string;
  complete: number;
  total: number;
  lessons: Lesson[];
}[] = [
  {
    id: 1,
    name: 'World 1: The Basics',
    complete: 5,
    total: 5,
    lessons: [
      { id: 1, name: 'What is Investing?', status: 'complete' },
      { id: 2, name: 'Risk & Reward', status: 'complete' },
      { id: 3, name: 'Stocks 101', status: 'complete' },
      { id: 4, name: 'Bonds 101', status: 'complete' },
      { id: 5, name: 'Diversification', status: 'complete' },
      { id: 6, name: 'Boss: Portfolio Quiz', status: 'complete', isBoss: true },
    ],
  },
  {
    id: 2,
    name: 'World 2: Index Investing',
    complete: 2,
    total: 5,
    lessons: [
      { id: 7, name: 'Index Funds', status: 'complete' },
      { id: 8, name: 'ETFs Explained', status: 'complete' },
      { id: 9, name: 'Dollar-Cost Avg', status: 'current' },
      { id: 10, name: 'Rebalancing', status: 'locked' },
      { id: 11, name: 'Tax Efficiency', status: 'locked' },
      { id: 12, name: 'Boss: Strategy Quiz', status: 'locked', isBoss: true },
    ],
  },
  {
    id: 3,
    name: 'World 3: Advanced Topics',
    complete: 0,
    total: 5,
    lessons: [
      { id: 13, name: 'Options Basics', status: 'locked' },
      { id: 14, name: 'Real Estate REITs', status: 'locked' },
      { id: 15, name: 'Crypto 101', status: 'locked' },
    ],
  },
];

type Lesson = {
  id: number;
  name: string;
  status: 'complete' | 'current' | 'locked';
  isBoss?: boolean;
};

function LessonNode({
  lesson,
  position,
  onClick,
}: {
  lesson: Lesson;
  position: 'left' | 'right';
  onClick: () => void;
}) {
  const isCurrent = lesson.status === 'current';
  const isComplete = lesson.status === 'complete';
  const isLocked = lesson.status === 'locked';
  const isBoss = lesson.isBoss;

  return (
    <div
      className={`flex items-center gap-4 mb-8 ${
        position === 'left' ? 'flex-row' : 'flex-row-reverse'
      }`}
    >
      <div className="flex-1" />

      <motion.button
        onClick={onClick}
        disabled={isLocked}
        whileTap={!isLocked ? { scale: 0.95 } : {}}
        animate={
          isCurrent
            ? {
                scale: [1, 1.1, 1],
              }
            : {}
        }
        transition={{
          duration: 2,
          repeat: isCurrent ? Infinity : 0,
          repeatType: 'reverse',
        }}
        className={`relative flex items-center justify-center ${
          isBoss ? 'w-16 h-16' : 'w-12 h-12'
        } rounded-full transition-all`}
        style={{
          backgroundColor: isComplete
            ? 'var(--teal)'
            : isCurrent
              ? 'var(--teal)'
              : isLocked
                ? 'var(--border-subtle)'
                : 'var(--teal)',
          boxShadow: isComplete || isCurrent ? '0 0 20px var(--teal)40' : 'none',
          opacity: isLocked ? 0.4 : 1,
        }}
      >
        {isComplete && <Check size={20} color="white" />}
        {isCurrent && <Play size={20} fill="white" color="white" />}
        {isLocked && <Lock size={16} style={{ color: 'var(--text-muted)' }} />}
        {isBoss && !isComplete && !isLocked && <Zap size={20} color="white" />}

        {isCurrent && (
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: 'var(--teal)' }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        )}
      </motion.button>

      <div className={`flex-1 ${position === 'left' ? 'text-left' : 'text-right'}`}>
        <div
          style={{
            fontSize: 'var(--font-caption)',
            color: isLocked ? 'var(--text-muted)' : 'var(--text-secondary)',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          {lesson.name}
        </div>
      </div>
    </div>
  );
}

export function Learn() {
  const navigate = useNavigate();

  return (
    <Layout>
      {/* Mobile Header */}
      <div
        className="sticky top-0 z-10 px-6 py-4 flex items-center gap-4 md:hidden"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <button onClick={() => navigate('/home')}>
          <ChevronLeft size={24} style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1
          style={{
            fontSize: 'var(--font-heading)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
          }}
        >
          Investing Path
        </h1>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block pt-8 pb-6">
        <h1
          className="mb-3"
          style={{
            fontSize: 'var(--font-display)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
            lineHeight: 1.2,
          }}
        >
          Investing Path
        </h1>
        <p
          style={{
            fontSize: 'var(--font-body)',
            color: 'var(--text-secondary)',
          }}
        >
          Your journey to financial independence
        </p>
      </div>

      <div className="px-6 md:px-0 py-8">
        {worlds.map((world, worldIndex) => (
          <motion.div
            key={world.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: worldIndex * 0.1 }}
          >
            {/* World Header */}
            <div
              className="mb-8 p-4 md:p-5 rounded-[var(--radius-card)] flex items-center justify-between border"
              style={{
                backgroundColor:
                  world.complete === world.total ? 'var(--teal)20' : 'var(--surface)',
                borderLeft:
                  world.complete === world.total ? '4px solid var(--teal)' : 'none',
                borderColor:
                  world.complete === world.total
                    ? 'var(--teal)40'
                    : 'var(--border-subtle)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 'var(--font-subheading)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {world.name}
                </div>
                <div
                  style={{
                    fontSize: 'var(--font-caption)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {world.complete}/{world.total} complete
                </div>
              </div>
              {world.complete === world.total && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--teal)' }}
                >
                  <Check size={16} color="white" />
                </div>
              )}
            </div>

            {/* Lesson Path */}
            <div className="relative">
              {/* Path Line */}
              <div
                className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2"
                style={{
                  background: `linear-gradient(to bottom, var(--teal) ${
                    (world.complete / world.total) * 100
                  }%, var(--border-subtle) ${(world.complete / world.total) * 100}%)`,
                }}
              />

              {/* Lesson Nodes */}
              {world.lessons.map((lesson, index) => (
                <LessonNode
                  key={lesson.id}
                  lesson={lesson}
                  position={index % 2 === 0 ? 'left' : 'right'}
                  onClick={() => {
                    if (lesson.status !== 'locked') {
                      navigate('/lesson');
                    }
                  }}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </Layout>
  );
}
