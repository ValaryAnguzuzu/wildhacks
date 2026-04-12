import { Home, Map, TrendingUp } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';

const tabs = [
  { id: 'home', icon: Home, path: '/home' },
  { id: 'learn', icon: Map, path: '/learn' },
  { id: 'progress', icon: TrendingUp, path: '/progress' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border-subtle)] px-2 py-3 flex justify-around items-center z-50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;

        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className="flex flex-col items-center gap-1 p-2 transition-all active:scale-95"
          >
            <Icon
              size={24}
              className="transition-colors"
              style={{
                color: isActive ? 'var(--teal)' : 'var(--text-muted)',
              }}
            />
            {isActive && (
              <div
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: 'var(--teal)' }}
              />
            )}
          </button>
        );
      })}

      {/* Profile Avatar */}
      <button
        onClick={() => navigate('/profile')}
        className="flex flex-col items-center gap-1 p-2 transition-all active:scale-95"
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            backgroundColor:
              location.pathname === '/profile'
                ? 'var(--teal)'
                : 'var(--surface-elevated)',
            color: location.pathname === '/profile' ? 'white' : 'var(--text-secondary)',
          }}
        >
          JD
        </div>
        {location.pathname === '/profile' && (
          <div
            className="w-1 h-1 rounded-full"
            style={{ backgroundColor: 'var(--teal)' }}
          />
        )}
      </button>
    </nav>
  );
}
