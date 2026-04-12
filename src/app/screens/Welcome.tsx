import { DollarSign, Home as HomeIcon, PiggyBank, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { FloatingThemeToggle } from '@/components/FloatingThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/store/useStore';

import { Button } from '../components/Button';

const bgIcons = [DollarSign, TrendingUp, PiggyBank, HomeIcon] as const;

export function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const profile = useStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    if (profile?.skillLevel && profile?.activeCategory) {
      navigate('/home', { replace: true });
    } else if (profile?.skillLevel) {
      navigate('/onboarding/pick-category', { replace: true });
    } else {
      navigate('/onboarding/skill-check', { replace: true });
    }
  }, [user, profile?.skillLevel, profile?.activeCategory, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden bg-[var(--background)]">
      <FloatingThemeToggle />
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => {
          const Icon = bgIcons[i % 4];
          const left = `${(i * 47) % 100}%`;
          const top = `${(i * 61) % 100}%`;
          return (
            <div key={i} className="absolute" style={{ left, top }}>
              <Icon size={24} style={{ color: 'var(--teal)' }} />
            </div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center z-10 max-w-md"
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
          className="mb-8"
          style={{ fontSize: 'var(--font-subheading)', color: 'var(--text-secondary)' }}
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
            onClick={() => navigate('/login')}
          >
            Get started
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
