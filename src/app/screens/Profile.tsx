import { useQuery } from '@tanstack/react-query';
import { Timestamp } from 'firebase/firestore';
import { Award, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { auth } from '@/firebase/config';
import { getUserSessionsSample } from '@/firebase/firestore';
import { useCategoryLessonLists } from '@/hooks/useCategoryLessonLists';
import { useStore } from '@/store/useStore';
import { CATEGORY_META, CATEGORY_ORDER, type CategoryId } from '@/utils/categoryMeta';

import { Layout } from '../components/Layout';

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function Profile() {
  const navigate = useNavigate();
  const profile = useStore((s) => s.user);
  const progressMap = useStore((s) => s.progress);
  const uid = auth.currentUser?.uid;
  const [mounted, setMounted] = useState(false);
  const { lessonsByCategory, isLoading: lessonsLoading } = useCategoryLessonLists();

  useEffect(() => setMounted(true), []);

  const {
    data: sessions = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['profile-sessions', uid],
    queryFn: async () => {
      if (!uid) return [];
      const { data, error } = await getUserSessionsSample(uid, 120);
      if (error) throw new Error(error);
      return data;
    },
    enabled: Boolean(uid),
    staleTime: 60_000,
  });

  const activityDays = useMemo(() => {
    const set = new Set<string>();
    for (const s of sessions) {
      const c = s.createdAt;
      if (c && typeof (c as Timestamp).toDate === 'function') {
        set.add(dayKey((c as Timestamp).toDate()));
      }
    }
    return set;
  }, [sessions]);

  const concepts = useMemo(() => {
    const list: { name: string; color: string }[] = [];
    for (const cid of CATEGORY_ORDER) {
      const tags = progressMap[cid]?.conceptsUnlocked ?? [];
      const color = CATEGORY_META[cid as CategoryId].colorVar;
      for (const t of tags) {
        list.push({ name: t.replace(/-/g, ' '), color });
      }
    }
    return list;
  }, [progressMap]);

  const categories = CATEGORY_ORDER.map((id) => {
    const lessons = lessonsByCategory[id] ?? [];
    const done = progressMap[id]?.lessonsComplete?.length ?? 0;
    const total = lessons.length || 1;
    const pct = Math.round((done / total) * 100);
    return {
      id,
      ...CATEGORY_META[id as CategoryId],
      progress: pct,
      lessons: `${done}/${total}`,
    };
  });

  const today = new Date();
  const streakDays = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (29 - i));
    const key = dayKey(date);
    const has = activityDays.has(key);
    return { date, has };
  });

  const displayName = profile?.displayName ?? 'Learner';
  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const totalLessons = CATEGORY_ORDER.reduce(
    (acc, id) => acc + (progressMap[id]?.lessonsComplete?.length ?? 0),
    0,
  );

  if (!mounted || isLoading || lessonsLoading) {
    return (
      <Layout>
        <div className="px-6 py-8 space-y-4 max-w-lg mx-auto">
          <div className="h-24 w-24 rounded-full bg-teal-500/10 animate-pulse" />
          <div className="h-10 w-48 bg-teal-500/10 animate-pulse rounded-lg" />
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

  return (
    <Layout>
      <div className="px-4 mx-4 md:mx-0 md:px-0 py-8 max-w-lg md:max-w-none lg:max-w-2xl lg:mx-auto">
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
            Profile
          </h1>
          <p style={{ fontSize: 'var(--font-body)', color: 'var(--text-secondary)' }}>
            Your learning stats and achievements
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div
            className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-2xl md:text-3xl font-bold"
            style={{
              backgroundColor: 'var(--teal)',
              color: 'white',
            }}
          >
            {initials || '?'}
          </div>
          <div>
            <h2
              className="mb-1"
              style={{
                fontSize: 'var(--font-heading)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
              }}
            >
              {displayName}
            </h2>
            <p
              style={{ fontSize: 'var(--font-caption)', color: 'var(--text-secondary)' }}
            >
              {(profile?.xp ?? 0).toLocaleString()} XP · {profile?.streak ?? 0} day streak
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-8 p-4 md:p-5 rounded-[var(--radius-card)] border space-y-3"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-subheading)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
            }}
          >
            Financial advisor
          </h2>
          <p style={{ fontSize: 'var(--font-caption)', color: 'var(--text-secondary)' }}>
            Chat with Fin or update the numbers used for personalized advice.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              className="flex-1 py-3 rounded-[var(--radius-button)] font-semibold text-white"
              style={{ backgroundColor: 'var(--teal)' }}
              onClick={() => navigate('/advisor')}
            >
              Open advisor
            </button>
            <button
              type="button"
              className="flex-1 py-3 rounded-[var(--radius-button)] font-semibold border"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--surface-elevated)',
              }}
              onClick={() => navigate('/financial-profile')}
            >
              Edit snapshot
            </button>
            <button
              type="button"
              className="flex-1 py-3 rounded-[var(--radius-button)] font-semibold border"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--surface-elevated)',
              }}
              onClick={() => navigate('/advisor/history')}
            >
              Past advice
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 md:gap-4 mb-8"
        >
          {[
            { label: 'Total XP', value: (profile?.xp ?? 0).toLocaleString() },
            { label: 'Current streak', value: `${profile?.streak ?? 0} days` },
            { label: 'Lessons', value: String(totalLessons) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex-1 p-4 md:p-5 rounded-[var(--radius-card)] text-center border"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div
                className="font-bold mb-1"
                style={{
                  fontSize: 'var(--font-subheading)',
                  color: 'var(--text-primary)',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 'var(--font-caption)',
                  color: 'var(--text-secondary)',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} style={{ color: 'var(--text-secondary)' }} />
            <h2
              style={{
                fontSize: 'var(--font-subheading)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
              }}
            >
              Streak calendar
            </h2>
          </div>
          <div
            className="p-4 md:p-5 rounded-[var(--radius-card)] border"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="grid grid-cols-10 gap-1.5">
              {streakDays.map((day, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className="aspect-square rounded"
                  style={{
                    backgroundColor: day.has ? 'var(--teal)' : 'var(--border-subtle)',
                    opacity: day.has ? 1 : 0.45,
                  }}
                  title={day.date.toLocaleDateString()}
                />
              ))}
            </div>
            <p
              className="mt-3 text-center"
              style={{ fontSize: 'var(--font-caption)', color: 'var(--text-secondary)' }}
            >
              Last 30 days
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Award size={20} style={{ color: 'var(--text-secondary)' }} />
            <h2
              style={{
                fontSize: 'var(--font-subheading)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
              }}
            >
              Concepts unlocked
            </h2>
          </div>
          {concepts.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-body)' }}>
              Finish your first lesson to unlock your first concept.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {concepts.map((concept, index) => (
                <motion.div
                  key={`${concept.name}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * (index % 12) }}
                  className="px-3 py-1.5 rounded-[var(--radius-pill)] text-sm capitalize"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${concept.color} 20%, transparent)`,
                    color: concept.color,
                    border: `1px solid color-mix(in srgb, ${concept.color} 40%, transparent)`,
                  }}
                >
                  {concept.name}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2
            className="mb-4"
            style={{
              fontSize: 'var(--font-subheading)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
            }}
          >
            Category progress
          </h2>
          <div className="space-y-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.colorVar }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      style={{
                        fontSize: 'var(--font-body)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {category.name}
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--font-caption)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {category.lessons}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-[var(--border-subtle)]">
                    <motion.div
                      className="h-full"
                      style={{ backgroundColor: category.colorVar }}
                      initial={{ width: 0 }}
                      animate={{ width: `${category.progress}%` }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
