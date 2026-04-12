import { Award, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

import { Layout } from '../components/Layout';

const stats = [
  { label: 'Total XP', value: '1,240' },
  { label: 'Current Streak', value: '7 days' },
  { label: 'Lessons Done', value: '23' },
];

const categories = [
  { name: 'Investing', color: 'var(--teal)', progress: 65, lessons: '13/20' },
  { name: 'Budgeting', color: 'var(--amber)', progress: 30, lessons: '6/20' },
  { name: 'Taxes', color: 'var(--indigo)', progress: 15, lessons: '3/20' },
  { name: 'Real Estate', color: 'var(--rose)', progress: 5, lessons: '1/20' },
];

const concepts = [
  { name: 'Dollar-cost averaging', category: 'var(--teal)' },
  { name: 'Compound interest', category: 'var(--teal)' },
  { name: 'Index funds', category: 'var(--teal)' },
  { name: '50/30/20 rule', category: 'var(--amber)' },
  { name: 'Emergency fund', category: 'var(--amber)' },
  { name: 'Tax deductions', category: 'var(--indigo)' },
  { name: 'Diversification', category: 'var(--teal)' },
  { name: 'Asset allocation', category: 'var(--teal)' },
  { name: 'Employer match', category: 'var(--amber)' },
  { name: 'Roth IRA', category: 'var(--indigo)' },
];

function StreakCalendar() {
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (29 - i));
    const intensity = Math.random();
    const hasActivity = intensity > 0.3;
    return {
      date,
      intensity: hasActivity ? Math.floor(intensity * 3) + 1 : 0,
    };
  });

  return (
    <div className="grid grid-cols-10 gap-1.5">
      {days.map((day, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.01 }}
          className="aspect-square rounded"
          style={{
            backgroundColor:
              day.intensity === 0
                ? 'var(--border-subtle)'
                : day.intensity === 1
                  ? 'var(--teal)40'
                  : day.intensity === 2
                    ? 'var(--teal)70'
                    : 'var(--teal)',
          }}
          title={day.date.toLocaleDateString()}
        />
      ))}
    </div>
  );
}

export function Profile() {
  return (
    <Layout showRightPanel={false}>
      <div className="px-6 md:px-0 py-8">
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
            Profile
          </h1>
          <p
            style={{
              fontSize: 'var(--font-body)',
              color: 'var(--text-secondary)',
            }}
          >
            Your learning stats and achievements
          </p>
        </div>

        {/* Profile Header */}
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
            JD
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
              Jordan Davis
            </h2>
            <p
              style={{
                fontSize: 'var(--font-caption)',
                color: 'var(--text-secondary)',
              }}
            >
              Member since Jan 2026
            </p>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 md:gap-4 mb-8"
        >
          {stats.map((stat, index) => (
            <div
              key={index}
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

        {/* Streak Calendar */}
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
            <StreakCalendar />
            <p
              className="mt-3 text-center"
              style={{
                fontSize: 'var(--font-caption)',
                color: 'var(--text-secondary)',
              }}
            >
              Last 30 days
            </p>
          </div>
        </motion.div>

        {/* Concepts Unlocked */}
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
          <div className="flex flex-wrap gap-2">
            {concepts.map((concept, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.03 }}
                className="px-3 py-1.5 rounded-[var(--radius-pill)] text-sm"
                style={{
                  backgroundColor: `${concept.category}20`,
                  color: concept.category,
                  border: `1px solid ${concept.category}40`,
                }}
              >
                {concept.name}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Category Progress */}
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
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
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
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--border-subtle)' }}
                  >
                    <motion.div
                      className="h-full"
                      style={{ backgroundColor: category.color }}
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
