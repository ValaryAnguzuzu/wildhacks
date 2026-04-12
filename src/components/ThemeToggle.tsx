import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

type ThemeToggleProps = {
  /** Larger tap target and label (e.g. Profile). */
  variant?: 'icon' | 'row';
};

export function ThemeToggle({ variant = 'icon' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme !== 'light';

  const toggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  if (!mounted) {
    return (
      <span
        className={
          variant === 'row'
            ? 'h-10 w-full rounded-[var(--radius-button)] bg-[var(--surface-elevated)]'
            : 'w-9 h-9 shrink-0 rounded-full bg-[var(--surface-elevated)]'
        }
        aria-hidden
      />
    );
  }

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-4 px-4 py-3 rounded-[var(--radius-button)] border transition-colors"
        style={{
          borderColor: 'var(--border-subtle)',
          backgroundColor: 'var(--surface)',
          color: 'var(--text-primary)',
        }}
      >
        <span className="text-left">
          <span className="block font-medium" style={{ fontSize: 'var(--font-body)' }}>
            Appearance
          </span>
          <span className="block text-sm" style={{ color: 'var(--text-muted)' }}>
            {isDark ? 'Dark' : 'Light'} mode
          </span>
        </span>
        <span
          className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--teal) 15%, transparent)',
            color: 'var(--teal)',
          }}
        >
          {isDark ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-colors"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--teal) 12%, transparent)',
        color: 'var(--teal)',
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun size={18} className="sm:w-5 sm:h-5" />
      ) : (
        <Moon size={18} className="sm:w-5 sm:h-5" />
      )}
    </button>
  );
}
