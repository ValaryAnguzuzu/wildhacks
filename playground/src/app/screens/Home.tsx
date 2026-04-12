import {
  FileText,
  Flame,
  Heart,
  Home as HomeIcon,
  Play,
  Star,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';

import { Layout } from '../components/Layout';

const categories = [
  {
    id: 'investing',
    name: 'Investing',
    icon: TrendingUp,
    color: 'var(--teal)',
    progress: 65,
  },
  {
    id: 'budgeting',
    name: 'Budgeting',
    icon: Wallet,
    color: 'var(--amber)',
    progress: 30,
  },
  { id: 'taxes', name: 'Taxes', icon: FileText, color: 'var(--indigo)', progress: 15 },
  {
    id: 'real-estate',
    name: 'Real Estate',
    icon: HomeIcon,
    color: 'var(--rose)',
    progress: 0,
  },
];

const recentActivity = [
  { lesson: 'Index funds explained', category: 'investing', xp: 15, time: '2h ago' },
  { lesson: 'The 50/30/20 rule', category: 'budgeting', xp: 20, time: '1d ago' },
  { lesson: 'Compound interest', category: 'investing', xp: 15, time: '2d ago' },
];

export function Home() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="px-6 md:px-0 pt-6 md:pt-8 pb-6">
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
            Good morning, Jordan
          </h1>
          <p
            style={{
              fontSize: 'var(--font-body)',
              color: 'var(--text-secondary)',
            }}
          >
            Day 7 · You&apos;re building something real
          </p>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mb-8 md:hidden">
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
            className="flex items-center gap-2"
          >
            <Flame size={20} style={{ color: 'var(--xp-gold)' }} />
            <span
              className="font-semibold"
              style={{ fontSize: 'var(--font-body)', color: 'var(--xp-gold)' }}
            >
              7
            </span>
          </motion.div>

          <div className="flex items-center gap-2">
            <Star size={16} style={{ color: 'var(--text-secondary)' }} />
            <span
              style={{ fontSize: 'var(--font-caption)', color: 'var(--text-primary)' }}
            >
              1,240 XP
            </span>
          </div>

          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Heart
                key={i}
                size={16}
                fill={i < 4 ? 'var(--rose)' : 'none'}
                style={{ color: i < 4 ? 'var(--rose)' : 'var(--text-muted)' }}
              />
            ))}
          </div>
        </div>

        {/* Today's Lesson Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -2 }}
          onClick={() => navigate('/lesson')}
          className="p-6 md:p-8 rounded-[var(--radius-card)] mb-6 md:mb-8 cursor-pointer relative overflow-hidden border md:border-2"
          style={{
            backgroundColor: 'var(--surface)',
            borderLeft: '4px solid var(--teal)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--text-secondary)',
            }}
          >
            ~3 min
          </div>

          <div
            className="inline-block px-3 py-1 rounded-[var(--radius-pill)] mb-3 text-xs uppercase tracking-wide font-medium"
            style={{
              backgroundColor: `var(--teal)20`,
              color: 'var(--teal)',
            }}
          >
            Investing
          </div>

          <h3
            className="mb-2"
            style={{
              fontSize: 'var(--font-subheading)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
            }}
          >
            Understanding Dollar-Cost Averaging
          </h3>

          <p
            className="mb-4"
            style={{
              fontSize: 'var(--font-body)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            Learn how to invest consistently without timing the market
          </p>

          <button
            className="w-full py-3 rounded-[var(--radius-button)] font-semibold flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, var(--teal) 0%, #0a7a70 100%)',
              color: 'white',
            }}
          >
            <Play size={18} fill="white" />
            Play
          </button>
        </motion.div>

        {/* Progress Rings */}
        <div className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto md:overflow-visible pb-4 mb-6 -mx-6 px-6 md:mx-0 md:px-0 scrollbar-hide">
          {categories.map((category, index) => {
            const Icon = category.icon;
            const isActive = index === 0;
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                onClick={() => navigate('/learn')}
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
                    <circle
                      cx="36"
                      cy="36"
                      r="32"
                      fill="none"
                      stroke={category.color}
                      strokeWidth="6"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${2 * Math.PI * 32 * (1 - category.progress / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon size={24} style={{ color: category.color }} />
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
                    {Math.round(category.progress / 5)}/20 lessons
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Motivation Strip */}
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
            style={{ backgroundColor: 'var(--teal)20' }}
          >
            <Star size={16} style={{ color: 'var(--teal)' }} />
          </div>
          <p style={{ fontSize: 'var(--font-body)', color: 'var(--text-secondary)' }}>
            You&apos;re in the top 18% of learners this week
          </p>
        </motion.div>

        {/* Recent Activity */}
        <div>
          <h4
            className="mb-4"
            style={{
              fontSize: 'var(--font-subheading)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
            }}
          >
            Recent activity
          </h4>

          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-center justify-between py-3 border-b md:border-none md:p-4 md:rounded-[var(--radius-card)] md:bg-[var(--surface)]"
                style={{
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 md:w-3 md:h-3 rounded-full"
                    style={{
                      backgroundColor:
                        activity.category === 'investing'
                          ? 'var(--teal)'
                          : 'var(--amber)',
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 'var(--font-body)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {activity.lesson}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--font-caption)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {activity.time}
                    </div>
                  </div>
                </div>
                <div
                  className="font-semibold"
                  style={{ fontSize: 'var(--font-body)', color: 'var(--xp-gold)' }}
                >
                  +{activity.xp}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
