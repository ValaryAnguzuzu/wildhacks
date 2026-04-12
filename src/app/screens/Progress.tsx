import { useQuery } from '@tanstack/react-query';
import { Timestamp } from 'firebase/firestore';
import { Award, type LucideIcon, Target, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';

import { auth } from '@/firebase/config';
import { getRecentSessions } from '@/firebase/firestore';
import { useCategoryLessonLists } from '@/hooks/useCategoryLessonLists';
import { useStore } from '@/store/useStore';
import { CATEGORY_META, CATEGORY_ORDER, type CategoryId } from '@/utils/categoryMeta';

import { Layout } from '../components/Layout';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function startOfWeekMonday(now: Date): Date {
  const d = new Date(now);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

type EarnedAchievement = {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
};

export function Progress() {
  const uid = auth.currentUser?.uid;
  const profile = useStore((s) => s.user);
  const progressMap = useStore((s) => s.progress);
  const { lessonsByCategory } = useCategoryLessonLists();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['progress-sessions', uid],
    queryFn: async () => {
      if (!uid) return [];
      const { data: rows, error } = await getRecentSessions(uid, 400);
      if (error) throw new Error(error);
      return rows;
    },
    enabled: Boolean(uid),
    staleTime: 60_000,
  });

  const { weeklyProgress, weekTotalXp, weekLessonCount } = useMemo(() => {
    const weekStart = startOfWeekMonday(new Date());
    const now = new Date();
    const buckets = DAY_LABELS.map((day) => ({ day, xp: 0, lessons: 0 }));

    for (const row of sessions) {
      const c = row.createdAt;
      if (!c || typeof (c as Timestamp).toDate !== 'function') continue;
      const dt = (c as Timestamp).toDate();
      if (dt < weekStart || dt > now) continue;
      const dow = dt.getDay();
      const idx = dow === 0 ? 6 : dow - 1;
      buckets[idx].xp += typeof row.xpEarned === 'number' ? row.xpEarned : 0;
      buckets[idx].lessons += 1;
    }

    const weekTotalXp = buckets.reduce((a, b) => a + b.xp, 0);
    const weekLessonCount = buckets.reduce((a, b) => a + b.lessons, 0);
    return { weeklyProgress: buckets, weekTotalXp, weekLessonCount };
  }, [sessions]);

  const maxXp = Math.max(1, ...weeklyProgress.map((d) => d.xp));

  const earnedAchievements = useMemo((): EarnedAchievement[] => {
    const list: EarnedAchievement[] = [];
    const streak = profile?.streak ?? 0;

    if (streak >= 7) {
      list.push({
        title: '7-day streak',
        description: `You reached at least 7 days in a row (current streak: ${streak}).`,
        icon: Zap,
        color: 'var(--xp-gold)',
      });
    }
    if (streak >= 30) {
      list.push({
        title: '30-day streak',
        description: `Long-run consistency: ${streak} days on your streak counter.`,
        icon: Zap,
        color: 'var(--amber)',
      });
    }

    for (const id of CATEGORY_ORDER) {
      const lessons = lessonsByCategory[id] ?? [];
      const done = new Set(progressMap[id]?.lessonsComplete ?? []);
      if (lessons.length === 0) continue;
      const meta = CATEGORY_META[id as CategoryId];

      const pathComplete = lessons.every((l) => done.has(l.id));
      if (pathComplete) {
        list.push({
          title: `${meta.name} path complete`,
          description: 'You completed every lesson in this category.',
          icon: Target,
          color: meta.colorVar,
        });
        continue;
      }

      const byWorld = new Map<number, typeof lessons>();
      for (const l of lessons) {
        const w = l.world;
        if (!byWorld.has(w)) byWorld.set(w, []);
        byWorld.get(w)!.push(l);
      }
      for (const [worldNum, inWorld] of byWorld) {
        if (inWorld.every((l) => done.has(l.id))) {
          list.push({
            title: `${meta.name}: World ${worldNum} complete`,
            description: `Finished every lesson in World ${worldNum} for ${meta.name}.`,
            icon: Award,
            color: meta.colorVar,
          });
        }
      }
    }

    const seen = new Set<string>();
    return list.filter((a) => {
      if (seen.has(a.title)) return false;
      seen.add(a.title);
      return true;
    });
  }, [profile?.streak, progressMap, lessonsByCategory]);

  const todayDow = new Date().getDay();
  const todayIdx = todayDow === 0 ? 6 : todayDow - 1;

  return (
    <Layout>
      <div className="px-6 md:px-0 py-8">
        <h1
          className="mb-8 md:hidden"
          style={{
            fontSize: 'var(--font-heading)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
          }}
        >
          Your Progress
        </h1>

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
            Your Progress
          </h1>
          <p
            style={{
              fontSize: 'var(--font-body)',
              color: 'var(--text-secondary)',
            }}
          >
            This week’s activity and achievements you’ve actually unlocked
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} style={{ color: 'var(--text-secondary)' }} />
            <h2
              style={{
                fontSize: 'var(--font-subheading)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
              }}
            >
              This week
            </h2>
          </div>

          <div
            className="p-6 rounded-[var(--radius-card)] border"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {isLoading ? (
              <div
                className="h-40 flex items-center justify-center text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                Loading activity…
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between gap-3 h-40 mb-4">
                  {weeklyProgress.map((day, index) => (
                    <div
                      key={day.day}
                      className="flex-1 flex flex-col items-center gap-2"
                    >
                      <motion.div
                        className="w-full rounded-t-lg"
                        style={{
                          backgroundColor: 'var(--teal)',
                          height: `${(day.xp / maxXp) * 100}%`,
                          minHeight: day.xp > 0 ? '8px' : '0',
                        }}
                        initial={{ height: 0 }}
                        animate={{ height: `${(day.xp / maxXp) * 100}%` }}
                        transition={{ delay: index * 0.05, duration: 0.5 }}
                      />
                      <span
                        className="text-xs"
                        style={{
                          color:
                            index === todayIdx
                              ? 'var(--text-primary)'
                              : 'var(--text-muted)',
                          fontWeight: index === todayIdx ? 600 : 400,
                        }}
                      >
                        {day.day}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div
                      className="font-bold mb-1"
                      style={{
                        fontSize: 'var(--font-heading)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {weekTotalXp.toLocaleString()} XP
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--font-caption)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      This week (Mon–Sun)
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="font-bold mb-1"
                      style={{
                        fontSize: 'var(--font-heading)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {weekLessonCount}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--font-caption)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Sessions logged
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2
            className="mb-4"
            style={{
              fontSize: 'var(--font-subheading)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
            }}
          >
            Achievements
          </h2>

          {earnedAchievements.length === 0 ? (
            <p style={{ fontSize: 'var(--font-body)', color: 'var(--text-secondary)' }}>
              Complete lessons and build your streak to unlock achievements. Nothing here
              until you&apos;ve earned it.
            </p>
          ) : (
            <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
              {earnedAchievements.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <motion.div
                    key={achievement.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + index * 0.05 }}
                    className="p-4 md:p-5 rounded-[var(--radius-card)] flex items-center gap-4 border"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: `${achievement.color}40`,
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${achievement.color}20`,
                      }}
                    >
                      <Icon size={24} style={{ color: achievement.color }} />
                    </div>
                    <div>
                      <div
                        className="font-semibold mb-1"
                        style={{
                          fontSize: 'var(--font-body)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {achievement.title}
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--font-caption)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {achievement.description}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
