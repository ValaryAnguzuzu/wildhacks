import { FileText, Home as HomeIcon, TrendingUp, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { FloatingThemeToggle } from '@/components/FloatingThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { updateUser } from '@/firebase/firestore';
import { useStore } from '@/store/useStore';

import { Button } from '../components/Button';

const categories = [
  {
    id: 'investing',
    name: 'Investing',
    tagline: 'Your money, working for you',
    icon: TrendingUp,
    color: 'var(--teal)',
  },
  {
    id: 'budgeting',
    name: 'Budgeting',
    tagline: 'Control your cash flow',
    icon: Wallet,
    color: 'var(--amber)',
  },
  {
    id: 'taxes',
    name: 'Taxes',
    tagline: 'Keep more of what you earn',
    icon: FileText,
    color: 'var(--indigo)',
  },
  {
    id: 'realEstate',
    name: 'Real Estate',
    tagline: 'Build wealth through property',
    icon: HomeIcon,
    color: 'var(--rose)',
  },
];

export function PickCategory() {
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const profile = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);

  useEffect(() => {
    if (!profile?.skillLevel) {
      navigate('/onboarding/skill-check', { replace: true });
    } else if (profile?.activeCategory) {
      navigate('/home', { replace: true });
    }
  }, [profile?.skillLevel, profile?.activeCategory, navigate]);

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 relative bg-[var(--background)]">
      <FloatingThemeToggle />
      <h2
        className="mb-2"
        style={{
          fontSize: 'var(--font-heading)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)',
        }}
      >
        Pick your start
      </h2>
      <p
        className="mb-8"
        style={{
          fontSize: 'var(--font-body)',
          color: 'var(--text-secondary)',
        }}
      >
        You can change this anytime
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <motion.button
              key={category.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelected(category.id)}
              className="p-6 rounded-[var(--radius-card)] aspect-square flex flex-col items-start justify-between border-2 transition-all"
              style={{
                backgroundColor:
                  selected === category.id ? `${category.color}15` : 'var(--surface)',
                borderColor:
                  selected === category.id ? category.color : 'var(--border-subtle)',
              }}
            >
              <Icon size={32} style={{ color: category.color }} />
              <div className="text-left">
                <div
                  className="mb-1"
                  style={{
                    fontSize: 'var(--font-subheading)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {category.name}
                </div>
                <div
                  style={{
                    fontSize: 'var(--font-caption)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {category.tagline}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {selected && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            fullWidth
            onClick={() => {
              if (!selected || !user?.uid) return;
              void (async () => {
                await updateUser(user.uid, { activeCategory: selected });
                const cur = useStore.getState().user;
                if (cur?.uid === user.uid) {
                  setUser({ ...cur, activeCategory: selected });
                }
                navigate('/home');
              })();
            }}
          >
            Start learning
          </Button>
        </motion.div>
      )}
    </div>
  );
}
