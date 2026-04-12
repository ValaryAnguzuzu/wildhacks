import { Flame, Home, Map, Star, TrendingUp, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ThemeToggle } from '@/components/ThemeToggle';
import { useStore } from '@/store/useStore';
import { userInitials } from '@/utils/initials';

export function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useStore((s) => s.user);
  const learnPath = profile?.activeCategory
    ? `/learn/${profile.activeCategory}`
    : '/learn/investing';

  const navItems = [
    {
      id: 'home',
      icon: Home,
      label: 'Home',
      path: '/home',
      match: (p: string) => p === '/home',
    },
    {
      id: 'learn',
      icon: Map,
      label: 'Learn',
      path: learnPath,
      match: (p: string) => p.startsWith('/learn'),
    },
    {
      id: 'progress',
      icon: TrendingUp,
      label: 'Progress',
      path: '/progress',
      match: (p: string) => p === '/progress',
    },
    {
      id: 'squad',
      icon: Users,
      label: 'Squad',
      path: '/squad',
      match: (p: string) => p.startsWith('/squad'),
    },
  ];

  const initials = userInitials(profile?.displayName);

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="flex items-center shrink-0"
          >
            <span
              className="font-bold tracking-tight"
              style={{
                fontSize: 'clamp(1rem, 4vw, var(--font-heading))',
                color: 'var(--text-primary)',
              }}
            >
              FinLife
            </span>
          </button>

          <nav
            className="flex-1 min-w-0 flex items-center justify-center sm:justify-start gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide py-0.5"
            aria-label="Main"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.match(location.pathname);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-[var(--radius-button)] transition-all shrink-0"
                  style={{
                    backgroundColor: isActive
                      ? 'color-mix(in srgb, var(--teal) 20%, transparent)'
                      : 'transparent',
                    color: isActive ? 'var(--teal)' : 'var(--text-secondary)',
                  }}
                >
                  <Icon size={18} className="shrink-0" aria-hidden />
                  <span className="font-medium text-sm sm:text-[length:var(--font-body)]">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-0.5 sm:gap-1" title="Streak">
                <Flame
                  size={16}
                  className="sm:w-[18px] sm:h-[18px]"
                  style={{ color: 'var(--xp-gold)' }}
                />
                <span
                  className="font-semibold text-xs sm:text-sm tabular-nums"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {profile?.streak ?? 0}
                </span>
              </div>
              <div
                className="flex items-center gap-0.5 sm:gap-1 max-sm:max-w-[3.25rem]"
                title="XP"
              >
                <Star
                  size={16}
                  className="sm:w-[18px] sm:h-[18px] shrink-0"
                  style={{ color: 'var(--text-secondary)' }}
                />
                <span
                  className="text-xs sm:text-sm tabular-nums truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {(profile?.xp ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
            <ThemeToggle />
            <button
              type="button"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm cursor-pointer"
              style={{
                backgroundColor: 'var(--teal)',
                color: 'white',
              }}
              onClick={() => navigate('/profile')}
              aria-label="Profile"
            >
              {initials}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
