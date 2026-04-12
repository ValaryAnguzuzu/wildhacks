import { Check, ChevronLeft, Lock, Play, Zap } from 'lucide-react';
import { motion, useAnimation } from 'motion/react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useLessonsForCategory } from '@/hooks/useLessonsForCategory';
import { useStore } from '@/store/useStore';
import { CATEGORY_META, type CategoryId, displayCategoryId } from '@/utils/categoryMeta';
import { getLessonStatus, type LessonStatus } from '@/utils/gameLogic';

import { Layout } from '../components/Layout';

type PathLesson = {
  id: string;
  name: string;
  status: LessonStatus;
  isBoss?: boolean;
  world: number;
};

function LessonNode({
  lesson,
  position,
  onTap,
  categoryColor,
}: {
  lesson: PathLesson;
  position: 'left' | 'right';
  onTap: () => void;
  categoryColor: string;
}) {
  const isAvailable = lesson.status === 'available';
  const isComplete = lesson.status === 'complete' || lesson.status === 'perfect';
  const isLocked = lesson.status === 'locked';
  const isBoss = lesson.isBoss;
  const controls = useAnimation();

  const handleClick = async () => {
    if (isLocked) {
      await controls.start({ x: [0, -6, 6, -6, 6, 0], transition: { duration: 0.45 } });
    } else {
      onTap();
    }
  };

  const sizeClass = 'w-11 h-11 lg:w-16 lg:h-16';
  const bossClass = isBoss ? 'w-14 h-14 lg:w-[4.5rem] lg:h-[4.5rem]' : sizeClass;

  return (
    <div
      className={`flex items-center gap-4 mb-8 ${position === 'left' ? 'flex-row' : 'flex-row-reverse'}`}
    >
      <div className="flex-1" />
      <motion.div animate={controls} className="relative">
        <motion.button
          type="button"
          onClick={() => void handleClick()}
          whileInView={{ opacity: 1, scale: 1 }}
          initial={{ opacity: 0.85, scale: 0.96 }}
          viewport={{ once: true, margin: '-20%' }}
          whileTap={!isLocked ? { scale: 0.95 } : {}}
          animate={
            isAvailable
              ? {
                  scale: [1, 1.12, 1],
                }
              : {}
          }
          transition={{
            duration: 2,
            repeat: isAvailable ? Infinity : 0,
            repeatType: 'reverse',
          }}
          className={`relative flex items-center justify-center rounded-full transition-all ${bossClass}`}
          style={{
            backgroundColor:
              isComplete || isAvailable ? categoryColor : 'var(--border-subtle)',
            boxShadow:
              isComplete || isAvailable
                ? `0 0 20px color-mix(in srgb, ${categoryColor} 25%, transparent)`
                : 'none',
            opacity: isLocked ? 0.4 : 1,
          }}
        >
          {isComplete && <Check size={20} color="white" />}
          {isAvailable && <Play size={20} fill="white" color="white" />}
          {isLocked && <Lock size={16} style={{ color: 'var(--text-muted)' }} />}
          {isBoss && !isComplete && !isLocked && <Zap size={20} color="white" />}
          {isAvailable && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 pointer-events-none"
              style={{ borderColor: categoryColor }}
              animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
            />
          )}
        </motion.button>
        {isLocked && (
          <div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] px-2 py-1 rounded bg-[var(--surface-elevated)] border border-[var(--border-subtle)] opacity-0 hover:opacity-100 pointer-events-none lg:pointer-events-auto transition-opacity z-20"
            style={{ color: 'var(--text-muted)' }}
          >
            Finish the current lesson first
          </div>
        )}
        {(lesson.status === 'complete' || lesson.status === 'perfect') && (
          <div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] px-2 py-1 rounded bg-[var(--surface-elevated)] border border-[var(--border-subtle)] opacity-0 hover:opacity-100 pointer-events-none lg:pointer-events-auto transition-opacity z-20"
            style={{ color: 'var(--text-secondary)' }}
          >
            {lesson.name} · Revisit
          </div>
        )}
      </motion.div>
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
  const { categoryId: rawCat } = useParams();
  const navigate = useNavigate();
  const profile = useStore((s) => s.user);
  const progressMap = useStore((s) => s.progress);

  const categoryId =
    displayCategoryId(rawCat) ??
    displayCategoryId(profile?.activeCategory) ??
    'investing';
  const meta = CATEGORY_META[categoryId as CategoryId];
  const {
    data: lessons = [],
    isLoading,
    isError,
    refetch,
  } = useLessonsForCategory(categoryId);

  const progress = progressMap[categoryId] ?? {
    worldsUnlocked: 1,
    lessonsComplete: [],
    conceptsUnlocked: [],
    xpEarned: 0,
    perfectLessons: [],
  };

  const worlds = useMemo(() => {
    const map = new Map<number, PathLesson[]>();
    for (const l of lessons) {
      const st = getLessonStatus(l.id, progress, lessons);
      const row: PathLesson = {
        id: l.id,
        name: l.title,
        status: st,
        world: l.world,
      };
      if (!map.has(l.world)) map.set(l.world, []);
      map.get(l.world)!.push(row);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [lessons, progress]);

  if (isLoading) {
    return (
      <Layout>
        <div className="px-6 py-10 space-y-4 max-w-3xl mx-auto">
          <div className="h-10 w-48 rounded-lg bg-teal-500/10 animate-pulse" />
          <div className="h-64 w-full rounded-[var(--radius-card)] bg-teal-500/10 animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="px-6 py-12 text-center max-w-md mx-auto">
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            Something went wrong
          </p>
          <button
            type="button"
            className="px-4 py-2 rounded-[var(--radius-button)] bg-[var(--teal)] text-white"
            onClick={() => void refetch()}
          >
            Try again
          </button>
        </div>
      </Layout>
    );
  }

  if (lessons.length === 0) {
    return (
      <Layout>
        <div className="px-6 py-12 text-center max-w-md mx-auto">
          <p style={{ color: 'var(--text-secondary)' }}>
            This is where your journey starts. Tap the first node.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="sticky top-0 z-10 -mx-4 px-4 sm:-mx-6 sm:px-6 py-3 flex items-center gap-4 sm:hidden bg-[var(--background)] border-b border-[var(--border-subtle)]">
          <button type="button" onClick={() => navigate('/home')} aria-label="Back">
            <ChevronLeft size={24} style={{ color: 'var(--text-primary)' }} />
          </button>
          <h1
            style={{
              fontSize: 'var(--font-heading)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
            }}
          >
            {meta.name} path
          </h1>
        </div>

        <div className="hidden sm:block pt-4 sm:pt-6 pb-4">
          <h1
            className="mb-3"
            style={{
              fontSize: 'var(--font-display)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}
          >
            {meta.name} path
          </h1>
          <p style={{ fontSize: 'var(--font-body)', color: 'var(--text-secondary)' }}>
            Your journey to financial independence
          </p>
        </div>

        <div className="py-6 sm:py-8">
          {worlds.map(([worldNum, worldLessons], worldIndex) => {
            const total = worldLessons.length;
            const complete = worldLessons.filter(
              (x) => x.status === 'complete' || x.status === 'perfect',
            ).length;
            return (
              <motion.div
                key={worldNum}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: worldIndex * 0.1 }}
                className="lg:w-full"
              >
                <div
                  className="mb-8 p-4 md:p-5 rounded-[var(--radius-card)] flex items-center justify-between border lg:w-full"
                  style={{
                    backgroundColor:
                      complete === total
                        ? 'color-mix(in srgb, var(--teal) 20%, transparent)'
                        : 'var(--surface)',
                    borderLeft: complete === total ? '4px solid var(--teal)' : undefined,
                    borderColor:
                      complete === total
                        ? 'color-mix(in srgb, var(--teal) 40%, transparent)'
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
                      World {worldNum}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--font-caption)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {complete}/{total} complete
                    </div>
                  </div>
                  {complete === total && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--teal)]">
                      <Check size={16} color="white" />
                    </div>
                  )}
                </div>

                <div className="relative">
                  <div
                    className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2"
                    style={{
                      background: `linear-gradient(to bottom, var(--teal) ${total ? (complete / total) * 100 : 0}%, var(--border-subtle) ${total ? (complete / total) * 100 : 0}%)`,
                    }}
                  />
                  {worldLessons.map((lesson, index) => (
                    <LessonNode
                      key={lesson.id}
                      lesson={lesson}
                      position={index % 2 === 0 ? 'left' : 'right'}
                      categoryColor={meta.colorVar}
                      onTap={() => {
                        if (lesson.status === 'available')
                          navigate(`/lesson/${lesson.id}`);
                        if (lesson.status === 'complete' || lesson.status === 'perfect') {
                          navigate(`/lesson/${lesson.id}`);
                        }
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
