import { ThemeToggle } from '@/components/ThemeToggle';

/** For screens without `TopNav` / `Layout` (login, lesson, result, onboarding). */
export function FloatingThemeToggle() {
  return (
    <div className="fixed top-4 right-4 z-[100] pointer-events-auto">
      <ThemeToggle />
    </div>
  );
}
