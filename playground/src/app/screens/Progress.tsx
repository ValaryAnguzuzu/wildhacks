import { Award, Target, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'motion/react';

import { Layout } from '../components/Layout';

const weeklyProgress = [
  { day: 'Mon', xp: 45, lessons: 3 },
  { day: 'Tue', xp: 30, lessons: 2 },
  { day: 'Wed', xp: 60, lessons: 4 },
  { day: 'Thu', xp: 15, lessons: 1 },
  { day: 'Fri', xp: 45, lessons: 3 },
  { day: 'Sat', xp: 30, lessons: 2 },
  { day: 'Sun', xp: 75, lessons: 5 },
];

const achievements = [
  {
    title: '7-day streak',
    description: 'Completed lessons 7 days in a row',
    icon: Zap,
    color: 'var(--xp-gold)',
    unlocked: true,
  },
  {
    title: 'Early investor',
    description: 'Completed World 1: Investing',
    icon: Award,
    color: 'var(--teal)',
    unlocked: true,
  },
  {
    title: 'Budget master',
    description: 'Complete all budgeting lessons',
    icon: Target,
    color: 'var(--amber)',
    unlocked: false,
  },
];

export function Progress() {
  const maxXp = Math.max(...weeklyProgress.map((d) => d.xp));

  return (
    <Layout>
      <div className="px-6 md:px-0 py-8">
        {/* Mobile Header */}
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

        {/* Desktop Header */}
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
            Track your learning journey and achievements
          </p>
        </div>

        {/* Weekly XP Chart */}
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
            <div className="flex items-end justify-between gap-3 h-40 mb-4">
              {weeklyProgress.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    className="w-full rounded-t-lg"
                    style={{
                      backgroundColor: 'var(--teal)',
                      height: `${(day.xp / maxXp) * 100}%`,
                      minHeight: day.xp > 0 ? '8px' : '0',
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.xp / maxXp) * 100}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  />
                  <span
                    className="text-xs"
                    style={{
                      color:
                        index === weeklyProgress.length - 1
                          ? 'var(--text-primary)'
                          : 'var(--text-muted)',
                      fontWeight: index === weeklyProgress.length - 1 ? 600 : 400,
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
                  300 XP
                </div>
                <div
                  style={{
                    fontSize: 'var(--font-caption)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  This week
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
                  20
                </div>
                <div
                  style={{
                    fontSize: 'var(--font-caption)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Lessons
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Achievements */}
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

          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="p-4 md:p-5 rounded-[var(--radius-card)] flex items-center gap-4 border"
                  style={{
                    backgroundColor: 'var(--surface)',
                    opacity: achievement.unlocked ? 1 : 0.5,
                    borderColor: achievement.unlocked
                      ? `${achievement.color}40`
                      : 'var(--border-subtle)',
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: achievement.unlocked
                        ? `${achievement.color}20`
                        : 'var(--border-subtle)',
                    }}
                  >
                    <Icon
                      size={24}
                      style={{
                        color: achievement.unlocked
                          ? achievement.color
                          : 'var(--text-muted)',
                      }}
                    />
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
        </motion.div>
      </div>
    </Layout>
  );
}
