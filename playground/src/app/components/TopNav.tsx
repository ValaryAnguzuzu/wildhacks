import { Flame, Home, Map, Star, TrendingUp } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';

const navItems = [
  { id: 'home', icon: Home, label: 'Home', path: '/home' },
  { id: 'learn', icon: Map, label: 'Learn', path: '/learn' },
  { id: 'progress', icon: TrendingUp, label: 'Progress', path: '/progress' },
];

export function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      className="hidden md:block sticky top-0 z-50 border-b"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <button onClick={() => navigate('/home')} className="flex items-center gap-2">
              <h1
                className="font-bold"
                style={{
                  fontSize: 'var(--font-heading)',
                  color: 'var(--text-primary)',
                }}
              >
                FinLife
              </h1>
            </button>

            {/* Nav Items */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-button)] transition-all"
                    style={{
                      backgroundColor: isActive ? 'var(--teal)20' : 'transparent',
                      color: isActive ? 'var(--teal)' : 'var(--text-secondary)',
                    }}
                  >
                    <Icon size={18} />
                    <span
                      className="font-medium"
                      style={{ fontSize: 'var(--font-body)' }}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Flame size={18} style={{ color: 'var(--xp-gold)' }} />
              <span
                className="font-semibold"
                style={{
                  fontSize: 'var(--font-body)',
                  color: 'var(--text-primary)',
                }}
              >
                7
              </span>
            </div>
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
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold cursor-pointer"
              style={{
                backgroundColor: 'var(--teal)',
                color: 'white',
              }}
              onClick={() => navigate('/profile')}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/profile')}
              role="button"
              tabIndex={0}
            >
              JD
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
