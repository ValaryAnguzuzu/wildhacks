import { Flame, Home, Map, Star, TrendingUp, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';

const navItems = [
  { id: 'home', icon: Home, label: 'Home', path: '/home' },
  { id: 'learn', icon: Map, label: 'Learn', path: '/learn' },
  { id: 'progress', icon: TrendingUp, label: 'Progress', path: '/progress' },
  { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
];

export function DesktopNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      className="hidden md:flex md:flex-col w-64 h-screen sticky top-0 border-r p-6"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Logo */}
      <div className="mb-12">
        <h1
          className="font-bold mb-2"
          style={{
            fontSize: 'var(--font-heading)',
            color: 'var(--text-primary)',
          }}
        >
          FinLife
        </h1>
        <p
          style={{
            fontSize: 'var(--font-caption)',
            color: 'var(--text-secondary)',
          }}
        >
          Money is a skill
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-button)] transition-all"
              style={{
                backgroundColor: isActive ? 'var(--teal)20' : 'transparent',
                color: isActive ? 'var(--teal)' : 'var(--text-secondary)',
              }}
            >
              <Icon size={20} />
              <span className="font-medium" style={{ fontSize: 'var(--font-body)' }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* User Stats */}
      <div
        className="mt-auto pt-6 border-t space-y-3"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={18} style={{ color: 'var(--xp-gold)' }} />
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--font-body)',
                color: 'var(--text-primary)',
              }}
            >
              7 day streak
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star size={18} style={{ color: 'var(--text-secondary)' }} />
            <span
              style={{
                fontSize: 'var(--font-body)',
                color: 'var(--text-primary)',
              }}
            >
              1,240 XP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
