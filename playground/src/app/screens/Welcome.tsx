import { DollarSign, Home as HomeIcon, PiggyBank, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';

import { Button } from '../components/Button';

export function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            {i % 4 === 0 && <DollarSign size={24} style={{ color: 'var(--teal)' }} />}
            {i % 4 === 1 && <TrendingUp size={24} style={{ color: 'var(--amber)' }} />}
            {i % 4 === 2 && <PiggyBank size={24} style={{ color: 'var(--rose)' }} />}
            {i % 4 === 3 && <HomeIcon size={24} style={{ color: 'var(--indigo)' }} />}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center z-10"
      >
        <motion.h1
          className="mb-4"
          style={{
            fontSize: 'var(--font-display)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
            lineHeight: 1.2,
          }}
        >
          Money is a skill.
          <br />
          Let&apos;s build it.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{
            fontSize: 'var(--font-subheading)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--spacing-6)',
          }}
        >
          3 minutes a day. Real results.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Button
            fullWidth
            gradient="linear-gradient(135deg, var(--teal) 0%, var(--indigo) 100%)"
            onClick={() => navigate('/onboarding/skill-check')}
          >
            Get started
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
