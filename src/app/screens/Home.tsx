import {
  FileText,
  Flame,
  Heart,
  Home as HomeIcon,
  Play,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { useCategoryLessonLists } from '@/hooks/useCategoryLessonLists';
import { useSquadBoard } from '@/hooks/useSquadBoard';
import { useStore } from '@/store/useStore';
import { CATEGORY_META, CATEGORY_ORDER, type CategoryId } from '@/utils/categoryMeta';
import { currentWeekId } from '@/utils/weekId';

import { Layout } from '../components/Layout';

const icons = {
  investing: TrendingUp,
  budgeting: Wallet,
  taxes: FileText,
  realEstate: HomeIcon,
} as const;

function formatCurrency(n: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function Home() {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const progressMap = useStore((s) => s.progress);
  const motivationPick = useRef(Math.floor(Math.random() * 4));
  const { lessonsByCategory, isLoading: lessonsLoading } = useCategoryLessonLists();
  const squadId = user?.activeGroupId ?? null;
  const { data: squadBoard } = useSquadBoard(squadId);
  const weekLabel = currentWeekId();

  const activeCategory = (user?.activeCategory as CategoryId | null) ?? null;
  const lessonsActive = activeCategory ? (lessonsByCategory[activeCategory] ?? []) : [];
  const activeLessonsStillLoading =
    activeCategory != null &&
    lessonsLoading &&
    lessonsByCategory[activeCategory] === undefined;
  const progressActive = activeCategory ? progressMap[activeCategory] : undefined;

  const sortedLessons = useMemo(
    () => [...lessonsActive].sort((a, b) => a.world - b.world || a.order - b.order),
    [lessonsActive],
  );

  const nextLesson = useMemo(() => {
    if (!activeCategory || !progressActive) return null;
    const done = new Set(progressActive.lessonsComplete ?? []);
    const firstIncomplete = sortedLessons.find((l) => !done.has(l.id));
    if (firstIncomplete) return firstIncomplete;
    return sortedLessons[0] ?? null;
  }, [activeCategory, progressActive, sortedLessons]);

  const allLessonsDone =
    Boolean(activeCategory && lessonsActive.length > 0) &&
    (progressActive?.lessonsComplete?.length ?? 0) >= lessonsActive.length;

  const motivation = useMemo(() => {
    if (!user || !progressActive) return '';
    const i = motivationPick.current;
    const concepts = progressActive.conceptsUnlocked?.length ?? 0;
    if (i === 0)
      return `You've learned ${concepts} concepts most people never think about.`;
    if (i === 1)
      return `Your simulated net worth: ${formatCurrency(user.netWorth)}. Keep going.`;
    if (i === 2) return `Day ${user.streak}. Consistency is the actual strategy.`;
    const n = progressActive.lessonsComplete?.length ?? 0;
    return `You've finished ${n} lesson${n === 1 ? '' : 's'} on this path — keep going.`;
  }, [user, progressActive]);

  const displayName = user?.displayName?.split(' ')[0] ?? 'Friend';

  const categoryRings = CATEGORY_ORDER.map((id) => {
    const lessons = lessonsByCategory[id] ?? [];
    const p = progressMap[id];
    const done = p?.lessonsComplete?.length ?? 0;
    const total = lessons.length || 1;
    const pct = Math.round((done / total) * 100);
    return { id, pct, done, total, ...CATEGORY_META[id], icon: icons[id] };
  });

  return (
    <Layout>
      <div className="w-full pt-2 sm:pt-4 pb-6">
        <div className="hidden md:block mb-10">
          <h1
            className="mb-3"
            style={{
              fontSize: 'var(--font-display)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}
          >
            Good morning, {displayName}
          </h1>
          <p style={{ fontSize: 'var(--font-body)', color: 'var(--text-secondary)' }}>
            Day {user?.streak ?? 0} · You&apos;re building something real
          </p>
        </div>

        <div className="flex items-center justify-between mb-8 md:hidden">
          <motion.div
            initial={{ scale: 1 }}
            animate={user && user.streak > 0 ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
            className="flex items-center gap-2"
          >
            <Flame size={20} style={{ color: 'var(--xp-gold)' }} />
            <span
              className="font-semibold"
              style={{ fontSize: 'var(--font-body)', color: 'var(--xp-gold)' }}
            >
              {user?.streak ?? 0}
            </span>
          </motion.div>

          <div className="flex items-center gap-2">
            <Star size={16} style={{ color: 'var(--text-secondary)' }} />
            <span
              style={{ fontSize: 'var(--font-caption)', color: 'var(--text-primary)' }}
            >
              {(user?.xp ?? 0).toLocaleString()} XP
            </span>
          </div>

          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <Heart
                key={i}
                size={16}
                fill={i < (user?.hearts ?? 0) ? 'var(--rose)' : 'none'}
                style={{
                  color: i < (user?.hearts ?? 0) ? 'var(--rose)' : 'var(--text-muted)',
                }}
              />
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={nextLesson && !activeLessonsStillLoading ? { y: -2 } : {}}
          onClick={() => {
            if (!nextLesson || activeLessonsStillLoading) return;
            navigate(`/lesson/${nextLesson.id}`);
          }}
          className={`p-6 md:p-8 rounded-[var(--radius-card)] mb-6 md:mb-8 relative overflow-hidden border md:border-2 ${
            nextLesson && !activeLessonsStillLoading ? 'cursor-pointer' : 'opacity-80'
          }`}
          style={{
            backgroundColor: 'var(--surface)',
            borderLeft: '4px solid var(--teal)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}
          >
            ~3 min
          </div>

          {activeLessonsStillLoading ? (
            <>
              <h3
                className="mb-2"
                style={{
                  fontSize: 'var(--font-subheading)',
                  color: 'var(--text-primary)',
                }}
              >
                Loading your path…
              </h3>
              <p
                className="mb-4"
                style={{ fontSize: 'var(--font-body)', color: 'var(--text-secondary)' }}
              >
                Fetching lessons from the server.
              </p>
            </>
          ) : !activeCategory || !nextLesson ? (
            <>
              <h3
                className="mb-2"
                style={{
                  fontSize: 'var(--font-subheading)',
                  color: 'var(--text-primary)',
                }}
              >
                Pick a path
              </h3>
              <p
                className="mb-4"
                style={{ fontSize: 'var(--font-body)', color: 'var(--text-secondary)' }}
              >
                Choose a category to start your next lesson.
              </p>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div
                  className="inline-block px-3 py-1 rounded-[var(--radius-pill)] text-xs uppercase tracking-wide font-medium"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--teal) 20%, transparent)',
                    color: 'var(--teal)',
                  }}
                >
                  {CATEGORY_META[activeCategory].name}
                </div>
                {allLessonsDone && (
                  <span
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Review
                  </span>
                )}
              </div>
              <h3
                className="mb-2"
                style={{
                  fontSize: 'var(--font-subheading)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                }}
              >
                {nextLesson.title}
              </h3>
              <p
                className="mb-4"
                style={{
                  fontSize: 'var(--font-body)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                {nextLesson.takeaway}
              </p>
              <button
                type="button"
                className="w-full py-3 rounded-[var(--radius-button)] font-semibold flex items-center justify-center gap-2 text-white"
                style={{
                  background: 'linear-gradient(135deg, var(--teal) 0%, #0a7a70 100%)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/lesson/${nextLesson.id}`);
                }}
              >
                <Play size={18} fill="white" />
                Play
              </button>
            </>
          )}
        </motion.div>

        {squadId && squadBoard?.group && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => navigate('/squad')}
            className="w-full text-left p-5 rounded-[var(--radius-card)] mb-6 border flex flex-col gap-3"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Users size={20} className="shrink-0" style={{ color: 'var(--teal)' }} />
                <span
                  className="font-semibold truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {squadBoard.group.name}
                </span>
              </div>
              <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                Week {weekLabel}
              </span>
            </div>
            <div className="space-y-2">
              {squadBoard.members.slice(0, 3).map((m, i) => (
                <div key={m.uid} className="flex justify-between text-sm gap-2">
                  <span style={{ color: 'var(--text-secondary)' }} className="truncate">
                    {i + 1}. {m.displayName}
                    {m.uid === user?.uid ? (
                      <span style={{ color: 'var(--teal)' }}> · you</span>
                    ) : null}
                  </span>
                  <span
                    className="tabular-nums font-medium shrink-0"
                    style={{ color: 'var(--xp-gold)' }}
                  >
                    {m.weekId === weekLabel ? m.weeklyXp : 0} XP
                  </span>
                </div>
              ))}
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--teal)' }}>
              Open squad leaderboard →
            </span>
          </motion.button>
        )}

        <div className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto md:overflow-visible pb-4 mb-6 -mx-1 px-1 sm:-mx-2 sm:px-2 md:mx-0 md:px-0 scrollbar-hide">
          {categoryRings.map((category, index) => {
            const Icon = category.icon;
            const isActive = category.id === activeCategory;
            const circumference = 2 * Math.PI * 32;
            const offset = circumference * (1 - category.pct / 100);
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                onClick={() => navigate(`/learn/${category.id}`)}
                className="flex flex-col items-center cursor-pointer flex-shrink-0"
                style={{ opacity: isActive ? 1 : 0.6 }}
              >
                <div className="relative mb-2">
                  <svg width="72" height="72" className="transform -rotate-90">
                    <circle
                      cx="36"
                      cy="36"
                      r="32"
                      fill="none"
                      stroke="var(--border-subtle)"
                      strokeWidth="6"
                    />
                    <motion.circle
                      cx="36"
                      cy="36"
                      r="32"
                      fill="none"
                      stroke={category.colorVar}
                      strokeWidth="6"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset: offset }}
                      transition={{ duration: 0.8, delay: 0.2 + index * 0.08 }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon size={24} style={{ color: category.colorVar }} />
                  </div>
                </div>
                <div
                  className="text-center"
                  style={{
                    fontSize: 'var(--font-caption)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div className="font-medium mb-1">{category.name}</div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    {category.done}/{category.total} lessons
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="p-4 md:p-5 rounded-[var(--radius-card)] mb-6 md:mb-8 flex items-center gap-3 border"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--teal) 20%, transparent)',
            }}
          >
            <Star size={16} style={{ color: 'var(--teal)' }} />
          </div>
          <p style={{ fontSize: 'var(--font-body)', color: 'var(--text-secondary)' }}>
            {motivation}
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}
